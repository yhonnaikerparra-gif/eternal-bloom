import { config } from '../config/index.js';
import { WhatsAppWebClient } from './whatsappWebClient.js';

export interface SendWhatsAppResult {
  success: boolean;
  messageId?: string;
  providerResponse?: string;
  error?: string;
}

export class WhatsAppService {
  private static BASE_URL = 'https://graph.facebook.com/v19.0';

  public static isConfigured(): boolean {
    return WhatsAppWebClient.isConnected() || !!(config.whatsapp.token && config.whatsapp.phoneNumberId);
  }

  /**
   * Cleans and formats phone number for WhatsApp E.164 without symbols.
   */
  public static cleanPhoneNumber(phone: string): string {
    return phone.replace(/[^\d]/g, '');
  }

  /**
   * Builds the formatted romantic WhatsApp love letter reminder.
   */
  public static buildReminderText(
    recipientName: string,
    title: string,
    content: string,
    signatureName: string,
    dateString: string,
    webUrl?: string
  ): string {
    const appUrl =
      (webUrl && webUrl.trim()) ||
      process.env.PUBLIC_URL ||
      process.env.RENDER_EXTERNAL_URL ||
      'https://mi-vida-eterna.onrender.com';

    return `🌸 *MI VIDA ETERNA* 🌸\n_${dateString}_\n\n*${title}*\n\nQuerida ${recipientName},\n\n"${content}"\n\n🌹 *Una nueva flor ha florecido hoy para ti en nuestro jardín eterno.*\n\n✨ Entra a nuestro mundo y mira tu jardín crecer:\n👉 ${appUrl}\n\nCon todo mi corazón,\n*${signatureName}* ❤️`;
  }

  /**
   * Generates a 1-click WhatsApp Direct URL (wa.me) that works instantly on any phone or browser without credentials.
   */
  public static buildDirectWhatsAppUrl(
    toPhone: string,
    recipientName: string,
    title: string,
    content: string,
    signatureName: string,
    dateString: string,
    webUrl?: string
  ): string {
    const cleaned = this.cleanPhoneNumber(toPhone);
    const text = this.buildReminderText(recipientName, title, content, signatureName, dateString, webUrl);
    const encoded = encodeURIComponent(text);
    return cleaned
      ? `https://api.whatsapp.com/send?phone=${cleaned}&text=${encoded}`
      : `https://api.whatsapp.com/send?text=${encoded}`;
  }

  /**
   * Tests WhatsApp connection status (personal WhatsApp Web or Meta API).
   */
  public static async testConnection(): Promise<{ connected: boolean; message: string }> {
    if (WhatsAppWebClient.isConnected()) {
      const user = WhatsAppWebClient.getStatus().user;
      return {
        connected: true,
        message: `WhatsApp Personal conectado y vinculado exitosamente desde el número (+${user?.phone || 'Vinculado'}). Envío 100% automático desatendido activo a las 5:00 AM.`
      };
    }

    if (!this.isConfigured()) {
      return {
        connected: false,
        message: 'WhatsApp Personal no vinculado. Escanea el código QR en la pestaña WhatsApp para activar el envío automático a las 5:00 AM.'
      };
    }

    try {
      const response = await fetch(`${this.BASE_URL}/${config.whatsapp.phoneNumberId}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${config.whatsapp.token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = (await response.json()) as any;
      if (response.ok && data.id) {
        return {
          connected: true,
          message: `Conexión exitosa con Meta WhatsApp Business API. Número emisor ID: ${data.id} (${data.display_phone_number || 'Verificado'})`
        };
      } else {
        return {
          connected: false,
          message: `Error de API de WhatsApp: ${data.error?.message || response.statusText}`
        };
      }
    } catch (error: any) {
      return {
        connected: false,
        message: `Error de conexión con WhatsApp: ${error.message}`
      };
    }
  }

  /**
   * Sends romantic love letter reminder via WhatsApp Cloud API.
   */
  public static async sendLetter(
    toPhone: string,
    recipientName: string,
    title: string,
    content: string,
    signatureName: string,
    dateString: string,
    webUrl?: string
  ): Promise<SendWhatsAppResult> {
    const cleanedPhone = this.cleanPhoneNumber(toPhone);

    if (!cleanedPhone || cleanedPhone.length < 9) {
      return {
        success: false,
        error: `Número de WhatsApp inválido: "${toPhone}". Debe incluir código de país (ejemplo: 57 para Colombia).`
      };
    }

    const formattedBody = this.buildReminderText(recipientName, title, content, signatureName, dateString, webUrl);

    // 1. Primary Priority: If personal WhatsApp Web Client is linked, send autonomously from user's phone!
    if (WhatsAppWebClient.isConnected()) {
      const webResult = await WhatsAppWebClient.sendMessage(cleanedPhone, formattedBody);
      if (webResult.success) {
        return {
          success: true,
          messageId: webResult.messageId,
          providerResponse: JSON.stringify({
            mode: 'WHATSAPP_PERSONAL_LINKED',
            messageId: webResult.messageId,
            sender: WhatsAppWebClient.getStatus().user?.phone,
            recipient: cleanedPhone
          })
        };
      } else {
        console.error('[WhatsAppService] WhatsApp Web failed to deliver:', webResult.error);
        // If it failed and Meta API is not configured, return the error
        if (!config.whatsapp.token) {
          return {
            success: false,
            error: webResult.error
          };
        }
      }
    }

    // 2. Secondary: If neither WhatsApp Web nor Meta API are configured
    if (!this.isConfigured()) {
      if (process.env.NODE_ENV === 'test') {
        return {
          success: true,
          messageId: `wa-test-mock-${Date.now()}`,
          providerResponse: JSON.stringify({ mode: 'TEST_MOCK' })
        };
      }
      return {
        success: false,
        error: 'Tu WhatsApp personal no está vinculado con el código QR. Entra al Panel de Administrador > pestaña WhatsApp y escanea el código QR para activar el envío automático a su celular.',
        providerResponse: JSON.stringify({
          mode: 'NOT_LINKED',
          directUrl: this.buildDirectWhatsAppUrl(toPhone, recipientName, title, content, signatureName, dateString, webUrl)
        })
      };
    }

    try {
      const payload = {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: cleanedPhone,
        type: 'text',
        text: {
          preview_url: true,
          body: formattedBody
        }
      };

      const response = await fetch(`${this.BASE_URL}/${config.whatsapp.phoneNumberId}/messages`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${config.whatsapp.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const data = (await response.json()) as any;

      if (response.ok && data.messages && data.messages.length > 0) {
        const messageId = data.messages[0].id;
        return {
          success: true,
          messageId: messageId,
          providerResponse: JSON.stringify(data)
        };
      } else {
        const errorMessage = data.error?.message || `WhatsApp API error (${response.status}): ${JSON.stringify(data)}`;
        console.error('[WhatsAppService] Error sending message:', errorMessage);
        return {
          success: false,
          error: errorMessage,
          providerResponse: JSON.stringify(data)
        };
      }
    } catch (error: any) {
      console.error('[WhatsAppService] Network error:', error);
      return {
        success: false,
        error: error.message || 'Network error connecting to Meta WhatsApp API'
      };
    }
  }
}
