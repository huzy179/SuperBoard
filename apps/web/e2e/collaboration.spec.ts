import { test, expect } from '@playwright/test';

test.describe('Full Collaboration Flow', () => {
  const randomSuffix = Math.floor(Math.random() * 10000);
  const workspaceName = `E2E Workspace ${randomSuffix}`;
  const projectName = `E2E Project ${randomSuffix}`;
  const taskTitle = `E2E Task ${randomSuffix}`;

  test('should complete the full collaboration flow', async ({ page }) => {
    // 1. Login
    await page.goto('/login');
    await page.fill('input[type="email"]', 'nguyen.minh.tuan@techviet.local');
    await page.fill('input[type="password"]', 'Passw0rd!');
    await page.click('button[type="submit"]');

    // Wait for redirect to dashboard or jira
    await expect(page).toHaveURL(/.*(dashboard|jira)/);

    // 2. Create Workspace
    await page.goto('/settings');
    await page.click('#e2e-open-create-ws-button');
    await page.fill('#e2e-ws-name-input', workspaceName);
    const slug = `e2e-ws-${randomSuffix}`;
    await page.fill('#e2e-ws-slug-input', slug);
    await page.click('#e2e-ws-submit-button');

    // After success, it reloads the page. Let's wait for the workspace to be available.
    // In our implementation, we simply reload. Let's wait for the reload.

    // 3. Invite Member
    // Switch to Workspace tab in Settings
    await page.click('button:has-text("Workspace")');
    await page.click('button:has-text("Mời thành viên")');
    await page.fill('input#email', 'le.van.duc@techviet.local');
    await page.selectOption('select#role', 'member');
    await page.click('button:has-text("Tạo lời mời")');

    // Verify invitation success
    await expect(page.locator('text=Lời mời đã sẵn sàng')).toBeVisible();
    await page.click('button:has-text("Hoàn tất")');

    // 4. Create Project
    await page.goto('/jira');
    await page.click('button:has-text("Tạo dự án")');
    await page.fill('input[placeholder*="Tên dự án"]', projectName);
    // Submit in ProjectForm
    await page.click('button[type="submit"]:has-text("Tạo dự án")');

    // Verify project created and navigate to it
    await expect(page.locator(`text=${projectName}`)).toBeVisible();
    await page.click(`text=${projectName}`);

    // 5. Create Task
    // Clicking "+ Thêm task" in the first column (likely "To Do")
    await page.click('button:has-text("+ Thêm task")');
    await page.fill('input[placeholder*="Thiết kế flow login mới"]', taskTitle);
    await page.click('button[type="submit"]:has-text("Tạo task")');

    // Verify task visibility
    await expect(page.locator(`text=${taskTitle}`)).toBeVisible();

    // 6. Post Comment
    // Open the task detail
    await page.click(`text=${taskTitle}`);
    await page.fill('textarea[placeholder*="Viết bình luận"]', 'This is an E2E test comment');
    await page.click('button:has-text("Gửi")');

    // Verify comment posted
    await expect(page.locator('text=This is an E2E test comment')).toBeVisible();

    // 7. Archive Task
    await page.click('button:has-text("Lưu trữ task")');

    // After archiving, the slide-over should close and task should disappear from board
    // Usually there's a toast message "Đã lưu trữ task"
    await expect(page.locator('text=Đã lưu trữ task')).toBeVisible();
    await expect(page.locator(`text=${taskTitle}`)).not.toBeVisible();
  });
});
