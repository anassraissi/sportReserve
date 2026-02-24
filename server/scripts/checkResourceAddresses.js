import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Resource from '../models/Resource.js';

dotenv.config();

async function checkResourceAddresses() {
  try {
    // Connect to MongoDB
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/flow-forge';
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Find all resources
    const resources = await Resource.find()
      .populate('locationId', 'name address city')
      .select('name address locationId type');

    console.log(`Found ${resources.length} resources:\n`);
    console.log('='.repeat(80));

    resources.forEach((resource, index) => {
      console.log(`\n[${index + 1}] Resource: ${resource.name}`);
      console.log(`   Type: ${resource.type}`);
      console.log(`   Direct Address: ${resource.address || '❌ NOT SET'}`);
      
      if (resource.locationId) {
        console.log(`   Location Name: ${resource.locationId.name}`);
        console.log(`   Location Address: ${resource.locationId.address || '❌ NOT SET'}`);
        console.log(`   Location City: ${resource.locationId.city || 'N/A'}`);
      } else {
        console.log(`   Location: ❌ NOT LINKED`);
      }

      // Show which address would be used
      let usedAddress = resource.address || 
                       resource.locationId?.address || 
                       resource.locationId?.name || 
                       '❌ NO ADDRESS FOUND';
      console.log(`   ✓ Would use: ${usedAddress}`);
    });

    console.log('\n' + '='.repeat(80));
    console.log('\n📋 Summary:');
    const withDirectAddress = resources.filter(r => r.address).length;
    const withLocationAddress = resources.filter(r => !r.address && r.locationId?.address).length;
    const noAddress = resources.filter(r => !r.address && (!r.locationId || !r.locationId.address)).length;

    console.log(`   ✅ With direct address: ${withDirectAddress}`);
    console.log(`   ✅ With location address: ${withLocationAddress}`);
    console.log(`   ❌ Without address: ${noAddress}`);

    if (noAddress > 0) {
      console.log('\n⚠️  WARNING: Some resources have NO ADDRESS!');
      console.log('   Please update resources with their addresses.');
    } else {
      console.log('\n✅ All resources have addresses!');
    }

    await mongoose.connection.close();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkResourceAddresses();
