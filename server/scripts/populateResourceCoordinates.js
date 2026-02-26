import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Resource from '../models/Resource.js';
import Location from '../models/Location.js';

dotenv.config();

// Known cities in Morocco with coordinates
const MOROCCAN_CITIES = {
  'sale': { latitude: 34.0393, longitude: -6.7985 },
  'rabat': { latitude: 34.0209, longitude: -6.8416 },
  'skhirat': { latitude: 33.8522, longitude: -7.0379 },
  'casablanca': { latitude: 33.5731, longitude: -7.5898 },
  'marrakech': { latitude: 31.6295, longitude: -8.0139 },
  'fes': { latitude: 34.0330, longitude: -5.0033 },
  'tanger': { latitude: 35.7671, longitude: -5.8126 },
  'agadir': { latitude: 30.4278, longitude: -9.5981 },
  'meknes': { latitude: 33.8869, longitude: -5.5472 },
};

async function populateResourceCoordinates() {
  try {
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/flow-forge';
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Find all resources
    const resources = await Resource.find()
      .populate('locationId', 'name address city latitude longitude');

    console.log(`📊 Processing ${resources.length} resources...\n`);

    let updated = 0;
    let skipped = 0;

    for (const resource of resources) {
      // Check if resource already has coordinates
      if (resource.latitude && resource.longitude) {
        console.log(`✅ [${resource.name}] Already has coordinates (${resource.latitude}, ${resource.longitude})`);
        skipped++;
        continue;
      }

      let newLatitude = null;
      let newLongitude = null;

      // Try to get from linked location
      if (resource.locationId && resource.locationId.latitude && resource.locationId.longitude) {
        newLatitude = resource.locationId.latitude;
        newLongitude = resource.locationId.longitude;
        console.log(`🔗 [${resource.name}] Using location coordinates: (${newLatitude}, ${newLongitude})`);
      }
      // Try to match city name
      else if (resource.address || resource.city || resource.locationId?.city) {
        const cityName = (resource.address || resource.city || resource.locationId?.city || '').toLowerCase();
        const matchedCity = Object.entries(MOROCCAN_CITIES).find(([key]) => cityName.includes(key));
        
        if (matchedCity) {
          const [cityKey, { latitude, longitude }] = matchedCity;
          newLatitude = latitude;
          newLongitude = longitude;
          console.log(`🌍 [${resource.name}] Using default ${cityKey} coordinates: (${newLatitude}, ${newLongitude})`);
        } else {
          console.log(`⚠️  [${resource.name}] No city match found for: "${cityName}"`);
          skipped++;
          continue;
        }
      } else {
        console.log(`❌ [${resource.name}] No address or location info`);
        skipped++;
        continue;
      }

      // Update resource
      resource.latitude = newLatitude;
      resource.longitude = newLongitude;
      await resource.save();
      console.log(`   ✏️  Updated: (${newLatitude}, ${newLongitude})\n`);
      updated++;
    }

    console.log('\n' + '='.repeat(80));
    console.log('📈 Summary:');
    console.log(`   ✅ Updated: ${updated}`);
    console.log(`   ⏭️  Skipped: ${skipped}`);
    console.log(`   📊 Total: ${resources.length}`);
    console.log('='.repeat(80));

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

populateResourceCoordinates();
