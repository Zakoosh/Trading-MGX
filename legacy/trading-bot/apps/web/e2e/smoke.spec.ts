import { test, expect } from '@playwright/test';

test('redirects root to dashboard', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveURL(/\/chat|\/dashboard/);
});
