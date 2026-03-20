import path from 'node:path';
import { existsSync } from 'node:fs';
import { randomBytes, scryptSync } from 'node:crypto';
import { config as dotenv } from 'dotenv';
import { PrismaPg } from '@prisma/adapter-pg';
import {
  PrismaClient,
  TaskPriority,
  WorkflowStatusCategory,
  TaskEventType,
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

// --- Data definitions ---

const WORKFLOW_STATUSES = [
  { key: 'todo', name: 'Cần làm', category: WorkflowStatusCategory.todo, position: 1 },
  {
    key: 'in_progress',
    name: 'Đang làm',
    category: WorkflowStatusCategory.in_progress,
    position: 2,
  },
  {
    key: 'in_review',
    name: 'Đang review',
    category: WorkflowStatusCategory.in_review,
    position: 3,
  },
  { key: 'done', name: 'Hoàn thành', category: WorkflowStatusCategory.done, position: 4 },
  { key: 'cancelled', name: 'Đã huỷ', category: WorkflowStatusCategory.blocked, position: 5 },
];

const USER_SPECS = [
  {
    email: 'nguyen.minh.tuan@techviet.local',
    fullName: 'Nguyễn Minh Tuấn',
    wsRole: WorkspaceMemberRole.owner,
    roleKey: 'workspace-owner',
  },
  {
    email: 'tran.thi.lan@techviet.local',
    fullName: 'Trần Thị Lan',
    wsRole: WorkspaceMemberRole.admin,
    roleKey: 'workspace-admin',
  },
  {
    email: 'le.van.duc@techviet.local',
    fullName: 'Lê Văn Đức',
    wsRole: WorkspaceMemberRole.member,
    roleKey: 'workspace-member',
  },
  {
    email: 'pham.ngoc.anh@techviet.local',
    fullName: 'Phạm Ngọc Anh',
    wsRole: WorkspaceMemberRole.member,
    roleKey: 'workspace-member',
  },
  {
    email: 'hoang.quoc.bao@techviet.local',
    fullName: 'Hoàng Quốc Bảo',
    wsRole: WorkspaceMemberRole.member,
    roleKey: 'workspace-member',
  },
  {
    email: 'vo.thi.mai@techviet.local',
    fullName: 'Võ Thị Mai',
    wsRole: WorkspaceMemberRole.member,
    roleKey: 'workspace-member',
  },
] as const;

// PLACEHOLDER_PROJECTS

const PROJECT_SPECS = [
  {
    id: 'seed-project-ecom',
    name: 'Nền tảng Thương mại Điện tử',
    description: 'Xây dựng hệ thống mua sắm trực tuyến B2C với tích hợp thanh toán VNPay và Momo',
    color: '#2563eb',
    icon: '🛒',
  },
  {
    id: 'seed-project-banking',
    name: 'Ứng dụng Mobile Banking',
    description:
      'Phát triển app ngân hàng di động cho iOS và Android với tính năng chuyển khoản, nạp tiền',
    color: '#059669',
    icon: '🏦',
  },
  {
    id: 'seed-project-hr',
    name: 'Cổng thông tin Nhân sự',
    description: 'Hệ thống quản lý nhân viên, chấm công, tính lương và đánh giá hiệu suất nội bộ',
    color: '#7c3aed',
    icon: '👥',
  },
  {
    id: 'seed-project-infra',
    name: 'Hạ tầng & DevOps',
    description:
      'Thiết lập CI/CD pipeline, Kubernetes cluster và monitoring stack cho toàn bộ hệ thống',
    color: '#dc2626',
    icon: '⚙️',
  },
];

// User index: 0=Tuấn, 1=Lan, 2=Đức, 3=Anh, 4=Bảo, 5=Mai
type TaskSpec = {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: TaskPriority;
  assigneeIdx: number | null;
  dueDate: string | null;
  position: string;
};

// PLACEHOLDER_TASKS

const TASKS_BY_PROJECT: Record<string, TaskSpec[]> = {
  'seed-project-ecom': [
    {
      id: 'seed-task-ecom-1',
      title: 'Thiết kế database schema cho sản phẩm và danh mục',
      description:
        'Bao gồm bảng products, categories, product_variants, product_images. Hỗ trợ multi-tenant.',
      status: 'done',
      priority: TaskPriority.high,
      assigneeIdx: 2,
      dueDate: '2026-02-15',
      position: '1000',
    },
    {
      id: 'seed-task-ecom-2',
      title: 'Xây dựng API quản lý sản phẩm (CRUD)',
      description:
        'REST API cho tạo, sửa, xoá, lấy danh sách sản phẩm. Hỗ trợ pagination, filter theo category.',
      status: 'done',
      priority: TaskPriority.high,
      assigneeIdx: 2,
      dueDate: '2026-02-28',
      position: '2000',
    },
    {
      id: 'seed-task-ecom-3',
      title: 'Tích hợp cổng thanh toán VNPay',
      description:
        'Implement VNPay sandbox, xử lý callback IPN, verify checksum. Hỗ trợ QR code và thẻ nội địa.',
      status: 'in_progress',
      priority: TaskPriority.urgent,
      assigneeIdx: 3,
      dueDate: '2026-03-25',
      position: '3000',
    },
    {
      id: 'seed-task-ecom-4',
      title: 'Thiết kế UI trang danh sách sản phẩm',
      description:
        'Responsive grid layout, filter sidebar, sort options. Theo design system đã thống nhất.',
      status: 'in_progress',
      priority: TaskPriority.medium,
      assigneeIdx: 5,
      dueDate: '2026-03-28',
      position: '4000',
    },
    {
      id: 'seed-task-ecom-5',
      title: 'Implement giỏ hàng và checkout flow',
      description:
        'Cart persistence (localStorage + API sync), address form, shipping method selection, order summary.',
      status: 'in_review',
      priority: TaskPriority.high,
      assigneeIdx: 2,
      dueDate: '2026-03-22',
      position: '5000',
    },
    {
      id: 'seed-task-ecom-6',
      title: 'Viết unit test cho order service',
      description:
        'Coverage tối thiểu 80% cho OrderService. Mock payment gateway, test edge cases (hết hàng, timeout).',
      status: 'todo',
      priority: TaskPriority.medium,
      assigneeIdx: 4,
      dueDate: '2026-04-05',
      position: '6000',
    },
    {
      id: 'seed-task-ecom-7',
      title: 'Tối ưu query tìm kiếm sản phẩm với Elasticsearch',
      description:
        'Index products vào ES, implement full-text search với Vietnamese analyzer, autocomplete suggestions.',
      status: 'todo',
      priority: TaskPriority.low,
      assigneeIdx: null,
      dueDate: '2026-04-20',
      position: '7000',
    },
  ],
  'seed-project-banking': [
    {
      id: 'seed-task-bank-1',
      title: 'Thiết kế kiến trúc microservices cho core banking',
      description:
        'Tách thành account-service, transaction-service, notification-service. Dùng event-driven architecture.',
      status: 'done',
      priority: TaskPriority.urgent,
      assigneeIdx: 0,
      dueDate: '2026-01-31',
      position: '1000',
    },
    {
      id: 'seed-task-bank-2',
      title: 'Implement xác thực 2 lớp (OTP SMS)',
      description:
        'Tích hợp Twilio/SpeedSMS cho OTP. Rate limiting 5 lần/phút. OTP expire sau 5 phút.',
      status: 'done',
      priority: TaskPriority.urgent,
      assigneeIdx: 3,
      dueDate: '2026-02-20',
      position: '2000',
    },
    {
      id: 'seed-task-bank-3',
      title: 'Xây dựng màn hình chuyển khoản nội bộ',
      description:
        'Form nhập số tài khoản, số tiền, nội dung. Xác nhận bằng OTP. Hiển thị biên lai sau khi thành công.',
      status: 'in_progress',
      priority: TaskPriority.high,
      assigneeIdx: 5,
      dueDate: '2026-03-20',
      position: '3000',
    },
    {
      id: 'seed-task-bank-4',
      title: 'Tích hợp API Napas cho chuyển khoản liên ngân hàng',
      description:
        'Kết nối Napas gateway, xử lý reconciliation, retry mechanism cho failed transactions.',
      status: 'in_progress',
      priority: TaskPriority.urgent,
      assigneeIdx: 2,
      dueDate: '2026-03-18',
      position: '4000',
    },
    {
      id: 'seed-task-bank-5',
      title: 'Kiểm thử bảo mật (penetration testing)',
      description:
        'OWASP Top 10 checklist, SQL injection, XSS, CSRF testing. Dùng Burp Suite và OWASP ZAP.',
      status: 'in_review',
      priority: TaskPriority.urgent,
      assigneeIdx: 4,
      dueDate: '2026-03-21',
      position: '5000',
    },
    {
      id: 'seed-task-bank-6',
      title: 'Thiết kế màn hình lịch sử giao dịch',
      description: 'Danh sách giao dịch với filter theo ngày, loại, trạng thái. Export PDF/Excel.',
      status: 'todo',
      priority: TaskPriority.medium,
      assigneeIdx: 5,
      dueDate: '2026-04-10',
      position: '6000',
    },
    {
      id: 'seed-task-bank-7',
      title: 'Viết tài liệu API cho mobile team',
      description: 'Swagger/OpenAPI spec cho tất cả endpoints. Bao gồm examples và error codes.',
      status: 'todo',
      priority: TaskPriority.low,
      assigneeIdx: null,
      dueDate: '2026-04-15',
      position: '7000',
    },
  ],
  // PLACEHOLDER_MORE_TASKS
  'seed-project-hr': [
    {
      id: 'seed-task-hr-1',
      title: 'Phân tích yêu cầu và lập tài liệu đặc tả',
      description:
        'Thu thập requirements từ phòng HR, viết SRS document. Bao gồm use case diagrams.',
      status: 'done',
      priority: TaskPriority.high,
      assigneeIdx: 1,
      dueDate: '2026-02-10',
      position: '1000',
    },
    {
      id: 'seed-task-hr-2',
      title: 'Thiết kế ERD cho module nhân viên',
      description:
        'Bảng employees, departments, positions, contracts. Quan hệ manager-subordinate.',
      status: 'done',
      priority: TaskPriority.medium,
      assigneeIdx: 2,
      dueDate: '2026-02-25',
      position: '2000',
    },
    {
      id: 'seed-task-hr-3',
      title: 'Xây dựng module chấm công theo ca',
      description:
        'Hỗ trợ ca sáng/chiều/đêm, OT calculation, nghỉ phép tích hợp. API check-in/check-out.',
      status: 'in_progress',
      priority: TaskPriority.high,
      assigneeIdx: 4,
      dueDate: '2026-03-30',
      position: '3000',
    },
    {
      id: 'seed-task-hr-4',
      title: 'Implement tính năng xin nghỉ phép online',
      description:
        'Form xin phép, approval workflow (manager → HR), tính số ngày phép còn lại tự động.',
      status: 'in_progress',
      priority: TaskPriority.medium,
      assigneeIdx: 3,
      dueDate: '2026-04-05',
      position: '4000',
    },
    {
      id: 'seed-task-hr-5',
      title: 'Tích hợp LDAP/Active Directory cho SSO',
      description: 'Đồng bộ user từ AD, auto-provision accounts, group mapping sang roles.',
      status: 'todo',
      priority: TaskPriority.high,
      assigneeIdx: null,
      dueDate: '2026-04-15',
      position: '5000',
    },
    {
      id: 'seed-task-hr-6',
      title: 'Xây dựng báo cáo lương tháng dạng PDF',
      description:
        'Template payslip PDF, tính gross/net, BHXH/BHYT/TNCN. Gửi email tự động cuối tháng.',
      status: 'todo',
      priority: TaskPriority.medium,
      assigneeIdx: null,
      dueDate: '2026-04-25',
      position: '6000',
    },
    {
      id: 'seed-task-hr-7',
      title: 'Viết test E2E cho luồng onboarding nhân viên mới',
      description:
        'Playwright tests cho flow: tạo nhân viên → gán phòng ban → cấp tài khoản → gửi welcome email.',
      status: 'todo',
      priority: TaskPriority.low,
      assigneeIdx: null,
      dueDate: '2026-05-01',
      position: '7000',
    },
  ],
  'seed-project-infra': [
    {
      id: 'seed-task-infra-1',
      title: 'Thiết lập Kubernetes cluster trên GKE',
      description:
        '3 node pools (system, app, worker), autoscaling 2-10 nodes, private cluster với Cloud NAT.',
      status: 'done',
      priority: TaskPriority.urgent,
      assigneeIdx: 0,
      dueDate: '2026-02-05',
      position: '1000',
    },
    {
      id: 'seed-task-infra-2',
      title: 'Cấu hình CI/CD pipeline với GitHub Actions',
      description:
        'Build → test → lint → Docker build → push to GCR → deploy to GKE. Separate staging/production.',
      status: 'done',
      priority: TaskPriority.high,
      assigneeIdx: 4,
      dueDate: '2026-02-18',
      position: '2000',
    },
    {
      id: 'seed-task-infra-3',
      title: 'Triển khai Prometheus + Grafana monitoring',
      description:
        'Prometheus scrape metrics, Grafana dashboards cho API latency, error rate, resource usage.',
      status: 'in_progress',
      priority: TaskPriority.high,
      assigneeIdx: 4,
      dueDate: '2026-03-25',
      position: '3000',
    },
    {
      id: 'seed-task-infra-4',
      title: 'Cấu hình Nginx Ingress và SSL certificates',
      description:
        "Cert-manager với Let's Encrypt, wildcard cert cho *.techviet.dev, rate limiting rules.",
      status: 'done',
      priority: TaskPriority.medium,
      assigneeIdx: 0,
      dueDate: '2026-03-01',
      position: '4000',
    },
    {
      id: 'seed-task-infra-5',
      title: 'Thiết lập log aggregation với ELK Stack',
      description:
        'Filebeat → Logstash → Elasticsearch → Kibana. Structured JSON logging, retention 30 ngày.',
      status: 'in_progress',
      priority: TaskPriority.medium,
      assigneeIdx: 2,
      dueDate: '2026-04-01',
      position: '5000',
    },
    {
      id: 'seed-task-infra-6',
      title: 'Viết runbook cho incident response',
      description:
        'Quy trình xử lý sự cố: escalation matrix, communication template, post-mortem checklist.',
      status: 'todo',
      priority: TaskPriority.low,
      assigneeIdx: null,
      dueDate: '2026-04-20',
      position: '6000',
    },
    {
      id: 'seed-task-infra-7',
      title: 'Tối ưu Docker image size cho production',
      description:
        'Multi-stage builds, Alpine base, .dockerignore cleanup. Target: giảm từ 1.2GB xuống < 300MB.',
      status: 'todo',
      priority: TaskPriority.medium,
      assigneeIdx: null,
      dueDate: '2026-04-10',
      position: '7000',
    },
    {
      id: 'seed-task-infra-8',
      title: 'Cấu hình auto-scaling policy cho các service',
      description:
        'HPA dựa trên CPU/memory, custom metrics (request rate). Min 2 replicas cho production.',
      status: 'in_review',
      priority: TaskPriority.high,
      assigneeIdx: 0,
      dueDate: '2026-03-22',
      position: '8000',
    },
  ],
};

// PLACEHOLDER_COMMENTS

type CommentSpec = { id: string; taskId: string; authorIdx: number; content: string };

const COMMENTS: CommentSpec[] = [
  {
    id: 'seed-cmt-1',
    taskId: 'seed-task-ecom-3',
    authorIdx: 3,
    content:
      'Đã liên hệ với team VNPay, họ cần thêm 2 ngày để cấp sandbox credentials. Tạm thời dùng mock data để unblock frontend.',
  },
  {
    id: 'seed-cmt-2',
    taskId: 'seed-task-ecom-3',
    authorIdx: 2,
    content:
      'Lưu ý: VNPay yêu cầu IP whitelist cho production. Cần nhờ anh Bảo mở port trên firewall trước khi go-live.',
  },
  {
    id: 'seed-cmt-3',
    taskId: 'seed-task-bank-4',
    authorIdx: 2,
    content:
      'Napas API docs khá cũ, một số endpoint đã deprecated. Đang chờ confirm từ phía họ về version mới nhất.',
  },
  {
    id: 'seed-cmt-4',
    taskId: 'seed-task-bank-4',
    authorIdx: 0,
    content:
      'Anh đã escalate lên account manager của Napas rồi. Họ hứa sẽ có response trong 24h. Cứ proceed với v2 API trước.',
  },
  {
    id: 'seed-cmt-5',
    taskId: 'seed-task-bank-5',
    authorIdx: 4,
    content:
      'Found 2 medium-severity issues: missing rate limiting on OTP endpoint and JWT secret rotation not implemented. Đang fix.',
  },
  {
    id: 'seed-cmt-6',
    taskId: 'seed-task-bank-5',
    authorIdx: 1,
    content:
      'Cần fix xong trước ngày 21/3 để kịp demo cho ban lãnh đạo. Priority cao nhất tuần này.',
  },
  {
    id: 'seed-cmt-7',
    taskId: 'seed-task-ecom-5',
    authorIdx: 2,
    content:
      'Checkout flow đã xong phần happy path. Đang handle edge cases: hết hàng khi đang checkout, payment timeout.',
  },
  {
    id: 'seed-cmt-8',
    taskId: 'seed-task-hr-3',
    authorIdx: 4,
    content:
      'Cần clarify với HR: ca đêm (22h-6h) tính OT như thế nào? Hiện tại logic đang tính sai cho ca split qua ngày.',
  },
  {
    id: 'seed-cmt-9',
    taskId: 'seed-task-hr-3',
    authorIdx: 1,
    content:
      'Đã confirm với chị Hương bên HR: ca đêm tính 150% lương cơ bản, không phân biệt ngày thường hay cuối tuần.',
  },
  {
    id: 'seed-cmt-10',
    taskId: 'seed-task-infra-3',
    authorIdx: 4,
    content:
      'Dashboard Grafana đã setup xong cho API latency và error rate. Đang thêm alerts cho disk usage > 80%.',
  },
  {
    id: 'seed-cmt-11',
    taskId: 'seed-task-infra-1',
    authorIdx: 0,
    content:
      'Cluster đã stable sau 2 tuần. Node pool đang chạy n2-standard-4, cost khoảng $800/tháng. Cần review lại sizing sau khi có traffic thực.',
  },
  {
    id: 'seed-cmt-12',
    taskId: 'seed-task-ecom-6',
    authorIdx: 3,
    content:
      'Suggest dùng jest-mock-extended cho việc mock Prisma client. Sẽ clean hơn nhiều so với manual mocking.',
  },
];

// PLACEHOLDER_MAIN

async function main() {
  console.log('🌱 Seeding database...');
  const defaultPassword = 'Passw0rd!';

  // 1. Workspace
  const workspace = await prisma.workspace.upsert({
    where: { slug: 'techviet' },
    update: { name: 'TechViet Solutions', plan: WorkspacePlan.free },
    create: { name: 'TechViet Solutions', slug: 'techviet', plan: WorkspacePlan.free },
  });
  console.log(`  ✓ Workspace: ${workspace.name}`);

  // 2. Permissions
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
  for (const key of permissionKeys) {
    await prisma.permission.upsert({
      where: { key },
      update: {},
      create: { key, description: `Permission: ${key}` },
    });
  }
  console.log(`  ✓ Permissions: ${permissionKeys.length}`);

  // 3. Roles
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
      ],
    },
    {
      key: 'workspace-viewer',
      name: 'Workspace Viewer',
      perms: ['workspace.read', 'project.read', 'task.read'],
    },
  ];
  for (const spec of roleSpecs) {
    const role = await prisma.role.upsert({
      where: { key: spec.key },
      update: { name: spec.name },
      create: { key: spec.key, name: spec.name, isSystem: true },
    });
    for (const permKey of spec.perms) {
      const perm = await prisma.permission.findUniqueOrThrow({ where: { key: permKey } });
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: role.id, permissionId: perm.id } },
        update: {},
        create: { roleId: role.id, permissionId: perm.id },
      });
    }
  }
  console.log(`  ✓ Roles: ${roleSpecs.length}`);

  // PLACEHOLDER_USERS

  // 4. Users
  const users: Array<{ id: string; fullName: string }> = [];
  for (const spec of USER_SPECS) {
    const user = await prisma.user.upsert({
      where: { email: spec.email },
      update: {
        passwordHash: hashPassword(defaultPassword),
        fullName: spec.fullName,
        isActive: true,
        defaultWorkspaceId: workspace.id,
      },
      create: {
        email: spec.email,
        passwordHash: hashPassword(defaultPassword),
        fullName: spec.fullName,
        isActive: true,
        defaultWorkspaceId: workspace.id,
      },
    });
    users.push({ id: user.id, fullName: user.fullName });

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
  }
  console.log(`  ✓ Users: ${users.map((u) => u.fullName).join(', ')}`);

  // 5. Projects + Workflow Statuses + Tasks
  for (const spec of PROJECT_SPECS) {
    const project = await prisma.project.upsert({
      where: { id: spec.id },
      update: {
        name: spec.name,
        description: spec.description,
        color: spec.color,
        icon: spec.icon,
        isArchived: false,
      },
      create: {
        id: spec.id,
        name: spec.name,
        description: spec.description,
        color: spec.color,
        icon: spec.icon,
        workspaceId: workspace.id,
      },
    });
    console.log(`  ✓ Project: ${project.name}`);

    // Seed workflow statuses for this project
    for (const ws of WORKFLOW_STATUSES) {
      await prisma.projectWorkflowStatus.upsert({
        where: { projectId_key: { projectId: project.id, key: ws.key } },
        update: { name: ws.name, category: ws.category, position: ws.position },
        create: {
          projectId: project.id,
          key: ws.key,
          name: ws.name,
          category: ws.category,
          position: ws.position,
        },
      });
    }

    // Seed tasks
    const tasks = TASKS_BY_PROJECT[spec.id] ?? [];
    for (const t of tasks) {
      const assigneeId = t.assigneeIdx !== null ? (users[t.assigneeIdx]?.id ?? null) : null;
      const task = await prisma.task.upsert({
        where: { id: t.id },
        update: {
          title: t.title,
          description: t.description,
          status: t.status,
          priority: t.priority,
          position: t.position,
          assigneeId,
          dueDate: t.dueDate ? new Date(t.dueDate) : null,
        },
        create: {
          id: t.id,
          title: t.title,
          description: t.description,
          status: t.status,
          priority: t.priority,
          position: t.position,
          assigneeId,
          dueDate: t.dueDate ? new Date(t.dueDate) : null,
          projectId: project.id,
        },
      });
      await prisma.taskEvent.upsert({
        where: { id: `seed-event-created-${task.id}` },
        update: {},
        create: {
          id: `seed-event-created-${task.id}`,
          taskId: task.id,
          actorId: users[0]!.id,
          type: TaskEventType.created,
          payload: { title: t.title },
        },
      });
    }
    console.log(`    ✓ Tasks: ${tasks.length}`);
  }

  // 6. Comments
  for (const c of COMMENTS) {
    const authorId = users[c.authorIdx]?.id;
    if (!authorId) continue;
    await prisma.comment.upsert({
      where: { id: c.id },
      update: { content: c.content, taskId: c.taskId },
      create: { id: c.id, taskId: c.taskId, authorId, content: c.content },
    });
  }
  console.log(`  ✓ Comments: ${COMMENTS.length}`);

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
