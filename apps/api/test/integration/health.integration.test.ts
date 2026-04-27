/**
 * Integration tests for Core API health check endpoints
 * Validates: Requirements 5.1, 5.4
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { HealthCheckController } from '../../src/modules/health/health.controller';

// Minimal mock response helper
function makeMockResponse() {
  let statusCode = 200;
  let body: unknown;
  const res = {
    status(code: number) {
      statusCode = code;
      return res;
    },
    json(data: unknown) {
      body = data;
      return res;
    },
    getStatusCode: () => statusCode,
    getBody: () => body,
  };
  return res;
}

const mockConfigService = { get: () => '1.0.0' };

function createHealthCheckService(overrides?: {
  postgresHealthy?: boolean;
  redisHealthy?: boolean;
  queueHealthy?: boolean;
  rabbitmqHealthy?: boolean;
}) {
  const postgresHealthy = overrides?.postgresHealthy ?? true;
  const redisHealthy = overrides?.redisHealthy ?? true;
  const queueHealthy = overrides?.queueHealthy ?? true;
  const rabbitmqHealthy = overrides?.rabbitmqHealthy ?? true;

  return {
    checkReadiness: async () => ({
      status: postgresHealthy && redisHealthy && queueHealthy && rabbitmqHealthy ? 'ok' : 'error',
      service: 'core-api',
      version: '1.0.0',
      uptime: 1,
      timestamp: new Date().toISOString(),
      dependencies: [
        {
          name: 'postgres',
          status: postgresHealthy ? 'healthy' : 'unhealthy',
          latencyMs: 1,
          error: postgresHealthy ? undefined : 'Connection refused',
        },
        {
          name: 'redis',
          status: redisHealthy ? 'healthy' : 'unhealthy',
          latencyMs: 1,
          error: redisHealthy ? undefined : 'Redis connection failed',
        },
        {
          name: 'bullmq',
          status: queueHealthy ? 'healthy' : 'unhealthy',
          latencyMs: 1,
          error: queueHealthy ? undefined : 'Queue down',
        },
        {
          name: 'rabbitmq',
          status: rabbitmqHealthy ? 'healthy' : 'unhealthy',
          latencyMs: 1,
          error: rabbitmqHealthy ? undefined : 'RabbitMQ down',
        },
      ],
    }),
  };
}

function buildController(overrides: { healthCheckService?: object }) {
  return new HealthCheckController(
    mockConfigService as never,
    (overrides.healthCheckService ?? createHealthCheckService()) as never,
  );
}

describe('HealthCheckController integration', () => {
  describe('GET /health (liveness)', () => {
    it('returns 200 with correct body shape when service is running', () => {
      const controller = buildController({});
      const result = controller.liveness();

      assert.equal(result.status, 'ok');
      assert.equal(result.service, 'core-api');
      assert.equal(typeof result.version, 'string');
      assert.equal(typeof result.uptime, 'number');
      assert.ok(Array.isArray(result.dependencies));
    });
  });

  describe('GET /ready (readiness)', () => {
    it('returns 200 with all dependencies healthy when everything is up', async () => {
      const controller = buildController({});
      const res = makeMockResponse();
      await controller.readiness(res as never);

      assert.equal(res.getStatusCode(), 200);
      const body = res.getBody() as {
        status: string;
        dependencies: { name: string; status: string }[];
      };
      assert.equal(body.status, 'ok');
      assert.ok(Array.isArray(body.dependencies));
      const postgres = body.dependencies.find((d) => d.name === 'postgres');
      assert.ok(postgres, 'postgres dependency should be present');
      assert.equal(postgres!.status, 'healthy');
    });

    it('returns 503 when database is not connected', async () => {
      const controller = buildController({
        healthCheckService: createHealthCheckService({ postgresHealthy: false }),
      });
      const res = makeMockResponse();
      await controller.readiness(res as never);

      assert.equal(res.getStatusCode(), 503);
      const body = res.getBody() as {
        status: string;
        dependencies: { name: string; status: string; error?: string }[];
      };
      assert.equal(body.status, 'not_ready');
      const postgres = body.dependencies.find((d) => d.name === 'postgres');
      assert.ok(postgres, 'postgres dependency should be present');
      assert.equal(postgres!.status, 'unhealthy');
      assert.equal(postgres!.error, 'Connection refused');
    });

    it('returns 503 when Redis is down', async () => {
      const controller = buildController({
        healthCheckService: createHealthCheckService({ redisHealthy: false }),
      });
      const res = makeMockResponse();
      await controller.readiness(res as never);

      assert.equal(res.getStatusCode(), 503);
      const body = res.getBody() as {
        status: string;
        dependencies: { name: string; status: string }[];
      };
      assert.equal(body.status, 'not_ready');
      const redis = body.dependencies.find((d) => d.name === 'redis');
      assert.ok(redis, 'redis dependency should be present');
      assert.equal(redis!.status, 'unhealthy');
    });
  });
});
