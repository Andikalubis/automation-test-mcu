import { test as setup, expect } from '@playwright/test';
import path from 'path';

const authFile = path.resolve(__dirname, '../../playwright/.auth/user.json');

setup('authenticate', async ({ page }) => {

    const email = process.env.LOGIN_USERNAME || 'admin@gmail.com';
    const password = process.env.LOGIN_PASSWORD || 'admin123';

    await page.goto('/');
    await page.getByPlaceholder('Masukan email anda').fill(email);
    await page.getByPlaceholder('Masukan password anda').fill(password);
    await page.getByRole('button', { name: 'Masuk', exact: true }).click();
    await page.waitForURL(url => !url.href.includes('/signin'), { timeout: 15000 });
    const cookies = await page.context().cookies();
    console.log('Login attempt completed. Cookies found:', cookies.length);

    await page.context().storageState({ path: authFile });
});
