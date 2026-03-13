import mongoose from 'mongoose';
import Subject from '../models/Subject.js';
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

// Migrate all existing subjects to have majorCategory = 'STEAM'
const migrateSubjects = async () => {
  try {
    console.log('Starting migration...');
    
    // Update all subjects that don't have majorCategory set
    const result = await Subject.updateMany(
      { majorCategory: { $exists: false } },
      { $set: { majorCategory: 'STEAM' } }
    );
    
    // Also update any subjects with old 'Real' value to 'STEAM'
    const result2 = await Subject.updateMany(
      { majorCategory: 'Real' },
      { $set: { majorCategory: 'STEAM' } }
    );
    
    // Update any subjects with old 'Uman' value to 'Humanities'
    const result3 = await Subject.updateMany(
      { majorCategory: 'Uman' },
      { $set: { majorCategory: 'Humanities' } }
    );
    
    console.log(`Migration complete! Updated ${result.modifiedCount + result2.modifiedCount + result3.modifiedCount} subjects.`);
    
    // Display all subjects with their categories
    const subjects = await Subject.find();
    console.log('\nCurrent subjects:');
    subjects.forEach(subject => {
      console.log(`- ${subject.name}: ${subject.majorCategory}`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Migration error:', error);
    process.exit(1);
  }
};

// Run migration
connectDB().then(migrateSubjects);
