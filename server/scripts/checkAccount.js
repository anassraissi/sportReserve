import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/flow-forge';

async function checkAccount(email) {
  try {
    await mongoose.connect(MONGODB_URI);
    const user = await User.findOne({ email });
    
    if (!user) {
      console.log(`❌ User not found: ${email}`);
      process.exit(1);
    }

    console.log(`\n📋 Account Status:`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Name: ${user.firstName} ${user.lastName}`);
    console.log(`   Role: ${user.role}`);
    console.log(`   Account Status: ${user.accountStatus}`);
    console.log(`   Approved: ${user.isApprovedByAdmin}`);
    console.log(`   Active: ${user.isActive}`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

const email = process.argv[2] || 'anass.raissi.ar@gmail.com';
checkAccount(email);
