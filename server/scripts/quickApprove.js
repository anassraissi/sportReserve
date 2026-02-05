import mongoose from 'mongoose';
import User from '../models/User.js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from parent directory
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/kanban-board';

async function quickApproveAccount() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Get the email from command line argument
    const email = process.argv[2];
    
    if (!email) {
      console.log('\n❌ Please provide an email address');
      console.log('Usage: node quickApprove.js <email>\n');
      console.log('Example: node quickApprove.js user@example.com\n');
      
      // Show pending accounts
      const pendingUsers = await User.find({ accountStatus: 'pending' }).select('email firstName lastName createdAt');
      if (pendingUsers.length > 0) {
        console.log('\n📋 Pending Accounts:');
        pendingUsers.forEach((user, index) => {
          console.log(`${index + 1}. ${user.email} - ${user.firstName} ${user.lastName} (Created: ${user.createdAt.toLocaleString()})`);
        });
      } else {
        console.log('\n✅ No pending accounts found');
      }
      
      await mongoose.disconnect();
      return;
    }

    // Find and approve the account
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      console.log(`\n❌ No user found with email: ${email}\n`);
      await mongoose.disconnect();
      return;
    }

    if (user.accountStatus === 'approved') {
      console.log(`\n✅ Account ${email} is already approved!\n`);
      await mongoose.disconnect();
      return;
    }

    // Approve the account
    user.accountStatus = 'approved';
    user.isApprovedByAdmin = true;
    await user.save();

    console.log(`\n✅ Successfully approved account: ${email}`);
    console.log(`   Name: ${user.firstName} ${user.lastName}`);
    console.log(`   Role: ${user.role}`);
    console.log(`   Status: ${user.accountStatus}\n`);
    console.log('🎉 User can now login!\n');

    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

quickApproveAccount();
