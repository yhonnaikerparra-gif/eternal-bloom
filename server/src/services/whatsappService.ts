import { config } from '../config/index.js';

export interface SendWhatsAppResult {
  success: boolean;
  messageId?: string;
  providerResponse?: string;
  error?: string;
}

export class WhatsAppService {
  private static BASE_URL = 'https://graph.facebook.com/v19.0';

  public static isConfigured(): boolean {
    return !!(config.whatsapp.token && config.whatsapp.phoneNumberId);
  }

  /**
   * Cleans and formats phone number for WhatsApp E.164 without symbols.
   */
  public static cleanPhoneNumber(phone: string): string {
    return phone.replace(/[^\d]/g, '');
  }

  /**
   * Tests WhatsApp Business API connection by fetching Phone Number Details.
   */
  public static async testConnection(): Promise<{ connected: boolean; message: string }> {
    if (!this.isConfigured()) {
      return {
        connected: false,
        message: 'WhatsApp not configured. Missing WHATSAPP_TOKEN or WHATSAPP_PHONE_NUMBER_ID.'
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
   * Sends romantic love letter via WhatsApp Cloud API.
   * Attempts Template message if configured, or falls back to structured text message.
   */
  public static async sendLetter(
    toPhone: string,
    recipientName: string,
    title: string,
    content: string,
    signatureName: string,
    dateString: string
  ): Promise<SendWhatsAppResult> {
    if (!this.isConfigured()) {
      return {
        success: false,
        error: 'WhatsApp Business API is not configured. Missing token or phone number ID.'
      };
    }

    const cleanedPhone = this.cleanPhoneNumber(toPhone);
    if (!cleanedPhone || cleanedPhone.length < 9) {
      return {
        success: false,
        error: `Invalid recipient phone number: "${toPhone}". Must include country code (e.g. 57 for Colombia).`
      };
    }

    const formattedBody = `🌸 *MI VIDA ETERNA* 🌸\n_${dateString}_\n\n*${title}*\n\nQuerida ${recipientName},\n\n${content}\n\nCon todo mi amor,\n*${signatureName}* 🌹\n\n_(Una nueva flor ha brotado hoy en nuestro jardín)_`;

    try {
      // Direct text payload (standard format)
      const payload = {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: cleanedPhone,
        type: 'text',
        text: {
          preview_url: false,
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
