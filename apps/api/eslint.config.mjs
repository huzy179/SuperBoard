// @ts-check
import js from '@eslint/js';
import tsParser from '@typescript-eslint/parser';
import tsPlugin from '@typescript-eslint/eslint-plugin';

/**
 * Boundary Rules for apps/api
 *
 * Rule 1 — Cross-domain service import:
 *   A controller/service in module A must NOT import a service or repository
 *   from module B directly. All cross-domain calls must go through the module's
 *   own public API (injected via NestJS DI), not by importing the class file.
 *
 * Rule 2 — Controller bypassing service layer:
 *   A controller must NOT import a repository file or PrismaService directly.
 *   Controllers must only depend on their own service layer.
 *
 * Rule 3 — packages/shared must not import from apps/*:
 *   The shared contract package must remain app-agnostic. It must never import
 *   from any app source directory.
 */

const MODULES = [
  'ai',
  'analytics',
  'audit',
  'auth',
  'automation',
  'chat',
  'doc',
  'knowledge',
  'monitoring',
  'notification',
  'project',
  'project-events',
  'search',
  'talent',
  'task',
  'upload',
  'workflow',
  'workspace',
];

/**
 * Produces no-restricted-imports patterns that block any module from importing
 * a .service or .repository file belonging to a different module.
 */
function crossDomainPatterns() {
  return MODULES.flatMap((mod) => [
    {
      group: [`**/modules/${mod}/*.service`, `**/modules/${mod}/*.service.ts`],
      message: `[Boundary Rule 1] Cross-domain service import detected. Do not import ${mod} services directly from another module. Use NestJS dependency injection instead.`,
    },
    {
      group: [`**/modules/${mod}/*.repository`, `**/modules/${mod}/*.repository.ts`],
      message: `[Boundary Rule 1] Cross-domain repository import detected. Do not import ${mod} repositories directly from another module.`,
    },
  ]);
}

export default [
  {
    ignores: ['node_modules/**', 'dist/**', '**/*.d.ts'],
  },

  js.configs.recommended,

  // TypeScript base config
  {
    files: ['**/*.{ts,tsx,mts,cts}'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
    },
    rules: {
      ...tsPlugin.configs.recommended.rules,
      'no-undef': 'off',
    },
  },

  // Rule 1: Block cross-domain service/repository imports
  // Module A must not directly import service or repository files from module B.
  {
    files: ['src/modules/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: crossDomainPatterns(),
        },
      ],
    },
  },

  // Rule 2: Block controllers from importing repositories or PrismaService directly.
  // Controllers must only depend on their own module's service layer.
  {
    files: ['src/modules/**/*.controller.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['**/*.repository', '**/*.repository.ts'],
              message:
                '[Boundary Rule 2] Controllers must not import repositories directly. Use the service layer instead.',
            },
            {
              group: ['**/prisma.service', '**/prisma.service.ts', '@prisma/client'],
              message:
                '[Boundary Rule 2] Controllers must not import PrismaService or @prisma/client directly. Use the service layer instead.',
            },
          ],
        },
      ],
    },
  },

  // Rule 3 (reference): packages/shared must not import from apps/*.
  // The canonical enforcement is in packages/shared/eslint.config.mjs.
  // This entry guards against shared-like files accidentally placed under apps/api.
  {
    files: ['../../packages/shared/src/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['apps/*', 'apps/**', '../../apps/*', '../../apps/**'],
              message:
                '[Boundary Rule 3] packages/shared must not import from apps/*. Shared code must remain app-agnostic.',
            },
          ],
        },
      ],
    },
  },
];
