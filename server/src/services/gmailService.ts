import nodemailer from 'nodemailer';
import { config } from '../config/index.js';

export interface SendEmailResult {
  success: boolean;
  messageId?: string;
  providerResponse?: string;
  error?: string;
}

export class GmailService {
  private static transporter: nodemailer.Transporter | null = null;

  public static getTransporter(): nodemailer.Transporter | null {
    if (!config.gmail.user || !config.gmail.appPassword) {
      return null;
    }

    if (!this.transporter) {
      this.transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: config.gmail.user,
          pass: config.gmail.appPassword,
        },
      });
    }

    return this.transporter;
  }

  /**
   * Generates a romantic, responsive, parchment-styled HTML email.
   */
  public static buildRomanticHtml(
    recipientName: string,
    title: string,
    content: string,
    signatureName: string,
    dateString: string
  ): string {
    const formattedContent = content
      .split('\n')
      .filter(p => p.trim().length > 0)
      .map(p => `<p style="margin: 0 0 16px 0; line-height: 1.8; color: #372826; font-size: 17px; font-family: 'Georgia', 'Cormorant Garamond', serif;">${p.trim()}</p>`)
      .join('');

    return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
</head>
<body style="margin: 0; padding: 30px 15px; background-color: #FAF5F0; font-family: 'Georgia', serif;">
  <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #FFFDF9; border-radius: 16px; border: 1px solid #EFE4D8; box-shadow: 0 10px 25px rgba(180, 130, 110, 0.12); overflow: hidden;">
    <!-- Romantic Header Decor -->
    <tr>
      <td align="center" style="padding: 35px 30px 15px 30px; background: linear-gradient(180deg, #FDF7F2 0%, #FFFDF9 100%); border-bottom: 1px solid #F3ECE4;">
        <span style="display: inline-block; font-size: 28px; line-height: 1; margin-bottom: 8px;">🌸</span>
        <h2 style="margin: 0; color: #881337; font-size: 13px; text-transform: uppercase; letter-spacing: 3px; font-family: 'Helvetica Neue', sans-serif; font-weight: 600;">MI VIDA ETERNA</h2>
        <p style="margin: 6px 0 0 0; color: #9C7D73; font-size: 12px; letter-spacing: 1px; font-style: italic;">${dateString}</p>
      </td>
    </tr>
    <!-- Letter Body -->
    <tr>
      <td style="padding: 40px 35px 30px 35px;">
        <h1 style="margin: 0 0 24px 0; color: #4C1D24; font-size: 24px; font-weight: normal; font-family: 'Georgia', serif; font-style: italic; border-left: 3px solid #E11D48; padding-left: 14px;">${title}</h1>
        <p style="margin: 0 0 20px 0; color: #78350F; font-size: 15px; font-weight: 500;">Querida ${recipientName},</p>
        <div style="text-align: justify;">
          ${formattedContent}
        </div>
        <!-- Romantic Signoff -->
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-top: 35px; border-top: 1px dashed #EEDDCF; padding-top: 25px;">
          <tr>
            <td align="right">
              <p style="margin: 0 0 4px 0; color: #9C7D73; font-size: 14px; font-style: italic;">Con todo mi corazón,</p>
              <p style="margin: 0; color: #881337; font-size: 22px; font-family: 'Brush Script MT', 'Dancing Script', cursive; font-weight: normal;">${signatureName}</p>
              <span style="display: inline-block; font-size: 18px; margin-top: 4px;">🌹</span>
            </td>
          </tr>
        </table>
      </td>
    </tr>
    <!-- Subtle Footer Note -->
    <tr>
      <td align="center" style="padding: 20px 30px; background-color: #FBF7F2; border-top: 1px solid #F3ECE4;">
        <p style="margin: 0; color: #A8958E; font-size: 11px; line-height: 1.5; font-family: 'Helvetica Neue', sans-serif;">
          Una nueva flor ha florecido hoy para ti en nuestro jardín eterno.<br>
          <em>Cada carta es única e irrepetible.</em>
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`;
  }

  /**
   * Tests connection with the SMTP/Gmail server.
   */
  public static async testConnection(): Promise<{ connected: boolean; message: string }> {
    const transporter = this.getTransporter();
    if (!transporter) {
      return {
        connected: false,
        message: 'Gmail credentials not configured. Please set GMAIL_USER and GMAIL_APP_PASSWORD in environment settings.'
      };
    }

    try {
      await transporter.verify();
      return {
        connected: true,
        message: 'Conexión exitosa con el servidor de Gmail.'
      };
    } catch (error: any) {
      return {
        connected: false,
        message: `Error al conectar con Gmail: ${error.message}`
      };
    }
  }

  /**
   * Sends the love letter email via Gmail.
   */
  public static async sendLetter(
    toEmail: string,
    recipientName: string,
    title: string,
    content: string,
    signatureName: string,
    dateString: string
  ): Promise<SendEmailResult> {
    const transporter = this.getTransporter();
    if (!transporter) {
      return {
        success: false,
        error: 'Gmail not configured. Missing GMAIL_USER or GMAIL_APP_PASSWORD.'
      };
    }

    if (!toEmail || !toEmail.includes('@')) {
      return {
        success: false,
        error: `Invalid recipient email address: "${toEmail}"`
      };
    }

    const html = this.buildRomanticHtml(recipientName, title, content, signatureName, dateString);
    const plainText = `MI VIDA ETERNA - ${dateString}\n\n${title}\n\nQuerida ${recipientName},\n\n${content}\n\nCon todo mi corazón,\n${signatureName} 🌹\n\n(Una nueva flor ha florecido hoy para ti en nuestro jardín)`;

    try {
      const info = await transporter.sendMail({
        from: `"${config.gmail.senderName}" <${config.gmail.user}>`,
        to: toEmail,
        subject: `🌸 ${title} — Mi Vida Eterna`,
        text: plainText,
        html: html,
      });

      return {
        success: true,
        messageId: info.messageId,
        providerResponse: JSON.stringify(info.response || 'Message accepted by Gmail SMTP')
      };
    } catch (error: any) {
      console.error('[GmailService] Send error:', error);
      return {
        success: false,
        error: error.message || 'Unknown error occurred while sending email via Gmail'
      };
    }
  }
}
