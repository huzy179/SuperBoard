/**
 * Integration test for AuthController routing declarations.
 *
 * Note: Our node:test + tsx pipeline doesn't enable TypeScript decorators at runtime,
 * so we validate route declarations by inspecting the source text.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';
import { join } from 'node:path';

const AUTH_CONTROLLER_PATH = join(
  process.cwd(),
  'apps',
  'api',
  'src',
  'modules',
  'auth',
  'auth.controller.ts',
);

describe('AuthController routing declarations', () => {
  it("declares @Controller('auth')", () => {
    const contents = readFileSync(AUTH_CONTROLLER_PATH, 'utf8');
    assert.match(contents, /@Controller\(\s*['"]auth['"]\s*\)/);
  });

  it("declares @Post('login')", () => {
    const contents = readFileSync(AUTH_CONTROLLER_PATH, 'utf8');
    assert.match(contents, /@Post\(\s*['"]login['"]\s*\)/);
  });
});
