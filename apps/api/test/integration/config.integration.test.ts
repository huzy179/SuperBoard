/**
 * Integration tests for API shared configuration migration
 * Validates: Requirements 3.1, 3.7
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { ConfigService as SharedConfigService } from '@superboard/backend-shared/config';
import { envSchema, type AppEnv } from '../../src/config/env';

describe('SharedConfigService integration', () => {
  it('loads and validates env variables with the shared config service', () => {
    const original = { ...process.env };
    try {
      process.env.NODE_ENV = 'test';
      process.env.PORT = '4000';
      process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
      process.env.REDIS_URL = 'redis://localhost:6379';
      process.env.ENABLE_REDIS = 'false';
      process.env.ENABLE_QUEUE = 'false';
      process.env.ELASTICSEARCH_URL = 'http://localhost:9200';
      process.env.QUEUE_NAME = 'superboard-dev';
      process.env.FRONTEND_URL = 'http://localhost:3000';
      process.env.AI_SERVICE_URL = 'http://localhost:8000';
      process.env.JWT_SECRET = '1234567890abcdef';
      process.env.JWT_EXPIRES_IN = '1d';

      const config = new SharedConfigService<AppEnv>({ schema: envSchema, validateOnLoad: true });
      assert.equal(config.get('PORT'), 4000);
      assert.equal(config.get('NODE_ENV'), 'test');
    } finally {
      // Restore env
      for (const key of Object.keys(process.env)) {
        if (!(key in original)) {
          delete process.env[key];
        }
      }
      Object.assign(process.env, original);
    }
  });
});
