/**
 * Boundary Rules Documentation Test
 *
 * Validates: Requirements 4.1
 *
 * This test verifies:
 * 1. Fixture files exist and contain the expected violation import patterns
 * 2. The ESLint config exists and contains the boundary rule configurations
 * 3. Each rule is documented in docs/boundary-rules.md
 *
 * This is a documentation/structural test — it does NOT run ESLint directly.
 * Actual lint enforcement is validated by running `npm run lint`.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const ROOT = resolve(__dirname, '../../../..');
const API_ROOT = resolve(ROOT, 'apps/api');
const FIXTURES_DIR = resolve(__dirname, 'fixtures');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function readFixture(filename: string): string {
  return readFileSync(resolve(FIXTURES_DIR, filename), 'utf-8');
}

function readApiFile(relativePath: string): string {
  return readFileSync(resolve(API_ROOT, relativePath), 'utf-8');
}

function readRootFile(relativePath: string): string {
  return readFileSync(resolve(ROOT, relativePath), 'utf-8');
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Boundary Rules — fixture files', () => {
  it('rule1-violation.ts exists and contains a cross-domain service import', () => {
    const content = readFixture('rule1-violation.ts');
    // Must import from another module's .service file
    assert.match(
      content,
      /from\s+['"][^'"]*\/modules\/workspace\/workspace\.service['"]/,
      'rule1-violation.ts must contain an import from workspace.service',
    );
  });

  it('rule2-violation.ts exists and contains a controller importing a repository', () => {
    const content = readFixture('rule2-violation.ts');
    // Must import from a .repository file
    assert.match(
      content,
      /from\s+['"][^'"]*\.repository['"]/,
      'rule2-violation.ts must contain an import from a .repository file',
    );
  });

  it('rule3-violation.ts exists and contains a shared-package import from apps/*', () => {
    const content = readFixture('rule3-violation.ts');
    // Must import from apps/api/src/
    assert.match(
      content,
      /from\s+['"][^'"]*apps\/api\/src[^'"]*['"]/,
      'rule3-violation.ts must contain an import from apps/api/src/',
    );
  });
});

describe('Boundary Rules — ESLint config', () => {
  it('eslint.config.mjs exists in apps/api', () => {
    // Will throw if file does not exist
    const content = readApiFile('eslint.config.mjs');
    assert.ok(content.length > 0, 'eslint.config.mjs must not be empty');
  });

  it('ESLint config contains Rule 1: cross-domain service import restriction', () => {
    const content = readApiFile('eslint.config.mjs');
    assert.ok(
      content.includes('Boundary Rule 1') || content.includes('crossDomainPatterns'),
      'ESLint config must reference Boundary Rule 1 or crossDomainPatterns()',
    );
    // The config must restrict imports from modules/*.service paths
    assert.match(
      content,
      /modules\/\$\{mod\}\/\*\.service|modules\/.*\.service/,
      'ESLint config must have a no-restricted-imports pattern for module service files',
    );
  });

  it('ESLint config contains Rule 2: controller bypassing service layer restriction', () => {
    const content = readApiFile('eslint.config.mjs');
    assert.ok(content.includes('Boundary Rule 2'), 'ESLint config must reference Boundary Rule 2');
    // The config must restrict .repository imports in controllers
    assert.match(
      content,
      /\*\.controller\.\{ts,tsx\}|\*\.controller\.\{ts/,
      'ESLint config must target controller files for Rule 2',
    );
    assert.match(
      content,
      /\*\*\/\*\.repository/,
      'ESLint config must restrict .repository imports',
    );
  });

  it('ESLint config contains Rule 3: packages/shared must not import from apps/*', () => {
    const content = readApiFile('eslint.config.mjs');
    assert.ok(content.includes('Boundary Rule 3'), 'ESLint config must reference Boundary Rule 3');
    assert.match(
      content,
      /apps\/\*|apps\/\*\*/,
      'ESLint config must restrict imports from apps/* for shared package files',
    );
  });
});

describe('Boundary Rules — documentation', () => {
  it('docs/boundary-rules.md exists', () => {
    const content = readRootFile('docs/boundary-rules.md');
    assert.ok(content.length > 0, 'docs/boundary-rules.md must not be empty');
  });

  it('docs/boundary-rules.md documents Rule 1 (cross-domain service import)', () => {
    const content = readRootFile('docs/boundary-rules.md');
    assert.ok(
      content.includes('Rule 1') || content.includes('Cross-Domain'),
      'docs/boundary-rules.md must document Rule 1 (cross-domain service import)',
    );
  });

  it('docs/boundary-rules.md documents Rule 2 (controller bypassing service layer)', () => {
    const content = readRootFile('docs/boundary-rules.md');
    assert.ok(
      content.includes('Rule 2') || content.includes('Controller Bypassing'),
      'docs/boundary-rules.md must document Rule 2 (controller bypassing service layer)',
    );
  });

  it('docs/boundary-rules.md documents Rule 3 (shared must not import from apps)', () => {
    const content = readRootFile('docs/boundary-rules.md');
    assert.ok(
      content.includes('Rule 3') || content.includes('packages/shared'),
      'docs/boundary-rules.md must document Rule 3 (shared must not import from apps/*)',
    );
  });
});
