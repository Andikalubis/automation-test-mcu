import { test, expect } from '@playwright/test';

test.describe('Authenticated Tests', () => {
    test('should be logged in automatically', async ({ page }) => {
        await page.goto('/');
        await expect(page).not.toHaveURL(/signin/);

        await page.getByRole('button', { name: /admin profile/i }).click();
        await expect(page.getByRole('button', { name: /keluar/i })).toBeVisible();
    });
});
