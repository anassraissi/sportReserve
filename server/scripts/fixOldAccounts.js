import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/flow-forge';

async function fixOldAccounts() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find all users missing accountStatus or isApprovedByAdmin fields
    const usersToFix = await User.find({
      $or: [
        { accountStatus: { $exists: false } },
        { isApprovedByAdmin: { $exists: false } }
      ]
    });

    console.log(`\n📋 Found ${usersToFix.length} accounts to fix:\n`);

    for (const user of usersToFix) {
      console.log(`Fixing: ${user.email} (${user.role})`);
      
      // Update missing fields
      if (!user.accountStatus) {
        user.accountStatus = 'approved'; // Auto-approve old accounts
      }
      if (user.isApprovedByAdmin === undefined) {
        user.isApprovedByAdmin = true; // Auto-approve old accounts
      }
      
      await user.save();
      console.log(`✅ Fixed: ${user.email} - Status: ${user.accountStatus}, Approved: ${user.isApprovedByAdmin}`);
    }

    console.log(`\n✅ Successfully fixed ${usersToFix.length} accounts`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

fixOldAccounts();
