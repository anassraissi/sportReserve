import dotenv from 'dotenv';
import nodemailer from 'nodemailer';

// Load environment variables
dotenv.config();

console.log('=== Email Test Script ===');
console.log('EMAIL_SERVICE:', process.env.EMAIL_SERVICE);
console.log('EMAIL_USER:', process.env.EMAIL_USER);
console.log('EMAIL_PASS:', process.env.EMAIL_PASS ? '****' : 'NOT SET');
console.log('EMAIL_FROM:', process.env.EMAIL_FROM);
console.log('========================\n');

// Configure email transporter
const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE || 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Verify configuration
console.log('Verifying email configuration...');
transporter.verify(function (error, success) {
  if (error) {
    console.error('❌ Verification failed:', error.message);
    process.exit(1);
  } else {
    console.log('✅ Email service is ready!\n');
    sendTestEmail();
  }
});

// Send test email
async function sendTestEmail() {
  try {
    console.log('Sending test email to anass.raissi.ar@gmail.com...\n');
    
    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: 'anass.raissi.ar@gmail.com',
      subject: '🧪 Test Email - sportReserve',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="UTF-8">
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; text-align: center; }
              .content { background: #f9f9f9; padding: 30px; border: 1px solid #ddd; border-top: none; }
              .footer { background: #333; color: white; padding: 15px; text-align: center; font-size: 12px; border-radius: 0 0 8px 8px; }
              .success { background: #d4edda; border: 1px solid #c3e6cb; color: #155724; padding: 15px; border-radius: 5px; margin: 20px 0; }
              .info { background: #d1ecf1; border: 1px solid #bee5eb; color: #0c5460; padding: 15px; border-radius: 5px; margin: 20px 0; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>🧪 Test Email</h1>
                <p style="font-size: 18px; margin: 10px 0 0 0;">sportReserve Notification System</p>
              </div>
              <div class="content">
                <div class="success">
                  <h2 style="margin: 0 0 10px 0;">✅ Success!</h2>
                  <p style="margin: 0;">Your email configuration is working correctly!</p>
                </div>
                
                <h3>Email Configuration Test</h3>
                <p>This is a test email from your sportReserve notification system.</p>
                
                <div class="info">
                  <p style="margin: 0;"><strong>Sent from:</strong> ${process.env.EMAIL_FROM || process.env.EMAIL_USER}</p>
                  <p style="margin: 5px 0 0 0;"><strong>Date:</strong> ${new Date().toLocaleString('fr-FR')}</p>
                </div>
                
                <p><strong>What this means:</strong></p>
                <ul>
                  <li>✅ Email credentials are configured correctly</li>
                  <li>✅ SMTP connection is working</li>
                  <li>✅ Emails can be sent successfully</li>
                  <li>✅ Your users will receive notifications</li>
                </ul>
                
                <p style="margin-top: 30px; padding-top: 20px; border-top: 2px solid #ddd;">
                  <strong>Next steps:</strong>
                </p>
                <ol>
                  <li>Booking confirmations will be sent automatically ✅</li>
                  <li>Reminders will be sent 3 hours before reservations ⏰</li>
                  <li>Cancellation notifications will work 🔔</li>
                </ol>
                
                <p style="margin-top: 20px; font-size: 14px; color: #666;">
                  If you received this email, your notification system is ready to use! 🎉
                </p>
              </div>
              <div class="footer">
                <p style="margin: 0;">&copy; 2026 sportReserve. All rights reserved.</p>
                <p style="margin: 5px 0 0 0;">This is a test email from your notification system</p>
              </div>
            </div>
          </body>
        </html>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    
    console.log('✅ Email sent successfully!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Message ID:', info.messageId);
    console.log('From:', process.env.EMAIL_FROM || process.env.EMAIL_USER);
    console.log('To: anass.raissi.ar@gmail.com');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n📧 Check your inbox at anass.raissi.ar@gmail.com');
    console.log('⚠️  Check spam folder if you don\'t see it!\n');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Failed to send email:', error.message);
    console.error('\nFull error:', error);
    process.exit(1);
  }
}
