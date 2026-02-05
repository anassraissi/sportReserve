import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/flow-forge';

async function approveAccount(email) {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const user = await User.findOne({ email });
    
    if (!user) {
      console.log(`❌ User not found: ${email}`);
      process.exit(1);
    }

    console.log(`\n📋 Current user status:`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Name: ${user.firstName} ${user.lastName}`);
    console.log(`   Role: ${user.role}`);
    console.log(`   Account Status: ${user.accountStatus}`);
    console.log(`   Approved: ${user.isApprovedByAdmin}`);

    // Update to approved status
    user.accountStatus = 'approved';
    user.isApprovedByAdmin = true;
    await user.save();

    console.log(`\n✅ Account approved successfully!`);
    console.log(`   New Status: ${user.accountStatus}`);
    console.log(`   Approved: ${user.isApprovedByAdmin}`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Get email from command line argument
const email = process.argv[2];

if (!email) {
  console.log('❌ Please provide an email address');
  console.log('Usage: node approveAccount.js <email>');
  process.exit(1);
}

approveAccount(email);
