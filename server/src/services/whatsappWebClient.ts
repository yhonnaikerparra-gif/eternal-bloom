import fs from 'fs';
import path from 'path';
import QRCode from 'qrcode';
import pino from 'pino';
import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  WASocket,
  proto
} from '@whiskeysockets/baileys';
import { config } from '../config/index.js';

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

  private static getSessionDir(): string {
    const authDir = path.resolve(config.dataDir, 'whatsapp_auth');
    if (!fs.existsSync(authDir)) {
      fs.mkdirSync(authDir, { recursive: true });
    }
    return authDir;
  }

  public static hasSavedSession(): boolean {
    const credsFile = path.join(this.getSessionDir(), 'creds.json');
    return fs.existsSync(credsFile);
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
   * Initializes the client. If saved credentials already exist, auto-reconnects on startup.
   */
  public static async init(): Promise<void> {
    if (this.hasSavedSession()) {
      console.log('[WhatsAppWeb] Sesión guardada encontrada. Reconectando WhatsApp personal...');
      await this.startClient();
    } else {
      console.log('[WhatsAppWeb] Sin sesión de WhatsApp vinculada. Listo para vincular por código QR.');
    }
  }

  /**
   * Starts connection and generates QR code if needed.
   */
  public static async startClient(): Promise<WhatsAppWebInfo> {
    if (this.socket && this.status === 'CONNECTED') {
      return this.getStatus();
    }

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    this.status = 'CONNECTING';

    try {
      const sessionDir = this.getSessionDir();
      const { state, saveCreds } = await useMultiFileAuthState(sessionDir);
      const { version } = await fetchLatestBaileysVersion().catch(() => ({ version: [2, 3000, 1015901307] as any }));

      const logger = pino({ level: 'silent' });

      const sock = makeWASocket({
        version,
        logger,
        auth: state,
        printQRInTerminal: false,
        browser: ['MI VIDA ETERNA', 'Chrome', '1.0.0'],
        connectTimeoutMs: 60000,
        defaultQueryTimeoutMs: 60000,
      });

      this.socket = sock;

      // Handle credentials updates
      sock.ev.on('creds.update', saveCreds);

      // Handle connection updates (QR code & open/close state)
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
            console.log('[WhatsAppWeb] Nuevo código QR generado para vinculación.');
          } catch (qrErr) {
            console.error('[WhatsAppWeb] Error generando QR imagen:', qrErr);
          }
        }

        if (connection === 'open') {
          this.status = 'CONNECTED';
          this.currentQr = null;
          this.lastConnectedAt = new Date().toISOString();

          const rawId = sock.user?.id || '';
          const cleanPhone = rawId.split(':')[0] || rawId.split('@')[0];

          this.user = {
            id: rawId,
            name: sock.user?.name || 'Mi WhatsApp',
            phone: cleanPhone
          };

          console.log(`🌸 [WhatsAppWeb] ¡WhatsApp Personal CONECTADO exitosamente! Número: ${cleanPhone}`);
        }

        if (connection === 'close') {
          const statusCode = (lastDisconnect?.error as any)?.output?.statusCode;
          const shouldReconnect = statusCode !== DisconnectReason.loggedOut;

          console.log(`[WhatsAppWeb] Conexión cerrada. Razón (status code): ${statusCode}. ¿Reconectar?: ${shouldReconnect}`);

          if (shouldReconnect) {
            this.status = 'CONNECTING';
            // Auto reconnect after 5 seconds
            this.reconnectTimer = setTimeout(() => {
              this.startClient().catch((err) => console.error('[WhatsAppWeb] Reconnect error:', err));
            }, 5000);
          } else {
            // User unlinked session from WhatsApp on their phone
            console.log('[WhatsAppWeb] Sesión desvinculada por el usuario.');
            await this.logout();
          }
        }
      });

      return this.getStatus();
    } catch (error: any) {
      console.error('[WhatsAppWeb] Error iniciando cliente Baileys:', error);
      this.status = 'DISCONNECTED';
      return this.getStatus();
    }
  }

  /**
   * Sends a WhatsApp text message directly to recipient phone number using linked personal WhatsApp.
   */
  public static async sendMessage(
    recipientPhone: string,
    message: string
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    if (!this.isConnected() || !this.socket) {
      return {
        success: false,
        error: 'WhatsApp Personal no está vinculado. Por favor escanea el código QR en el panel de administrador.'
      };
    }

    try {
      const cleanPhone = recipientPhone.replace(/[^\d]/g, '');
      if (!cleanPhone || cleanPhone.length < 7) {
        return {
          success: false,
          error: `Número de teléfono inválido: "${recipientPhone}".`
        };
      }

      // WhatsApp standard JID: [countryCode][number]@s.whatsapp.net
      const jid = `${cleanPhone}@s.whatsapp.net`;

      const result = await this.socket.sendMessage(jid, {
        text: message
      });

      const messageId = result?.key?.id || `msg-${Date.now()}`;

      console.log(`[WhatsAppWeb] Mensaje enviado a ${cleanPhone}. Message ID: ${messageId}`);

      return {
        success: true,
        messageId
      };
    } catch (error: any) {
      console.error('[WhatsAppWeb] Error enviando mensaje:', error);
      return {
        success: false,
        error: error.message || 'Error al enviar mensaje por WhatsApp personal.'
      };
    }
  }

  /**
   * Unlinks and clears WhatsApp session.
   */
  public static async logout(): Promise<void> {
    try {
      if (this.socket) {
        try {
          await this.socket.logout();
        } catch {
          this.socket.end(undefined);
        }
      }
    } catch {
      // Ignore cleanup error
    } finally {
      this.socket = null;
      this.status = 'DISCONNECTED';
      this.currentQr = null;
      this.user = null;

      // Clean directory
      const sessionDir = this.getSessionDir();
      if (fs.existsSync(sessionDir)) {
        try {
          fs.rmSync(sessionDir, { recursive: true, force: true });
        } catch (rmErr) {
          console.warn('[WhatsAppWeb] No se pudo borrar carpeta de auth:', rmErr);
        }
      }
    }
  }
}
