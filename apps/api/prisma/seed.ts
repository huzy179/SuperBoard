import path from 'node:path';
import { existsSync } from 'node:fs';
import { randomBytes, scryptSync } from 'node:crypto';
import { config as dotenv } from 'dotenv';
import { PrismaPg } from '@prisma/adapter-pg';
import {
  ChannelType,
  IntegrationProvider,
  PrismaClient,
  TaskEventType,
  TaskLinkType,
  TaskPriority,
  TaskType,
  WorkflowStatusCategory,
  WorkspaceInvitationStatus,
  WorkspaceMemberRole,
  WorkspacePlan,
} from '@prisma/client';

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

const WORKSPACE = {
  slug: 'techviet',
  name: 'TechViet Solutions',
  plan: WorkspacePlan.pro,
};

const WORKSPACE_STATUSES = [
  { key: 'todo', name: 'Cần làm', category: WorkflowStatusCategory.todo, position: 1 },
  {
    key: 'in_progress',
    name: 'Đang thực hiện',
    category: WorkflowStatusCategory.in_progress,
    position: 2,
  },
  {
    key: 'in_review',
    name: 'Đang review',
    category: WorkflowStatusCategory.in_review,
    position: 3,
  },
  { key: 'blocked', name: 'Bị chặn', category: WorkflowStatusCategory.blocked, position: 4 },
  { key: 'done', name: 'Hoàn thành', category: WorkflowStatusCategory.done, position: 5 },
] as const;

const WORKSPACE_TRANSITIONS = [
  ['todo', 'in_progress'],
  ['in_progress', 'in_review'],
  ['in_progress', 'blocked'],
  ['blocked', 'in_progress'],
  ['in_review', 'done'],
  ['in_review', 'in_progress'],
  ['todo', 'done'],
] as const;

const USER_SPECS = [
  {
    email: 'nguyen.minh.tuan@techviet.local',
    fullName: 'Nguyễn Minh Tuấn',
    wsRole: WorkspaceMemberRole.owner,
    roleKey: 'workspace-owner',
    avatarColor: '#2563eb',
  },
  {
    email: 'tran.thi.lan@techviet.local',
    fullName: 'Trần Thị Lan',
    wsRole: WorkspaceMemberRole.admin,
    roleKey: 'workspace-admin',
    avatarColor: '#059669',
  },
  {
    email: 'le.van.duc@techviet.local',
    fullName: 'Lê Văn Đức',
    wsRole: WorkspaceMemberRole.member,
    roleKey: 'workspace-member',
    avatarColor: '#7c3aed',
  },
  {
    email: 'pham.ngoc.anh@techviet.local',
    fullName: 'Phạm Ngọc Anh',
    wsRole: WorkspaceMemberRole.member,
    roleKey: 'workspace-member',
    avatarColor: '#dc2626',
  },
  {
    email: 'hoang.quoc.bao@techviet.local',
    fullName: 'Hoàng Quốc Bảo',
    wsRole: WorkspaceMemberRole.member,
    roleKey: 'workspace-member',
    avatarColor: '#d97706',
  },
  {
    email: 'vo.thi.mai@techviet.local',
    fullName: 'Võ Thị Mai',
    wsRole: WorkspaceMemberRole.member,
    roleKey: 'workspace-member',
    avatarColor: '#db2777',
  },
] as const;

const PROJECT_SPECS = [
  {
    id: 'seed-project-ecom',
    name: 'Nền tảng Thương mại Điện tử',
    description: 'Omnichannel commerce: web, mobile và social storefront.',
    color: '#2563eb',
    icon: '🛒',
    key: 'ECOM',
  },
  {
    id: 'seed-project-banking',
    name: 'Ứng dụng Mobile Banking',
    description: 'Ứng dụng ngân hàng số tập trung vào giao dịch real-time và bảo mật.',
    color: '#059669',
    icon: '🏦',
    key: 'BANK',
  },
  {
    id: 'seed-project-hr',
    name: 'Cổng thông tin Nhân sự',
    description: 'Quản trị vòng đời nhân sự từ onboarding tới payroll.',
    color: '#7c3aed',
    icon: '👥',
    key: 'HR',
  },
  {
    id: 'seed-project-infra',
    name: 'Hạ tầng & DevOps',
    description: 'Platform engineering: CI/CD, observability, reliability.',
    color: '#dc2626',
    icon: '⚙️',
    key: 'INFRA',
  },
] as const;

type TaskSeed = {
  id: string;
  projectId: string;
  number: number;
  title: string;
  description: string;
  type: TaskType;
  priority: TaskPriority;
  status: string;
  storyPoints: number;
  assigneeEmail: string | null;
  dueDate: string | null;
  position: string;
  parentTaskId?: string;
};

const TASKS: TaskSeed[] = [
  {
    id: 'seed-task-ecom-1',
    projectId: 'seed-project-ecom',
    number: 1,
    title: 'Thiết kế schema sản phẩm và tồn kho',
    description: 'Bao gồm biến thể, kho theo vùng và lịch sử giá.',
    type: TaskType.story,
    priority: TaskPriority.high,
    status: 'done',
    storyPoints: 8,
    assigneeEmail: 'le.van.duc@techviet.local',
    dueDate: '2026-03-02',
    position: '1000',
  },
  {
    id: 'seed-task-ecom-2',
    projectId: 'seed-project-ecom',
    number: 2,
    title: 'Triển khai checkout flow với VNPay + MoMo',
    description: 'Xử lý callback, idempotency key và retry payment.',
    type: TaskType.epic,
    priority: TaskPriority.urgent,
    status: 'in_progress',
    storyPoints: 13,
    assigneeEmail: 'pham.ngoc.anh@techviet.local',
    dueDate: '2026-04-28',
    position: '2000',
  },
  {
    id: 'seed-task-ecom-3',
    projectId: 'seed-project-ecom',
    number: 3,
    title: 'Subtask: OTP xác nhận thanh toán',
    description: 'Bổ sung lớp xác thực rủi ro cao cho giao dịch > 5 triệu.',
    type: TaskType.task,
    priority: TaskPriority.medium,
    status: 'in_review',
    storyPoints: 5,
    assigneeEmail: 'tran.thi.lan@techviet.local',
    dueDate: '2026-04-20',
    position: '2100',
    parentTaskId: 'seed-task-ecom-2',
  },
  {
    id: 'seed-task-bank-1',
    projectId: 'seed-project-banking',
    number: 1,
    title: 'Thiết kế bounded context cho account/transaction',
    description: 'Tách service theo domain và chuẩn hóa event contract.',
    type: TaskType.epic,
    priority: TaskPriority.urgent,
    status: 'done',
    storyPoints: 13,
    assigneeEmail: 'nguyen.minh.tuan@techviet.local',
    dueDate: '2026-02-10',
    position: '1000',
  },
  {
    id: 'seed-task-bank-2',
    projectId: 'seed-project-banking',
    number: 2,
    title: 'Triển khai anti-fraud rule engine',
    description: 'Rule velocity, device fingerprint, geo anomalies.',
    type: TaskType.story,
    priority: TaskPriority.high,
    status: 'in_progress',
    storyPoints: 8,
    assigneeEmail: 'hoang.quoc.bao@techviet.local',
    dueDate: '2026-05-01',
    position: '2000',
  },
  {
    id: 'seed-task-bank-3',
    projectId: 'seed-project-banking',
    number: 3,
    title: 'Viết test bảo mật cho OTP endpoint',
    description: 'Bao phủ rate limit, brute force và replay attack.',
    type: TaskType.bug,
    priority: TaskPriority.high,
    status: 'todo',
    storyPoints: 5,
    assigneeEmail: 'vo.thi.mai@techviet.local',
    dueDate: '2026-05-06',
    position: '3000',
  },
  {
    id: 'seed-task-hr-1',
    projectId: 'seed-project-hr',
    number: 1,
    title: 'Thiết kế chính sách chấm công đa ca',
    description: 'Bao gồm ca đêm, split shift và quy tắc tăng ca.',
    type: TaskType.story,
    priority: TaskPriority.high,
    status: 'in_progress',
    storyPoints: 8,
    assigneeEmail: 'hoang.quoc.bao@techviet.local',
    dueDate: '2026-04-30',
    position: '1000',
  },
  {
    id: 'seed-task-hr-2',
    projectId: 'seed-project-hr',
    number: 2,
    title: 'Xây dựng module duyệt nghỉ phép',
    description: '2 bước duyệt: quản lý trực tiếp và HRBP.',
    type: TaskType.task,
    priority: TaskPriority.medium,
    status: 'todo',
    storyPoints: 5,
    assigneeEmail: 'pham.ngoc.anh@techviet.local',
    dueDate: '2026-05-08',
    position: '2000',
  },
  {
    id: 'seed-task-infra-1',
    projectId: 'seed-project-infra',
    number: 1,
    title: 'Xây dựng golden path CI/CD cho monorepo',
    description: 'Build matrix cho api/web/service với quality gates.',
    type: TaskType.story,
    priority: TaskPriority.high,
    status: 'done',
    storyPoints: 8,
    assigneeEmail: 'nguyen.minh.tuan@techviet.local',
    dueDate: '2026-03-15',
    position: '1000',
  },
  {
    id: 'seed-task-infra-2',
    projectId: 'seed-project-infra',
    number: 2,
    title: 'Thiết lập SLO và alert latency p95',
    description: 'Định nghĩa SLI/SLO cho API critical path và paging policy.',
    type: TaskType.task,
    priority: TaskPriority.high,
    status: 'in_review',
    storyPoints: 5,
    assigneeEmail: 'hoang.quoc.bao@techviet.local',
    dueDate: '2026-04-29',
    position: '2000',
  },
  {
    id: 'seed-task-infra-3',
    projectId: 'seed-project-infra',
    number: 3,
    title: 'Fix memory leak ở worker xử lý queue',
    description: 'Phân tích heap snapshot, giảm object retention.',
    type: TaskType.bug,
    priority: TaskPriority.urgent,
    status: 'blocked',
    storyPoints: 8,
    assigneeEmail: 'le.van.duc@techviet.local',
    dueDate: '2026-04-26',
    position: '3000',
  },
];

const LABELS = [
  { id: 'seed-label-backend', name: 'Backend', color: '#2563eb' },
  { id: 'seed-label-frontend', name: 'Frontend', color: '#db2777' },
  { id: 'seed-label-security', name: 'Bảo mật', color: '#dc2626' },
  { id: 'seed-label-devops', name: 'DevOps', color: '#d97706' },
  { id: 'seed-label-qa', name: 'Kiểm thử', color: '#059669' },
  { id: 'seed-label-product', name: 'Sản phẩm', color: '#7c3aed' },
] as const;

const TASK_LABELS = [
  ['seed-task-ecom-2', 'seed-label-backend'],
  ['seed-task-ecom-2', 'seed-label-product'],
  ['seed-task-ecom-3', 'seed-label-security'],
  ['seed-task-bank-2', 'seed-label-security'],
  ['seed-task-bank-3', 'seed-label-qa'],
  ['seed-task-hr-2', 'seed-label-product'],
  ['seed-task-infra-1', 'seed-label-devops'],
  ['seed-task-infra-2', 'seed-label-devops'],
  ['seed-task-infra-3', 'seed-label-backend'],
] as const;

const COMMENTS = [
  {
    id: 'seed-cmt-1',
    taskId: 'seed-task-ecom-2',
    authorEmail: 'pham.ngoc.anh@techviet.local',
    content: 'Đã xong happy path checkout, còn xử lý timeout ở callback.',
  },
  {
    id: 'seed-cmt-2',
    taskId: 'seed-task-bank-2',
    authorEmail: 'hoang.quoc.bao@techviet.local',
    content: 'Rule velocity theo device hoạt động ổn, cần tune false positive thêm.',
  },
  {
    id: 'seed-cmt-3',
    taskId: 'seed-task-infra-3',
    authorEmail: 'le.van.duc@techviet.local',
    content: 'Leak xảy ra khi worker nhận batch > 100 events. Đang bóc tách root cause.',
  },
] as const;

const availableTables = new Set<string>();

async function refreshAvailableTables() {
  const rows = await prisma.$queryRaw<Array<{ table_name: string }>>`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
  `;

  availableTables.clear();
  for (const row of rows) {
    availableTables.add(row.table_name);
    availableTables.add(row.table_name.toLowerCase());
  }
}

function hasTable(tableName: string): boolean {
  return availableTables.has(tableName) || availableTables.has(tableName.toLowerCase());
}

async function cleanupSeedData() {
  if (hasTable('TaskLabel')) {
    await prisma.taskLabel.deleteMany({ where: { taskId: { startsWith: 'seed-task-' } } });
  }
  if (hasTable('TaskLink')) {
    await prisma.taskLink.deleteMany({
      where: {
        OR: [
          { sourceTaskId: { startsWith: 'seed-task-' } },
          { targetTaskId: { startsWith: 'seed-task-' } },
        ],
      },
    });
  }
  if (hasTable('TaskDocLink')) {
    await prisma.taskDocLink.deleteMany({
      where: {
        OR: [{ taskId: { startsWith: 'seed-task-' } }, { docId: { startsWith: 'seed-doc-' } }],
      },
    });
  }
  if (hasTable('DocVersion')) {
    await prisma.docVersion.deleteMany({ where: { docId: { startsWith: 'seed-doc-' } } });
  }
  if (hasTable('Comment')) {
    await prisma.comment.deleteMany({ where: { id: { startsWith: 'seed-cmt-' } } });
  }
  if (hasTable('TaskEvent')) {
    await prisma.taskEvent.deleteMany({ where: { id: { startsWith: 'seed-evt-' } } });
  }
  if (hasTable('MessageReaction')) {
    await prisma.messageReaction.deleteMany({ where: { messageId: { startsWith: 'seed-msg-' } } });
  }
  if (hasTable('Message')) {
    await prisma.message.deleteMany({ where: { id: { startsWith: 'seed-msg-' } } });
  }
  if (hasTable('ChannelMember')) {
    await prisma.channelMember.deleteMany({ where: { channelId: { startsWith: 'seed-chan-' } } });
  }
  if (hasTable('Notification')) {
    await prisma.notification.deleteMany({ where: { id: { startsWith: 'seed-noti-' } } });
  }
  if (hasTable('WorkspaceInvitation')) {
    await prisma.workspaceInvitation.deleteMany({ where: { id: { startsWith: 'seed-invite-' } } });
  }
  if (hasTable('AuditLog')) {
    await prisma.auditLog.deleteMany({ where: { id: { startsWith: 'seed-audit-' } } });
  }
  if (hasTable('WorkflowRule')) {
    await prisma.workflowRule.deleteMany({ where: { id: { startsWith: 'seed-rule-' } } });
  }
  if (hasTable('AgentAction')) {
    await prisma.agentAction.deleteMany({ where: { id: { startsWith: 'seed-agent-' } } });
  }
  if (hasTable('SignalLog')) {
    await prisma.signalLog.deleteMany({ where: { id: { startsWith: 'seed-signal-' } } });
  }
  if (hasTable('ExternalIntegration')) {
    await prisma.externalIntegration.deleteMany({ where: { id: { startsWith: 'seed-int-' } } });
  }
  if (hasTable('Doc')) {
    await prisma.doc.deleteMany({ where: { id: { startsWith: 'seed-doc-' } } });
  }
  if (hasTable('Channel')) {
    await prisma.channel.deleteMany({ where: { id: { startsWith: 'seed-chan-' } } });
  }
  if (hasTable('Task')) {
    await prisma.task.deleteMany({ where: { id: { startsWith: 'seed-task-' } } });
  }
  if (hasTable('ProjectWorkflowTransition')) {
    await prisma.projectWorkflowTransition.deleteMany({
      where: { id: { startsWith: 'seed-pwt-' } },
    });
  }
  if (hasTable('ProjectWorkflowStatus')) {
    await prisma.projectWorkflowStatus.deleteMany({ where: { id: { startsWith: 'seed-pws-' } } });
  }
  if (hasTable('Project')) {
    await prisma.project.deleteMany({ where: { id: { startsWith: 'seed-project-' } } });
  }
  if (hasTable('Label')) {
    await prisma.label.deleteMany({ where: { id: { startsWith: 'seed-label-' } } });
  }
  if (hasTable('WorkspaceWorkflowTransition')) {
    await prisma.workspaceWorkflowTransition.deleteMany({
      where: { id: { startsWith: 'seed-wwt-' } },
    });
  }
  if (hasTable('WorkspaceWorkflowStatus')) {
    await prisma.workspaceWorkflowStatus.deleteMany({ where: { id: { startsWith: 'seed-wws-' } } });
  }
}

async function main() {
  console.log('🌱 Seeding database...');
  const defaultPassword = 'Passw0rd!';

  await refreshAvailableTables();
  await cleanupSeedData();

  const workspace = await prisma.workspace.upsert({
    where: { slug: WORKSPACE.slug },
    update: { name: WORKSPACE.name, plan: WORKSPACE.plan },
    create: { slug: WORKSPACE.slug, name: WORKSPACE.name, plan: WORKSPACE.plan },
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
    'docs.read',
    'docs.write',
    'channel.read',
    'channel.write',
  ];

  for (const key of permissionKeys) {
    await prisma.permission.upsert({
      where: { key },
      update: {},
      create: { key, description: `Permission: ${key}` },
    });
  }

  const roleSpecs = [
    { key: 'workspace-owner', name: 'Workspace Owner', perms: permissionKeys },
    {
      key: 'workspace-admin',
      name: 'Workspace Admin',
      perms: permissionKeys.filter((k) => k !== 'workspace.manage'),
    },
    {
      key: 'workspace-member',
      name: 'Workspace Member',
      perms: [
        'workspace.read',
        'project.read',
        'project.write',
        'task.read',
        'task.write',
        'task.comment',
        'docs.read',
        'docs.write',
        'channel.read',
        'channel.write',
      ],
    },
    {
      key: 'workspace-viewer',
      name: 'Workspace Viewer',
      perms: ['workspace.read', 'project.read', 'task.read', 'docs.read', 'channel.read'],
    },
  ] as const;

  for (const roleSpec of roleSpecs) {
    const role = await prisma.role.upsert({
      where: { key: roleSpec.key },
      update: { name: roleSpec.name },
      create: { key: roleSpec.key, name: roleSpec.name, isSystem: true },
    });

    for (const permKey of roleSpec.perms) {
      const permission = await prisma.permission.findUniqueOrThrow({ where: { key: permKey } });
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: role.id, permissionId: permission.id } },
        update: {},
        create: { roleId: role.id, permissionId: permission.id },
      });
    }
  }
  console.log(`  ✓ Permission/Role: ${permissionKeys.length}/${roleSpecs.length}`);

  const usersByEmail = new Map<string, { id: string; fullName: string }>();
  for (const spec of USER_SPECS) {
    const user = await prisma.user.upsert({
      where: { email: spec.email },
      update: {
        passwordHash: hashPassword(defaultPassword),
        fullName: spec.fullName,
        avatarColor: spec.avatarColor,
        isActive: true,
        defaultWorkspaceId: workspace.id,
      },
      create: {
        email: spec.email,
        passwordHash: hashPassword(defaultPassword),
        fullName: spec.fullName,
        avatarColor: spec.avatarColor,
        isActive: true,
        defaultWorkspaceId: workspace.id,
      },
    });
    usersByEmail.set(spec.email, { id: user.id, fullName: user.fullName });

    await prisma.workspaceMember.upsert({
      where: { workspaceId_userId: { workspaceId: workspace.id, userId: user.id } },
      update: { role: spec.wsRole },
      create: { workspaceId: workspace.id, userId: user.id, role: spec.wsRole },
    });

    const role = await prisma.role.findUniqueOrThrow({ where: { key: spec.roleKey } });
    await prisma.userRole.upsert({
      where: {
        userId_roleId_workspaceId: { userId: user.id, roleId: role.id, workspaceId: workspace.id },
      },
      update: {},
      create: { userId: user.id, roleId: role.id, workspaceId: workspace.id },
    });

    await prisma.notificationPreference.upsert({
      where: { userId: user.id },
      update: {
        emailEnabled: true,
        inAppEnabled: true,
        taskAssignedEmail: true,
        workspaceInviteEmail: true,
        commentMentionEmail: true,
        commentMentionInApp: true,
      },
      create: {
        userId: user.id,
        emailEnabled: true,
        inAppEnabled: true,
        taskAssignedEmail: true,
        workspaceInviteEmail: true,
        commentMentionEmail: true,
        commentMentionInApp: true,
      },
    });
  }
  console.log(`  ✓ Users: ${usersByEmail.size}`);

  const hasWorkspaceWorkflow =
    hasTable('WorkspaceWorkflowStatus') && hasTable('WorkspaceWorkflowTransition');
  if (hasWorkspaceWorkflow) {
    const workspaceStatusIds = new Map<string, string>();
    for (const status of WORKSPACE_STATUSES) {
      const wsStatus = await prisma.workspaceWorkflowStatus.upsert({
        where: { workspaceId_key: { workspaceId: workspace.id, key: status.key } },
        update: { name: status.name, category: status.category, position: status.position },
        create: {
          id: `seed-wws-${status.key}`,
          workspaceId: workspace.id,
          key: status.key,
          name: status.name,
          category: status.category,
          position: status.position,
        },
      });
      workspaceStatusIds.set(status.key, wsStatus.id);
    }

    for (const [fromKey, toKey] of WORKSPACE_TRANSITIONS) {
      await prisma.workspaceWorkflowTransition.create({
        data: {
          id: `seed-wwt-${fromKey}-${toKey}`,
          workspaceId: workspace.id,
          fromStatusId: workspaceStatusIds.get(fromKey)!,
          toStatusId: workspaceStatusIds.get(toKey)!,
        },
      });
    }
    console.log(`  ✓ Workspace workflow: ${WORKSPACE_STATUSES.length} statuses`);
  } else {
    console.log('  - Skip workspace workflow seed (table not found)');
  }

  if (hasTable('Label')) {
    for (const label of LABELS) {
      await prisma.label.upsert({
        where: { id: label.id },
        update: { name: label.name, color: label.color },
        create: { id: label.id, name: label.name, color: label.color, workspaceId: workspace.id },
      });
    }
  }

  for (const spec of PROJECT_SPECS) {
    const project = await prisma.project.upsert({
      where: { id: spec.id },
      update: {
        name: spec.name,
        description: spec.description,
        color: spec.color,
        icon: spec.icon,
        key: spec.key,
      },
      create: {
        id: spec.id,
        workspaceId: workspace.id,
        name: spec.name,
        description: spec.description,
        color: spec.color,
        icon: spec.icon,
        key: spec.key,
      },
    });

    if (hasTable('ProjectWorkflowStatus')) {
      const statusMap = new Map<string, string>();
      for (const status of WORKSPACE_STATUSES) {
        const projectStatus = await prisma.projectWorkflowStatus.upsert({
          where: { projectId_key: { projectId: project.id, key: status.key } },
          update: { name: status.name, category: status.category, position: status.position },
          create: {
            id: `seed-pws-${project.id}-${status.key}`,
            projectId: project.id,
            key: status.key,
            name: status.name,
            category: status.category,
            position: status.position,
          },
        });
        statusMap.set(status.key, projectStatus.id);
      }

      if (hasTable('ProjectWorkflowTransition')) {
        for (const [fromKey, toKey] of WORKSPACE_TRANSITIONS) {
          await prisma.projectWorkflowTransition.create({
            data: {
              id: `seed-pwt-${project.id}-${fromKey}-${toKey}`,
              projectId: project.id,
              fromStatusId: statusMap.get(fromKey)!,
              toStatusId: statusMap.get(toKey)!,
            },
          });
        }
      }
    }
  }
  console.log(`  ✓ Projects: ${PROJECT_SPECS.length}`);

  for (const task of TASKS) {
    const assignee = task.assigneeEmail ? usersByEmail.get(task.assigneeEmail) : undefined;
    await prisma.task.upsert({
      where: { id: task.id },
      update: {
        title: task.title,
        description: task.description,
        type: task.type,
        priority: task.priority,
        status: task.status,
        storyPoints: task.storyPoints,
        number: task.number,
        position: task.position,
        assigneeId: assignee?.id ?? null,
        dueDate: task.dueDate ? new Date(task.dueDate) : null,
        parentTaskId: task.parentTaskId ?? null,
      },
      create: {
        id: task.id,
        projectId: task.projectId,
        title: task.title,
        description: task.description,
        type: task.type,
        priority: task.priority,
        status: task.status,
        storyPoints: task.storyPoints,
        number: task.number,
        position: task.position,
        assigneeId: assignee?.id,
        dueDate: task.dueDate ? new Date(task.dueDate) : null,
        parentTaskId: task.parentTaskId,
      },
    });

    if (hasTable('TaskEvent')) {
      const owner = usersByEmail.get('nguyen.minh.tuan@techviet.local');
      await prisma.taskEvent.upsert({
        where: { id: `seed-evt-created-${task.id}` },
        update: {},
        create: {
          id: `seed-evt-created-${task.id}`,
          taskId: task.id,
          actorId: owner?.id,
          type: TaskEventType.created,
          payload: { seeded: true },
        },
      });

      if (task.status !== 'todo') {
        await prisma.taskEvent.upsert({
          where: { id: `seed-evt-status-${task.id}` },
          update: {},
          create: {
            id: `seed-evt-status-${task.id}`,
            taskId: task.id,
            actorId: assignee?.id,
            type: TaskEventType.status_changed,
            payload: { from: 'todo', to: task.status },
          },
        });
      }
    }
  }

  if (hasTable('TaskLabel')) {
    for (const [taskId, labelId] of TASK_LABELS) {
      await prisma.taskLabel.create({ data: { taskId, labelId } });
    }
  }

  if (hasTable('TaskLink')) {
    await prisma.taskLink.createMany({
      data: [
        {
          sourceTaskId: 'seed-task-infra-1',
          targetTaskId: 'seed-task-bank-2',
          type: TaskLinkType.blocks,
        },
        {
          sourceTaskId: 'seed-task-ecom-2',
          targetTaskId: 'seed-task-ecom-3',
          type: TaskLinkType.relates_to,
        },
        {
          sourceTaskId: 'seed-task-bank-3',
          targetTaskId: 'seed-task-ecom-3',
          type: TaskLinkType.relates_to,
        },
      ],
    });
  }
  console.log(`  ✓ Tasks: ${TASKS.length}`);

  if (hasTable('Comment')) {
    for (const comment of COMMENTS) {
      const author = usersByEmail.get(comment.authorEmail);
      await prisma.comment.upsert({
        where: { id: comment.id },
        update: { content: comment.content, taskId: comment.taskId, authorId: author?.id },
        create: {
          id: comment.id,
          taskId: comment.taskId,
          authorId: author!.id,
          content: comment.content,
        },
      });
    }
  }

  const channels = [
    {
      id: 'seed-chan-general',
      name: 'general',
      description: 'Thông báo chung cho toàn bộ workspace',
      type: ChannelType.public,
    },
    {
      id: 'seed-chan-backend',
      name: 'backend-core',
      description: 'Kênh thảo luận API và kiến trúc hệ thống',
      type: ChannelType.public,
    },
    {
      id: 'seed-chan-incident',
      name: 'incident-war-room',
      description: 'Kênh xử lý sự cố P1/P2',
      type: ChannelType.private,
    },
  ] as const;

  if (hasTable('Channel')) {
    for (const channel of channels) {
      await prisma.channel.upsert({
        where: { id: channel.id },
        update: { name: channel.name, description: channel.description, type: channel.type },
        create: {
          id: channel.id,
          workspaceId: workspace.id,
          name: channel.name,
          description: channel.description,
          type: channel.type,
        },
      });
    }
  }

  if (hasTable('ChannelMember')) {
    for (const [email, user] of usersByEmail) {
      await prisma.channelMember.upsert({
        where: { channelId_userId: { channelId: 'seed-chan-general', userId: user.id } },
        update: {},
        create: { channelId: 'seed-chan-general', userId: user.id },
      });

      if (email !== 'vo.thi.mai@techviet.local') {
        await prisma.channelMember.upsert({
          where: { channelId_userId: { channelId: 'seed-chan-backend', userId: user.id } },
          update: {},
          create: { channelId: 'seed-chan-backend', userId: user.id },
        });
      }
    }
  }

  const tuan = usersByEmail.get('nguyen.minh.tuan@techviet.local')!;
  const duc = usersByEmail.get('le.van.duc@techviet.local')!;
  const bao = usersByEmail.get('hoang.quoc.bao@techviet.local')!;

  if (hasTable('Message')) {
    await prisma.message.upsert({
      where: { id: 'seed-msg-1' },
      update: { content: 'Tuần này ưu tiên ổn định checkout và anti-fraud trước demo.' },
      create: {
        id: 'seed-msg-1',
        channelId: 'seed-chan-general',
        authorId: tuan.id,
        content: 'Tuần này ưu tiên ổn định checkout và anti-fraud trước demo.',
      },
    });

    await prisma.message.upsert({
      where: { id: 'seed-msg-2' },
      update: { content: 'Infra cần khóa SLO trước thứ 2 để đồng bộ alert policy.' },
      create: {
        id: 'seed-msg-2',
        channelId: 'seed-chan-backend',
        authorId: bao.id,
        content: 'Infra cần khóa SLO trước thứ 2 để đồng bộ alert policy.',
      },
    });

    await prisma.message.upsert({
      where: { id: 'seed-msg-3' },
      update: { content: 'Đã rõ, em cập nhật thêm runbook rollback trong hôm nay.' },
      create: {
        id: 'seed-msg-3',
        channelId: 'seed-chan-backend',
        authorId: duc.id,
        parentId: 'seed-msg-2',
        content: 'Đã rõ, em cập nhật thêm runbook rollback trong hôm nay.',
      },
    });
  }

  if (hasTable('MessageReaction')) {
    await prisma.messageReaction.createMany({
      data: [
        { messageId: 'seed-msg-1', userId: bao.id, emoji: '🔥' },
        { messageId: 'seed-msg-2', userId: tuan.id, emoji: '✅' },
        { messageId: 'seed-msg-3', userId: bao.id, emoji: '👍' },
      ],
    });
  }

  if (hasTable('Doc')) {
    await prisma.doc.upsert({
      where: { id: 'seed-doc-architecture' },
      update: {
        title: 'Kiến trúc checkout resilient',
        projectId: 'seed-project-ecom',
        content: {
          type: 'doc',
          content: [
            {
              type: 'paragraph',
              content: [
                { type: 'text', text: 'Thiết kế retry + idempotency cho callback payment.' },
              ],
            },
          ],
        },
      },
      create: {
        id: 'seed-doc-architecture',
        workspaceId: workspace.id,
        title: 'Kiến trúc checkout resilient',
        projectId: 'seed-project-ecom',
        createdById: tuan.id,
        lastEditedBy: duc.id,
        content: {
          type: 'doc',
          content: [
            {
              type: 'paragraph',
              content: [
                { type: 'text', text: 'Thiết kế retry + idempotency cho callback payment.' },
              ],
            },
          ],
        },
      },
    });

    await prisma.doc.upsert({
      where: { id: 'seed-doc-slo' },
      update: { title: 'SLO handbook', projectId: 'seed-project-infra' },
      create: {
        id: 'seed-doc-slo',
        workspaceId: workspace.id,
        title: 'SLO handbook',
        projectId: 'seed-project-infra',
        createdById: bao.id,
        lastEditedBy: bao.id,
        content: {
          type: 'doc',
          content: [
            {
              type: 'paragraph',
              content: [{ type: 'text', text: 'Mục tiêu availability: 99.9% cho API thanh toán.' }],
            },
          ],
        },
      },
    });
  }

  if (hasTable('DocVersion')) {
    await prisma.docVersion.createMany({
      data: [
        {
          id: 'seed-docv-1',
          docId: 'seed-doc-architecture',
          content: { version: 1, note: 'Khởi tạo outline checkout architecture' },
        },
        {
          id: 'seed-docv-2',
          docId: 'seed-doc-slo',
          content: { version: 1, note: 'Khởi tạo SLO baseline' },
        },
      ],
    });
  }

  if (hasTable('TaskDocLink')) {
    await prisma.taskDocLink.createMany({
      data: [
        {
          taskId: 'seed-task-ecom-2',
          docId: 'seed-doc-architecture',
          type: 'manual',
          strength: 0.95,
        },
        { taskId: 'seed-task-infra-2', docId: 'seed-doc-slo', type: 'manual', strength: 0.9 },
      ],
    });
  }

  if (hasTable('WorkflowRule')) {
    await prisma.workflowRule.createMany({
      data: [
        {
          id: 'seed-rule-1',
          workspaceId: workspace.id,
          projectId: 'seed-project-ecom',
          name: 'Auto gán reviewer khi vào in_review',
          description: 'Task vào in_review sẽ tự gán reviewer mặc định.',
          isActive: true,
          trigger: { when: 'task.status_changed', to: 'in_review' },
          actions: { assignReviewer: 'tran.thi.lan@techviet.local' },
        },
        {
          id: 'seed-rule-2',
          workspaceId: workspace.id,
          projectId: null,
          name: 'Cảnh báo task urgent bị blocked',
          description: 'Gửi cảnh báo vào incident-war-room khi task urgent bị blocked.',
          isActive: true,
          trigger: { when: 'task.status_changed', to: 'blocked', priority: 'urgent' },
          actions: { postChannel: 'incident-war-room' },
        },
      ],
    });
  }

  if (hasTable('AgentAction')) {
    await prisma.agentAction.createMany({
      data: [
        {
          id: 'seed-agent-1',
          workspaceId: workspace.id,
          projectId: 'seed-project-ecom',
          agentName: 'PlannerAI',
          actionType: 'task_breakdown',
          targetId: 'seed-task-ecom-2',
          reason: 'Tự động chia nhỏ epic checkout theo payment providers.',
          metadata: { chunks: 4 },
        },
        {
          id: 'seed-agent-2',
          workspaceId: workspace.id,
          projectId: 'seed-project-infra',
          agentName: 'SREAgent',
          actionType: 'incident_hint',
          targetId: 'seed-task-infra-3',
          reason: 'Phát hiện pattern memory leak theo throughput.',
          metadata: { confidence: 0.82 },
        },
      ],
    });
  }

  if (hasTable('ExternalIntegration')) {
    await prisma.externalIntegration.createMany({
      data: [
        {
          id: 'seed-int-slack',
          workspaceId: workspace.id,
          projectId: 'seed-project-infra',
          name: 'Slack Alerts',
          provider: IntegrationProvider.SLACK,
          type: 'webhook_out',
          config: { channel: '#alerts', url: 'https://hooks.slack.test/seed' },
          status: 'active',
        },
        {
          id: 'seed-int-github',
          workspaceId: workspace.id,
          projectId: 'seed-project-ecom',
          name: 'GitHub PR Webhook',
          provider: IntegrationProvider.GITHUB,
          type: 'webhook_in',
          config: { secret: 'seed-secret', repo: 'techviet/ecom' },
          status: 'active',
        },
      ],
    });
  }

  if (hasTable('SignalLog') && hasTable('ExternalIntegration')) {
    await prisma.signalLog.createMany({
      data: [
        {
          id: 'seed-signal-1',
          workspaceId: workspace.id,
          projectId: 'seed-project-infra',
          integrationId: 'seed-int-slack',
          provider: IntegrationProvider.SLACK,
          payload: { text: 'p95 latency vượt ngưỡng 900ms trong 10 phút' },
          interpretation: 'Tín hiệu cảnh báo SLO degradation cần điều tra ngay.',
        },
        {
          id: 'seed-signal-2',
          workspaceId: workspace.id,
          projectId: 'seed-project-ecom',
          integrationId: 'seed-int-github',
          provider: IntegrationProvider.GITHUB,
          payload: { pr: 142, title: 'feat: harden payment callback' },
          interpretation: 'PR liên quan checkout resiliency đã được mở, nên ưu tiên review.',
        },
      ],
    });
  }

  if (hasTable('WorkspaceInvitation')) {
    await prisma.workspaceInvitation.createMany({
      data: [
        {
          id: 'seed-invite-1',
          workspaceId: workspace.id,
          inviterId: tuan.id,
          email: 'new.dev@techviet.local',
          tokenHash: 'seed-token-hash-1',
          role: WorkspaceMemberRole.member,
          status: WorkspaceInvitationStatus.pending,
          expiresAt: new Date('2026-05-30T00:00:00.000Z'),
        },
        {
          id: 'seed-invite-2',
          workspaceId: workspace.id,
          inviterId: tuan.id,
          email: 'security.consultant@techviet.local',
          tokenHash: 'seed-token-hash-2',
          role: WorkspaceMemberRole.viewer,
          status: WorkspaceInvitationStatus.accepted,
          acceptedAt: new Date('2026-04-10T08:30:00.000Z'),
          expiresAt: new Date('2026-06-15T00:00:00.000Z'),
        },
      ],
    });
  }

  if (hasTable('Notification')) {
    await prisma.notification.createMany({
      data: [
        {
          id: 'seed-noti-1',
          userId: bao.id,
          workspaceId: workspace.id,
          type: 'task.blocked',
          payload: { taskId: 'seed-task-infra-3', title: 'Fix memory leak ở worker xử lý queue' },
          neuralPriority: 'HIGH',
          aiSummary: 'Task urgent đang blocked, cần owner hành động trong hôm nay.',
        },
        {
          id: 'seed-noti-2',
          userId: tuan.id,
          workspaceId: workspace.id,
          type: 'workflow.in_review',
          payload: { taskId: 'seed-task-ecom-3' },
          neuralPriority: 'FOCUSED',
          aiSummary: 'Subtask OTP checkout đã sẵn sàng để phê duyệt.',
        },
      ],
    });
  }

  if (hasTable('AuditLog')) {
    await prisma.auditLog.createMany({
      data: [
        {
          id: 'seed-audit-1',
          workspaceId: workspace.id,
          actorId: tuan.id,
          action: 'project_created',
          entityType: 'project',
          entityId: 'seed-project-ecom',
          payload: { key: 'ECOM' },
        },
        {
          id: 'seed-audit-2',
          workspaceId: workspace.id,
          actorId: bao.id,
          action: 'task_status_changed',
          entityType: 'task',
          entityId: 'seed-task-infra-3',
          payload: { from: 'in_progress', to: 'blocked' },
        },
      ],
    });
  }

  console.log('  ✓ Collaboration + automation data seeded');
  console.log('  ✓ Login: nguyen.minh.tuan@techviet.local / Passw0rd!');
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
