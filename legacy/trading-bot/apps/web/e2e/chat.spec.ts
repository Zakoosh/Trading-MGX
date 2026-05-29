import { test, expect } from '@playwright/test';

const MESSAGE = 'رسالة تجريبية';

test('streams chat tokens and final message', async ({ page }) => {
  await page.goto('/chat');

  await page.getByPlaceholder('اكتب الرسالة التي تريد إرسالها للوسيط...').fill(MESSAGE);
  await page.getByRole('button', { name: 'إرسال' }).click();

  const botMessage = page
    .locator('article')
    .filter({ hasText: 'اكتمل' })
    .filter({ hasText: MESSAGE });
  await expect(botMessage).toBeVisible({ timeout: 10_000 });

  await expect(botMessage.locator('text=التوكنات')).toBeVisible();
});
