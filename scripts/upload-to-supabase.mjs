/**
 * Upload beach photos to Supabase Storage + insert into photos_cache table
 * Usage: node scripts/upload-to-supabase.mjs
 *        node scripts/upload-to-supabase.mjs --dry-run   (test sans uploader)
 *        node scripts/upload-to-supabase.mjs --limit 50  (test sur 50 photos)
 */
import { createClient } from '@supabase/supabase-js';
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { parse } from 'csv-parse/sync';
import * as dotenv from 'dotenv';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

// Load .env
dotenv.config({ path: join(ROOT, '.env') });

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
// Utilise service role key si dispo (nécessaire pour upload Storage), sinon anon key
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
const PHOTOS_DIR = join(__dirname, 'photos');
const CSV_PATH = join(__dirname, 'photos_supabase.csv');
const BUCKET = 'beach-photos';
const BATCH_SIZE = 10; // upload N photos en parallèle

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ EXPO_PUBLIC_SUPABASE_URL et EXPO_PUBLIC_SUPABASE_ANON_KEY requis dans .env');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const limitArg = args.indexOf('--limit');
const LIMIT = limitArg >= 0 ? parseInt(args[limitArg + 1]) : Infinity;

async function ensureBucket() {
  const { data: buckets } = await supabase.storage.listBuckets();
  const exists = buckets?.some(b => b.name === BUCKET);
  if (!exists) {
    const { error } = await supabase.storage.createBucket(BUCKET, { public: true });
    if (error) throw new Error(`Bucket creation failed: ${error.message}`);
    console.log(`✅ Bucket '${BUCKET}' créé`);
  }
}

async function uploadRow(row) {
  const { osm_id, name, photo_file, source } = row;
  if (!photo_file || !osm_id) return null;

  // Find photo file (may have .jpg, .jpeg, .png, .webp extension)
  const extensions = ['jpg', 'jpeg', 'png', 'webp'];
  let localPath = null;
  for (const ext of extensions) {
    const candidate = join(PHOTOS_DIR, photo_file);
    if (existsSync(candidate)) { localPath = candidate; break; }
    // Also try with the base name + ext
    const base = photo_file.replace(/\.[^.]+$/, '');
    const candidate2 = join(PHOTOS_DIR, `${base}.${ext}`);
    if (existsSync(candidate2)) { localPath = candidate2; break; }
  }

  if (!localPath) {
    console.log(`  ⚠️  Photo non trouvée: ${photo_file} (osm_id: ${osm_id})`);
    return null;
  }

  const ext = localPath.split('.').pop();
  const storagePath = `${osm_id}.${ext}`;
  const contentType = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';

  if (DRY_RUN) {
    console.log(`  [dry-run] Would upload: ${storagePath}`);
    return { osm_id, storagePath };
  }

  // Upload to Storage
  const fileBuffer = readFileSync(localPath);
  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(storagePath, fileBuffer, {
      contentType,
      upsert: true,
    });

  if (uploadError) {
    console.log(`  ❌ Upload error (${osm_id}): ${uploadError.message}`);
    return null;
  }

  // Get public URL
  const { data: { publicUrl } } = supabase.storage.from(BUCKET).getPublicUrl(storagePath);

  // Insert into photos_cache
  const { error: dbError } = await supabase.from('photos_cache').insert({
    osm_id,
    url: publicUrl,
    source: source || 'google_maps',
    attribution: 'Google Maps',
  });

  if (dbError) {
    console.log(`  ❌ DB error (${osm_id}): ${dbError.message}`);
    return null;
  }

  return { osm_id, publicUrl };
}

async function main() {
  console.log(`\nBeachFinder — Upload photos → Supabase`);
  console.log(`Bucket: ${BUCKET}  |  ${DRY_RUN ? '🔍 DRY RUN' : '🚀 LIVE'}\n`);

  if (!existsSync(CSV_PATH)) {
    console.error(`❌ CSV non trouvé: ${CSV_PATH}`);
    process.exit(1);
  }

  const csvContent = readFileSync(CSV_PATH, 'utf-8');
  const rows = parse(csvContent, { columns: true, skip_empty_lines: true });
  const limited = rows.slice(0, LIMIT === Infinity ? rows.length : LIMIT);

  console.log(`📋 ${limited.length} lignes dans le CSV`);

  if (!DRY_RUN) {
    await ensureBucket();
    // Check already uploaded (skip if already in DB)
    const { data: existing } = await supabase.from('photos_cache').select('osm_id');
    const existingIds = new Set(existing?.map(r => r.osm_id) ?? []);
    const toUpload = limited.filter(r => !existingIds.has(r.osm_id));
    console.log(`✅ Déjà en base: ${existingIds.size}  |  À uploader: ${toUpload.length}\n`);

    let done = 0, errors = 0;
    for (let i = 0; i < toUpload.length; i += BATCH_SIZE) {
      const batch = toUpload.slice(i, i + BATCH_SIZE);
      const results = await Promise.all(batch.map(uploadRow));
      done += results.filter(Boolean).length;
      errors += results.filter(r => r === null).length;
      const pct = Math.round(((i + batch.length) / toUpload.length) * 100);
      process.stdout.write(`\r  ${i + batch.length}/${toUpload.length} (${pct}%) — ✅${done} ❌${errors}`);
    }
    console.log(`\n\n✅ Upload terminé: ${done} photos, ${errors} erreurs`);
  } else {
    // Dry run
    let found = 0;
    for (const row of limited.slice(0, 10)) {
      const r = await uploadRow(row);
      if (r) found++;
    }
    console.log(`\nDry run: ${found}/10 photos trouvées localement`);
  }
}

main().catch(e => { console.error(e); process.exit(1); });
