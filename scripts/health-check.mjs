const checks = [
  {
    name: 'API',
    url: 'http://localhost:4000/api/v1/health',
  },
  {
    name: 'AI Service',
    url: 'http://localhost:8000/health',
  },
];

function isValidHealthEnvelope(payload) {
  return (
    payload &&
    typeof payload === 'object' &&
    typeof payload.success === 'boolean' &&
    payload.data &&
    typeof payload.data === 'object' &&
    typeof payload.data.status === 'string' &&
    payload.meta &&
    typeof payload.meta === 'object' &&
    typeof payload.meta.timestamp === 'string'
  );
}

async function run() {
  let hasError = false;

  for (const check of checks) {
    try {
      const response = await globalThis.fetch(check.url);
      const body = await response.text();
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

      if (!parsed.success || parsed.data.status !== 'ok') {
        hasError = true;
        console.error(`✗ ${check.name} unhealthy -> ${body}`);
        continue;
      }

      console.log(`✓ ${check.name} ok (${response.status}) -> ${body}`);
    } catch (error) {
      hasError = true;
      console.error(`✗ ${check.name} unreachable -> ${error.message}`);
    }
  }

  if (hasError) {
    process.exit(1);
  }
}

run();
