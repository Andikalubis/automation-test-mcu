import { test, expect } from '@playwright/test';

test.describe('MCU Automation Tests', () => {
    test('Frontend should be accessible', async ({ page }) => {
        await page.goto('/');
        console.log('Accessed FE at:', page.url());
    });

    test('Backend API should be accessible', async ({ request }) => {
        const beUrl = process.env.BE_URL || 'http://127.0.0.1:8000';
        const response = await request.get(beUrl);
        console.log('Accessed BE at:', beUrl, 'Status:', response.status());

        expect([200, 401, 404]).toContain(response.status());
    });
});
