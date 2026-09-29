/**
 * Migration: Normalize lesson language values to English
 *
 * Old values → New values:
 *   română / romana / Română       → romanian
 *   français / Français            → french
 *   deutsch / Deutsch              → german
 *   español / Español              → spanish
 *   italiano / Italiano            → italian
 *   português / Português          → portuguese
 *   english / English              → english  (already correct, lowercase only)
 *   other / Other                  → other
 *
 * Usage: node scripts/migrate-languages.js
 *        node scripts/migrate-languages.js --dry-run
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '..', '.env') });

const isDryRun = process.argv.includes('--dry-run');

// Map every known variant to the canonical English value
const LANGUAGE_MAP = {
  // Romanian
  'română': 'romanian',
  'romana': 'romanian',
  'română': 'romanian',
  'romanian': 'romanian',
  'Romanian': 'romanian',

  // French
  'français': 'french',
  'francais': 'french',
  'français': 'french',
  'french': 'french',
  'French': 'french',

  // German
  'deutsch': 'german',
  'Deutsch': 'german',
  'german': 'german',
  'German': 'german',

  // Spanish
  'español': 'spanish',
  'espanol': 'spanish',
  'español': 'spanish',
  'spanish': 'spanish',
  'Spanish': 'spanish',

  // Italian
  'italiano': 'italian',
  'Italiano': 'italian',
  'italian': 'italian',
  'Italian': 'italian',

  // Portuguese
  'português': 'portuguese',
  'portugues': 'portuguese',
  'português': 'portuguese',
  'portuguese': 'portuguese',
  'Portuguese': 'portuguese',

  // English
  'english': 'english',
  'English': 'english',

  // Other
  'other': 'other',
  'Other': 'other',
};

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✅ Connected to MongoDB');

  const db = mongoose.connection.db;
  const collection = db.collection('lessons');

  // Fetch all distinct language values currently in DB
  const distinct = await collection.distinct('language');
  console.log('\nDistinct language values found in DB:', distinct);

  let totalUpdated = 0;

  for (const oldValue of distinct) {
    const canonical = LANGUAGE_MAP[oldValue];

    if (!canonical) {
      console.warn(`  ⚠️  No mapping for "${oldValue}" — skipping`);
      continue;
    }

    if (canonical === oldValue) {
      console.log(`  ✓  "${oldValue}" already canonical — no change needed`);
      continue;
    }

    const filter = { language: oldValue };
    const count = await collection.countDocuments(filter);

    if (isDryRun) {
      console.log(`  [DRY-RUN] Would update ${count} lesson(s): "${oldValue}" → "${canonical}"`);
    } else {
      const result = await collection.updateMany(filter, { $set: { language: canonical } });
      totalUpdated += result.modifiedCount;
      console.log(`  ✅ Updated ${result.modifiedCount} lesson(s): "${oldValue}" → "${canonical}"`);
    }
  }

  // Also fix LessonReview documents that store lessonData.language
  const reviewCollection = db.collection('lessonreviews');
  const reviewDistinct = await reviewCollection.distinct('lessonData.language');
  console.log('\nDistinct lessonData.language values in LessonReviews:', reviewDistinct);

  for (const oldValue of reviewDistinct) {
    const canonical = LANGUAGE_MAP[oldValue];
    if (!canonical || canonical === oldValue) continue;

    const filter = { 'lessonData.language': oldValue };
    const count = await reviewCollection.countDocuments(filter);

    if (isDryRun) {
      console.log(`  [DRY-RUN] Would update ${count} review(s): "${oldValue}" → "${canonical}"`);
    } else {
      const result = await reviewCollection.updateMany(filter, { $set: { 'lessonData.language': canonical } });
      totalUpdated += result.modifiedCount;
      console.log(`  ✅ Updated ${result.modifiedCount} review(s): "${oldValue}" → "${canonical}"`);
    }
  }

  if (!isDryRun) {
    console.log(`\n✅ Migration complete. Total documents updated: ${totalUpdated}`);
  } else {
    console.log('\n[DRY-RUN] No changes made. Run without --dry-run to apply.');
  }

  await mongoose.disconnect();
}

run().catch(err => {
  console.error('Migration failed:', err);
  mongoose.disconnect();
  process.exit(1);
});
