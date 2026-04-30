#!/usr/bin/env node
import { readdir, readFile, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';

const ROOT = process.cwd();

function usage() {
  console.log(
    [
      'Usage:',
      '  node scripts/ui.mjs audit [targets...] [--out=path] [--strict]',
      '  node scripts/ui.mjs lint [scopes...] [--all]',
      '',
      'Examples:',
      '  npm run ui -- audit apps/web/src --out=docs/fe-ui-audit.md',
      '  npm run ui -- lint --all',
    ].join('\n'),
  );
}

function parseOut(argv, fallback) {
  const outArg = argv.find((a) => a.startsWith('--out='));
  return outArg ? outArg.slice('--out='.length) : fallback;
}

async function listFilesInDir(dir) {
  const abs = path.resolve(ROOT, dir);
  const results = [];
  async function walk(current) {
    const entries = await readdir(current, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.name.startsWith('.')) continue;
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) {
        if (entry.name === 'node_modules' || entry.name === '.next' || entry.name === 'dist')
          continue;
        await walk(full);
        continue;
      }
      const s = await stat(full);
      if (!s.isFile()) continue;
      if (!/\.(ts|tsx|js|mjs|css)$/.test(entry.name)) continue;
      results.push(full);
    }
  }
  await walk(abs);
  return results;
}

function countMatches(text, re) {
  let count = 0;
  for (;;) {
    const match = re.exec(text);
    if (!match) break;
    count += 1;
  }
  return count;
}

async function runAudit(argv) {
  const DEFAULT_TARGETS = ['apps/web/src', 'packages/ui/src'];
  const PATTERNS = [
    { id: 'dark_text', label: 'Terminal/dark text', re: /text-white(\/|\b)/g },
    { id: 'dark_bg', label: 'Terminal/dark backgrounds', re: /bg-slate-950\b/g },
    { id: 'white_borders', label: 'White borders', re: /border-white(\/|\b)/g },
    { id: 'glow', label: 'Glow shadows', re: /shadow-glow|text-glow/g },
    { id: 'pulse', label: 'Attention animations', re: /animate-pulse|animate-ping/g },
    { id: 'upper', label: 'Aggressive uppercase UI', re: /\buppercase\b/g },
    {
      id: 'tracking_dense',
      label: 'Dense tracking (terminal style)',
      re: /tracking-\[(0\.\d+em)\]/g,
    },
    { id: 'backdrop_blur', label: 'Backdrop blur', re: /backdrop-blur/g },
  ];

  const argsSet = new Set(argv);
  const targets = argv.filter((a) => !a.startsWith('--')).map((t) => t.replace(/\/$/, ''));
  const strict = argsSet.has('--strict');
  const out = parseOut(argv, 'docs/fe-ui-audit.md');
  const finalTargets = targets.length ? targets : DEFAULT_TARGETS;

  const files = (await Promise.all(finalTargets.map(listFilesInDir))).flat();
  const byFile = new Map(); // file -> { patternId -> count }

  for (const file of files) {
    const text = await readFile(file, 'utf8');
    const rel = path.relative(ROOT, file);
    const counts = {};
    for (const pattern of PATTERNS) {
      pattern.re.lastIndex = 0;
      const c = countMatches(text, pattern.re);
      if (c > 0) counts[pattern.id] = c;
    }
    if (Object.keys(counts).length > 0) byFile.set(rel, counts);
  }

  const totals = {};
  for (const pattern of PATTERNS) totals[pattern.id] = 0;
  for (const counts of byFile.values()) {
    for (const [patternId, c] of Object.entries(counts)) totals[patternId] += c;
  }

  const rows = [...byFile.entries()].map(([file, counts]) => ({
    file,
    total: Object.values(counts).reduce((a, b) => a + b, 0),
    counts,
  }));
  rows.sort((a, b) => b.total - a.total);

  const top = rows.slice(0, 40);
  const now = new Date().toISOString().slice(0, 10);

  const md = [
    `# FE UI Audit (${now})`,
    ``,
    `Targets: ${finalTargets.map((t) => `\`${t}\``).join(', ')}`,
    ``,
    `## Totals`,
    ...PATTERNS.map((p) => `- ${p.label}: **${totals[p.id]}**`),
    ``,
    `## Top Files (by total hits)`,
    `| File | Total | Breakdown |`,
    `| --- | ---: | --- |`,
    ...top.map((r) => {
      const breakdown = PATTERNS.filter((p) => r.counts[p.id])
        .map((p) => `${p.id}:${r.counts[p.id]}`)
        .join(', ');
      return `| \`${r.file}\` | ${r.total} | ${breakdown} |`;
    }),
    ``,
    `## Next Actions`,
    `- Prioritize refactor of the top 10 files/pages (P0) to remove terminal/dark classes and attention animations.`,
    `- Consolidate primitives: move app usage to \`@superboard/ui\` components and reduce duplicated styling in \`apps/web\`.`,
    `- Add guardrails (lint rule / script) after P0 pages are cleaned so CI can enforce the new baseline.`,
    ``,
  ].join('\n');

  await writeFile(path.resolve(ROOT, out), md, 'utf8');

  if (strict) {
    const totalHits = Object.values(totals).reduce((a, b) => a + b, 0);
    if (totalHits > 0) {
      console.error(`UI audit strict mode failed: ${totalHits} total hits (see ${out}).`);
      process.exit(1);
    }
  }

  console.log(`Wrote UI audit to ${out} (${rows.length} files flagged).`);
}

async function listFilesForLint(input) {
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

async function runLint(argv) {
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

  const all = argv.includes('--all');
  const scopes = argv.filter((a) => a !== '--all').map((s) => s.replace(/\/$/, ''));
  const finalScopes = all
    ? ['apps/web/src', 'packages/ui/src']
    : scopes.length
      ? scopes
      : DEFAULT_SCOPES;
  const files = (await Promise.all(finalScopes.map(listFilesForLint))).flat();

  const violations = [];
  for (const file of files) {
    const rel = path.relative(ROOT, file);
    const text = await readFile(file, 'utf8');
    for (const banned of BANNED) {
      if (banned.re.test(text)) violations.push({ file: rel, rule: banned.id });
    }
  }

  if (violations.length > 0) {
    console.error('UI token lint failed. Found banned patterns:');
    for (const v of violations.slice(0, 60)) console.error(`- ${v.rule}: ${v.file}`);
    if (violations.length > 60) console.error(`…and ${violations.length - 60} more`);
    console.error('Tip: run `npm run ui -- audit` to see full report.');
    process.exit(1);
  }
}

async function main() {
  const [, , command, ...rest] = process.argv;
  if (!command || command === '-h' || command === '--help' || command === 'help') {
    usage();
    return;
  }

  if (command === 'audit') return runAudit(rest);
  if (command === 'lint') return runLint(rest);

  console.error(`Unknown command: ${command}`);
  usage();
  process.exit(1);
}

await main();
