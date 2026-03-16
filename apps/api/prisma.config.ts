import path from 'node:path';
import { existsSync } from 'node:fs';
import { defineConfig } from 'prisma/config';
import { config as dotenv } from 'dotenv';

// Load .env.local so migrate commands pick up DATABASE_URL without needing to
// export it manually. Falls back to .env.example if .env.local is absent.
const dir = __dirname;
const envLocal = path.join(dir, '.env.local');
const envExample = path.join(dir, '.env.example');

if (existsSync(envLocal)) {
  dotenv({ path: envLocal });
} else if (existsSync(envExample)) {
  dotenv({ path: envExample });
}

const DATABASE_URL =
  process.env['DATABASE_URL'] ?? 'postgresql://dev:devpassword@localhost:5433/superboard';

export default defineConfig({
  schema: path.join(dir, 'prisma/schema.prisma'),
  migrations: {
    seed: 'ts-node prisma/seed.ts',
  },
  datasource: {
    url: DATABASE_URL,
  },
});
