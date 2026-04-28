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

const SEED_SCALE = Number.parseInt(process.env['SEED_SCALE'] ?? '3', 10) || 3;
const SEED_NOW = new Date(process.env['SEED_NOW'] ?? '2026-04-28T00:00:00.000Z');

function clampInt(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, Math.trunc(value)));
}

function toDateISO(date: Date): string {
  const year = date.getUTCFullYear();
  const month = `${date.getUTCMonth() + 1}`.padStart(2, '0');
  const day = `${date.getUTCDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function xorshift32(state: number): number {
  let x = state >>> 0;
  x ^= x << 13;
  x ^= x >>> 17;
  x ^= x << 5;
  return x >>> 0;
}

function makeRng(seed: string) {
  let state = stableSeed(seed) || 1;
  return {
    nextU32() {
      state = xorshift32(state);
      return state;
    },
    int(min: number, max: number) {
      const lo = Math.ceil(min);
      const hi = Math.floor(max);
      const span = hi - lo + 1;
      if (span <= 1) return lo;
      return lo + (this.nextU32() % span);
    },
    bool(pTrue = 0.5) {
      const threshold = Math.floor(pTrue * 0xffffffff);
      return this.nextU32() <= threshold;
    },
    pick<T>(arr: readonly T[]) {
      return arr[this.int(0, arr.length - 1)]!;
    },
    sample<T>(arr: readonly T[], count: number) {
      const target = clampInt(count, 0, arr.length);
      const picked = new Set<number>();
      while (picked.size < target) picked.add(this.int(0, arr.length - 1));
      return [...picked].map((idx) => arr[idx]!);
    },
  };
}

function weightedPick<T>(
  rng: ReturnType<typeof makeRng>,
  items: Array<{ value: T; w: number }>,
): T {
  const total = items.reduce((sum, item) => sum + item.w, 0);
  let roll = rng.int(1, total);
  for (const item of items) {
    roll -= item.w;
    if (roll <= 0) return item.value;
  }
  return items[items.length - 1]!.value;
}

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
    id: 'seed-task-ecom-4',
    projectId: 'seed-project-ecom',
    number: 4,
    title: 'Thiết kế bộ lọc sản phẩm đa chiều',
    description: 'Facet filter theo brand, price, rating và availability.',
    type: TaskType.task,
    priority: TaskPriority.medium,
    status: 'todo',
    storyPoints: 5,
    assigneeEmail: 'pham.ngoc.anh@techviet.local',
    dueDate: '2026-05-07',
    position: '2200',
  },
  {
    id: 'seed-task-ecom-5',
    projectId: 'seed-project-ecom',
    number: 5,
    title: 'Tối ưu trải nghiệm trang checkout mobile',
    description: 'Rút ngắn form, lưu địa chỉ gần nhất và payment fallback.',
    type: TaskType.story,
    priority: TaskPriority.high,
    status: 'in_progress',
    storyPoints: 8,
    assigneeEmail: 'vo.thi.mai@techviet.local',
    dueDate: '2026-05-10',
    position: '2300',
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
    id: 'seed-task-bank-4',
    projectId: 'seed-project-banking',
    number: 4,
    title: 'Tích hợp màn hình lịch sử giao dịch realtime',
    description: 'Timeline giao dịch theo account, hỗ trợ pull-to-refresh.',
    type: TaskType.task,
    priority: TaskPriority.medium,
    status: 'in_review',
    storyPoints: 5,
    assigneeEmail: 'tran.thi.lan@techviet.local',
    dueDate: '2026-05-11',
    position: '3200',
  },
  {
    id: 'seed-task-bank-5',
    projectId: 'seed-project-banking',
    number: 5,
    title: 'Đảm bảo tokenization cho thẻ nội địa',
    description: 'Không lưu PAN thô, audit theo chuẩn PCI tối thiểu.',
    type: TaskType.bug,
    priority: TaskPriority.urgent,
    status: 'todo',
    storyPoints: 8,
    assigneeEmail: 'le.van.duc@techviet.local',
    dueDate: '2026-05-15',
    position: '3300',
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
    id: 'seed-task-hr-3',
    projectId: 'seed-project-hr',
    number: 3,
    title: 'Báo cáo payroll và thưởng tháng',
    description: 'Tính lương gross/net, thưởng KPI và xuất file PDF.',
    type: TaskType.story,
    priority: TaskPriority.medium,
    status: 'in_progress',
    storyPoints: 8,
    assigneeEmail: 'le.van.duc@techviet.local',
    dueDate: '2026-05-12',
    position: '2100',
  },
  {
    id: 'seed-task-hr-4',
    projectId: 'seed-project-hr',
    number: 4,
    title: 'Onboarding checklist cho nhân viên mới',
    description: 'Provision account, gửi welcome email và checklist 7 ngày.',
    type: TaskType.task,
    priority: TaskPriority.low,
    status: 'todo',
    storyPoints: 3,
    assigneeEmail: null,
    dueDate: '2026-05-16',
    position: '2200',
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
  {
    id: 'seed-task-infra-4',
    projectId: 'seed-project-infra',
    number: 4,
    title: 'Thiết lập HPA cho API critical services',
    description: 'Autoscaling theo CPU và RPS với min 2 replicas.',
    type: TaskType.task,
    priority: TaskPriority.high,
    status: 'in_progress',
    storyPoints: 5,
    assigneeEmail: 'nguyen.minh.tuan@techviet.local',
    dueDate: '2026-05-09',
    position: '3200',
  },
  {
    id: 'seed-task-infra-5',
    projectId: 'seed-project-infra',
    number: 5,
    title: 'Chuẩn hóa log pipeline và alert rule',
    description: 'Log JSON, retention policy và cảnh báo error burst.',
    type: TaskType.story,
    priority: TaskPriority.medium,
    status: 'todo',
    storyPoints: 8,
    assigneeEmail: 'hoang.quoc.bao@techviet.local',
    dueDate: '2026-05-18',
    position: '3300',
  },
];

function buildExtraUsers() {
  const rng = makeRng('seed-extra-users');
  const firstNames = [
    'Anh',
    'Bình',
    'Châu',
    'Chi',
    'Dũng',
    'Duy',
    'Giang',
    'Hà',
    'Hải',
    'Hạnh',
    'Hiếu',
    'Hùng',
    'Khánh',
    'Khoa',
    'Linh',
    'Long',
    'Minh',
    'My',
    'Nam',
    'Nga',
    'Nhi',
    'Phúc',
    'Quân',
    'Quỳnh',
    'Sơn',
    'Thảo',
    'Trang',
    'Trí',
    'Tú',
    'Vân',
  ] as const;
  const lastNames = [
    'Nguyễn',
    'Trần',
    'Lê',
    'Phạm',
    'Hoàng',
    'Võ',
    'Đặng',
    'Bùi',
    'Đỗ',
    'Hồ',
    'Dương',
    'Lý',
  ] as const;

  const colors = [
    '#2563eb',
    '#059669',
    '#7c3aed',
    '#dc2626',
    '#d97706',
    '#db2777',
    '#0ea5e9',
    '#22c55e',
    '#f97316',
    '#a855f7',
    '#ef4444',
    '#14b8a6',
  ] as const;

  const extraCount = clampInt(SEED_SCALE * 8, 8, 80);
  const users: Array<{
    email: string;
    fullName: string;
    wsRole: WorkspaceMemberRole;
    roleKey: string;
    avatarColor: string;
  }> = [];

  for (let i = 0; i < extraCount; i += 1) {
    const first = rng.pick(firstNames);
    const last = rng.pick(lastNames);
    const fullName = `${last} ${first}`;
    const local = `${last}.${first}.${i + 1}`.toLowerCase().replaceAll(' ', '');
    const email = `${local}@techviet.local`;
    const wsRole = rng.bool(0.1) ? WorkspaceMemberRole.viewer : WorkspaceMemberRole.member;
    const roleKey = wsRole === WorkspaceMemberRole.viewer ? 'workspace-viewer' : 'workspace-member';
    users.push({
      email,
      fullName,
      wsRole,
      roleKey,
      avatarColor: colors[i % colors.length]!,
    });
  }

  return users;
}

const EXTRA_USER_SPECS = buildExtraUsers();
const ALL_USER_SPECS = [...USER_SPECS, ...EXTRA_USER_SPECS] as const;

function buildExtraProjects() {
  const base = [
    {
      id: 'seed-project-ai',
      name: 'Trợ lý AI nội bộ',
      description: 'AI assistant cho triage issue, tóm tắt docs và gợi ý plan.',
      color: '#0ea5e9',
      icon: '🤖',
      key: 'AI',
    },
    {
      id: 'seed-project-data',
      name: 'Nền tảng Dữ liệu',
      description: 'Data ingestion, warehouse, BI dashboard, quality checks.',
      color: '#14b8a6',
      icon: '📊',
      key: 'DATA',
    },
    {
      id: 'seed-project-support',
      name: 'Vận hành & CSKH',
      description: 'Ticketing, SLA, knowledge base và tooling nội bộ.',
      color: '#f97316',
      icon: '🎧',
      key: 'SUP',
    },
    {
      id: 'seed-project-growth',
      name: 'Growth & Experiment',
      description: 'A/B testing, funnel analytics, onboarding optimization.',
      color: '#a855f7',
      icon: '📈',
      key: 'GROW',
    },
  ] as const;

  const count = clampInt(SEED_SCALE, 1, base.length);
  return base.slice(0, count);
}

const EXTRA_PROJECT_SPECS = buildExtraProjects();
const ALL_PROJECT_SPECS = [...PROJECT_SPECS, ...EXTRA_PROJECT_SPECS] as const;

function maxTaskNumberByProject(existing: readonly TaskSeed[]) {
  const map = new Map<string, number>();
  for (const task of existing) {
    map.set(task.projectId, Math.max(map.get(task.projectId) ?? 0, task.number));
  }
  return map;
}

function buildExtraTasks() {
  const rng = makeRng('seed-extra-tasks');
  const maxByProject = maxTaskNumberByProject(TASKS);

  const statuses = [
    { value: 'todo', w: 35 },
    { value: 'in_progress', w: 30 },
    { value: 'in_review', w: 15 },
    { value: 'blocked', w: 5 },
    { value: 'done', w: 15 },
  ] as const;

  const priorities = [
    { value: TaskPriority.low, w: 10 },
    { value: TaskPriority.medium, w: 45 },
    { value: TaskPriority.high, w: 30 },
    { value: TaskPriority.urgent, w: 15 },
  ] as const;

  const types = [
    { value: TaskType.task, w: 45 },
    { value: TaskType.story, w: 30 },
    { value: TaskType.bug, w: 15 },
    { value: TaskType.epic, w: 10 },
  ] as const;

  const templates = [
    {
      title: 'Chuẩn hóa API contract {area}',
      desc: 'Định nghĩa schema, error code và versioning cho {area}.',
    },
    {
      title: 'Tối ưu truy vấn DB cho {area}',
      desc: 'Add index, giảm N+1 và benchmark p95 cho {area}.',
    },
    {
      title: 'Viết integration test cho {area}',
      desc: 'Bao phủ edge-cases, race conditions và regression cho {area}.',
    },
    {
      title: 'Thiết kế UI flow {area}',
      desc: 'Prototype + review UX, đảm bảo accessibility và empty state cho {area}.',
    },
    {
      title: 'Hardening bảo mật {area}',
      desc: 'Threat model, rate-limit và audit log cho {area}.',
    },
    {
      title: 'Refactor module {area}',
      desc: 'Tách layer, chuẩn hóa naming và giảm cyclomatic complexity cho {area}.',
    },
    {
      title: 'Thiết lập observability {area}',
      desc: 'Metrics, tracing và alert cho critical path {area}.',
    },
  ] as const;

  const areasByProjectKey: Record<string, readonly string[]> = {
    ECOM: ['checkout', 'catalog', 'inventory', 'pricing', 'promotion', 'shipment', 'refund'],
    BANK: ['ledger', 'otp', 'fraud', 'settlement', 'reconciliation', 'kyc', 'notifications'],
    HR: ['onboarding', 'attendance', 'leave', 'payroll', 'benefits', 'org-chart', 'reports'],
    INFRA: ['ci-cd', 'autoscaling', 'logging', 'monitoring', 'queues', 'redis', 'security'],
    AI: ['prompting', 'retrieval', 'evals', 'agent-runner', 'embeddings', 'safety'],
    DATA: ['pipelines', 'warehouse', 'dbt', 'quality', 'catalog', 'lineage', 'dashboards'],
    SUP: ['tickets', 'sla', 'kb', 'macros', 'routing', 'csat', 'ops'],
    GROW: ['ab-test', 'funnel', 'onboarding', 'activation', 'retention', 'pricing', 'analytics'],
  };

  const tasksPerProject = clampInt(40 + SEED_SCALE * 30, 60, 240);
  const all: TaskSeed[] = [];

  for (const project of ALL_PROJECT_SPECS) {
    const start = (maxByProject.get(project.id) ?? 0) + 1;
    const areas = areasByProjectKey[project.key ?? ''] ?? ['core'];

    for (let offset = 0; offset < tasksPerProject; offset += 1) {
      const number = start + offset;
      const id = `seed-task-${(project.key ?? project.id).toLowerCase()}-${number}`;
      const tpl = rng.pick(templates);
      const area = rng.pick(areas);
      const status = weightedPick(rng, [...statuses]);
      const priority = weightedPick(rng, [...priorities]);
      const type = weightedPick(rng, [...types]);
      const storyPoints = rng.pick([1, 2, 3, 5, 8, 13] as const);

      const hasAssignee = rng.bool(0.88);
      const dueShift = rng.int(-30, 45);
      const due = new Date(SEED_NOW.getTime());
      due.setUTCDate(due.getUTCDate() + dueShift);

      all.push({
        id,
        projectId: project.id,
        number,
        title: tpl.title.replace('{area}', area),
        description: tpl.desc.replace('{area}', area),
        type,
        priority,
        status,
        storyPoints,
        assigneeEmail: hasAssignee ? rng.pick(ALL_USER_SPECS).email : null,
        dueDate: rng.bool(0.85) ? toDateISO(due) : null,
        position: `${number * 1000}`,
      });

      if (rng.bool(0.22)) {
        const subCount = rng.int(1, 3);
        for (let s = 0; s < subCount; s += 1) {
          const subNumber = number * 1000 + (s + 1);
          all.push({
            id: `${id}-sub-${s + 1}`,
            projectId: project.id,
            number: subNumber,
            title: `Subtask: ${tpl.title.replace('{area}', area)}`,
            description: `Tách nhỏ để triển khai dần: ${tpl.desc.replace('{area}', area)}`,
            type: TaskType.task,
            priority: rng.pick([TaskPriority.low, TaskPriority.medium, TaskPriority.high] as const),
            status: rng.pick(['todo', 'in_progress', 'in_review'] as const),
            storyPoints: rng.pick([1, 2, 3, 5] as const),
            assigneeEmail: rng.bool(0.75) ? rng.pick(ALL_USER_SPECS).email : null,
            dueDate: rng.bool(0.7) ? toDateISO(due) : null,
            position: `${number * 1000 + (s + 1) * 10}`,
            parentTaskId: id,
          });
        }
      }
    }
  }

  return all;
}

const EXTRA_TASKS = buildExtraTasks();
const ALL_TASKS = [...TASKS, ...EXTRA_TASKS];

const LABELS = [
  { id: 'seed-label-backend', name: 'Backend', color: '#2563eb' },
  { id: 'seed-label-frontend', name: 'Frontend', color: '#db2777' },
  { id: 'seed-label-uiux', name: 'UI/UX', color: '#f43f5e' },
  { id: 'seed-label-docs', name: 'Tài liệu', color: '#6b7280' },
  { id: 'seed-label-security', name: 'Bảo mật', color: '#dc2626' },
  { id: 'seed-label-devops', name: 'DevOps', color: '#d97706' },
  { id: 'seed-label-qa', name: 'Kiểm thử', color: '#059669' },
  { id: 'seed-label-product', name: 'Sản phẩm', color: '#7c3aed' },
] as const;

const TASK_LABELS = [
  ['seed-task-ecom-2', 'seed-label-backend'],
  ['seed-task-ecom-2', 'seed-label-product'],
  ['seed-task-ecom-3', 'seed-label-security'],
  ['seed-task-ecom-4', 'seed-label-uiux'],
  ['seed-task-ecom-5', 'seed-label-uiux'],
  ['seed-task-bank-2', 'seed-label-security'],
  ['seed-task-bank-3', 'seed-label-qa'],
  ['seed-task-bank-4', 'seed-label-uiux'],
  ['seed-task-bank-5', 'seed-label-security'],
  ['seed-task-hr-2', 'seed-label-product'],
  ['seed-task-hr-3', 'seed-label-product'],
  ['seed-task-hr-4', 'seed-label-docs'],
  ['seed-task-infra-1', 'seed-label-devops'],
  ['seed-task-infra-2', 'seed-label-devops'],
  ['seed-task-infra-3', 'seed-label-backend'],
  ['seed-task-infra-4', 'seed-label-devops'],
  ['seed-task-infra-5', 'seed-label-devops'],
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
  {
    id: 'seed-cmt-4',
    taskId: 'seed-task-ecom-4',
    authorEmail: 'vo.thi.mai@techviet.local',
    content: 'Filter UI nên cho phép multi-select và giữ state khi back/forward.',
  },
  {
    id: 'seed-cmt-5',
    taskId: 'seed-task-bank-4',
    authorEmail: 'tran.thi.lan@techviet.local',
    content: 'Màn hình history realtime đã đủ cho demo, còn polish empty state.',
  },
  {
    id: 'seed-cmt-6',
    taskId: 'seed-task-hr-3',
    authorEmail: 'nguyen.minh.tuan@techviet.local',
    content: 'Payroll phải khóa dữ liệu trước ngày chốt lương để tránh lệch số.',
  },
  {
    id: 'seed-cmt-7',
    taskId: 'seed-task-infra-4',
    authorEmail: 'hoang.quoc.bao@techviet.local',
    content: 'HPA policy cần theo dõi cả memory khi spike traffic ban đêm.',
  },
] as const;

function buildExtraLabels() {
  const base = [
    { name: 'Observability', color: '#0ea5e9' },
    { name: 'Performance', color: '#f97316' },
    { name: 'Refactor', color: '#64748b' },
    { name: 'Tech Debt', color: '#6b7280' },
    { name: 'UX', color: '#db2777' },
    { name: 'Accessibility', color: '#22c55e' },
    { name: 'Reliability', color: '#dc2626' },
    { name: 'Data', color: '#14b8a6' },
    { name: 'AI', color: '#a855f7' },
    { name: 'Incident', color: '#ef4444' },
    { name: 'Experiment', color: '#f59e0b' },
    { name: 'Release', color: '#2563eb' },
  ] as const;

  const count = clampInt(6 + SEED_SCALE * 4, 8, base.length);
  return base.slice(0, count).map((l, idx) => ({
    id: `seed-label-extra-${idx + 1}`,
    name: l.name,
    color: l.color,
  }));
}

const EXTRA_LABELS = buildExtraLabels();
const ALL_LABELS = [...LABELS, ...EXTRA_LABELS] as const;

function buildExtraTaskLabels() {
  const rng = makeRng('seed-extra-task-labels');
  const taskLabelPairs: Array<[string, string]> = [];
  const labelIds = ALL_LABELS.map((l) => l.id);
  const maxPairs = clampInt(ALL_TASKS.length * 2, 200, 5000);

  for (let i = 0; i < ALL_TASKS.length && taskLabelPairs.length < maxPairs; i += 1) {
    const task = ALL_TASKS[i]!;
    const count = rng.int(0, 3);
    const picks = rng.sample(labelIds, count);
    for (const labelId of picks) taskLabelPairs.push([task.id, labelId]);
  }
  return taskLabelPairs;
}

const EXTRA_TASK_LABELS = buildExtraTaskLabels();
const ALL_TASK_LABELS = (() => {
  const seen = new Set<string>();
  const out: Array<readonly [string, string]> = [];
  for (const [taskId, labelId] of [...TASK_LABELS, ...EXTRA_TASK_LABELS]) {
    const key = `${taskId}::${labelId}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push([taskId, labelId] as const);
  }
  return out;
})();

function buildExtraComments() {
  const rng = makeRng('seed-extra-comments');
  const snippets = [
    'Đã update theo feedback, nhờ review thêm.',
    'Có risk edge-case; đề xuất thêm test regression.',
    'Có thể optimize bằng index + cache; em sẽ benchmark.',
    'Chỗ này cần clarify acceptance criteria trước khi merge.',
    'Em gặp blocker phụ thuộc service khác, đang ping owner.',
    'OK, em tách thành 2 PR cho dễ review.',
    'Đã thêm metrics/tracing cho đường đi chính.',
    'Cần confirm behavior khi retry/idempotency.',
    'Em bổ sung docs + runbook để handoff.',
  ] as const;

  const comments: Array<{
    id: string;
    taskId: string;
    authorEmail: string;
    content: string;
  }> = [];

  const targetTasks = ALL_TASKS.filter(() => rng.bool(0.35));
  const maxComments = clampInt(500 * SEED_SCALE, 600, 6000);

  for (const task of targetTasks) {
    const count = rng.int(0, 4);
    for (let i = 0; i < count && comments.length < maxComments; i += 1) {
      const authorEmail = rng.pick(ALL_USER_SPECS).email;
      comments.push({
        id: `seed-cmt-${task.id}-${i + 1}`,
        taskId: task.id,
        authorEmail,
        content: rng.pick(snippets),
      });
    }
    if (comments.length >= maxComments) break;
  }

  return comments;
}

const EXTRA_COMMENTS = buildExtraComments();
const ALL_COMMENTS = [...COMMENTS, ...EXTRA_COMMENTS] as const;

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
  if (hasTable('Attachment')) {
    await prisma.attachment.deleteMany({ where: { id: { startsWith: 'seed-att-' } } });
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
  if (hasTable('ProjectMemoir')) {
    await prisma.projectMemoir.deleteMany({ where: { id: { startsWith: 'seed-memoir-' } } });
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
  if (hasTable('TaskEmbedding')) {
    await prisma.taskEmbedding.deleteMany({ where: { taskId: { startsWith: 'seed-task-' } } });
  }
  if (hasTable('ProjectEmbedding')) {
    await prisma.projectEmbedding.deleteMany({
      where: { projectId: { startsWith: 'seed-project-' } },
    });
  }
  if (hasTable('DocEmbedding')) {
    await prisma.docEmbedding.deleteMany({ where: { docId: { startsWith: 'seed-doc-' } } });
  }
  if (hasTable('SignalEmbedding')) {
    await prisma.signalEmbedding.deleteMany({
      where: { signalId: { startsWith: 'seed-signal-' } },
    });
  }
}

const EMBEDDING_DIMENSIONS = 768;

function stableSeed(input: string): number {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function buildFakeVector(seed: string, dimensions = EMBEDDING_DIMENSIONS): string {
  let state = stableSeed(seed) || 1;
  const values: string[] = [];

  for (let i = 0; i < dimensions; i += 1) {
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    const normalized = (state >>> 0) / 4294967295;
    values.push((normalized * 2 - 1).toFixed(6));
  }

  return `[${values.join(',')}]`;
}

async function upsertEmbedding(
  table: string,
  keyColumn: string,
  keyValue: string,
  vectorSeed: string,
) {
  const vectorStr = buildFakeVector(vectorSeed);
  await prisma.$executeRawUnsafe(
    `INSERT INTO "${table}" ("${keyColumn}", "vector", "updatedAt") VALUES ($1, $2::vector, NOW()) ON CONFLICT ("${keyColumn}") DO UPDATE SET "vector" = $2::vector, "updatedAt" = NOW();`,
    keyValue,
    vectorStr,
  );
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
  for (const spec of ALL_USER_SPECS) {
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
    for (const label of ALL_LABELS) {
      await prisma.label.upsert({
        where: { id: label.id },
        update: { name: label.name, color: label.color },
        create: { id: label.id, name: label.name, color: label.color, workspaceId: workspace.id },
      });
    }
  }

  for (const spec of ALL_PROJECT_SPECS) {
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
  console.log(`  ✓ Projects: ${ALL_PROJECT_SPECS.length}`);

  for (const task of ALL_TASKS) {
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
    for (const [taskId, labelId] of ALL_TASK_LABELS) {
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
  console.log(`  ✓ Tasks: ${ALL_TASKS.length}`);

  if (hasTable('Comment')) {
    for (const comment of ALL_COMMENTS) {
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
    ...(SEED_SCALE >= 2
      ? ([
          {
            id: 'seed-chan-product',
            name: 'product',
            description: 'Trao đổi roadmap, PRD và quyết định sản phẩm',
            type: ChannelType.public,
          },
          {
            id: 'seed-chan-design',
            name: 'design-system',
            description: 'UI kit, tokens và review accessibility',
            type: ChannelType.public,
          },
          {
            id: 'seed-chan-data',
            name: 'data-platform',
            description: 'Pipelines, quality và dashboard BI',
            type: ChannelType.public,
          },
        ] as const)
      : ([] as const)),
    ...(SEED_SCALE >= 3
      ? ([
          {
            id: 'seed-chan-ai',
            name: 'ai-lab',
            description: 'Evals, prompts và agent workflows',
            type: ChannelType.public,
          },
          {
            id: 'seed-chan-random',
            name: 'random',
            description: 'Chém gió, chia sẻ, và thảo luận tự do',
            type: ChannelType.public,
          },
        ] as const)
      : ([] as const)),
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
    const rng = makeRng('seed-channel-members');
    for (const [, user] of usersByEmail) {
      for (const channel of channels) {
        if (channel.type === ChannelType.private) {
          if (!rng.bool(0.35)) continue;
        }
        await prisma.channelMember.upsert({
          where: { channelId_userId: { channelId: channel.id, userId: user.id } },
          update: {},
          create: { channelId: channel.id, userId: user.id },
        });
      }
    }
  }

  const tuan = usersByEmail.get('nguyen.minh.tuan@techviet.local')!;
  const lan = usersByEmail.get('tran.thi.lan@techviet.local')!;
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

    const rng = makeRng('seed-auto-messages');
    const authors = [...usersByEmail.values()].map((u) => u.id);
    const messageSnippets = [
      'Đã merge PR, nhờ mọi người pull về test nhanh.',
      'Có ai rảnh review giúp phần edge-case này không?',
      'Em vừa cập nhật dashboard latency p95, nhìn có spike lúc 2AM.',
      'Đề xuất add index cho query này, hiện đang chậm ở staging.',
      'Checklist release hôm nay: migrate + feature flag + rollback.',
      'Có thể split task này thành 2 phần để giảm risk.',
      'Note: cần đảm bảo idempotency cho endpoint callback.',
      'Em đã viết thêm test và fix flaky case.',
      'Cập nhật tiến độ: đang blocked do phụ thuộc service khác.',
      'Nice, demo ổn rồi. Mai polish thêm UI.',
    ] as const;

    const basePerChannel = clampInt(40 + SEED_SCALE * 40, 80, 500);
    const totalTarget = basePerChannel * channels.length;

    const baseMessages: Array<{
      id: string;
      channelId: string;
      authorId: string;
      content: string;
    }> = [];

    for (let i = 0; i < totalTarget; i += 1) {
      const channel = rng.pick(channels);
      baseMessages.push({
        id: `seed-msg-auto-${i + 1}`,
        channelId: channel.id,
        authorId: rng.pick(authors),
        content: rng.pick(messageSnippets),
      });
    }

    if (baseMessages.length > 0) {
      await prisma.message.createMany({ data: baseMessages });
    }

    const replyCount = clampInt(Math.floor(baseMessages.length * 0.12), 20, 400);
    const replies: Array<{
      id: string;
      channelId: string;
      authorId: string;
      parentId: string;
      content: string;
    }> = [];

    for (let i = 0; i < replyCount; i += 1) {
      const parent = rng.pick(baseMessages);
      replies.push({
        id: `seed-msg-reply-${i + 1}`,
        channelId: parent.channelId,
        authorId: rng.pick(authors),
        parentId: parent.id,
        content: rng.pick(messageSnippets),
      });
    }

    if (replies.length > 0) {
      await prisma.message.createMany({ data: replies });
    }
  }

  if (hasTable('MessageReaction')) {
    await prisma.messageReaction.createMany({
      data: [
        { messageId: 'seed-msg-1', userId: bao.id, emoji: '🔥' },
        { messageId: 'seed-msg-2', userId: tuan.id, emoji: '✅' },
        { messageId: 'seed-msg-3', userId: bao.id, emoji: '👍' },
      ],
    });

    const rng = makeRng('seed-auto-reactions');
    const users = [...usersByEmail.values()].map((u) => u.id);
    const emojis = ['👍', '✅', '🎉', '🔥', '👀', '💡', '🧪', '🚀'] as const;
    const reactionCount = clampInt(200 * SEED_SCALE, 200, 4000);

    const reactions: Array<{ messageId: string; userId: string; emoji: string }> = [];
    for (let i = 0; i < reactionCount; i += 1) {
      const messageId = rng.bool(0.8)
        ? `seed-msg-auto-${rng.int(1, clampInt(40 + SEED_SCALE * 40, 80, 500) * channels.length)}`
        : `seed-msg-reply-${rng.int(1, clampInt(Math.floor(clampInt(40 + SEED_SCALE * 40, 80, 500) * channels.length * 0.12), 20, 400))}`;
      reactions.push({ messageId, userId: rng.pick(users), emoji: rng.pick(emojis) });
    }

    await prisma.messageReaction.createMany({ data: reactions, skipDuplicates: true });
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

    await prisma.doc.upsert({
      where: { id: 'seed-doc-banking-architecture' },
      update: { title: 'Banking transaction lifecycle', projectId: 'seed-project-banking' },
      create: {
        id: 'seed-doc-banking-architecture',
        workspaceId: workspace.id,
        title: 'Banking transaction lifecycle',
        projectId: 'seed-project-banking',
        createdById: tuan.id,
        lastEditedBy: bao.id,
        content: {
          type: 'doc',
          content: [
            {
              type: 'paragraph',
              content: [
                {
                  type: 'text',
                  text: 'Chuỗi xử lý chuyển khoản: initiate → verify → settle → reconcile.',
                },
              ],
            },
          ],
        },
      },
    });

    await prisma.doc.upsert({
      where: { id: 'seed-doc-hr-handbook' },
      update: { title: 'HR operations handbook', projectId: 'seed-project-hr' },
      create: {
        id: 'seed-doc-hr-handbook',
        workspaceId: workspace.id,
        title: 'HR operations handbook',
        projectId: 'seed-project-hr',
        createdById: lan.id,
        lastEditedBy: lan.id,
        content: {
          type: 'doc',
          content: [
            {
              type: 'paragraph',
              content: [
                { type: 'text', text: 'Quy trình onboarding, offboarding và duyệt nghỉ phép.' },
              ],
            },
          ],
        },
      },
    });

    await prisma.doc.upsert({
      where: { id: 'seed-doc-infra-runbook' },
      update: { title: 'Incident and rollout runbook', projectId: 'seed-project-infra' },
      create: {
        id: 'seed-doc-infra-runbook',
        workspaceId: workspace.id,
        title: 'Incident and rollout runbook',
        projectId: 'seed-project-infra',
        createdById: bao.id,
        lastEditedBy: bao.id,
        content: {
          type: 'doc',
          content: [
            {
              type: 'paragraph',
              content: [
                { type: 'text', text: 'Checklist rollback, communication và incident handoff.' },
              ],
            },
          ],
        },
      },
    });

    const rng = makeRng('seed-auto-docs');
    const creators = [tuan.id, lan.id, duc.id, bao.id];

    await prisma.doc.upsert({
      where: { id: 'seed-doc-wiki' },
      update: { title: 'TechViet Wiki' },
      create: {
        id: 'seed-doc-wiki',
        workspaceId: workspace.id,
        title: 'TechViet Wiki',
        createdById: tuan.id,
        lastEditedBy: tuan.id,
        content: {
          type: 'doc',
          content: [
            {
              type: 'paragraph',
              content: [{ type: 'text', text: 'Tổng hợp tài liệu nội bộ theo team và dự án.' }],
            },
          ],
        },
      },
    });

    const sectionDocs = [
      { id: 'seed-doc-sec-engineering', title: 'Engineering Handbook' },
      { id: 'seed-doc-sec-product', title: 'Product Handbook' },
      { id: 'seed-doc-sec-ops', title: 'Operations Handbook' },
    ] as const;

    for (const sec of sectionDocs) {
      await prisma.doc.upsert({
        where: { id: sec.id },
        update: { title: sec.title, parentDocId: 'seed-doc-wiki' },
        create: {
          id: sec.id,
          workspaceId: workspace.id,
          title: sec.title,
          parentDocId: 'seed-doc-wiki',
          createdById: rng.pick(creators),
          lastEditedBy: rng.pick(creators),
          content: {
            type: 'doc',
            content: [
              { type: 'paragraph', content: [{ type: 'text', text: `Section: ${sec.title}` }] },
            ],
          },
        },
      });
    }

    const docCountPerProject = clampInt(6 + SEED_SCALE * 6, 10, 60);
    for (const project of ALL_PROJECT_SPECS) {
      const folderId = `seed-doc-folder-${(project.key ?? project.id).toLowerCase()}`;
      await prisma.doc.upsert({
        where: { id: folderId },
        update: { title: `Project: ${project.name}`, parentDocId: 'seed-doc-sec-engineering' },
        create: {
          id: folderId,
          workspaceId: workspace.id,
          title: `Project: ${project.name}`,
          parentDocId: 'seed-doc-sec-engineering',
          projectId: project.id,
          createdById: rng.pick(creators),
          lastEditedBy: rng.pick(creators),
          content: {
            type: 'doc',
            content: [
              {
                type: 'paragraph',
                content: [{ type: 'text', text: `Tài liệu dự án ${project.key ?? ''}` }],
              },
            ],
          },
        },
      });

      for (let i = 0; i < docCountPerProject; i += 1) {
        const docId = `seed-doc-auto-${(project.key ?? project.id).toLowerCase()}-${i + 1}`;
        const title = rng.pick([
          'Decision log',
          'Runbook',
          'API contract',
          'Architecture note',
          'Release checklist',
          'Onboarding guide',
          'Testing strategy',
          'Security notes',
          'Observability guide',
        ] as const);

        await prisma.doc.upsert({
          where: { id: docId },
          update: { title: `${title} #${i + 1}`, projectId: project.id, parentDocId: folderId },
          create: {
            id: docId,
            workspaceId: workspace.id,
            title: `${title} #${i + 1}`,
            projectId: project.id,
            parentDocId: folderId,
            createdById: rng.pick(creators),
            lastEditedBy: rng.pick(creators),
            content: {
              type: 'doc',
              content: [
                {
                  type: 'paragraph',
                  content: [
                    {
                      type: 'text',
                      text: `Doc: ${title}. Nội dung mẫu để demo search, link và AI summary.`,
                    },
                  ],
                },
              ],
            },
          },
        });
      }
    }
  }

  if (hasTable('DocVersion')) {
    const rng = makeRng('seed-doc-versions');
    const baseVersions = [
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
      {
        id: 'seed-docv-3',
        docId: 'seed-doc-banking-architecture',
        content: { version: 1, note: 'Khởi tạo transaction lifecycle' },
      },
      {
        id: 'seed-docv-4',
        docId: 'seed-doc-hr-handbook',
        content: { version: 1, note: 'Khởi tạo HR handbook' },
      },
      {
        id: 'seed-docv-5',
        docId: 'seed-doc-infra-runbook',
        content: { version: 1, note: 'Khởi tạo incident runbook' },
      },
    ];

    const extraDocIds = await prisma.doc.findMany({
      where: { id: { startsWith: 'seed-doc-auto-' } },
      select: { id: true },
    });

    const extraVersions = extraDocIds.flatMap((doc, idx) => {
      const count = rng.int(1, 3);
      return Array.from({ length: count }).map((_, v) => ({
        id: `seed-docv-auto-${idx + 1}-${v + 1}`,
        docId: doc.id,
        content: {
          version: v + 1,
          note: rng.pick(['Draft', 'Review update', 'Final pass'] as const),
        },
      }));
    });

    await prisma.docVersion.createMany({ data: [...baseVersions, ...extraVersions] });
  }

  if (hasTable('TaskDocLink')) {
    const baseLinks = [
      {
        taskId: 'seed-task-ecom-2',
        docId: 'seed-doc-architecture',
        type: 'manual',
        strength: 0.95,
      },
      { taskId: 'seed-task-infra-2', docId: 'seed-doc-slo', type: 'manual', strength: 0.9 },
      {
        taskId: 'seed-task-bank-1',
        docId: 'seed-doc-banking-architecture',
        type: 'manual',
        strength: 0.9,
      },
      {
        taskId: 'seed-task-hr-1',
        docId: 'seed-doc-hr-handbook',
        type: 'manual',
        strength: 0.85,
      },
      {
        taskId: 'seed-task-infra-3',
        docId: 'seed-doc-infra-runbook',
        type: 'manual',
        strength: 0.92,
      },
    ];

    const rng = makeRng('seed-auto-task-doc-links');
    const autoDocs = await prisma.doc.findMany({
      where: { id: { startsWith: 'seed-doc-auto-' } },
      select: { id: true, projectId: true },
    });

    const links: Array<{ taskId: string; docId: string; type: string; strength: number }> = [
      ...baseLinks,
    ];

    const maxLinks = clampInt(600 * SEED_SCALE, 800, 8000);
    for (const doc of autoDocs) {
      if (!doc.projectId) continue;
      const candidates = ALL_TASKS.filter((t) => t.projectId === doc.projectId);
      if (candidates.length === 0) continue;
      const count = rng.int(0, 3);
      for (let i = 0; i < count && links.length < maxLinks; i += 1) {
        const taskId = rng.pick(candidates).id;
        links.push({
          taskId,
          docId: doc.id,
          type: rng.pick(['manual', 'suggested'] as const),
          strength: Number((0.5 + rng.int(0, 45) / 100).toFixed(2)),
        });
      }
      if (links.length >= maxLinks) break;
    }

    await prisma.taskDocLink.createMany({ data: links, skipDuplicates: true });
  }

  if (hasTable('ProjectMemoir')) {
    await prisma.projectMemoir.createMany({
      data: [
        {
          id: 'seed-memoir-ecom-1',
          projectId: 'seed-project-ecom',
          title: 'Retail launch momentum',
          content:
            'Project ecom cần ưu tiên checkout reliability và UI polish cho mobile conversion.',
          persona: 'executive',
        },
        {
          id: 'seed-memoir-bank-1',
          projectId: 'seed-project-banking',
          title: 'Risk-first banking',
          content:
            'Mọi thay đổi transaction flow phải đi kèm observability và rollback plan rõ ràng.',
          persona: 'technical',
        },
        {
          id: 'seed-memoir-hr-1',
          projectId: 'seed-project-hr',
          title: 'People ops clarity',
          content: 'HR portal cần ưu tiên đơn giản hoá chấm công, nghỉ phép và payroll reporting.',
          persona: 'celebratory',
        },
        {
          id: 'seed-memoir-infra-1',
          projectId: 'seed-project-infra',
          title: 'Reliability guardrails',
          content:
            'Infra backlog xoay quanh SLO, alerting, deployment safety và incident response.',
          persona: 'technical',
        },
      ],
    });
  }

  if (hasTable('Attachment')) {
    await prisma.attachment.createMany({
      data: [
        {
          id: 'seed-att-1',
          name: 'checkout-wireframe.png',
          key: 'seed/attachments/checkout-wireframe.png',
          url: 'https://cdn.techviet.local/seed/checkout-wireframe.png',
          size: BigInt(284112),
          mimeType: 'image/png',
          taskId: 'seed-task-ecom-5',
          aiContext: 'Wireframe checkout mobile with condensed address flow.',
          aiMetadata: { source: 'figma-export', confidence: 0.93 },
        },
        {
          id: 'seed-att-2',
          name: 'incident-runbook.pdf',
          key: 'seed/attachments/incident-runbook.pdf',
          url: 'https://cdn.techviet.local/seed/incident-runbook.pdf',
          size: BigInt(821004),
          mimeType: 'application/pdf',
          taskId: 'seed-task-infra-3',
          aiContext: 'Runbook for memory leak incident response.',
          aiMetadata: { source: 'docs-export', confidence: 0.89 },
        },
        {
          id: 'seed-att-3',
          name: 'payroll-report-sample.xlsx',
          key: 'seed/attachments/payroll-report-sample.xlsx',
          url: 'https://cdn.techviet.local/seed/payroll-report-sample.xlsx',
          size: BigInt(145212),
          mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          taskId: 'seed-task-hr-3',
          aiContext: 'Sample payroll report for HR verification.',
          aiMetadata: { source: 'generated', confidence: 0.84 },
        },
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

  if (hasTable('ProjectEmbedding')) {
    for (const project of ALL_PROJECT_SPECS) {
      await upsertEmbedding(
        'ProjectEmbedding',
        'projectId',
        project.id,
        `${project.name}\n${project.description}`,
      );
    }
  }

  if (hasTable('TaskEmbedding')) {
    for (const task of ALL_TASKS) {
      await upsertEmbedding(
        'TaskEmbedding',
        'taskId',
        task.id,
        `${task.title}\n${task.description}`,
      );
    }
  }

  if (hasTable('DocEmbedding')) {
    const docs = await prisma.doc.findMany({
      where: { id: { startsWith: 'seed-doc-' } },
      select: { id: true, title: true, content: true },
    });

    for (const doc of docs) {
      const content = doc.content ? JSON.stringify(doc.content).slice(0, 2000) : '';
      await upsertEmbedding('DocEmbedding', 'docId', doc.id, `${doc.title}\n${content}`);
    }
  }

  if (hasTable('SignalEmbedding')) {
    const signals = await prisma.signalLog.findMany({
      where: { id: { startsWith: 'seed-signal-' } },
      select: { id: true, interpretation: true, payload: true },
    });

    for (const signal of signals) {
      await upsertEmbedding(
        'SignalEmbedding',
        'signalId',
        signal.id,
        `${signal.interpretation}\n${JSON.stringify(signal.payload)}`,
      );
    }
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
