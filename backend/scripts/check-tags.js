import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '..', '..', '.env') });

await mongoose.connect(process.env.MONGODB_URI);
const db = mongoose.connection.db;
const lessons = await db.collection('lessons').find(
  { tags: { $exists: true, $not: { $size: 0 } } },
  { projection: { tags: 1, title: 1 } }
).toArray();

const allTags = [...new Set(lessons.flatMap(l => l.tags || []))];
console.log('Distinct tags:', JSON.stringify(allTags, null, 2));
console.log('Lessons with tags:', lessons.length);
await mongoose.disconnect();
