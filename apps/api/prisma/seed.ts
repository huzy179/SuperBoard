import path from 'node:path';
import { existsSync } from 'node:fs';
import { randomBytes, scryptSync } from 'node:crypto';
import { config as dotenv } from 'dotenv';
import { PrismaPg } from '@prisma/adapter-pg';
import {
  PrismaClient,
  TaskPriority,
  TaskStatus,
  TaskEventType,
  WorkspaceMemberRole,
  WorkspacePlan,
} from '@prisma/client';

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

function hashPassword(rawPassword: string): string {
  const normalized = rawPassword.normalize('NFKC');
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(normalized, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

async function main() {
  console.log('🌱 Seeding database...');
  const defaultPassword = 'Passw0rd!';

  // Upsert workspace so seed is idempotent
  const workspace = await prisma.workspace.upsert({
    where: { slug: 'acme-corp' },
    update: {
      plan: WorkspacePlan.free,
    },
    create: {
      name: 'Acme Corp',
      slug: 'acme-corp',
      plan: WorkspacePlan.free,
    },
  });
  console.log(`  ✓ Workspace: ${workspace.name}`);

  const permissionKeys = [
    'workspace.read',
    'workspace.manage',
    'project.read',
    'project.write',
    'task.read',
    'task.write',
    'task.comment',
    'task.assign',
  ];

  for (const permissionKey of permissionKeys) {
    await prisma.permission.upsert({
      where: { key: permissionKey },
      update: {},
      create: {
        key: permissionKey,
        description: `Permission: ${permissionKey}`,
      },
    });
  }
  console.log(`  ✓ Permissions: ${permissionKeys.length}`);

  const roleSpecs = [
    {
      key: 'workspace-owner',
      name: 'Workspace Owner',
      permissionKeys,
    },
    {
      key: 'workspace-admin',
      name: 'Workspace Admin',
      permissionKeys: permissionKeys.filter((key) => key !== 'workspace.manage'),
    },
    {
      key: 'workspace-member',
      name: 'Workspace Member',
      permissionKeys: [
        'workspace.read',
        'project.read',
        'project.write',
        'task.read',
        'task.write',
        'task.comment',
      ],
    },
    {
      key: 'workspace-viewer',
      name: 'Workspace Viewer',
      permissionKeys: ['workspace.read', 'project.read', 'task.read'],
    },
  ] as const;

  for (const spec of roleSpecs) {
    const role = await prisma.role.upsert({
      where: { key: spec.key },
      update: { name: spec.name },
      create: {
        key: spec.key,
        name: spec.name,
        isSystem: true,
      },
    });

    for (const permissionKey of spec.permissionKeys) {
      const permission = await prisma.permission.findUniqueOrThrow({
        where: { key: permissionKey },
      });

      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: role.id,
            permissionId: permission.id,
          },
        },
        update: {},
        create: {
          roleId: role.id,
          permissionId: permission.id,
        },
      });
    }
  }
  console.log(`  ✓ Roles: ${roleSpecs.length}`);

  const owner = await prisma.user.upsert({
    where: { email: 'owner@acme.local' },
    update: {
      passwordHash: hashPassword(defaultPassword),
      fullName: 'Alice Owner',
      isActive: true,
      defaultWorkspaceId: workspace.id,
    },
    create: {
      email: 'owner@acme.local',
      passwordHash: hashPassword(defaultPassword),
      fullName: 'Alice Owner',
      isActive: true,
      defaultWorkspaceId: workspace.id,
    },
  });
  console.log(`  ✓ User: ${owner.fullName}`);

  const member = await prisma.user.upsert({
    where: { email: 'member@acme.local' },
    update: {
      passwordHash: hashPassword(defaultPassword),
      fullName: 'Bob Member',
      isActive: true,
      defaultWorkspaceId: workspace.id,
    },
    create: {
      email: 'member@acme.local',
      passwordHash: hashPassword(defaultPassword),
      fullName: 'Bob Member',
      isActive: true,
      defaultWorkspaceId: workspace.id,
    },
  });
  console.log(`  ✓ User: ${member.fullName}`);

  await prisma.workspaceMember.upsert({
    where: {
      workspaceId_userId: {
        workspaceId: workspace.id,
        userId: owner.id,
      },
    },
    update: {
      role: WorkspaceMemberRole.owner,
    },
    create: {
      workspaceId: workspace.id,
      userId: owner.id,
      role: WorkspaceMemberRole.owner,
    },
  });

  await prisma.workspaceMember.upsert({
    where: {
      workspaceId_userId: {
        workspaceId: workspace.id,
        userId: member.id,
      },
    },
    update: {
      role: WorkspaceMemberRole.member,
    },
    create: {
      workspaceId: workspace.id,
      userId: member.id,
      role: WorkspaceMemberRole.member,
    },
  });
  console.log('  ✓ Workspace members: owner + member');

  const ownerRole = await prisma.role.findUniqueOrThrow({ where: { key: 'workspace-owner' } });
  const memberRole = await prisma.role.findUniqueOrThrow({ where: { key: 'workspace-member' } });

  await prisma.userRole.upsert({
    where: {
      userId_roleId_workspaceId: {
        userId: owner.id,
        roleId: ownerRole.id,
        workspaceId: workspace.id,
      },
    },
    update: {},
    create: {
      userId: owner.id,
      roleId: ownerRole.id,
      workspaceId: workspace.id,
    },
  });

  await prisma.userRole.upsert({
    where: {
      userId_roleId_workspaceId: {
        userId: member.id,
        roleId: memberRole.id,
        workspaceId: workspace.id,
      },
    },
    update: {},
    create: {
      userId: member.id,
      roleId: memberRole.id,
      workspaceId: workspace.id,
    },
  });
  console.log('  ✓ User role assignments');

  const project = await prisma.project.upsert({
    where: { id: 'seed-project-1' },
    update: {
      name: 'SuperBoard MVP',
      description: 'MVP implementation board',
      color: '#2563eb',
      icon: 'rocket',
      isArchived: false,
    },
    create: {
      id: 'seed-project-1',
      name: 'SuperBoard MVP',
      description: 'MVP implementation board',
      color: '#2563eb',
      icon: 'rocket',
      workspaceId: workspace.id,
    },
  });
  console.log(`  ✓ Project: ${project.name}`);

  const taskSamples: Array<{
    title: string;
    description: string;
    status: TaskStatus;
    priority: TaskPriority;
    position: string;
  }> = [
    {
      title: 'Set up monorepo',
      description: 'Turborepo + workspaces',
      status: TaskStatus.done,
      priority: TaskPriority.medium,
      position: '1000',
    },
    {
      title: 'Configure Docker Compose',
      description: 'Postgres, Redis, MinIO, Keycloak',
      status: TaskStatus.done,
      priority: TaskPriority.high,
      position: '2000',
    },
    {
      title: 'Implement Auth module',
      description: 'JWT local login + IAM foundation',
      status: TaskStatus.in_progress,
      priority: TaskPriority.urgent,
      position: '3000',
    },
    {
      title: 'Build Task CRUD API',
      description: 'REST + WebSocket events',
      status: TaskStatus.todo,
      priority: TaskPriority.high,
      position: '4000',
    },
    {
      title: 'Integrate Elasticsearch',
      description: 'Full-text search for tasks',
      status: TaskStatus.todo,
      priority: TaskPriority.low,
      position: '5000',
    },
  ];

  const seededTaskIds: string[] = [];
  for (const sample of taskSamples) {
    const task = await prisma.task.upsert({
      where: {
        id: `seed-task-${sample.title.toLowerCase().replace(/\s+/g, '-')}`,
      },
      update: {
        title: sample.title,
        description: sample.description,
        status: sample.status,
        priority: sample.priority,
        position: sample.position,
        assigneeId: sample.status !== TaskStatus.todo ? member.id : null,
      },
      create: {
        id: `seed-task-${sample.title.toLowerCase().replace(/\s+/g, '-')}`,
        title: sample.title,
        description: sample.description,
        status: sample.status,
        priority: sample.priority,
        position: sample.position,
        assigneeId: sample.status !== TaskStatus.todo ? member.id : null,
        projectId: project.id,
      },
    });

    seededTaskIds.push(task.id);

    await prisma.taskEvent.upsert({
      where: { id: `seed-event-created-${task.id}` },
      update: {},
      create: {
        id: `seed-event-created-${task.id}`,
        taskId: task.id,
        actorId: owner.id,
        type: TaskEventType.created,
        payload: { title: sample.title },
      },
    });
  }
  console.log(`  ✓ Tasks: ${taskSamples.length} samples seeded`);

  const commentTaskId = seededTaskIds[2] ?? seededTaskIds[0] ?? 'seed-task-implement-auth-module';

  await prisma.comment.upsert({
    where: { id: 'seed-comment-1' },
    update: {
      content: 'Bắt đầu từ login MVP, sau đó mở rộng sang Jira board.',
      taskId: commentTaskId,
    },
    create: {
      id: 'seed-comment-1',
      taskId: commentTaskId,
      authorId: owner.id,
      content: 'Bắt đầu từ login MVP, sau đó mở rộng sang Jira board.',
    },
  });

  console.log('  ✓ Comment sample seeded');
  console.log(
    '  ✓ Login credentials: owner@acme.local / Passw0rd! | member@acme.local / Passw0rd!',
  );

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
