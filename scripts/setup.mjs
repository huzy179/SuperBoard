import { existsSync, copyFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

function parseVersion(version) {
  return version
    .replace(/^v/, '')
    .split('.')
    .map((part) => Number(part));
}

function compareVersions(left, right) {
  const maxLength = Math.max(left.length, right.length);

  for (let index = 0; index < maxLength; index += 1) {
    const l = left[index] ?? 0;
    const r = right[index] ?? 0;

    if (l > r) return 1;
    if (l < r) return -1;
  }

  return 0;
}

function checkCommand(command, args = ['--version']) {
  const result = spawnSync(command, args, { encoding: 'utf8' });
  return result.status === 0;
}

function ensureEnvFile(examplePath, localPath) {
  if (existsSync(localPath)) {
    console.log(`• Exists: ${localPath}`);
    return;
  }

  copyFileSync(examplePath, localPath);
  console.log(`✓ Created: ${localPath}`);
}

function run() {
  const requiredNode = parseVersion('20.11.0');
  const currentNode = parseVersion(process.version);

  if (compareVersions(currentNode, requiredNode) < 0) {
    console.error(`✗ Node.js ${process.version} is too old. Required >= v20.11.0`);
    process.exit(1);
  }
  console.log(`✓ Node.js ${process.version}`);

  if (!checkCommand('python3')) {
    console.error('✗ python3 is not available. Please install Python 3.9+');
    process.exit(1);
  }
  console.log('✓ python3 available');

  if (!checkCommand('docker')) {
    console.error('✗ docker is not available. Please install Docker Desktop');
    process.exit(1);
  }
  console.log('✓ docker available');

  if (!checkCommand('docker', ['compose', 'version'])) {
    console.error('✗ docker compose is not available. Please enable Docker Compose v2');
    process.exit(1);
  }
  console.log('✓ docker compose available');

  const root = process.cwd();
  ensureEnvFile(resolve(root, 'apps/api/.env.example'), resolve(root, 'apps/api/.env.local'));
  ensureEnvFile(resolve(root, 'apps/web/.env.example'), resolve(root, 'apps/web/.env.local'));
  ensureEnvFile(
    resolve(root, 'apps/ai-service/.env.example'),
    resolve(root, 'apps/ai-service/.env.local'),
  );

  console.log('\nSetup complete. Next steps:');
  console.log('1) npm run dev:infra');
  console.log('2) npm run dev');
  console.log('3) npm run health:check');
}

run();
