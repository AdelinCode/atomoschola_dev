/**
 * Fix broken/corrupted language values that start with "rom"
 * but weren't caught by the main migration (encoding issues).
 */
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '..', '.env') });

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✅ Connected to MongoDB');
  const db = mongoose.connection.db;

  for (const collName of ['lessons', 'lessonreviews']) {
    const col = db.collection(collName);
    const field = collName === 'lessonreviews' ? 'lessonData.language' : 'language';

    // Find all docs whose language starts with "rom" but isn't already "romanian"
    const docs = await col.find({ [field]: { $regex: '^rom', $options: 'i' } }).toArray();
    const broken = docs.filter(d => {
      const val = collName === 'lessonreviews' ? d.lessonData?.language : d.language;
      return val !== 'romanian';
    });

    if (broken.length === 0) {
      console.log(`  ✓  No broken Romanian values in "${collName}"`);
      continue;
    }

    const ids = broken.map(d => d._id);
    const result = await col.updateMany(
      { _id: { $in: ids } },
      { $set: { [field]: 'romanian' } }
    );
    console.log(`  ✅ Fixed ${result.modifiedCount} doc(s) in "${collName}"`);
  }

  console.log('\n✅ Done.');
  await mongoose.disconnect();
}

run().catch(err => {
  console.error('Failed:', err);
  mongoose.disconnect();
  process.exit(1);
});
