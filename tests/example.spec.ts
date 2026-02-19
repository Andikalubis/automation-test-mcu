import { test, expect } from '@playwright/test';

test.describe('MCU Automation Tests', () => {
    test('Frontend should be accessible', async ({ page }) => {
        await page.goto('/');
        // Adjust the title verification based on the actual FE title
        // await expect(page).toHaveTitle(/MCU/);
        console.log('Accessed FE at:', page.url());
    });

    test('Backend API should be accessible', async ({ request }) => {
        const beUrl = process.env.BE_URL || 'http://127.0.0.1:8000';
        const response = await request.get(beUrl);
        console.log('Accessed BE at:', beUrl, 'Status:', response.status());
        // We expect the BE to be reachable, even if it returns 404 or something else depending on the root route
        expect(response.ok() || response.status() === 404).toBeTruthy();
    });
});
