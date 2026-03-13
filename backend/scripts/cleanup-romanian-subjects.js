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

// Cleanup Romanian subjects
const cleanupSubjects = async () => {
  try {
    console.log('Starting cleanup...');
    
    // Find all subjects
    const allSubjects = await Subject.find();
    console.log('\nCurrent subjects:');
    allSubjects.forEach(subject => {
      console.log(`- ${subject.name} (${subject.slug}) - Category: ${subject.majorCategory || 'NONE'}`);
    });
    
    // Delete subjects with Romanian names or without proper majorCategory
    const romanianNames = ['Științe Reale', 'Științe Umane', 'Stiinte Reale', 'Stiinte Umane'];
    
    for (const name of romanianNames) {
      const result = await Subject.deleteMany({ name: name });
      if (result.deletedCount > 0) {
        console.log(`\n✓ Deleted ${result.deletedCount} subject(s) with name: "${name}"`);
      }
    }
    
    // Also delete any subjects without majorCategory or with invalid values
    const invalidResult = await Subject.deleteMany({
      $or: [
        { majorCategory: { $exists: false } },
        { majorCategory: { $nin: ['STEAM', 'Humanities'] } }
      ]
    });
    
    if (invalidResult.deletedCount > 0) {
      console.log(`\n✓ Deleted ${invalidResult.deletedCount} subject(s) with invalid or missing majorCategory`);
    }
    
    // Display remaining subjects
    const remainingSubjects = await Subject.find();
    console.log('\n\nRemaining subjects:');
    console.log('\nSTEAM:');
    remainingSubjects.filter(s => s.majorCategory === 'STEAM').forEach(s => {
      console.log(`  - ${s.name} (${s.slug})`);
    });
    console.log('\nHumanities:');
    remainingSubjects.filter(s => s.majorCategory === 'Humanities').forEach(s => {
      console.log(`  - ${s.name} (${s.slug})`);
    });
    
    console.log('\n✅ Cleanup complete!');
    process.exit(0);
  } catch (error) {
    console.error('Cleanup error:', error);
    process.exit(1);
  }
};

// Run cleanup
connectDB().then(cleanupSubjects);
