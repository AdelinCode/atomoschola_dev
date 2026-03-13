import mongoose from 'mongoose';
import Subject from '../models/Subject.js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../../.env') });

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB connected\n');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

const forceCleanup = async () => {
  try {
    console.log('=== FORCE CLEANUP - Deleting Romanian Subjects ===\n');
    
    // Delete by slug (more reliable)
    const slugsToDelete = ['stiinte-reale', 'stiinte-umane'];
    
    for (const slug of slugsToDelete) {
      const subject = await Subject.findOne({ slug });
      if (subject) {
        console.log(`Found: ${subject.name} (${subject.slug})`);
        await Subject.deleteOne({ slug });
        console.log(`✓ Deleted: ${subject.name}\n`);
      } else {
        console.log(`Not found: ${slug}\n`);
      }
    }
    
    // Also try by name with regex (case insensitive)
    const result = await Subject.deleteMany({
      name: { $regex: /științe|stiinte/i }
    });
    
    if (result.deletedCount > 0) {
      console.log(`✓ Deleted ${result.deletedCount} additional Romanian subject(s)\n`);
    }
    
    // Show remaining subjects
    const remaining = await Subject.find();
    console.log('=== REMAINING SUBJECTS ===');
    console.log(`Total: ${remaining.length}\n`);
    
    console.log('STEAM:');
    remaining.filter(s => s.majorCategory === 'STEAM').forEach(s => {
      console.log(`  - ${s.name} (${s.slug})`);
    });
    
    console.log('\nHumanities:');
    remaining.filter(s => s.majorCategory === 'Humanities').forEach(s => {
      console.log(`  - ${s.name} (${s.slug})`);
    });
    
    console.log('\n✅ Force cleanup complete!');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

connectDB().then(forceCleanup);
