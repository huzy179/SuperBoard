import { describe, it, after } from 'node:test';
import assert from 'node:assert/strict';
import * as http from 'node:http';
import { createHealthServer } from './health.js';

function request(
  server: http.Server,
  path: string,
): Promise<{ statusCode: number; body: unknown }> {
  return new Promise((resolve, reject) => {
    const addr = server.address() as { port: number };
    const options = { hostname: '127.0.0.1', port: addr.port, path, method: 'GET' };
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        resolve({ statusCode: res.statusCode ?? 0, body: JSON.parse(data) });
      });
    });
    req.on('error', reject);
    req.end();
  });
}

function startServer(server: http.Server): Promise<void> {
  return new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
}

describe('Health server', async () => {
  const servers: http.Server[] = [];

  after(() => {
    for (const s of servers) s.close();
  });

  async function makeServer(): Promise<http.Server> {
    const s = createHealthServer();
    servers.push(s);
    await startServer(s);
    return s;
  }

  await it('GET /health returns 200 with status ok and service name', async () => {
    const server = await makeServer();
    const { statusCode, body } = await request(server, '/health');
    assert.equal(statusCode, 200);
    assert.equal((body as { status: string }).status, 'ok');
    assert.equal((body as { service: string }).service, 'collab-service');
  });

  await it('GET /ready returns 200 when REDIS_URL is not set', async () => {
    delete process.env.REDIS_URL;
    const server = await makeServer();
    const { statusCode, body } = await request(server, '/ready');
    assert.equal(statusCode, 200);
    assert.equal((body as { status: string }).status, 'ready');
    assert.deepEqual((body as { dependencies: unknown[] }).dependencies, []);
  });

  await it('GET /ready returns 503 when REDIS_URL points to unreachable host', async () => {
    process.env.REDIS_URL = 'redis://127.0.0.1:19999';
    const server = await makeServer();
    const { statusCode, body } = await request(server, '/ready');
    assert.equal(statusCode, 503);
    assert.equal((body as { status: string }).status, 'not_ready');
    const deps = (body as { dependencies: { name: string; status: string }[] }).dependencies;
    assert.equal(deps[0].name, 'redis');
    assert.equal(deps[0].status, 'unhealthy');
    delete process.env.REDIS_URL;
  });

  await it('GET /unknown returns 404', async () => {
    const server = await makeServer();
    const { statusCode } = await request(server, '/unknown');
    assert.equal(statusCode, 404);
  });
});
