const nodemailer = require('nodemailer');

// Configure the transporter
// Note: User should update .env with real credentials
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: process.env.SMTP_PORT || 587,
    secure: false, 
    auth: {
        user: process.env.SMTP_EMAIL_USER,
        pass: process.env.SMTP_EMAIL_PASS
    }
});

/**
 * Send a professional email
 * @param {string} to - Recipient email
 * @param {string} subject - Email subject
 * @param {string} text - Plain text body
 * @param {string} html - Optional HTML body
 */
async function sendEmail(to, subject, text, html = '') {
    try {
        const info = await transporter.sendMail({
            from: `"HR-Pulse Innovation Hub" <${process.env.SMTP_EMAIL_FROM || process.env.SMTP_EMAIL_USER}>`,
            to,
            subject,
            text,
            html: html || text.replace(/\n/g, '<br>') // Basic text to HTML conversion
        });
        console.log(`[MAILER] Email sent to ${to}: ${info.messageId}`);
        return info;
    } catch (error) {
        console.error(`[MAILER] Failed to send email to ${to}:`, error.message);
        throw error;
    }
}

module.exports = { sendEmail };
