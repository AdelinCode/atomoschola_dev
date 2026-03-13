import mongoose from 'mongoose';
import Subject from '../models/Subject.js';
import User from '../models/User.js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env from root directory
dotenv.config({ path: join(__dirname, '../../.env') });

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB connected');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

// Seed Uman subjects
const seedUmanSubjects = async () => {
  try {
    console.log('Starting seed...');
    
    // Find an owner user
    const owner = await User.findOne({ userType: 'owner' });
    if (!owner) {
      console.error('No owner user found. Please create an owner user first.');
      process.exit(1);
    }
    
    // Uman subjects to create
    const umanSubjects = [
      {
        name: 'History',
        slug: 'history',
        icon: 'fas fa-landmark',
        description: 'Explore world history, civilizations, and historical events',
        majorCategory: 'Humanities',
        isPremium: false,
        managedBy: [owner._id]
      },
      {
        name: 'Literature',
        slug: 'literature',
        icon: 'fas fa-book-open',
        description: 'Study classic and modern literature, poetry, and literary analysis',
        majorCategory: 'Humanities',
        isPremium: false,
        managedBy: [owner._id]
      },
      {
        name: 'Philosophy',
        slug: 'philosophy',
        icon: 'fas fa-brain',
        description: 'Explore philosophical thought, ethics, and critical thinking',
        majorCategory: 'Humanities',
        isPremium: false,
        managedBy: [owner._id]
      },
      {
        name: 'Languages',
        slug: 'languages',
        icon: 'fas fa-language',
        description: 'Learn foreign languages and linguistics',
        majorCategory: 'Humanities',
        isPremium: false,
        managedBy: [owner._id]
      }
    ];
    
    // Create subjects
    for (const subjectData of umanSubjects) {
      // Check if subject already exists
      const existing = await Subject.findOne({ slug: subjectData.slug });
      if (existing) {
        console.log(`Subject "${subjectData.name}" already exists, skipping...`);
        continue;
      }
      
      const subject = await Subject.create(subjectData);
      console.log(`✓ Created subject: ${subject.name} (${subject.majorCategory})`);
    }
    
    console.log('\nSeed complete!');
    
    // Display all subjects
    const allSubjects = await Subject.find();
    console.log('\nAll subjects:');
    console.log('STEAM:');
    allSubjects.filter(s => s.majorCategory === 'STEAM').forEach(s => {
      console.log(`  - ${s.name}`);
    });
    console.log('Humanities:');
    allSubjects.filter(s => s.majorCategory === 'Humanities').forEach(s => {
      console.log(`  - ${s.name}`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error);
    process.exit(1);
  }
};

// Run seed
connectDB().then(seedUmanSubjects);
