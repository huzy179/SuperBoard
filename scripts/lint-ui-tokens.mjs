#!/usr/bin/env node
import { readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';

const ROOT = process.cwd();

const DEFAULT_SCOPES = [
  'apps/web/src/components/layout',
  'apps/web/src/app/(public)/login',
  'apps/web/src/app/layout.tsx',
  'packages/ui/src/components',
];

const BANNED = [
  { id: 'bg-slate-950', re: /bg-slate-950\b/ },
  { id: 'glow', re: /shadow-glow|text-glow/ },
  { id: 'pulse', re: /animate-pulse|animate-ping/ },
];

function parseArgs(argv) {
  const args = argv.slice(2);
  const scopes = [];
  let all = false;
  for (const arg of args) {
    if (arg === '--all') all = true;
    else scopes.push(arg.replace(/\/$/, ''));
  }
  if (all) return { scopes: ['apps/web/src', 'packages/ui/src'] };
  return { scopes: scopes.length ? scopes : DEFAULT_SCOPES };
}

async function listFiles(input) {
  const abs = path.resolve(ROOT, input);
  const results = [];

  async function walk(current) {
    const s = await stat(current);
    if (s.isFile()) {
      results.push(current);
      return;
    }

    const entries = await readdir(current, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.name.startsWith('.')) continue;
      if (entry.name === 'node_modules' || entry.name === '.next' || entry.name === 'dist')
        continue;
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) await walk(full);
      else results.push(full);
    }
  }

  await walk(abs);

  return results.filter((f) => /\.(ts|tsx|js|mjs|css)$/.test(f));
}

async function main() {
  const { scopes } = parseArgs(process.argv);
  const files = (await Promise.all(scopes.map(listFiles))).flat();

  const violations = [];
  for (const file of files) {
    const rel = path.relative(ROOT, file);
    const text = await readFile(file, 'utf8');
    for (const banned of BANNED) {
      if (banned.re.test(text)) {
        violations.push({ file: rel, rule: banned.id });
      }
    }
  }

  if (violations.length > 0) {
    console.error('UI token lint failed. Found banned patterns:');
    for (const v of violations.slice(0, 60)) {
      console.error(`- ${v.rule}: ${v.file}`);
    }
    if (violations.length > 60) console.error(`…and ${violations.length - 60} more`);
    console.error('Tip: run `npm run ui:audit` to see full report.');
    process.exit(1);
  }
}

await main();
