import mongoose from 'mongoose';
import Subject from '../models/Subject.js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env from root directory
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

const checkSubjects = async () => {
  try {
    const allSubjects = await Subject.find();
    
    console.log('=== ALL SUBJECTS IN DATABASE ===\n');
    allSubjects.forEach(subject => {
      console.log(`Name: ${subject.name}`);
      console.log(`Slug: ${subject.slug}`);
      console.log(`Category: ${subject.majorCategory || 'NONE/UNDEFINED'}`);
      console.log(`Icon: ${subject.icon}`);
      console.log('---');
    });
    
    console.log('\n=== STEAM SUBJECTS ===');
    const steamSubjects = allSubjects.filter(s => s.majorCategory === 'STEAM');
    console.log(`Count: ${steamSubjects.length}`);
    steamSubjects.forEach(s => console.log(`  - ${s.name}`));
    
    console.log('\n=== HUMANITIES SUBJECTS ===');
    const humanitiesSubjects = allSubjects.filter(s => s.majorCategory === 'Humanities');
    console.log(`Count: ${humanitiesSubjects.length}`);
    humanitiesSubjects.forEach(s => console.log(`  - ${s.name}`));
    
    console.log('\n=== SUBJECTS WITHOUT CATEGORY ===');
    const noCategory = allSubjects.filter(s => !s.majorCategory);
    console.log(`Count: ${noCategory.length}`);
    noCategory.forEach(s => console.log(`  - ${s.name} (${s.slug})`));
    
    console.log('\n=== SUBJECTS WITH INVALID CATEGORY ===');
    const invalidCategory = allSubjects.filter(s => s.majorCategory && s.majorCategory !== 'STEAM' && s.majorCategory !== 'Humanities');
    console.log(`Count: ${invalidCategory.length}`);
    invalidCategory.forEach(s => console.log(`  - ${s.name}: ${s.majorCategory}`));
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

connectDB().then(checkSubjects);
