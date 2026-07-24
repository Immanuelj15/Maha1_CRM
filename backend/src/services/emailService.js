import nodemailer from 'nodemailer';

/**
 * Send an email (with optional attachments)
 * @param {string} to - Recipient email
 * @param {string} subject - Email subject
 * @param {string} text - Plain text body
 * @param {string} html - HTML rich body
 * @param {Array} attachments - PDF attachment buffers or files
 */
export const sendEmail = async ({ to, subject, text, html, attachments = [] }) => {
  try {
    let transporter;

    // Use environment SMTP variables if configured
    if (process.env.SMTP_HOST && process.env.SMTP_PORT && process.env.SMTP_USER) {
      transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });
      console.log('📬 Nodemailer configured with custom SMTP server.');
    } else {
      // Fallback: Create ethereal test account on-demand
      console.log('📬 SMTP credentials not found. Generating a mock Ethereal SMTP transporter...');
      const testAccount = await nodemailer.createTestAccount();
      transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
      console.log(`✨ Created Ethereal test account: ${testAccount.user}`);
    }

    const mailOptions = {
      from: process.env.SMTP_FROM || '"CaterMaster CRM" <no-reply@catermaster.com>',
      to,
      subject,
      text,
      html,
      attachments
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('🚀 Message sent: %s', info.messageId);

    // If using Ethereal, print the test preview URL
    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) {
      console.log('🔗 Ethereal Preview URL:', previewUrl);
      return { success: true, messageId: info.messageId, previewUrl };
    }

    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Failed to send email:', error.message);
    // Return mock success to prevent UI errors
    return { success: false, error: error.message };
  }
};
