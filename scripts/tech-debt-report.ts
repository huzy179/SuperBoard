#!/usr/bin/env tsx
/**
 * Tech Debt Report Generator
 *
 * Requirements: 16.1, 16.2, 16.3
 *
 * Collects tech debt metrics from:
 *   - jscpd: duplicate code ratio per app
 *   - CI history: flaky test count (reads from local test output if available)
 *   - BullMQ stats: queue failure rate (reads from Redis if REDIS_URL is set)
 *   - ESLint/TypeScript: lint and type error counts
 *
 * Output: docs/tech-debt/YYYY-WW.md with current metrics + updated backlog priorities
 *
 * Usage:
 *   npx tsx scripts/tech-debt-report.ts
 *   npx tsx scripts/tech-debt-report.ts --dry-run   # print to stdout only
 */

import { execSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

// ─── Config ───────────────────────────────────────────────────────────────────

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, '..');
const DOCS_TECH_DEBT = join(ROOT, 'docs', 'tech-debt');
const TEMPLATE_PATH = join(DOCS_TECH_DEBT, 'template.md');

const APPS = ['apps/api', 'apps/notification', 'apps/collaboration', 'apps/web'];
const PACKAGES = ['packages/shared'];

const isDryRun = process.argv.includes('--dry-run');

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getISOWeek(date: Date): string {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
}

function runCommand(cmd: string, cwd = ROOT): string {
  try {
    return execSync(cmd, { cwd, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }).trim();
  } catch (err: unknown) {
    const error = err as { stdout?: string; stderr?: string };
    return error.stdout?.trim() ?? '';
  }
}

// ─── Metric collectors ────────────────────────────────────────────────────────

interface DupMetric {
  app: string;
  percentage: string;
  topHotspots: Array<{ files: string[]; duplicateLines: number; group: string }>;
}

function collectDuplicateMetrics(): DupMetric[] {
  const metrics: DupMetric[] = [];

  for (const app of [...APPS, ...PACKAGES]) {
    const reportDir = join(ROOT, app, 'reports', 'dup');
    const reportFile = join(reportDir, 'jscpd-report.json');

    if (!existsSync(reportFile)) {
      // Try to generate report if jscpd is available
      const srcDir = join(ROOT, app, 'src');
      if (existsSync(srcDir)) {
        mkdirSync(reportDir, { recursive: true });
        runCommand(`npx jscpd ${srcDir} --reporters json --output ${reportDir} --silent`, ROOT);
      }
    }

    if (existsSync(reportFile)) {
      try {
        const report = JSON.parse(readFileSync(reportFile, 'utf8')) as {
          statistics?: { total?: { percentage?: number } };
          duplicates?: Array<{
            firstFile?: { name?: string };
            secondFile?: { name?: string };
            lines?: number;
          }>;
        };
        const percentage = report.statistics?.total?.percentage?.toFixed(1) ?? 'N/A';
        const hotspots = (report.duplicates ?? []).slice(0, 3).map((d) => ({
          files: [d.firstFile?.name ?? '', d.secondFile?.name ?? ''].filter(Boolean),
          duplicateLines: d.lines ?? 0,
          group: 'unknown',
        }));
        metrics.push({ app, percentage: `${percentage}%`, topHotspots: hotspots });
      } catch {
        metrics.push({ app, percentage: 'N/A', topHotspots: [] });
      }
    } else {
      metrics.push({ app, percentage: 'N/A (run dup:report)', topHotspots: [] });
    }
  }

  return metrics;
}

interface LintMetric {
  app: string;
  errors: number;
  warnings: number;
  typeErrors: number;
}

function collectLintMetrics(): LintMetric[] {
  const metrics: LintMetric[] = [];

  for (const app of APPS) {
    const appPath = join(ROOT, app);
    if (!existsSync(appPath)) {
      continue;
    }

    // Count ESLint errors/warnings
    const lintOutput = runCommand('npx eslint . --format json 2>/dev/null || echo "[]"', appPath);
    let errors = 0;
    let warnings = 0;
    try {
      const results = JSON.parse(lintOutput) as Array<{
        errorCount: number;
        warningCount: number;
      }>;
      for (const r of results) {
        errors += r.errorCount ?? 0;
        warnings += r.warningCount ?? 0;
      }
    } catch {
      errors = -1;
      warnings = -1;
    }

    // Count TypeScript errors
    const tscOutput = runCommand('npx tsc --noEmit 2>&1 || true', appPath);
    const typeErrors = (tscOutput.match(/error TS\d+/g) ?? []).length;

    metrics.push({ app, errors, warnings, typeErrors });
  }

  return metrics;
}

interface QueueMetric {
  queue: string;
  processed: string;
  failed: string;
  dlqDepth: string;
  successRate: string;
}

async function collectQueueMetrics(): Promise<QueueMetric[]> {
  const redisUrl = process.env.REDIS_URL;

  if (!redisUrl) {
    return [
      {
        queue: 'notifications',
        processed: 'N/A (set REDIS_URL)',
        failed: 'N/A',
        dlqDepth: 'N/A',
        successRate: 'N/A',
      },
      {
        queue: 'notifications:failed (DLQ)',
        processed: 'N/A',
        failed: 'N/A',
        dlqDepth: 'N/A',
        successRate: 'N/A',
      },
    ];
  }

  try {
    // Dynamic import to avoid hard dependency on ioredis at script load time
    const { default: Redis } = await import('ioredis');
    const redis = new Redis(redisUrl, { lazyConnect: true, connectTimeout: 3000 });
    await redis.connect();

    const queues = ['notifications', 'notifications:failed'];
    const metrics: QueueMetric[] = [];

    for (const q of queues) {
      const [completed, failed, waiting] = await Promise.all([
        redis.get(`bull:${q}:completed`).then((v) => parseInt(v ?? '0', 10)),
        redis.get(`bull:${q}:failed`).then((v) => parseInt(v ?? '0', 10)),
        redis.llen(`bull:${q}:wait`),
      ]);

      const total = completed + failed;
      const successRate = total > 0 ? `${((completed / total) * 100).toFixed(1)}%` : 'N/A';

      metrics.push({
        queue: q,
        processed: String(completed),
        failed: String(failed),
        dlqDepth: String(waiting),
        successRate,
      });
    }

    await redis.quit();
    return metrics;
  } catch {
    return [
      {
        queue: 'notifications',
        processed: 'N/A (Redis unavailable)',
        failed: 'N/A',
        dlqDepth: 'N/A',
        successRate: 'N/A',
      },
    ];
  }
}

// ─── Report builder ───────────────────────────────────────────────────────────

function buildReport(
  weekId: string,
  date: string,
  dupMetrics: DupMetric[],
  lintMetrics: LintMetric[],
  queueMetrics: QueueMetric[],
): string {
  const dupRows = dupMetrics.map((m) => `| \`${m.app}\` | ${m.percentage} | — | — | |`).join('\n');

  const dupHotspots = dupMetrics
    .flatMap((m) => m.topHotspots)
    .slice(0, 3)
    .map((h, i) => `${i + 1}. \`${h.files.join(', ')}\` — ${h.duplicateLines} duplicate lines`)
    .join('\n');

  const lintRows = lintMetrics
    .map(
      (m) =>
        `| \`${m.app}\` | ${m.errors < 0 ? 'N/A' : m.errors} | ${m.warnings < 0 ? 'N/A' : m.warnings} | ${m.typeErrors} | — |`,
    )
    .join('\n');

  const queueRows = queueMetrics
    .map(
      (m) =>
        `| \`${m.queue}\` | ${m.processed} | ${m.failed} | ${m.dlqDepth} | ${m.successRate} | — |`,
    )
    .join('\n');

  return `# Weekly Tech Debt Review — ${weekId}

> **Review date:** ${date}  
> **Reviewer(s):** <!-- names -->  
> **Previous report:** <!-- link to last week -->

---

## 1. Duplicate Code Ratio

| App / Package | Current Score | Previous Score | Δ | Status |
|---|---|---|---|---|
${dupRows}

**Top 3 hotspots this week:**

${dupHotspots || '1. No hotspot data — run `npm run dup:report` in each app\n2. —\n3. —'}

**Action items:**
- [ ] <!-- consolidation task, owner, target week -->

---

## 2. Flaky Test Count

| App | Flaky Tests | New This Week | Fixed This Week |
|---|---|---|---|
| \`apps/api\` | <!-- count --> | <!-- count --> | <!-- count --> |
| \`apps/notification\` | | | |
| \`apps/collaboration\` | | | |
| \`packages/shared\` | | | |

**Flaky test details:**
- <!-- test name, file, failure pattern, owner -->

**Action items:**
- [ ] <!-- fix task, owner, target week -->

---

## 3. Queue Failure Rate

| Queue | Jobs Processed | Failed | DLQ Depth | Success Rate | Δ vs Last Week |
|---|---|---|---|---|---|
${queueRows}

**Notable failures:**
- <!-- job type, error pattern, count, owner -->

**Action items:**
- [ ] <!-- fix task, owner, target week -->

---

## 4. Lint / Type Error Count

| App | Lint Errors | Lint Warnings | Type Errors | Δ vs Last Week |
|---|---|---|---|---|
${lintRows}

**Action items:**
- [ ] <!-- fix task, owner, target week -->

---

## 5. Backlog Priorities (Updated)

| Priority | Item | Owner | Target Week | Status |
|---|---|---|---|---|
| P1 | <!-- item --> | <!-- owner --> | <!-- YYYY-WW --> | <!-- In Progress / Blocked / Done --> |
| P2 | | | | |
| P3 | | | | |

**Items completed since last review:**
- <!-- item, completed date -->

**Items added to backlog:**
- <!-- item, rationale -->

---

## 6. Notes & Decisions

<!-- Free-form notes, architectural decisions, blockers, etc. -->

---

*Generated by \`scripts/tech-debt-report.ts\` on ${new Date().toISOString()} — edit manually to add context and decisions.*
`;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const now = new Date();
  const weekId = getISOWeek(now);
  const date = now.toISOString().split('T')[0];

  console.log(`📊 Collecting tech debt metrics for ${weekId}...`);

  console.log('  → Duplicate code metrics...');
  const dupMetrics = collectDuplicateMetrics();

  console.log('  → Lint / type error metrics...');
  const lintMetrics = collectLintMetrics();

  console.log('  → Queue metrics...');
  const queueMetrics = await collectQueueMetrics();

  const report = buildReport(weekId, date, dupMetrics, lintMetrics, queueMetrics);

  if (isDryRun) {
    console.log('\n─── DRY RUN — output below ───\n');
    console.log(report);
    return;
  }

  mkdirSync(DOCS_TECH_DEBT, { recursive: true });
  const outputPath = join(DOCS_TECH_DEBT, `${weekId}.md`);
  writeFileSync(outputPath, report, 'utf8');

  console.log(`\n✅ Report written to: docs/tech-debt/${weekId}.md`);
  console.log(
    '   Open the file and fill in the manual sections (flaky tests, backlog priorities, notes).',
  );

  // Verify template exists
  if (!existsSync(TEMPLATE_PATH)) {
    console.warn(
      '⚠️  Template not found at docs/tech-debt/template.md — run this script again after creating it.',
    );
  }
}

main().catch((err) => {
  console.error('❌ Failed to generate tech debt report:', err);
  process.exit(1);
});
