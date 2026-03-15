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

async function run() {
    let hasError = false;

    for (const check of checks) {
        try {
            const response = await fetch(check.url);
            const body = await response.text();

            if (!response.ok) {
                hasError = true;
                console.error(`✗ ${check.name} failed (${response.status}) -> ${body}`);
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
