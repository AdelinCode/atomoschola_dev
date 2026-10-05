/**
 * Migration: Translate lesson tags to English
 * Usage: node scripts/migrate-tags.js
 *        node scripts/migrate-tags.js --dry-run
 */
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '..', '..', '.env') });

const isDryRun = process.argv.includes('--dry-run');

// Map known Romanian/other tags to English equivalents
const TAG_MAP = {
  // Romanian
  'reducere': 'reduction',
  'oxidare': 'oxidation',
  'redox': 'redox',
  'probleme': 'problems',
  'algoritmi': 'algorithms',
  'electrochimie': 'electrochemistry',
  'electroni': 'electrons',
  'concentratii': 'concentrations',
  'concentrații': 'concentrations',
  'tradus': 'translated',
  // Common Romanian academic tags (future-proof)
  'chimie': 'chemistry',
  'fizica': 'physics',
  'fizică': 'physics',
  'matematica': 'mathematics',
  'matematică': 'mathematics',
  'biologie': 'biology',
  'informatica': 'computer science',
  'informatică': 'computer science',
  'formula': 'formula',
  'formule': 'formulas',
  'teorie': 'theory',
  'exercitii': 'exercises',
  'exerciții': 'exercises',
  'bacalaureat': 'baccalaureate',
  'termodinamica': 'thermodynamics',
  'termodinamică': 'thermodynamics',
  'mecanica': 'mechanics',
  'mecanică': 'mechanics',
  'electricitate': 'electricity',
  'optica': 'optics',
  'optică': 'optics',
  'algebra': 'algebra',
  'algebră': 'algebra',
  'geometrie': 'geometry',
  'trigonometrie': 'trigonometry',
  'calcul': 'calculus',
  'statistica': 'statistics',
  'statistică': 'statistics',
  'programare': 'programming',
  'retele': 'networks',
  'rețele': 'networks',
  'literatura': 'literature',
  'literatură': 'literature',
  'istorie': 'history',
  'geografie': 'geography',
  'economie': 'economics',
  'filozofie': 'philosophy',
  'filosofie': 'philosophy',
  'gramatica': 'grammar',
  'gramatică': 'grammar',
};

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✅ Connected to MongoDB');
  const db = mongoose.connection.db;
  const col = db.collection('lessons');

  const lessons = await col.find(
    { tags: { $exists: true, $not: { $size: 0 } } }
  ).toArray();

  console.log(`\nFound ${lessons.length} lesson(s) with tags.\n`);

  let totalUpdated = 0;

  for (const lesson of lessons) {
    const oldTags = lesson.tags || [];
    const newTags = oldTags.map(tag => {
      const lower = tag.toLowerCase().trim();
      return TAG_MAP[lower] || TAG_MAP[tag] || lower;
    });

    const changed = oldTags.some((t, i) => t !== newTags[i]);
    if (!changed) {
      console.log(`  ✓  "${lesson.title}" — tags already OK: ${JSON.stringify(oldTags)}`);
      continue;
    }

    if (isDryRun) {
      console.log(`  [DRY-RUN] "${lesson.title}": ${JSON.stringify(oldTags)} → ${JSON.stringify(newTags)}`);
    } else {
      await col.updateOne({ _id: lesson._id }, { $set: { tags: newTags } });
      totalUpdated++;
      console.log(`  ✅ "${lesson.title}": ${JSON.stringify(oldTags)} → ${JSON.stringify(newTags)}`);
    }
  }

  // Also fix LessonReview lessonData.tags
  const reviewCol = db.collection('lessonreviews');
  const reviews = await reviewCol.find(
    { 'lessonData.tags': { $exists: true, $not: { $size: 0 } } }
  ).toArray();

  console.log(`\nFound ${reviews.length} review(s) with tags.\n`);

  for (const review of reviews) {
    const oldTags = review.lessonData?.tags || [];
    const newTags = oldTags.map(tag => {
      const lower = tag.toLowerCase().trim();
      return TAG_MAP[lower] || TAG_MAP[tag] || lower;
    });

    const changed = oldTags.some((t, i) => t !== newTags[i]);
    if (!changed) continue;

    if (isDryRun) {
      console.log(`  [DRY-RUN] Review "${review.lessonData?.title}": ${JSON.stringify(oldTags)} → ${JSON.stringify(newTags)}`);
    } else {
      await reviewCol.updateOne({ _id: review._id }, { $set: { 'lessonData.tags': newTags } });
      totalUpdated++;
      console.log(`  ✅ Review "${review.lessonData?.title}": ${JSON.stringify(oldTags)} → ${JSON.stringify(newTags)}`);
    }
  }

  if (!isDryRun) {
    console.log(`\n✅ Migration complete. Total updated: ${totalUpdated}`);
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
