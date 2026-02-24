import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Reservation from './models/Reservation.js';
import User from './models/User.js';
import Resource from './models/Resource.js';

// Load environment variables
dotenv.config();

console.log('=== Check Recent Reservations ===\n');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log('✅ Connected to MongoDB\n');
    
    // Find the most recent reservation
    const recentReservation = await Reservation.findOne()
      .sort({ createdAt: -1 })
      .populate('userId', 'email firstName lastName')
      .populate('resourceId', 'name type');
    
    if (!recentReservation) {
      console.log('❌ No reservations found in database');
      process.exit(0);
    }
    
    console.log('📋 Most Recent Reservation:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('ID:', recentReservation._id);
    console.log('Created:', recentReservation.createdAt);
    console.log('Start Time:', recentReservation.startTime);
    console.log('End Time:', recentReservation.endTime);
    console.log('Status:', recentReservation.status);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n👤 User Info:');
    console.log('Name:', recentReservation.userId?.firstName, recentReservation.userId?.lastName);
    console.log('Email:', recentReservation.userId?.email);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n🏢 Resource Info:');
    console.log('Name:', recentReservation.resourceId?.name);
    console.log('Type:', recentReservation.resourceId?.type);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    // Check if user has email
    if (!recentReservation.userId?.email) {
      console.log('⚠️  WARNING: User has no email address!');
      console.log('Email cannot be sent without user email.\n');
    } else {
      console.log('✅ User has email - emails should be sent to:', recentReservation.userId.email);
    }
    
    // Check notifications for this reservation
    const Notification = (await import('./models/Notification.js')).default;
    const notifications = await Notification.find({
      'data.reservationId': recentReservation._id.toString()
    }).sort({ createdAt: -1 });
    
    console.log('\n📧 Notifications for this reservation:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    if (notifications.length === 0) {
      console.log('❌ No notifications found! Email was NOT sent.');
      console.log('\n💡 This means:');
      console.log('   - The confirmation email function failed');
      console.log('   - Check server logs for errors');
      console.log('   - Server might not be running');
    } else {
      notifications.forEach(notif => {
        console.log('\nType:', notif.type);
        console.log('Channel:', notif.channel);
        console.log('Status:', notif.status);
        console.log('Title:', notif.title);
        console.log('Created:', notif.createdAt);
        if (notif.sentAt) {
          console.log('Sent At:', notif.sentAt);
        }
        if (notif.errorMessage) {
          console.log('Error:', notif.errorMessage);
        }
      });
      
      const emailNotif = notifications.find(n => n.channel === 'email');
      if (emailNotif) {
        if (emailNotif.status === 'sent') {
          console.log('\n✅ Email was successfully sent!');
          console.log('   Check inbox at:', recentReservation.userId.email);
        } else if (emailNotif.status === 'failed') {
          console.log('\n❌ Email sending failed!');
          console.log('   Error:', emailNotif.errorMessage);
        } else {
          console.log('\n⏳ Email is:', emailNotif.status);
        }
      } else {
        console.log('\n⚠️  No email notification found (only in-app)');
      }
    }
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    mongoose.connection.close();
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Database error:', err);
    process.exit(1);
  });
