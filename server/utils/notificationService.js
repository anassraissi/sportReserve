import dotenv from 'dotenv';
import Notification from '../models/Notification.js';
import User from '../models/User.js';
import nodemailer from 'nodemailer';

// Load environment variables
dotenv.config();

// Debug email configuration
console.log('[Email Config] EMAIL_SERVICE:', process.env.EMAIL_SERVICE);
console.log('[Email Config] EMAIL_USER:', process.env.EMAIL_USER ? '***@gmail.com' : 'NOT SET');
console.log('[Email Config] EMAIL_PASS:', process.env.EMAIL_PASS ? '****' : 'NOT SET');
console.log('[Email Config] EMAIL_FROM:', process.env.EMAIL_FROM);

// Verify email configuration
if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
  console.warn('[Email] WARNING: Email credentials not configured. Emails will not be sent.');
  console.warn('[Email] EMAIL_USER:', process.env.EMAIL_USER);
  console.warn('[Email] EMAIL_PASS:', process.env.EMAIL_PASS ? 'SET' : 'NOT SET');
}

// Configure email transporter
const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE || 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Verify transporter configuration
transporter.verify(function (error, success) {
  if (error) {
    console.error('[Email] Transporter verification failed:', error.message);
    console.error('[Email] Please check your EMAIL_USER and EMAIL_PASS in .env file');
  } else {
    console.log('[Email] ✅ Email service is ready to send messages');
    console.log('[Email] From:', process.env.EMAIL_FROM || process.env.EMAIL_USER);
  }
});

/**
 * Send notification to user(s)
 * @param {Object} options - Notification options
 */
export const sendNotification = async (options) => {
  try {
    const {
      userId,
      userIds = [],
      type,
      title,
      message,
      channels = ['in_app'], // 'in_app', 'email', 'sms'
      data = {},
      scheduledFor = null,
    } = options;

    const targetUserIds = userId ? [userId] : userIds;
    if (!targetUserIds || targetUserIds.length === 0) {
      throw new Error('No target users specified');
    }

    const notifications = [];

    for (const uid of targetUserIds) {
      for (const channel of channels) {
        const notification = new Notification({
          userId: uid,
          type,
          title,
          message,
          channel,
          data,
          scheduledFor: scheduledFor || new Date(),
          status: scheduledFor ? 'pending' : 'sent',
        });

        await notification.save();
        notifications.push(notification);

        // Send email immediately if in email channels
        if (channel === 'email' && !scheduledFor) {
          try {
            console.log(`[Email] Sending email to user ${uid}: ${title}`);
            await sendEmail(uid, title, message);
            console.log(`[Email] Successfully sent to user ${uid}`);
          } catch (err) {
            console.error(`[Email] Failed to send to user ${uid}:`, err.message);
            notification.status = 'failed';
            notification.errorMessage = err.message;
            await notification.save();
          }
        }
      }
    }

    return notifications;
  } catch (error) {
    console.error('Send notification error:', error);
    throw error;
  }
};

/**
 * Send email notification
 */
export const sendEmail = async (userId, subject, htmlContent) => {
  try {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      throw new Error('Email credentials not configured');
    }

    const user = await User.findById(userId);
    if (!user || !user.email) {
      throw new Error('User email not found');
    }

    console.log(`[Email] Preparing to send to ${user.email}`);
    
    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: user.email,
      subject: subject,
      html: generateEmailTemplate(subject, htmlContent, user.firstName),
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`[Email] \u2705 Successfully sent to ${user.email} - MessageID: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error(`[Email] \u274c Send error:`, error.message);
    throw error;
  }
};

/**
 * Generate email HTML template
 */
export const generateEmailTemplate = (subject, message, userName) => {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 5px 5px 0 0; }
          .content { background: #f9f9f9; padding: 20px; border: 1px solid #ddd; border-top: none; }
          .footer { background: #333; color: white; padding: 10px; text-align: center; font-size: 12px; border-radius: 0 0 5px 5px; }
          .button { display: inline-block; background: #667eea; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin-top: 10px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>${subject}</h2>
          </div>
          <div class="content">
            <p>Bonjour ${userName},</p>
            <p>${message}</p>
            <p style="margin-top: 20px; font-size: 12px; color: #666;">
              Merci d'être un utilisateur de sportReserve!
            </p>
          </div>
          <div class="footer">
            <p>&copy; 2024 sportReserve. Tous droits réservés.</p>
          </div>
        </div>
      </body>
    </html>
  `;
};

/**
 * Send payment confirmation email
 */
export const sendPaymentConfirmation = async (reservation) => {
  try {
    console.log(`[Payment Confirmation] Sending for reservation ${reservation._id}`);
    
    const resourceName = typeof reservation.resourceId === 'object' 
      ? reservation.resourceId.name 
      : 'Resource';
    const startTime = new Date(reservation.startTime);
    const endTime = new Date(reservation.endTime);
    
    // Get address from resource or location with fallback logic
    let address = null;
    if (typeof reservation.resourceId === 'object') {
      // Try direct resource address first
      if (reservation.resourceId.address) {
        address = reservation.resourceId.address;
      }
      // Try location reference
      else if (reservation.resourceId.locationId?.address) {
        address = reservation.resourceId.locationId.address;
      }
      // Try location name
      else if (reservation.resourceId.locationId?.name) {
        address = reservation.resourceId.locationId.name;
      }
    }
    address = address || 'Veuillez consulter votre profil pour l\'adresse exacte';

    const userId = typeof reservation.userId === 'object' 
      ? reservation.userId._id || reservation.userId.id
      : reservation.userId;

    const title = `💳 Paiement confirmé - ${resourceName}`;
    const message = `
      <h3>Votre paiement est confirmé!</h3>
      <p><strong>✅ Réservation confirmée et payée</strong></p>
      
      <div style="background-color: #e8f4f8; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 5px solid #2196F3;">
        <h4 style="margin-top: 0; color: #1565c0;">📍 Lieu de votre réservation:</h4>
        <p style="font-size: 16px; font-weight: bold; color: #1565c0; margin: 10px 0;">
          ${address}
        </p>
      </div>
      
      <h4>📅 Détails de votre réservation:</h4>
      <p><strong>Ressource:</strong> ${resourceName}</p>
      <p><strong>Date:</strong> ${startTime.toLocaleDateString('fr-FR')}</p>
      <p><strong>Heure de début:</strong> ${startTime.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</p>
      <p><strong>Heure de fin:</strong> ${endTime.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</p>
      
      <h4>💰 Montant payé:</h4>
      <p style="font-size: 18px; color: #2e7d32;"><strong>${reservation.totalAmount?.toFixed(2) || '0.00'} DH</strong></p>
      
      <div style="background-color: #f0f4ff; padding: 15px; border-left: 4px solid #7b68ee; border-radius: 3px; margin: 20px 0;">
        <p style="margin: 0; color: #4a235a;">
          <strong>⏰ Rappel important:</strong> Vous recevrez une notification 3 heures avant votre réservation avec tous les détails d'accès et les instructions.
        </p>
      </div>
    `;

    console.log(`[Payment Confirmation] Sending to user ${userId}`);
    
    await sendNotification({
      userId: userId,
      type: 'payment_confirmation',
      title,
      message,
      channels: ['in_app', 'email'],
      data: {
        reservationId: reservation._id,
        resourceId: reservation.resourceId,
        paymentId: reservation.paymentId,
        totalAmount: reservation.totalAmount,
      },
    });

    console.log(`[Payment Confirmation] Sent successfully`);
  } catch (error) {
    console.error(`[Payment Confirmation] Error:`, error.message);
    throw error;
  }
};

/**
 * Send reservation reminder (3 hours before) with address and timing
 */
export const sendReservationReminder = async (reservation) => {
  try {
    const startTime = new Date(reservation.startTime);
    const reminderTime = new Date(startTime.getTime() - 3 * 60 * 60 * 1000); // 3 hours before

    const resourceName = typeof reservation.resourceId === 'object' 
      ? reservation.resourceId.name 
      : 'Resource';
    
    const address = typeof reservation.resourceId === 'object' 
      ? reservation.resourceId.address || 'Adresse disponible dans votre profil'
      : 'Adresse disponible dans votre profil';

    const title = `⏰ Rappel: ${resourceName} dans 3 heures`;
    const message = `
      <h3>Rappel de réservation - Vous avez 3 heures!</h3>
      <p><strong>${resourceName}</strong></p>
      
      <h4>📍 Lieu de la réservation:</h4>
      <p>${address}</p>
      
      <h4>⏱️ Détails horaires:</h4>
      <p><strong>Heure de début:</strong> ${startTime.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</p>
      <p><strong>Date:</strong> ${startTime.toLocaleDateString('fr-FR')}</p>
      
      <h4>⚠️ Important:</h4>
      <p style="background-color: #fff3cd; padding: 15px; border-left: 4px solid #ffc107; border-radius: 3px;">
        <strong>Veuillez arriver 15 minutes avant l'heure de début</strong> (à <strong>${new Date(startTime.getTime() - 15 * 60 * 1000).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</strong>)
      </p>
      
      <p style="margin-top: 20px; color: #666; font-size: 12px;">
        Si vous ne pouvez pas vous présenter, veuillez annuler votre réservation dès que possible.
      </p>
    `;

    await sendNotification({
      userId: reservation.userId,
      type: 'booking_reminder',
      title,
      message,
      channels: ['in_app', 'email'],
      data: {
        reservationId: reservation._id,
        resourceId: reservation.resourceId,
        startTime: startTime.toISOString(),
        address: address,
      },
      scheduledFor: reminderTime,
    });

    console.log(`Reminder scheduled for reservation ${reservation._id}`);
  } catch (error) {
    console.error('Schedule reminder error:', error);
    throw error;
  }
};

/**
 * Send confirmation notification
 */
export const sendReservationConfirmation = async (reservation) => {
  try {
    console.log(`[Confirmation] Sending confirmation for reservation ${reservation._id}`);
    
    const resourceName = typeof reservation.resourceId === 'object' 
      ? reservation.resourceId.name 
      : 'Resource';
    const startTime = new Date(reservation.startTime);
    
    // Get address from resource or location
    let address = null;
    if (typeof reservation.resourceId === 'object') {
      if (reservation.resourceId.address) {
        address = reservation.resourceId.address;
      } else if (reservation.resourceId.locationId?.address) {
        address = reservation.resourceId.locationId.address;
      } else if (reservation.resourceId.locationId?.name) {
        address = reservation.resourceId.locationId.name;
      }
    }
    address = address || 'Adresse disponible dans votre profil';
    
    const userId = typeof reservation.userId === 'object' 
      ? reservation.userId._id || reservation.userId.id
      : reservation.userId;

    const title = `✅ Réservation confirmée et payée - ${resourceName}`;
    const message = `
      <h3>Votre réservation est confirmée et payée!</h3>
      
      <div style="background-color: #c8e6c9; padding: 15px; border-left: 4px solid #2e7d32; border-radius: 3px; margin: 20px 0;">
        <p style="margin: 0; color: #2e7d32;"><strong>✅ Paiement reçu</strong></p>
      </div>
      
      <h4>📋 Détails de votre réservation:</h4>
      <p><strong>Ressource:</strong> ${resourceName}</p>
      <div style="background-color: #e8f4f8; padding: 15px; border-left: 4px solid #2196F3; border-radius: 3px; margin: 20px 0;">
        <h4 style="margin-top: 0; color: #1565c0;">📍 Lieu:</h4>
        <p style="font-size: 16px; font-weight: bold; color: #1565c0; margin: 10px 0;">
          ${address}
        </p>
      </div>
      <p><strong>Date:</strong> ${startTime.toLocaleDateString('fr-FR')}</p>
      <p><strong>Heure:</strong> ${startTime.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</p>
      
      <p style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd;">
        <strong>⏰ Rappel:</strong> Vous recevrez un email d'alerte 3 heures avant votre réservation avec les derniers détails.
      </p>
    `;

    console.log(`[Confirmation] Sending to user ${userId} with channels: in_app, email`);
    
    await sendNotification({
      userId: userId,
      type: 'booking_confirmation',
      title,
      message,
      channels: ['in_app', 'email'],
      data: {
        reservationId: reservation._id,
        resourceId: reservation.resourceId,
      },
    });
    
    console.log(`[Confirmation] ✅ Successfully sent confirmation for reservation ${reservation._id}`);
  } catch (error) {
    console.error('Send confirmation error:', error);
  }
};

/**
 * Send cancellation notification
 */
export const sendReservationCancellation = async (reservation, reason = '') => {
  try {
    const resourceName = typeof reservation.resourceId === 'object' 
      ? reservation.resourceId.name 
      : 'Resource';

    const title = `❌ Réservation annulée - ${resourceName}`;
    const message = `
      <h3>Votre réservation a été annulée</h3>
      <p><strong>Ressource:</strong> ${resourceName}</p>
      ${reason ? `<p><strong>Raison:</strong> ${reason}</p>` : ''}
      <p>Si vous avez des questions, contactez notre support.</p>
    `;

    await sendNotification({
      userId: reservation.userId,
      type: 'booking_cancellation',
      title,
      message,
      channels: ['in_app', 'email'],
      data: {
        reservationId: reservation._id,
      },
    });
  } catch (error) {
    console.error('Send cancellation error:', error);
  }
};

/**
 * Broadcast notification to all users or filtered users
 */
export const broadcastNotification = async (options) => {
  try {
    const {
      title,
      message,
      type = 'system_alert',
      filter = {},
      channels = ['in_app', 'email'],
    } = options;

    // Get all users matching filter
    const users = await User.find(filter).select('_id');
    const userIds = users.map(u => u._id);

    if (userIds.length === 0) {
      throw new Error('No users found matching filter');
    }

    return await sendNotification({
      userIds,
      type,
      title,
      message,
      channels,
    });
  } catch (error) {
    console.error('Broadcast notification error:', error);
    throw error;
  }
};

/**
 * Mark notification as sent
 */
export const markNotificationAsSent = async (notificationId) => {
  try {
    const notification = await Notification.findByIdAndUpdate(
      notificationId,
      {
        status: 'sent',
        sentAt: new Date(),
      },
      { new: true }
    );
    return notification;
  } catch (error) {
    console.error('Mark as sent error:', error);
  }
};

export default {
  sendNotification,
  sendEmail,
  generateEmailTemplate,
  sendReservationReminder,
  sendReservationConfirmation,
  sendPaymentConfirmation,
  sendReservationCancellation,
  broadcastNotification,
  markNotificationAsSent,
};
