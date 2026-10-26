import fs from 'fs';
import path from 'path';
import QRCode from 'qrcode';
import pino from 'pino';
import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  WASocket,
} from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import { config } from '../config/index.js';
import { getDatabase } from '../db/index.js';
import { Scheduler } from './scheduler.js';

export type WhatsAppWebStatus = 'DISCONNECTED' | 'QR_READY' | 'CONNECTING' | 'CONNECTED';

export interface WhatsAppWebInfo {
  status: WhatsAppWebStatus;
  qrCode?: string | null;
  user?: {
    id?: string;
    name?: string;
    phone?: string;
  } | null;
  hasSavedSession: boolean;
  lastConnectedAt?: string;
}

export class WhatsAppWebClient {
  private static socket: WASocket | null = null;
  private static status: WhatsAppWebStatus = 'DISCONNECTED';
  private static currentQr: string | null = null;
  private static user: { id?: string; name?: string; phone?: string } | null = null;
  private static lastConnectedAt: string | undefined;
  private static reconnectTimer: NodeJS.Timeout | null = null;
  private static isConnecting = false;

  private static getSessionDir(): string {
    const authDir = path.resolve(config.dataDir, 'whatsapp_auth');
    if (!fs.existsSync(authDir)) {
      fs.mkdirSync(authDir, { recursive: true });
    }
    return authDir;
  }

  /**
   * Syncs SQLite database session files to local disk if local files were wiped.
   */
  private static restoreSessionFromDatabase(sessionDir: string): boolean {
    try {
      const db = getDatabase();
      const rows = db.prepare('SELECT key, value FROM whatsapp_sessions').all() as { key: string; value: string }[];
      if (rows && rows.length > 0) {
        console.log(`[WhatsAppWeb] Restaurando ${rows.length} llaves de sesión desde la base de datos persistente...`);
        for (const row of rows) {
          const filePath = path.join(sessionDir, row.key);
          fs.writeFileSync(filePath, row.value, 'utf-8');
        }
        return true;
      }
    } catch (e) {
      console.warn('[WhatsAppWeb] Error restaurando sesión desde base de datos:', e);
    }
    return false;
  }

  /**
   * Persists all auth session files into SQLite database so redeploys and restarts never lose login.
   */
  public static syncSessionToDatabase(sessionDir: string): void {
    try {
      if (!fs.existsSync(sessionDir)) return;
      const files = fs.readdirSync(sessionDir);
      const db = getDatabase();

      const insertStmt = db.prepare(`
        INSERT OR REPLACE INTO whatsapp_sessions (key, value, updated_at)
        VALUES (?, ?, datetime('now'))
      `);

      const saveTransaction = db.transaction(() => {
        for (const file of files) {
          // Only save json files and keys
          if (file.endsWith('.json')) {
            const content = fs.readFileSync(path.join(sessionDir, file), 'utf-8');
            insertStmt.run(file, content);
          }
        }
      });

      saveTransaction();
    } catch (e) {
      console.warn('[WhatsAppWeb] Error sincronizando sesión a base de datos:', e);
    }
  }

  public static hasSavedSession(): boolean {
    const sessionDir = this.getSessionDir();
    const credsFile = path.join(sessionDir, 'creds.json');
    if (fs.existsSync(credsFile)) return true;

    // Check if session exists in SQLite
    try {
      const db = getDatabase();
      const row = db.prepare("SELECT COUNT(*) as count FROM whatsapp_sessions WHERE key = 'creds.json'").get() as { count: number };
      return (row && row.count > 0);
    } catch {
      return false;
    }
  }

  public static isConnected(): boolean {
    return this.status === 'CONNECTED' && this.socket !== null;
  }

  public static getStatus(): WhatsAppWebInfo {
    return {
      status: this.status,
      qrCode: this.currentQr,
      user: this.user,
      hasSavedSession: this.hasSavedSession(),
      lastConnectedAt: this.lastConnectedAt
    };
  }

  /**
   * Initializes client on server boot.
   */
  public static async init(): Promise<void> {
    if (this.hasSavedSession()) {
      console.log('[WhatsAppWeb] Sesión persistente encontrada. Conectando WhatsApp personal automáticamente...');
      await this.startClient();
    } else {
      console.log('[WhatsAppWeb] Sin sesión de WhatsApp activa. Listo para vincular por código QR.');
    }
  }

  /**
   * Starts connection and handles pairing/reconnection cleanly.
   */
  public static async startClient(): Promise<WhatsAppWebInfo> {
    if (this.socket && this.status === 'CONNECTED') {
      return this.getStatus();
    }

    if (this.isConnecting) {
      return this.getStatus();
    }

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    this.isConnecting = true;
    this.status = 'CONNECTING';

    try {
      const sessionDir = this.getSessionDir();

      // Ensure session is restored from SQLite if local disk was wiped
      this.restoreSessionFromDatabase(sessionDir);

      const { state, saveCreds } = await useMultiFileAuthState(sessionDir);
      const { version } = await fetchLatestBaileysVersion().catch(() => ({ version: [2, 3000, 1015901307] as any }));

      const logger = pino({ level: 'silent' });

      // Clean existing socket listeners if any
      if (this.socket) {
        try {
          this.socket.ev.removeAllListeners('connection.update');
          this.socket.ev.removeAllListeners('creds.update');
        } catch {}
      }

      const sock = makeWASocket({
        version,
        logger,
        auth: state,
        printQRInTerminal: false,
        browser: ['MI VIDA ETERNA', 'Chrome', '1.0.0'],
        connectTimeoutMs: 60000,
        defaultQueryTimeoutMs: 60000,
        keepAliveIntervalMs: 25000,
        emitOwnEvents: false,
        syncFullHistory: false
      });

      this.socket = sock;

      // Handle credentials updates and immediately persist to SQLite
      sock.ev.on('creds.update', async () => {
        await saveCreds();
        WhatsAppWebClient.syncSessionToDatabase(sessionDir);
      });

      // Handle connection updates
      sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
          try {
            this.currentQr = await QRCode.toDataURL(qr, {
              margin: 2,
              width: 320,
              color: {
                dark: '#0f172a',
                light: '#ffffff'
              }
            });
            this.status = 'QR_READY';
            console.log('[WhatsAppWeb] 📱 Nuevo código QR generado para vincular tu WhatsApp.');
          } catch (qrErr) {
            console.error('[WhatsAppWeb] Error generando imagen QR:', qrErr);
          }
        }

        if (connection === 'open') {
          this.status = 'CONNECTED';
          this.currentQr = null;
          this.isConnecting = false;
          this.lastConnectedAt = new Date().toISOString();

          // Sync credentials to database on successful link
          WhatsAppWebClient.syncSessionToDatabase(sessionDir);

          const rawId = sock.user?.id || '';
          const cleanPhone = rawId.split(':')[0] || rawId.split('@')[0];

          this.user = {
            id: rawId,
            name: sock.user?.name || 'Mi WhatsApp',
            phone: cleanPhone
          };

          console.log(`🌸 [WhatsAppWeb] ¡WhatsApp Personal VINCULADO y ACTIVO! Emisor (+${cleanPhone})`);

          // Check if today's dispatch was pending and automatically send it now!
          try {
            Scheduler.checkAndRecoverPendingDispatch();
          } catch (recErr) {
            console.warn('[WhatsAppWeb] Notice running post-connect dispatch check:', recErr);
          }
        }

        if (connection === 'close') {
          const boomError = lastDisconnect?.error as Boom | undefined;
          const statusCode = boomError?.output?.statusCode;
          const isLoggedOut = statusCode === DisconnectReason.loggedOut;

          console.log(`[WhatsAppWeb] Conexión cerrada. Status Code: ${statusCode}. ¿Desvinculado por usuario?: ${isLoggedOut}`);

          this.isConnecting = false;

          if (isLoggedOut) {
            // Explicitly logged out from WhatsApp on phone
            console.log('[WhatsAppWeb] Sesión desvinculada por el usuario desde su teléfono.');
            await this.logout();
          } else {
            // Reconnection needed (e.g. 515 restartRequired after QR scan, temporary network drop, etc.)
            this.status = 'CONNECTING';
            const delay = statusCode === DisconnectReason.restartRequired ? 1000 : 3000;
            console.log(`[WhatsAppWeb] Reconectando automáticamente en ${delay}ms...`);
            this.reconnectTimer = setTimeout(() => {
              this.startClient().catch((err) => console.error('[WhatsAppWeb] Error reconectando:', err));
            }, delay);
          }
        }
      });

      return this.getStatus();
    } catch (error: any) {
      console.error('[WhatsAppWeb] Error iniciando cliente Baileys:', error);
      this.isConnecting = false;
      this.status = 'DISCONNECTED';
      return this.getStatus();
    }
  }

  /**
   * Resolves recipient phone number to valid canonical WhatsApp JID.
   * Handles Colombian mobile normalization and country prefixes.
   */
  public static async resolveTargetJid(rawPhone: string): Promise<string> {
    let clean = rawPhone.replace(/[^\d]/g, '');

    // Colombian mobile numbers: 10 digits starting with 3 (e.g. 3001234567 -> 573001234567)
    if (clean.length === 10 && clean.startsWith('3')) {
      clean = `57${clean}`;
    }

    // Try resolving with onWhatsApp if socket is active
    if (this.socket) {
      try {
        const queryResults = await this.socket.onWhatsApp(clean);
        if (queryResults && queryResults.length > 0 && queryResults[0].exists) {
          return queryResults[0].jid;
        }

        // Alternative: try with Colombian mobile format variations if starting with 573
        if (clean.startsWith('573') && clean.length === 12) {
          const altQuery = await this.socket.onWhatsApp(`57${clean.slice(2)}`);
          if (altQuery && altQuery.length > 0 && altQuery[0].exists) {
            return altQuery[0].jid;
          }
        }
      } catch (err) {
        console.warn('[WhatsAppWeb] onWhatsApp verification check fallback:', err);
      }
    }

    return `${clean}@s.whatsapp.net`;
  }

  /**
   * Sends a WhatsApp love letter or reminder directly from linked WhatsApp account.
   */
  public static async sendMessage(
    recipientPhone: string,
    message: string
  ): Promise<{ success: boolean; messageId?: string; error?: string; targetJid?: string }> {
    // If currently reconnecting, wait up to 4 seconds for socket to open
    if (this.status === 'CONNECTING') {
      console.log('[WhatsAppWeb] Socket reconectando, esperando brevemente para enviar mensaje...');
      for (let i = 0; i < 8; i++) {
        await new Promise((r) => setTimeout(r, 500));
        if (this.isConnected()) break;
      }
    }

    if (!this.isConnected() || !this.socket) {
      return {
        success: false,
        error: 'Tu WhatsApp personal no está vinculado con el código QR. Entra al Panel de Administrador > WhatsApp y escanea el código QR para activar el envío automático a su celular.'
      };
    }

    try {
      const cleanPhone = recipientPhone.replace(/[^\d]/g, '');
      if (!cleanPhone || cleanPhone.length < 7) {
        return {
          success: false,
          error: `Número de teléfono destinatario inválido: "${recipientPhone}". Debe incluir código de país (ej. 57 para Colombia).`
        };
      }

      const targetJid = await this.resolveTargetJid(recipientPhone);

      console.log(`[WhatsAppWeb] Transmitiendo mensaje a JID: ${targetJid}...`);

      const sent = await this.socket.sendMessage(targetJid, {
        text: message
      });

      const messageId = sent?.key?.id || `msg-${Date.now()}`;

      console.log(`[WhatsAppWeb] ¡Mensaje entregado exitosamente a WhatsApp! ID: ${messageId}`);

      return {
        success: true,
        messageId,
        targetJid
      };
    } catch (error: any) {
      console.error('[WhatsAppWeb] Error enviando mensaje a WhatsApp:', error);
      return {
        success: false,
        error: error.message || 'Error transmitiendo mensaje a WhatsApp personal.'
      };
    }
  }

  /**
   * Explicitly unlinks WhatsApp session from app and purges database & disk credentials.
   */
  public static async logout(): Promise<void> {
    try {
      if (this.reconnectTimer) {
        clearTimeout(this.reconnectTimer);
        this.reconnectTimer = null;
      }

      if (this.socket) {
        try {
          await this.socket.logout();
        } catch {
          this.socket.end(undefined);
        }
      }
    } catch {
      // Ignore
    } finally {
      this.socket = null;
      this.status = 'DISCONNECTED';
      this.currentQr = null;
      this.user = null;
      this.isConnecting = false;

      // Purge disk session folder
      const sessionDir = this.getSessionDir();
      if (fs.existsSync(sessionDir)) {
        try {
          fs.rmSync(sessionDir, { recursive: true, force: true });
        } catch (rmErr) {
          console.warn('[WhatsAppWeb] Error borrando carpeta auth:', rmErr);
        }
      }

      // Purge database session table
      try {
        const db = getDatabase();
        db.prepare('DELETE FROM whatsapp_sessions').run();
        console.log('[WhatsAppWeb] Sesión eliminada completamente de la base de datos.');
      } catch (dbErr) {
        console.warn('[WhatsAppWeb] Error limpiando tabla whatsapp_sessions:', dbErr);
      }
    }
  }
}
