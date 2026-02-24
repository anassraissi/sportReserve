import Notification from '../models/Notification.js';
import Reservation from '../models/Reservation.js';
import { sendEmail, markNotificationAsSent } from '../utils/notificationService.js';
import User from '../models/User.js';

/**
 * Process pending scheduled notifications
 * Run this periodically (e.g., every 5-10 minutes)
 */
export const processScheduledNotifications = async () => {
  try {
    console.log('[Scheduled Jobs] Processing pending notifications...');
    
    const now = new Date();
    
    // Find notifications that should be sent
    const pendingNotifications = await Notification.find({
      status: 'pending',
      scheduledFor: { $lte: now },
    })
      .populate('userId', 'email firstName')
      .limit(100);

    if (pendingNotifications.length === 0) {
      console.log('[Scheduled Jobs] No pending notifications to process');
      return;
    }

    console.log(`[Scheduled Jobs] Processing ${pendingNotifications.length} notifications`);

    for (const notification of pendingNotifications) {
      try {
        // Send email if required
        if (notification.channel === 'email' || notification.channel.includes('email')) {
          await sendEmail(
            notification.userId._id,
            notification.title,
            notification.message
          );
        }

        // Mark as sent
        await markNotificationAsSent(notification._id);
        console.log(`[Scheduled Jobs] Notification ${notification._id} sent`);
      } catch (error) {
        console.error(`[Scheduled Jobs] Error sending notification ${notification._id}:`, error);
        
        // Update notification with error
        notification.status = 'failed';
        notification.errorMessage = error.message;
        notification.retryCount += 1;
        await notification.save();
      }
    }

    console.log('[Scheduled Jobs] Scheduled notifications processing complete');
  } catch (error) {
    console.error('[Scheduled Jobs] Error in processScheduledNotifications:', error);
  }
};

/**
 * Send reminders for reservations starting in ~3 hours
 * Run this periodically (e.g., every hour)
 */
export const sendReservationReminders = async () => {
  try {
    console.log('[Reservation Reminders] Checking for upcoming reservations...');

    const now = new Date();
    const fourHoursLater = new Date(now.getTime() + 4 * 60 * 60 * 1000);   // 4 hours
    const oneHourLater = new Date(now.getTime() + 1 * 60 * 60 * 1000);     // 1 hour

    // Find reservations starting in 1-4 hours that haven't been reminded yet
    // Only send reminders for PAID reservations
    const upcomingReservations = await Reservation.find({
      startTime: {
        $gte: oneHourLater,
        $lte: fourHoursLater,
      },
      status: { $in: ['paid', 'confirmed', 'active'] },
    })
      .populate('userId', 'email firstName')
      .populate({
        path: 'resourceId',
        populate: {
          path: 'locationId',
          select: 'name address city'
        }
      });

    if (upcomingReservations.length === 0) {
      console.log('[Reservation Reminders] No upcoming reservations');
      return;
    }

    console.log(`[Reservation Reminders] Found ${upcomingReservations.length} upcoming reservations`);

    for (const reservation of upcomingReservations) {
      try {
        // Check if reminder already sent for this reservation
        const existingReminder = await Notification.findOne({
          type: 'booking_reminder',
          'data.reservationId': reservation._id,
          status: { $ne: 'failed' },
        });

        if (existingReminder) {
          console.log(`[Reservation Reminders] Reminder already sent for reservation ${reservation._id}`);
          continue;
        }

        // Create and send reminder
        const startTime = new Date(reservation.startTime);
        const endTime = new Date(reservation.endTime);
        const resourceName = reservation.resourceId?.name || 'Your reserved resource';
        
        // Get address from resource or location with detailed fallback logic
        let address = null;
        
        // Try 1: Direct resource address
        if (reservation.resourceId?.address) {
          address = reservation.resourceId.address;
          console.log(`[Reminders] Address from resource.address: ${address}`);
        }
        // Try 2: From location reference
        else if (reservation.resourceId?.locationId?.address) {
          address = reservation.resourceId.locationId.address;
          console.log(`[Reminders] Address from location: ${address}`);
        }
        // Try 3: From location name
        else if (reservation.resourceId?.locationId?.name) {
          address = reservation.resourceId.locationId.name;
          console.log(`[Reminders] Address from location name: ${address}`);
        }
        
        // Fallback if nothing found
        if (!address) {
          address = 'Veuillez consulter votre profil pour l\'adresse exacte';
          console.log(`[Reminders] No address found for resource ${reservation.resourceId?._id}`);
        }
        
        const arrivalTime = new Date(startTime.getTime() - 15 * 60 * 1000);

        const title = `⏰ Rappel: ${resourceName} dans 3 heures`;
        const message = `
          <h3>Rappel de réservation - Vous avez 3 heures!</h3>
          <p><strong>${resourceName}</strong></p>
          
          <div style="background-color: #e8f4f8; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 5px solid #2196F3;">
            <h4 style="margin-top: 0; color: #1565c0;">📍 Lieu de la réservation:</h4>
            <p style="font-size: 16px; font-weight: bold; color: #1565c0; margin: 10px 0;">
              ${address}
            </p>
          </div>
          
          <h4>⏱️ Détails horaires:</h4>
          <p><strong>Heure de début:</strong> ${startTime.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</p>
          <p><strong>Heure de fin:</strong> ${endTime.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</p>
          <p><strong>Date:</strong> ${startTime.toLocaleDateString('fr-FR')}</p>
          
          <div style="background-color: #fff3cd; padding: 15px; border-left: 4px solid #ffc107; border-radius: 3px; margin: 20px 0;">
            <h4 style="margin-top: 0;">⚠️ Important:</h4>
            <p style="margin-bottom: 0;">
              <strong>Veuillez arriver 15 minutes avant l'heure de début</strong><br>
              <span style="font-size: 14px; color: #d39e00;">🕐 Arrivée prévue: <strong>${arrivalTime.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</strong></span>
            </p>
          </div>
          
          <p style="margin-top: 20px; color: #666; font-size: 12px;">
            Si vous ne pouvez pas vous présenter, veuillez annuler votre réservation dès que possible.
          </p>
        `;

        // Create IN-APP notification
        const notification = new Notification({
          userId: reservation.userId._id,
          type: 'booking_reminder',
          title,
          message,
          channel: 'in_app',
          status: 'sent',
          sentAt: new Date(),
          data: {
            reservationId: reservation._id.toString(),
            resourceName,
            startTime: startTime.toISOString(),
          },
        });

        await notification.save();

        // Send EMAIL separately
        try {
          await sendEmail(
            reservation.userId._id,
            title,
            message
          );
          console.log(`[Reservation Reminders] Email sent for reservation ${reservation._id}`);
        } catch (emailError) {
          console.error(`[Reservation Reminders] Email error for ${reservation._id}:`, emailError);
        }

        console.log(`[Reservation Reminders] Reminder sent for reservation ${reservation._id}`);
      } catch (error) {
        console.error(`[Reservation Reminders] Error processing reservation ${reservation._id}:`, error);
      }
    }

    console.log('[Reservation Reminders] Complete');
  } catch (error) {
    console.error('[Reservation Reminders] Error:', error);
  }
};

/**
 * Initialize scheduled jobs
 */
export const initializeScheduledJobs = (app) => {
  console.log('[Jobs] Initializing scheduled jobs...');

  // Process scheduled notifications every 5 minutes
  setInterval(processScheduledNotifications, 5 * 60 * 1000);
  // Run immediately
  processScheduledNotifications();

  // Check for reservation reminders every 30 minutes
  setInterval(sendReservationReminders, 30 * 60 * 1000);
  // Run immediately
  sendReservationReminders();

  console.log('[Jobs] Scheduled jobs initialized');
};

export default {
  processScheduledNotifications,
  sendReservationReminders,
  initializeScheduledJobs,
};
