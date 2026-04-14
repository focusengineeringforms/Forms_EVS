import nodemailer from 'nodemailer';
import { MailerSend, EmailParams, Sender, Recipient } from "mailersend";

class MailService {
  constructor() {
    // Initialize MailerSend if API key is present
    if (process.env.MAILERSEND_API_KEY) {
      this.mailersend = new MailerSend({
        apiKey: process.env.MAILERSEND_API_KEY,
      });
      console.log('✅ MailService: MailerSend API initialized for production');
    }

    // Standard SMTP Transporter (Fallback)
    // Standard SMTP Transporter (Fallback)
    const host = process.env.SMTP_HOST || 'smtp.gmail.com';
    const port = parseInt(process.env.SMTP_PORT || '587');
    const secure = process.env.SMTP_SECURE === 'true'; // false for 587, true for 465

    this.transporter = nodemailer.createTransport({
      host: host,
      port: port,
      secure: secure,
      auth: {
        user: (process.env.SMTP_USER || '').trim(),
        pass: (process.env.SMTP_PASS || '').trim()
      },
      tls: {
        rejectUnauthorized: false
      },
      connectionTimeout: 20000, // 20 seconds
      greetingTimeout: 15000,   // 15 seconds
    });

    if (!process.env.MAILERSEND_API_KEY) {
      this.transporter.verify((error) => {
        if (error) {
          console.error('❌ MailService SMTP failure:', error.message);
        } else {
          console.log('✅ MailService SMTP ready');
        }
      });
    }
  }

  async sendEmail(options) {
    const senderName = process.env.SMTP_SENDER_NAME || 'EVSUAE';

    // ── PRIMARY: MailerSend HTTP API (works on Render — SMTP ports are blocked) ──
    if (this.mailersend) {
      try {
        // Use dedicated MailerSend sender, fall back to SMTP_USER
        const fromEmail = process.env.MAILERSEND_FROM_EMAIL || process.env.SMTP_USER;
        if (!fromEmail) {
          throw new Error('No sender email configured (set MAILERSEND_FROM_EMAIL or SMTP_USER)');
        }

        console.log(`📧 MailerSend: Sending to ${options.to} from ${fromEmail}`);

        const sentFrom = new Sender(fromEmail, senderName);
        const recipients = [new Recipient(options.to)];

        const emailParams = new EmailParams()
          .setFrom(sentFrom)
          .setTo(recipients)
          .setSubject(options.subject)
          .setHtml(options.html);

        // Set reply-to as the business email if using a trial domain
        if (process.env.SMTP_USER && process.env.SMTP_USER !== fromEmail) {
          emailParams.setReplyTo(new Sender(process.env.SMTP_USER, senderName));
        }

        const response = await this.mailersend.email.send(emailParams);
        console.log(`✅ MailerSend delivery successful to ${options.to}!`);
        return { success: true, messageId: response?.body?.id || 'mailersend-ok' };
      } catch (apiError) {
        const errorDetail = apiError?.body?.message || apiError?.message || String(apiError);
        console.error('❌ MailerSend API failed:', errorDetail);
        console.error('   Full error:', JSON.stringify(apiError?.body || apiError, null, 2));

        // If MAILERSEND_API_KEY is configured, we DO NOT fall through to SMTP.
        // This avoids 20s connection timeouts when MailerSend fails but SMTP is blocked.
        return { success: false, error: `MailerSend error: ${errorDetail}` };
      }
    }

    // ── FALLBACK: Classic SMTP (works locally, blocked on Render) ──
    try {
      if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
        if (process.env.NODE_ENV === 'development') {
           return { success: true, messageId: 'dev-mock-ok-' + Date.now() };
        }
        throw new Error('SMTP credentials not configured');
      }

      const result = await this.transporter.sendMail({
        from: `"${senderName}" <${process.env.SMTP_USER}>`,
        to: options.to,
        subject: options.subject,
        html: options.html,
        attachments: options.attachments || []
      });

      console.log(`✅ SMTP delivery successful to ${options.to}!`);
      return { success: true, messageId: result.messageId };
    } catch (error) {
      console.error('❌ SMTP delivery failed:', error.message);
      return { success: false, error: error.message };
    }
  }

  // Helper methods
  async sendServiceRequestNotification(serviceRequest, customerInfo) {
    return this.sendEmail({
      to: process.env.SHOP_EMAIL || 'admin@focus.com',
      subject: `🚗 New Service Request - ${serviceRequest.vehicleMake} ${serviceRequest.vehicleModel}`,
      html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee;">
            <h2 style="color: #2563eb; border-bottom: 2px solid #2563eb; padding-bottom: 10px;">
              New Service Request Received
            </h2>
            <div style="background: #f8fafc; padding: 15px; border-radius: 8px;">
              <p><strong>Customer:</strong> ${customerInfo.name}</p>
              <p><strong>Vehicle:</strong> ${serviceRequest.vehicleMake} ${serviceRequest.vehicleModel}</p>
              <p><strong>Issue:</strong> ${serviceRequest.issueDescription}</p>
            </div>
          </div>
      `
    });
  }

  async sendCustomerConfirmation(serviceRequest, customerInfo) {
    return this.sendEmail({
      to: customerInfo.email,
      subject: `✅ Service Request Received - Focus Engineering`,
      html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #16a34a; border-bottom: 2px solid #16a34a; padding-bottom: 10px;">
              Service Confirmation
            </h2>
            <p>We will contact you shortly with the next steps.</p>
          </div>
      `
    });
  }

  async sendFormInvite(recipientEmail, formTitle, inviteLink, tenantName, language = 'en') {
    let subject = `V2 Invitation: Please complete "${formTitle}"`;
    let html = '';

    // ALWAYS ensure the link points to Arabic form if Arabic or Both is selected
    let finalInviteLink = inviteLink;
    if (language === 'ar') {
      const separator = finalInviteLink.includes('?') ? '&' : '?';
      finalInviteLink = `${finalInviteLink}${separator}lang=ar`;
    } else if (language === 'both') {
      const separator = finalInviteLink.includes('?') ? '&' : '?';
      finalInviteLink = `${finalInviteLink}${separator}lang=both`;
    }

    const isBoth = language === 'both';
    const isArabic = language === 'ar';

    // Subject remains English even for Arabic, or Bilingual for Both
    if (language === 'both') {
      subject = `V2 Invitation / دعوة: Please complete "${formTitle}" / يرجى إكمال "${formTitle}"`;
    } else if (language === 'ar') {
      subject = `V2 دعوة: يرجى إكمال "${formTitle}"`;
    }

    const englishContent = `
      <div style="direction: ltr; text-align: left; margin-bottom: 30px; font-family: Arial, sans-serif; color: #334155;">
        <p>Dear Valued Customer,</p>
        <p>Thank you for your recent visit to <strong>${tenantName}</strong>. We hope we were able to fully meet your expectations.</p>
        <p>At ${tenantName}, we continuously strive to improve our customer experience and deliver the highest level of service. We would greatly appreciate your feedback on your recent car maintenance experience with us.</p>
        <p>This short survey will take no more than two minutes of your time.</p>
        <div style="margin: 25px 0; text-align: center;">
          <a href="${finalInviteLink}" style="display: inline-block; background-color: #2563eb; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-size: 16px; font-weight: bold; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">Fill Out Form</a>
        </div>
        <p>Thank you in advance for your valuable feedback.</p>
        <p style="margin-top: 20px;">Best regards,<br><strong>${tenantName} Team</strong></p>
      </div>
    `;

    const arabicContent = `
      <div style="direction: rtl; text-align: right; margin-bottom: 30px; font-family: Tahoma, Arial, sans-serif; color: #334155;">
        <p>شكرًا لزيارتك الأخيرة إلى <strong>${tenantName}</strong>. نأمل أن نكون قد لبّينا توقعاتك بالكامل.</p>
        <p>في ${tenantName}، نسعى باستمرار إلى تحسين تجربة عملائنا وتقديم أعلى مستوى من الخدمة. ويسعدنا جدًا الحصول على ملاحظاتك حول تجربتك الأخيرة معنا في صيانة سيارتك.</p>
        <p>لن يستغرق هذا الاستبيان أكثر من دقيقتين من وقتك.</p>
        <div style="margin: 25px 0; text-align: center;">
          <a href="${finalInviteLink}" style="display: inline-block; background-color: #16a34a; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-size: 16px; font-weight: bold; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">تعبئة النموذج</a>
        </div>
        <p>شكرًا مقدمًا على مشاركتك القيّمة.</p>
        <p style="margin-top: 20px;">مع خالص التحية،<br><strong>فريق ${tenantName}</strong></p>
      </div>
    `;

    html = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 20px auto; padding: 30px; border: 2px solid #3b82f6; border-radius: 16px; background-color: #ffffff; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);">
        <h2 style="color: #1e40af; text-align: center; margin-bottom: 30px; font-size: 26px; border-bottom: 2px solid #f1f5f9; padding-bottom: 15px;">${language === 'both' ? 'Invitation / دعوة' : (language === 'ar' ? 'دعوة' : 'Invitation')}</h2>
        
        ${!isArabic ? englishContent : ''}
        ${isBoth ? '<hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 40px 0;">' : ''}
        ${(isBoth || isArabic) ? arabicContent : ''}

        <p style="font-size: 12px; color: #94a3b8; margin-top: 40px; border-top: 1px solid #f1f5f9; padding-top: 20px; text-align: center;">
            Direct Link / الرابط المباشر: <a href="${finalInviteLink}" style="color: #2563eb; text-decoration: underline;">${finalInviteLink}</a>
        </p>
      </div>
    `;

    return this.sendEmail({
      to: recipientEmail,
      subject: subject,
      html: html
    });
  }

  async sendResponseReportWithAttachment(recipientEmail, subject, fileData, fileName) {
    return this.sendEmail({
      to: recipientEmail,
      subject: subject || 'Response Report',
      html: `<p>Please find attached the report for ${subject}.</p>`,
      attachments: [{ filename: fileName || 'report.xlsx', content: fileData }]
    });
  }

  async testConnection() {
    try {
      await this.transporter.verify();
      console.log('✅ SMTP connection successful');
      return { success: true, message: 'SMTP connection successful' };
    } catch (error) {
      console.error('❌ SMTP connection failed:', error.message);
      return { success: false, error: error.message };
    }
  }
}

export default new MailService();