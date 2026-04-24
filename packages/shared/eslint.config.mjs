// @ts-check
import js from '@eslint/js';
import tsParser from '@typescript-eslint/parser';
import tsPlugin from '@typescript-eslint/eslint-plugin';

/**
 * ESLint config for packages/shared
 *
 * Rule 3 — packages/shared must not import from apps/*:
 *   The shared contract package must remain app-agnostic. It must never import
 *   from any app source directory (apps/api, apps/web, apps/ai-service, etc.).
 */
export default [
  {
    ignores: ['node_modules/**', 'dist/**', '**/*.d.ts'],
  },

  js.configs.recommended,

  {
    files: ['src/**/*.{ts,tsx,mts,cts}'],
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

      // ── Rule 3: Block packages/shared from importing apps/* ───────────────
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['../../apps/*', '../../apps/**', '../../../apps/*', '../../../apps/**'],
              message:
                '[Boundary Rule 3] packages/shared must not import from apps/*. Shared code must remain app-agnostic. Move the dependency to the consuming app instead.',
            },
          ],
        },
      ],
    },
  },
];
