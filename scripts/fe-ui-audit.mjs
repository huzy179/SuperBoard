#!/usr/bin/env node
import { readdir, readFile, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';

const ROOT = process.cwd();

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

function parseArgs(argv) {
  const args = new Set(argv.slice(2));
  const targets = argv
    .slice(2)
    .filter((a) => !a.startsWith('--'))
    .map((t) => t.replace(/\/$/, ''));
  const strict = args.has('--strict');
  const out = (() => {
    const outArg = argv.find((a) => a.startsWith('--out='));
    return outArg ? outArg.slice('--out='.length) : 'docs/fe-ui-audit.md';
  })();
  return { targets: targets.length ? targets : DEFAULT_TARGETS, strict, out };
}

async function listFiles(dir) {
  const abs = path.resolve(ROOT, dir);
  const results = [];
  async function walk(current) {
    const entries = await readdir(current, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.name.startsWith('.')) continue;
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) {
        if (entry.name === 'node_modules' || entry.name === '.next' || entry.name === 'dist') {
          continue;
        }
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

async function main() {
  const { targets, strict, out } = parseArgs(process.argv);

  const files = (await Promise.all(targets.map(listFiles))).flat();
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
    `Targets: ${targets.map((t) => `\`${t}\``).join(', ')}`,
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

await main();
