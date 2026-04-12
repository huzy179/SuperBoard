# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: collaboration.spec.ts >> Full Collaboration Flow >> should complete the full collaboration flow
- Location: e2e/collaboration.spec.ts:9:7

# Error details

```
Error: expect(page).toHaveURL(expected) failed

Expected pattern: /.*(dashboard|jira)/
Received string:  "http://localhost:3333/login"
Timeout: 5000ms

Call log:
  - Expect "toHaveURL" with timeout 5000ms
    9 × unexpected value "http://localhost:3333/login"

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
    - generic [ref=e2]:
        - banner [ref=e3]:
            - generic [ref=e4]:
                - generic [ref=e5]:
                    - generic [ref=e7]: SB
                    - generic [ref=e8]:
                        - paragraph [ref=e9]: SuperBoard
                        - paragraph [ref=e10]: Access Portal
                - paragraph [ref=e11]: Enterprise Access
        - main [ref=e12]:
            - generic [ref=e14]:
                - heading "Đăng nhập SuperBoard" [level=1] [ref=e15]
                - paragraph [ref=e16]: Đăng nhập MVP (tài khoản seed đã có sẵn).
                - generic [ref=e17]:
                    - generic [ref=e18]:
                        - text: Email
                        - textbox "Email" [ref=e19]: nguyen.minh.tuan@techviet.local
                    - generic [ref=e20]:
                        - text: Mật khẩu
                        - textbox "Mật khẩu" [ref=e21]: Passw0rd!
                    - button "Đăng nhập" [ref=e22] [cursor=pointer]
                - paragraph [ref=e23]: Failed to fetch
                - paragraph [ref=e24]: 'Tài khoản seed: nguyen.minh.tuan@techviet.local / Passw0rd!'
        - contentinfo [ref=e25]:
            - generic [ref=e26]:
                - paragraph [ref=e27]: SuperBoard Platform
                - generic [ref=e28]:
                    - generic [ref=e29]: © 2026 SuperBoard
                    - generic [ref=e31]: Identity gateway
    - region "Notifications alt+T"
    - button "Open Next.js Dev Tools" [ref=e37] [cursor=pointer]:
        - img [ref=e38]
    - alert [ref=e41]
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  |
  3  | test.describe('Full Collaboration Flow', () => {
  4  |   const randomSuffix = Math.floor(Math.random() * 10000);
  5  |   const workspaceName = `E2E Workspace ${randomSuffix}`;
  6  |   const projectName = `E2E Project ${randomSuffix}`;
  7  |   const taskTitle = `E2E Task ${randomSuffix}`;
  8  |
  9  |   test('should complete the full collaboration flow', async ({ page }) => {
  10 |     // 1. Login
  11 |     await page.goto('/login');
  12 |     await page.fill('input[type="email"]', 'nguyen.minh.tuan@techviet.local');
  13 |     await page.fill('input[type="password"]', 'Passw0rd!');
  14 |     await page.click('button[type="submit"]');
  15 |
  16 |     // Wait for redirect to dashboard or jira
> 17 |     await expect(page).toHaveURL(/.*(dashboard|jira)/);
     |                        ^ Error: expect(page).toHaveURL(expected) failed
  18 |
  19 |     // 2. Create Workspace
  20 |     await page.goto('/settings');
  21 |     await page.click('#e2e-open-create-ws-button');
  22 |     await page.fill('#e2e-ws-name-input', workspaceName);
  23 |     const slug = `e2e-ws-${randomSuffix}`;
  24 |     await page.fill('#e2e-ws-slug-input', slug);
  25 |     await page.click('#e2e-ws-submit-button');
  26 |
  27 |     // After success, it reloads the page. Let's wait for the workspace to be available.
  28 |     // In our implementation, we simply reload. Let's wait for the reload.
  29 |
  30 |     // 3. Invite Member
  31 |     // Switch to Workspace tab in Settings
  32 |     await page.click('button:has-text("Workspace")');
  33 |     await page.click('button:has-text("Mời thành viên")');
  34 |     await page.fill('input#email', 'le.van.duc@techviet.local');
  35 |     await page.selectOption('select#role', 'member');
  36 |     await page.click('button:has-text("Tạo lời mời")');
  37 |
  38 |     // Verify invitation success
  39 |     await expect(page.locator('text=Lời mời đã sẵn sàng')).toBeVisible();
  40 |     await page.click('button:has-text("Hoàn tất")');
  41 |
  42 |     // 4. Create Project
  43 |     await page.goto('/jira');
  44 |     await page.click('button:has-text("Tạo dự án")');
  45 |     await page.fill('input[placeholder*="Tên dự án"]', projectName);
  46 |     // Submit in ProjectForm
  47 |     await page.click('button[type="submit"]:has-text("Tạo dự án")');
  48 |
  49 |     // Verify project created and navigate to it
  50 |     await expect(page.locator(`text=${projectName}`)).toBeVisible();
  51 |     await page.click(`text=${projectName}`);
  52 |
  53 |     // 5. Create Task
  54 |     // Clicking "+ Thêm task" in the first column (likely "To Do")
  55 |     await page.click('button:has-text("+ Thêm task")');
  56 |     await page.fill('input[placeholder*="Thiết kế flow login mới"]', taskTitle);
  57 |     await page.click('button[type="submit"]:has-text("Tạo task")');
  58 |
  59 |     // Verify task visibility
  60 |     await expect(page.locator(`text=${taskTitle}`)).toBeVisible();
  61 |
  62 |     // 6. Post Comment
  63 |     // Open the task detail
  64 |     await page.click(`text=${taskTitle}`);
  65 |     await page.fill('textarea[placeholder*="Viết bình luận"]', 'This is an E2E test comment');
  66 |     await page.click('button:has-text("Gửi")');
  67 |
  68 |     // Verify comment posted
  69 |     await expect(page.locator('text=This is an E2E test comment')).toBeVisible();
  70 |
  71 |     // 7. Archive Task
  72 |     await page.click('button:has-text("Lưu trữ task")');
  73 |
  74 |     // After archiving, the slide-over should close and task should disappear from board
  75 |     // Usually there's a toast message "Đã lưu trữ task"
  76 |     await expect(page.locator('text=Đã lưu trữ task')).toBeVisible();
  77 |     await expect(page.locator(`text=${taskTitle}`)).not.toBeVisible();
  78 |   });
  79 | });
  80 |
```
