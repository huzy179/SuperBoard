import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, it } from 'node:test';

// Resolve relative to this file's location: apps/api/test/tech-debt/ → ../../../../docs/...
const BASELINE_PATH = resolve(__dirname, '../../../../docs/tech-debt/dup-baseline-v1.json');

const VALID_GROUPS = ['validation', 'mapper', 'response', 'error-handling'] as const;
const VALID_IMPACTS = ['high', 'medium', 'low'] as const;

type Group = (typeof VALID_GROUPS)[number];
type Impact = (typeof VALID_IMPACTS)[number];

interface Hotspot {
  rank: number;
  group: Group;
  files: string[];
  duplicateLines: number;
  impact: Impact;
  consolidationDirection: string;
}

interface BaselineReport {
  reportVersion: string;
  generatedAt: string;
  hotspots: Hotspot[];
}

describe('dup-baseline-v1.json schema validation', () => {
  let report: BaselineReport;

  it('reads and parses as valid JSON', () => {
    const raw = readFileSync(BASELINE_PATH, 'utf-8');
    report = JSON.parse(raw) as BaselineReport;
    assert.ok(report, 'Parsed report should be truthy');
  });

  it('has required top-level fields: reportVersion, generatedAt, hotspots', () => {
    const raw = readFileSync(BASELINE_PATH, 'utf-8');
    report = JSON.parse(raw) as BaselineReport;

    assert.ok('reportVersion' in report, 'Missing field: reportVersion');
    assert.ok('generatedAt' in report, 'Missing field: generatedAt');
    assert.ok('hotspots' in report, 'Missing field: hotspots');

    assert.equal(typeof report.reportVersion, 'string', 'reportVersion must be a string');
    assert.equal(typeof report.generatedAt, 'string', 'generatedAt must be a string');
  });

  it('hotspots is an array with at least 10 entries', () => {
    const raw = readFileSync(BASELINE_PATH, 'utf-8');
    report = JSON.parse(raw) as BaselineReport;

    assert.ok(Array.isArray(report.hotspots), 'hotspots must be an array');
    assert.ok(
      report.hotspots.length >= 10,
      `hotspots must have at least 10 entries, got ${report.hotspots.length}`,
    );
  });

  it('each hotspot has required fields with correct types', () => {
    const raw = readFileSync(BASELINE_PATH, 'utf-8');
    report = JSON.parse(raw) as BaselineReport;

    for (const [index, hotspot] of report.hotspots.entries()) {
      const ctx = `hotspot[${index}] (rank ${hotspot.rank})`;

      // rank: number
      assert.equal(typeof hotspot.rank, 'number', `${ctx}: rank must be a number`);

      // group: one of validation/mapper/response/error-handling
      assert.ok(
        (VALID_GROUPS as readonly string[]).includes(hotspot.group),
        `${ctx}: group "${hotspot.group}" must be one of ${VALID_GROUPS.join(', ')}`,
      );

      // files: array of strings
      assert.ok(Array.isArray(hotspot.files), `${ctx}: files must be an array`);
      assert.ok(hotspot.files.length > 0, `${ctx}: files must not be empty`);
      for (const file of hotspot.files) {
        assert.equal(typeof file, 'string', `${ctx}: each file entry must be a string`);
      }

      // duplicateLines: number
      assert.equal(
        typeof hotspot.duplicateLines,
        'number',
        `${ctx}: duplicateLines must be a number`,
      );

      // impact: one of high/medium/low
      assert.ok(
        (VALID_IMPACTS as readonly string[]).includes(hotspot.impact),
        `${ctx}: impact "${hotspot.impact}" must be one of ${VALID_IMPACTS.join(', ')}`,
      );

      // consolidationDirection: string
      assert.equal(
        typeof hotspot.consolidationDirection,
        'string',
        `${ctx}: consolidationDirection must be a string`,
      );
      assert.ok(
        hotspot.consolidationDirection.length > 0,
        `${ctx}: consolidationDirection must not be empty`,
      );
    }
  });
});
