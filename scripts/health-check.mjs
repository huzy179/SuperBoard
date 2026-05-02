const checks = [
  {
    name: 'API',
    url: 'http://localhost:4000/api/v1/health',
  },
  {
    name: 'Docs API (auth required)',
    url: 'http://localhost:4000/api/v1/docs?workspaceId=__healthcheck__',
    expectStatus: 401,
    expectEnvelope: false,
  },
  {
    name: 'AI Service',
    url: 'http://localhost:8000/health',
    optional: true,
  },
];

function isValidHealthEnvelope(payload) {
  // Supports either:
  // - apiSuccess envelope: { success, data: { status }, meta: { timestamp } }
  // - raw health DTO (current API /health): { status, service, version, uptime, dependencies }
  if (!payload || typeof payload !== 'object') return false;

  if (
    typeof payload.success === 'boolean' &&
    payload.data &&
    typeof payload.data === 'object' &&
    typeof payload.data.status === 'string'
  ) {
    return true;
  }

  return (
    typeof payload.status === 'string' &&
    typeof payload.service === 'string' &&
    typeof payload.version === 'string'
  );
}

async function run() {
  let hasError = false;

  for (const check of checks) {
    try {
      const response = await globalThis.fetch(check.url);
      const body = await response.text();

      if (typeof check.expectStatus === 'number') {
        if (response.status !== check.expectStatus) {
          hasError = true;
          console.error(
            `✗ ${check.name} expected ${check.expectStatus} but got ${response.status} -> ${body}`,
          );
          continue;
        }

        console.log(`✓ ${check.name} ok (${response.status})`);
        continue;
      }

      let parsed;

      try {
        parsed = JSON.parse(body);
      } catch {
        hasError = true;
        console.error(`✗ ${check.name} returned non-JSON payload -> ${body}`);
        continue;
      }

      if (!response.ok) {
        hasError = true;
        console.error(`✗ ${check.name} failed (${response.status}) -> ${body}`);
        continue;
      }

      if (!isValidHealthEnvelope(parsed)) {
        hasError = true;
        console.error(`✗ ${check.name} invalid health envelope -> ${body}`);
        continue;
      }

      if (typeof parsed.success === 'boolean') {
        if (!parsed.success || parsed.data.status !== 'ok') {
          hasError = true;
          console.error(`✗ ${check.name} unhealthy -> ${body}`);
          continue;
        }
      } else if (parsed.status !== 'ok') {
        hasError = true;
        console.error(`✗ ${check.name} unhealthy -> ${body}`);
        continue;
      }

      console.log(`✓ ${check.name} ok (${response.status}) -> ${body}`);
    } catch (error) {
      if (check.optional) {
        console.warn(`! ${check.name} unreachable (optional) -> ${error.message}`);
      } else {
        hasError = true;
        console.error(`✗ ${check.name} unreachable -> ${error.message}`);
      }
    }
  }

  if (hasError) {
    process.exit(1);
  }
}

run();
