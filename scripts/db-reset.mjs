#!/usr/bin/env node
/**
 * db-reset.mjs — drops and recreates the local dev database then applies
 * all migrations and optionally seeds sample data.
 *
 * Usage:
 *   npm run db:reset          → migrate reset + seed
 *   npm run db:reset -- --no-seed  → skip seeding
 */
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

const root = process.cwd();
const apiDir = resolve(root, 'apps/api');
const noSeed = process.argv.includes('--no-seed');

function run(cmd, args, cwd = apiDir) {
  console.log(`→ ${cmd} ${args.join(' ')}`);
  const result = spawnSync(cmd, args, { cwd, stdio: 'inherit', shell: false });
  if (result.status !== 0) {
    console.error(`\n✗ Command failed with exit code ${result.status}`);
    process.exit(result.status ?? 1);
  }
}

// Check .env.local exists
const envPath = resolve(apiDir, '.env.local');
const envFallback = resolve(apiDir, '.env.example');
if (!existsSync(envPath) && !existsSync(envFallback)) {
  console.error('✗ No .env.local or .env.example found in apps/api — run npm run setup first');
  process.exit(1);
}

console.log('🗄  Resetting database…');
run('npx', ['prisma', 'migrate', 'reset', '--force', '--schema=prisma/schema.prisma']);

console.log('\n📦  Running migrations…');
run('npx', ['prisma', 'migrate', 'deploy', '--schema=prisma/schema.prisma']);

console.log('\n🧱  Syncing schema (dev fallback)…');
run('npx', ['prisma', 'db', 'push', '--schema=prisma/schema.prisma']);

if (!noSeed) {
  console.log('\n🌱  Seeding…');
  run('npx', ['prisma', 'db', 'seed']);
}

console.log('\n✅  Database reset complete');
