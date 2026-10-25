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
    const appUrl = webUrl || 'http://localhost:3001';

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
   * Tests WhatsApp Business API connection.
   */
  public static async testConnection(): Promise<{ connected: boolean; message: string }> {
    if (!this.isConfigured()) {
      return {
        connected: false,
        message: 'Meta WhatsApp Cloud API no configurado. Puedes usar el botón directo de WhatsApp Web/Móvil con 1 clic sin necesidad de claves.'
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

    // If Meta API credentials are not set, return simulated success with direct link notice
    if (!this.isConfigured()) {
      return {
        success: true,
        messageId: `wa-direct-${Date.now()}`,
        providerResponse: JSON.stringify({
          mode: 'DIRECT_WHATSAPP_LINK',
          notice: 'Mensaje preparado para envío directo por WhatsApp sin requerir API de Meta.',
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
