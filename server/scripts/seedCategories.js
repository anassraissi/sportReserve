import mongoose from 'mongoose';
import dotenv from 'dotenv';
import ResourceCategory from '../models/ResourceCategory.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/flow-forge';

const sportCategories = [
  // Terrains de sport
  {
    name: 'Tennis',
    slug: 'tennis',
    description: 'Terrains de tennis en extérieur et intérieur',
    icon: '🎾',
    order: 1,
  },
  {
    name: 'Basketball',
    slug: 'basketball',
    description: 'Terrains de basketball',
    icon: '🏀',
    order: 2,
  },
  {
    name: 'Football',
    slug: 'football',
    description: 'Terrains de football',
    icon: '⚽',
    order: 3,
  },
  {
    name: 'Volleyball',
    slug: 'volleyball',
    description: 'Terrains de volleyball',
    icon: '🏐',
    order: 4,
  },
  {
    name: 'Badminton',
    slug: 'badminton',
    description: 'Terrains de badminton',
    icon: '🏸',
    order: 5,
  },
  {
    name: 'Padel',
    slug: 'padel',
    description: 'Terrains de padel',
    icon: '🎾',
    order: 6,
  },
  // Salles de sport
  {
    name: 'Fitness',
    slug: 'fitness',
    description: 'Salles de fitness et musculation',
    icon: '💪',
    order: 10,
  },
  {
    name: 'Yoga',
    slug: 'yoga',
    description: 'Salles de yoga et méditation',
    icon: '🧘',
    order: 11,
  },
  {
    name: 'Pilates',
    slug: 'pilates',
    description: 'Salles de pilates',
    icon: '🤸',
    order: 12,
  },
  {
    name: 'Danse',
    slug: 'danse',
    description: 'Salles de danse',
    icon: '💃',
    order: 13,
  },
  {
    name: 'Arts martiaux',
    slug: 'arts-martiaux',
    description: 'Salles d\'arts martiaux (karaté, judo, etc.)',
    icon: '🥋',
    order: 14,
  },
  // Équipements
  {
    name: 'Raquettes',
    slug: 'raquettes',
    description: 'Raquettes de tennis, badminton, padel',
    icon: '🎾',
    order: 20,
  },
  {
    name: 'Ballons',
    slug: 'ballons',
    description: 'Ballons de sport (football, basketball, etc.)',
    icon: '⚽',
    order: 21,
  },
  {
    name: 'Équipement fitness',
    slug: 'equipement-fitness',
    description: 'Matériel de fitness et musculation',
    icon: '🏋️',
    order: 22,
  },
  {
    name: 'Protection',
    slug: 'protection',
    description: 'Équipements de protection sportive',
    icon: '🛡️',
    order: 23,
  },
];

async function seedCategories() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing categories
    await ResourceCategory.deleteMany({});
    console.log('🗑️  Cleared existing categories');

    // Insert new categories
    const categories = await ResourceCategory.insertMany(sportCategories);
    console.log(`✅ Created ${categories.length} sport categories`);

    console.log('\n📋 Categories created:');
    categories.forEach(cat => {
      console.log(`  ${cat.icon} ${cat.name} (${cat.slug})`);
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding categories:', error);
    process.exit(1);
  }
}

seedCategories();








