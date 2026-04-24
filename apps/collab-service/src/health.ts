import * as http from 'http';
import * as net from 'net';

interface DependencyHealth {
  name: string;
  status: 'healthy' | 'unhealthy';
  error?: string;
}

function parseRedisUrl(redisUrl: string): { host: string; port: number } | null {
  try {
    const url = new URL(redisUrl);
    return {
      host: url.hostname || 'localhost',
      port: parseInt(url.port || '6379', 10),
    };
  } catch {
    return null;
  }
}

function checkRedisTcp(host: string, port: number, timeoutMs = 3000): Promise<DependencyHealth> {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    let settled = false;

    const done = (result: DependencyHealth) => {
      if (settled) return;
      settled = true;
      socket.destroy();
      resolve(result);
    };

    socket.setTimeout(timeoutMs);

    socket.connect(port, host, () => {
      done({ name: 'redis', status: 'healthy' });
    });

    socket.on('timeout', () => {
      done({ name: 'redis', status: 'unhealthy', error: 'Connection timed out' });
    });

    socket.on('error', (err) => {
      done({ name: 'redis', status: 'unhealthy', error: err.message });
    });
  });
}

async function checkReadiness(): Promise<{ ready: boolean; dependencies: DependencyHealth[] }> {
  const redisUrl = process.env.REDIS_URL;

  if (!redisUrl) {
    // Redis not configured — skip check, report as healthy
    return { ready: true, dependencies: [] };
  }

  const parsed = parseRedisUrl(redisUrl);
  if (!parsed) {
    return {
      ready: false,
      dependencies: [{ name: 'redis', status: 'unhealthy', error: 'Invalid REDIS_URL format' }],
    };
  }

  const dep = await checkRedisTcp(parsed.host, parsed.port);
  return {
    ready: dep.status === 'healthy',
    dependencies: [dep],
  };
}

export function createHealthServer(): http.Server {
  const server = http.createServer(async (req, res) => {
    const url = req.url?.split('?')[0];

    if (req.method === 'GET' && url === '/health') {
      const body = JSON.stringify({ status: 'ok', service: 'collab-service' });
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(body);
      return;
    }

    if (req.method === 'GET' && url === '/ready') {
      const { ready, dependencies } = await checkReadiness();
      const statusCode = ready ? 200 : 503;
      const body = JSON.stringify({
        status: ready ? 'ready' : 'not_ready',
        dependencies,
      });
      res.writeHead(statusCode, { 'Content-Type': 'application/json' });
      res.end(body);
      return;
    }

    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not found' }));
  });

  return server;
}

export function startHealthServer(): void {
  const port = parseInt(process.env.HEALTH_PORT || '3001', 10);
  const host = process.env.HEALTH_HOST || '0.0.0.0';

  const server = createHealthServer();
  server.listen(port, host, () => {
    console.log(`Health server listening on ${host}:${port}`);
  });
}
