import path from 'node:path';
import { existsSync } from 'node:fs';
import { config as dotenv } from 'dotenv';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient, UserRole, TaskStatus } from '@prisma/client';

// Ensure DATABASE_URL is populated before creating the client
const dir = path.join(__dirname, '..');
if (existsSync(path.join(dir, '.env.local'))) {
  dotenv({ path: path.join(dir, '.env.local') });
} else if (existsSync(path.join(dir, '.env.example'))) {
  dotenv({ path: path.join(dir, '.env.example') });
}

const adapter = new PrismaPg({
  connectionString:
    process.env['DATABASE_URL'] ?? 'postgresql://dev:devpassword@localhost:5433/superboard',
});
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Seeding database...');

  // Upsert workspace so seed is idempotent
  const workspace = await prisma.workspace.upsert({
    where: { slug: 'acme-corp' },
    update: {},
    create: {
      name: 'Acme Corp',
      slug: 'acme-corp',
    },
  });
  console.log(`  ✓ Workspace: ${workspace.name}`);

  const owner = await prisma.user.upsert({
    where: { email: 'owner@acme.local' },
    update: {},
    create: {
      email: 'owner@acme.local',
      fullName: 'Alice Owner',
      role: UserRole.owner,
      workspaceId: workspace.id,
    },
  });
  console.log(`  ✓ User: ${owner.fullName}`);

  const member = await prisma.user.upsert({
    where: { email: 'member@acme.local' },
    update: {},
    create: {
      email: 'member@acme.local',
      fullName: 'Bob Member',
      role: UserRole.member,
      workspaceId: workspace.id,
    },
  });
  console.log(`  ✓ User: ${member.fullName}`);

  const project = await prisma.project.upsert({
    where: { id: 'seed-project-1' },
    update: {},
    create: {
      id: 'seed-project-1',
      name: 'SuperBoard MVP',
      workspaceId: workspace.id,
    },
  });
  console.log(`  ✓ Project: ${project.name}`);

  const taskSamples: Array<{ title: string; description: string; status: TaskStatus }> = [
    { title: 'Set up monorepo', description: 'Turborepo + workspaces', status: TaskStatus.done },
    {
      title: 'Configure Docker Compose',
      description: 'Postgres, Redis, MinIO, Keycloak',
      status: TaskStatus.done,
    },
    {
      title: 'Implement Auth module',
      description: 'JWT + Keycloak integration',
      status: TaskStatus.in_progress,
    },
    {
      title: 'Build Task CRUD API',
      description: 'REST + WebSocket events',
      status: TaskStatus.todo,
    },
    {
      title: 'Integrate Elasticsearch',
      description: 'Full-text search for tasks',
      status: TaskStatus.todo,
    },
  ];

  for (const sample of taskSamples) {
    await prisma.task.upsert({
      where: {
        id: `seed-task-${sample.title.toLowerCase().replace(/\s+/g, '-')}`,
      },
      update: {},
      create: {
        id: `seed-task-${sample.title.toLowerCase().replace(/\s+/g, '-')}`,
        title: sample.title,
        description: sample.description,
        status: sample.status,
        assigneeId: sample.status !== TaskStatus.todo ? member.id : null,
        projectId: project.id,
      },
    });
  }
  console.log(`  ✓ Tasks: ${taskSamples.length} samples seeded`);

  console.log('✅ Seed complete');
}

main()
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exit(1);
  })
  .finally(() => {
    void prisma.$disconnect();
  });
