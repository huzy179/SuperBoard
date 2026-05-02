import { test, expect } from '@playwright/test';

test.describe('Chat basic flows', () => {
  test('create channel, rename, leave', async ({ page }) => {
    const suffix = `${Date.now()}`.slice(-6);
    const channelName = `e2e-private-${suffix}`;
    const renamed = `e2e-renamed-${suffix}`;

    await page.goto('/login');
    await page.fill('input[type="email"]', 'nguyen.minh.tuan@techviet.local');
    await page.fill('input[type="password"]', 'Passw0rd!');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/.*(dashboard|jira)/);

    await page.goto('/chat');
    await page.click('[data-testid="chat-create-channel"]');
    await page.fill('[data-testid="create-channel-name"]', channelName);
    await page.selectOption('[data-testid="create-channel-type"]', 'PRIVATE');
    await page.click('[data-testid="create-channel-submit"]');

    // Wait until redirected to the new channel
    await expect(page).toHaveURL(/\/chat\/.+/);

    // Open more menu
    await page.click('button[aria-label="More"]');

    await page.fill('[data-testid="channel-rename-input"]', renamed);
    await page.click('[data-testid="channel-rename-save"]');

    // Header should reflect new name
    await expect(page.locator(`text=${renamed}`)).toBeVisible();

    // Leave channel
    await page.click('button[aria-label="More"]');
    await page.fill('[data-testid="channel-leave-confirm"]', 'leave');
    await page.click('[data-testid="channel-leave-submit"]');

    await expect(page).toHaveURL(/\/chat/);
    await expect(page.locator(`text=${renamed}`)).not.toBeVisible();
  });
});
