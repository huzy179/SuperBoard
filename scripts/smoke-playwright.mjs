import { chromium } from 'playwright';

const BASE_URL = process.env.BASE_URL ?? 'http://localhost:3000';
const EMAIL = process.env.SMOKE_EMAIL ?? 'nguyen.minh.tuan@techviet.local';
const PASSWORD = process.env.SMOKE_PASSWORD ?? 'Passw0rd!';

function nowTag() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}_${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
}

async function run() {
  const results = {
    login: { pass: false, details: [] },
    errorState: { pass: false, details: [] },
    emptyState: { pass: false, details: [] },
    responsive: { pass: false, details: [] },
    consoleErrors: [],
  };

  const createdProjectName = `Empty State Test - ${nowTag()}`;
  const consoleErrors = [];
  const pageErrors = [];

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const page = await context.newPage();

  page.on('console', (msg) => {
    if (msg.type() !== 'error') return;
    const text = msg.text();
    // Common harmless noise from missing favicon/sourcemaps in dev.
    if (/Failed to load resource:.*404/.test(text)) return;
    consoleErrors.push(text);
  });
  page.on('pageerror', (err) => {
    pageErrors.push(err.message);
  });

  async function goto(path) {
    const url = `${BASE_URL}${path.startsWith('/') ? '' : '/'}${path}`;
    await page.goto(url, { waitUntil: 'domcontentloaded' });
  }

  async function expectText(text, timeoutMs = 15000) {
    await page.getByText(text, { exact: true }).waitFor({ timeout: timeoutMs });
  }

  try {
    // 1) LOGIN + HOME
    await goto('/login');
    await expectText('Đăng nhập SuperBoard');

    await page.getByLabel('Email').fill(EMAIL);
    await page.getByLabel('Mật khẩu').fill(PASSWORD);
    await page.getByRole('button', { name: 'Đăng nhập' }).click();

    // Next/Turbopack compile can delay navigation; assert by UI render instead of URL only.
    await page.getByText('Các dự án của bạn', { exact: false }).waitFor({ timeout: 60000 });
    results.login.pass = true;
    results.login.details.push('Redirect to /jira after valid login');

    // 2) ERROR STATE (invalid project)
    await goto('/jira/projects/invalid-id');
    await expectText('Không thể tải project');
    results.errorState.pass = true;
    results.errorState.details.push('Full-page error rendered for invalid project');

    // go back to list
    await page.getByRole('button', { name: 'Quay lại danh sách' }).click();
    await page.waitForURL(/\/jira$/, { timeout: 60000 });
    results.errorState.details.push('Action "Quay lại danh sách" navigates back to /jira');

    // 3) EMPTY STATE: create a new project then open it
    // open create panel
    await goto('/jira');
    await page
      .getByRole('button', { name: /Tạo dự án/ })
      .first()
      .click();

    // Wait for create form fields to be visible
    await page.getByLabel('Tên dự án').waitFor({ timeout: 20000 });
    await page.getByLabel('Tên dự án').fill(createdProjectName);
    await page.getByLabel('Icon').fill('📌');
    // ProjectForm: the text input for color uses placeholder "#2563eb"
    await page.getByPlaceholder('#2563eb').fill('#2563eb');
    await page.getByLabel('Mô tả').fill('Empty state smoke test');

    // submit form (avoid the header toggle button)
    const submitInForm = page.locator('form').getByRole('button', { name: 'Tạo dự án' });
    await submitInForm.last().click();

    // Wait for the newly created project card to show up.
    // If creation failed, ProjectForm renders an inline <p role="alert"> with error message.
    const errorAlert = page.locator('p[role="alert"]');
    const projectNameLocator = page.getByText(createdProjectName, { exact: false }).first();
    await Promise.race([
      projectNameLocator.waitFor({ timeout: 25000 }),
      errorAlert
        .first()
        .waitFor({ state: 'visible', timeout: 25000 })
        .then(async () => {
          const msg = await errorAlert.first().innerText();
          throw new Error(`Project creation failed: ${msg}`);
        }),
    ]);

    await projectNameLocator.click();
    await page.waitForURL(/\/jira\/projects\/.+/, { timeout: 60000 });

    await expectText('Project chưa có task');
    results.emptyState.pass = true;
    results.emptyState.details.push('Empty state card shown for project without tasks');

    // 4) RESPONSIVE: check view mode buttons at 3 breakpoints
    const viewButtons = [{ label: 'Board' }, { label: 'Danh sách' }, { label: 'Lịch' }];

    const sizes = [
      { width: 1920, height: 1080, name: 'desktop' },
      { width: 768, height: 900, name: 'tablet' },
      { width: 375, height: 900, name: 'mobile' },
    ];

    for (const s of sizes) {
      await page.setViewportSize({ width: s.width, height: s.height });
      // View buttons should remain visible/clickable.
      for (const b of viewButtons) {
        await page.getByRole('button', { name: b.label }).waitFor({ timeout: 10000 });
      }
      results.responsive.details.push(`Responsive check OK at ${s.name} (${s.width}px)`);
    }

    results.responsive.pass = true;
  } finally {
    results.consoleErrors = [...consoleErrors, ...pageErrors];
    await browser.close();
  }

  // Fail fast if console errors exist.
  const anyConsoleError = results.consoleErrors.length > 0;
  const anyFail =
    !results.login.pass ||
    !results.errorState.pass ||
    !results.emptyState.pass ||
    !results.responsive.pass ||
    anyConsoleError;

  console.log(JSON.stringify({ results }, null, 2));
  process.exit(anyFail ? 1 : 0);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
