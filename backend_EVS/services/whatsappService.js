import twilio from 'twilio';

class WhatsAppService {
  constructor() {
    // Use WA-specific Twilio account if set, otherwise fall back to default
    const accountSid = (process.env.WA_TWILIO_ACCOUNT_SID || process.env.TWILIO_ACCOUNT_SID || '').trim();
    const authToken = (process.env.WA_TWILIO_AUTH_TOKEN || process.env.TWILIO_AUTH_TOKEN || '').trim();

    this.isConfigured = !!(accountSid && authToken);

    if (!this.isConfigured) {
      const missing = [];
      if (!accountSid) missing.push('WA_TWILIO_ACCOUNT_SID');
      if (!authToken) missing.push('WA_TWILIO_AUTH_TOKEN');
      console.warn(`⚠️ WhatsApp service not fully configured. Missing: ${missing.join(', ')}`);
      this.client = null;
    } else {
      this.client = twilio(accountSid, authToken);
      console.log(`✅ WhatsApp Twilio client initialized (Account: ${accountSid.substring(0, 10)}...)`);
    }

    this.twilioPhoneNumber = (process.env.WA_TWILIO_WHATSAPP_NUMBER || process.env.TWILIO_WHATSAPP_NUMBER || '').trim();
    this.inviteTemplateSid = (process.env.WA_TWILIO_INVITE_TEMPLATE_SID || process.env.TWILIO_INVITE_TEMPLATE_SID || '').trim();
  }

  formatPhoneNumber(phone) {
    if (!phone) return null;

    const cleaned = phone.replace(/\D/g, '');

    if (cleaned.startsWith('91') && cleaned.length === 12) {
      return `+${cleaned}`;
    }

    if (cleaned.length === 10) {
      return `+91${cleaned}`;
    }

    return `+${cleaned}`;
  }

  async sendServiceRequestNotification(serviceRequest, customerInfo) {
    try {
      if (!this.isConfigured) {
        return { success: false, error: 'Twilio WhatsApp service not configured' };
      }

      const customerPhone = this.formatPhoneNumber(customerInfo.phone);
      if (!customerPhone) {
        return { success: false, error: 'Invalid customer phone number' };
      }

      const shopPhone = process.env.TWILIO_SHOP_WHATSAPP || '';
      if (!shopPhone) {
        return { success: false, error: 'Shop WhatsApp number not configured' };
      }

      const message = `
🚗 *NEW SERVICE REQUEST*

*Customer Information:*
Name: ${customerInfo.name}
Email: ${customerInfo.email}
Phone: ${customerInfo.phone}

*Vehicle Information:*
Make: ${serviceRequest.vehicleMake}
Model: ${serviceRequest.vehicleModel}
Year: ${serviceRequest.vehicleYear || 'Not specified'}
License Plate: ${serviceRequest.licensePlate || 'Not provided'}

*Service Details:*
Service Type: ${serviceRequest.serviceType}
Issue: ${serviceRequest.issueDescription}
${serviceRequest.urgency ? `Urgency: ${serviceRequest.urgency}` : ''}
${serviceRequest.preferredDate ? `Preferred Date: ${serviceRequest.preferredDate}` : ''}

Request ID: ${serviceRequest.id || 'N/A'}
Submitted: ${new Date().toLocaleString()}
      `.trim();

      const messageData = await this.client.messages.create({
        from: `whatsapp:${this.twilioPhoneNumber}`,
        to: `whatsapp:${shopPhone}`,
        body: message,
      });

      console.log('Service request notification sent to shop:', messageData.sid);
      return { success: true, messageId: messageData.sid };
    } catch (error) {
      console.error('Error sending service request notification:', error);
      return { success: false, error: error.message };
    }
  }

  async sendCustomerConfirmation(serviceRequest, customerInfo) {
    try {
      if (!this.isConfigured) {
        return { success: false, error: 'Twilio WhatsApp service not configured' };
      }

      const customerPhone = this.formatPhoneNumber(customerInfo.phone);
      if (!customerPhone) {
        return { success: false, error: 'Invalid customer phone number' };
      }

      const message = `
✅ *SERVICE REQUEST RECEIVED*

Dear ${customerInfo.name},

Thank you for choosing Focus Auto Shop! We have received your service request.

*Your Request Summary:*
Vehicle: ${serviceRequest.vehicleMake} ${serviceRequest.vehicleModel} ${serviceRequest.vehicleYear || ''}
Service Type: ${serviceRequest.serviceType}
Issue: ${serviceRequest.issueDescription}

*What Happens Next?*
📋 Our team will review within 24 hours
📞 We'll contact you to schedule
🔧 Our mechanics will diagnose & fix

*Need Help?*
Call: (555) 123-4567
Email: support@focus-auto.com

Request ID: ${serviceRequest.id || 'N/A'}
      `.trim();

      const messageData = await this.client.messages.create({
        from: `whatsapp:${this.twilioPhoneNumber}`,
        to: `whatsapp:${customerPhone}`,
        body: message,
      });

      console.log('Customer confirmation sent:', messageData.sid);
      return { success: true, messageId: messageData.sid };
    } catch (error) {
      console.error('Error sending customer confirmation:', error);
      return { success: false, error: error.message };
    }
  }

  async sendFormInvite(phone, formTitle, inviteLink, tenantName, language = 'en') {
    let customerPhone;
    try {
      if (!this.isConfigured) {
        return { success: false, error: 'Twilio WhatsApp service not configured' };
      }

      customerPhone = this.formatPhoneNumber(phone);
      if (!customerPhone) {
        return { success: false, error: 'Invalid phone number' };
      }

      // Force production URL
      let inviteLinkFinal = String(inviteLink || '').trim().replace(
        /http:\/\/(localhost|127\.0\.0\.1)(:\d+)?/,
        'https://formsuperadmin.focusengineeringapp.com'
      );

      // If language is NOT English, force fallback to plain text strategy
      if (language !== 'en') {
        throw new Error('MULTILINGUAL_STRATEGY');
      }

      const v1 = inviteLinkFinal;
      const messageData = await this.client.messages.create({
        from: `whatsapp:${this.twilioPhoneNumber}`,
        to: `whatsapp:${customerPhone}`,
        contentSid: this.inviteTemplateSid.trim(),
        contentVariables: JSON.stringify({ "1": v1 }),
      });

      return { success: true, messageId: messageData.sid, status: messageData.status };
    } catch (error) {
      try {
        let inviteLinkFinal = String(inviteLink || '').trim().replace(
          /http:\/\/(localhost|127\.0\.0\.1)(:\d+)?/,
          'https://formsuperadmin.focusengineeringapp.com'
        );
        
        let finalInviteLink = inviteLinkFinal;
        if (language === 'ar') {
          const separator = finalInviteLink.includes('?') ? '&' : '?';
          finalInviteLink = `${finalInviteLink}${separator}lang=ar`;
        } else if (language === 'both') {
          const separator = finalInviteLink.includes('?') ? '&' : '?';
          finalInviteLink = `${finalInviteLink}${separator}lang=both`;
        }

        let body = '';
        const enBody = `Dear Valued Customer,

Thank you for your recent visit to *${tenantName}*. We continuously strive to deliver the highest level of service and would greatly appreciate your feedback on your recent car maintenance experience. 🚘✨

This short survey will take no more than two minutes of your time. Please share your thoughts here:
👉 ${finalInviteLink}

Thank you in advance for your valuable feedback!

Best regards, 
*${tenantName} Team*`;

        const arBody = `عميلنا العزيز،

نشكرك على زيارتك الأخيرة لـ *${tenantName}*. نسعى دائماً لتقديم أعلى مستوى من الخدمة، ونقدر جداً ملاحظاتك حول تجربتك الأخيرة في صيانة سيارتك. 🚘✨

لن يستغرق هذا الاستبيان القصير أكثر من دقيقتين من وقتك. يرجى مشاركة آرائك هنا:
👉 ${finalInviteLink}

شكراً لك مقدماً على ملاحظاتك القيمة!

مع خالص التحية،
*فريق ${tenantName}*`;

        if (language === 'both') {
          body = `${enBody}\n\n---\n\n${arBody}`;
        } else if (language === 'ar') {
          body = arBody;
        } else {
          body = enBody;
        }

        const msgData = await this.client.messages.create({
          from: `whatsapp:${this.twilioPhoneNumber}`,
          to: `whatsapp:${customerPhone}`,
          body: body,
        });
        
        return { success: true, messageId: msgData.sid, strategy: 'plain_text' };
      } catch (fallbackError) {
        console.error('❌ WhatsApp delivery failed:', fallbackError.message);
        return { success: false, error: fallbackError.message };
      }
    }
  }


  async sendStatusUpdate(serviceRequest, customerInfo, status, message, estimatedCompletion = null) {
    try {
      if (!this.isConfigured) {
        return { success: false, error: 'Twilio WhatsApp service not configured' };
      }

      const customerPhone = this.formatPhoneNumber(customerInfo.phone);
      if (!customerPhone) {
        return { success: false, error: 'Invalid customer phone number' };
      }

      const statusEmojis = {
        'received': '📥',
        'in-progress': '⚙️',
        'waiting-parts': '⏳',
        'completed': '✅',
        'ready-pickup': '🚗'
      };

      const emoji = statusEmojis[status] || '📌';
      const statusText = status.replace('-', ' ').toUpperCase();

      const whatsappMessage = `
${emoji} *SERVICE STATUS UPDATE*

Dear ${customerInfo.name},

*Vehicle:* ${serviceRequest.vehicleMake} ${serviceRequest.vehicleModel}
*Status:* ${statusText}

*Update:*
${message}

${estimatedCompletion ? `⏰ *Estimated Completion:* ${estimatedCompletion}` : ''}

*Questions?*
Call: (555) 123-4567
Reference your request ID
      `.trim();

      const messageData = await this.client.messages.create({
        from: `whatsapp:${this.twilioPhoneNumber}`,
        to: `whatsapp:${customerPhone}`,
        body: whatsappMessage,
      });

      console.log('Status update sent:', messageData.sid);
      return { success: true, messageId: messageData.sid };
    } catch (error) {
      console.error('Error sending status update:', error);
      return { success: false, error: error.message };
    }
  }

  async sendResponseReport(recipientPhone, subject, fileData, fileName) {
    try {
      if (!this.isConfigured) {
        return { success: false, error: 'Twilio WhatsApp service not configured' };
      }

      const phone = this.formatPhoneNumber(recipientPhone);
      if (!phone) {
        return { success: false, error: 'Invalid phone number' };
      }

      console.log('📱 Attempting to send report via WhatsApp...');
      console.log('To:', phone);
      console.log('Subject:', subject);

      const message = `
📊 *RESPONSE REPORT*

${subject}

Report Contents:
📈 Dashboard Summary & Statistics
📋 Detailed Responses by Sections

Report Generated: ${new Date().toLocaleString()}

Please check your email for the attached Excel file with complete details.
      `.trim();

      const messageData = await this.client.messages.create({
        from: `whatsapp:${this.twilioPhoneNumber}`,
        to: `whatsapp:${phone}`,
        body: message,
      });

      console.log('✅ Response report notification sent via WhatsApp!');
      console.log('Message ID:', messageData.sid);
      return { success: true, messageId: messageData.sid };
    } catch (error) {
      console.error('❌ Error sending response report:');
      console.error('Error message:', error.message);
      return { success: false, error: error.message };
    }
  }

  async testConnection() {
    try {
      if (!this.isConfigured) {
        return {
          success: false,
          error: 'Twilio WhatsApp service not configured. Missing WA_TWILIO_ACCOUNT_SID or WA_TWILIO_AUTH_TOKEN'
        };
      }

      if (!this.twilioPhoneNumber) {
        return {
          success: false,
          error: 'WA_TWILIO_WHATSAPP_NUMBER environment variable not set'
        };
      }

      await this.client.api.accounts(
        process.env.WA_TWILIO_ACCOUNT_SID || process.env.TWILIO_ACCOUNT_SID
      ).fetch();
      console.log('✅ Twilio WhatsApp connection successful');
      return { success: true, message: 'Twilio WhatsApp connection successful' };
    } catch (error) {
      console.error('❌ Twilio WhatsApp connection failed:', error);
      return { success: false, error: error.message };
    }
  }

  async sendTestMessage(recipientPhone) {
    try {
      if (!this.isConfigured) {
        return { success: false, error: 'Twilio WhatsApp service not configured' };
      }

      const phone = this.formatPhoneNumber(recipientPhone);
      if (!phone) {
        return { success: false, error: 'Invalid phone number format' };
      }

      const message = `
✅ *TEST MESSAGE*

This is a test message from Focus Forms WhatsApp integration.

If you received this, WhatsApp service is working correctly! 🎉

Configuration Status:
✓ Twilio Account Connected
✓ WhatsApp Service Active
✓ Message Delivery Working

Timestamp: ${new Date().toLocaleString()}
      `.trim();

      const messageData = await this.client.messages.create({
        from: `whatsapp:${this.twilioPhoneNumber}`,
        to: `whatsapp:${phone}`,
        body: message,
      });

      console.log('Test message sent:', messageData.sid);
      return { success: true, messageId: messageData.sid };
    } catch (error) {
      console.error('Error sending test message:', error);
      return { success: false, error: error.message };
    }
  }
}

export default new WhatsAppService();
