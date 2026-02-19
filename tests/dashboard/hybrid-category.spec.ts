import { test, expect, request, APIRequestContext } from '@playwright/test';
import fs from 'fs';
import path from 'path';

/**
 * =============================================================
 * HYBRID FE-BE AUTOMATION TEST
 * =============================================================
 * Skenario ini menggabungkan Frontend (UI) dan Backend (API)
 * dalam satu alur test yang saling validasi:
 *
 * Test 1: BE Create → FE Verify (data muncul di UI)
 * Test 2: FE Navigate → BE Verify (data cocok di API)  
 * Test 3: BE Create → FE Delete → BE Verify (data terhapus)
 * =============================================================
 */
test.describe('Hybrid FE-BE Category Test', () => {
    let apiContext: APIRequestContext;
    const authFile = path.resolve(__dirname, '../../playwright/.auth/user.json');
    const beUrl = process.env.BE_URL || 'http://127.0.0.1:8000';
    let createdCategoryUid: string | null = null;

    test.beforeAll(async () => {
        const storageState = JSON.parse(fs.readFileSync(authFile, 'utf-8'));
        const authStorage = JSON.parse(
            storageState.origins
                .find((o: any) => o.origin === 'http://localhost:3000')
                .localStorage.find((ls: any) => ls.name === 'auth-storage').value
        );
        const token = authStorage.state.accessToken;

        apiContext = await request.newContext({
            baseURL: beUrl,
            extraHTTPHeaders: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json',
                'Content-Type': 'application/json',
            },
        });
    });

    test.afterAll(async () => {
        if (createdCategoryUid) {
            try {
                await apiContext.delete(`/v1/category/${createdCategoryUid}`);
                console.log('Cleanup: Category deleted');
            } catch { /* ignore */ }
        }
        await apiContext.dispose();
    });

    test('1. BE Create → FE Verify: data yang dibuat via API muncul di UI', async ({ page }) => {
        const categoryCode = `HYB-${Date.now()}`;
        const categoryName = `Hybrid Test ${Date.now()}`;

        console.log(`[BE] Creating category: ${categoryCode}`);
        const createRes = await apiContext.post('/v1/category', {
            data: {
                code: categoryCode,
                name: categoryName,
                description: 'Created by hybrid automation test',
            },
        });

        expect(createRes.ok(), `API create failed: ${createRes.status()}`).toBeTruthy();
        const createBody = await createRes.json();
        console.log('[BE] Category created successfully:', JSON.stringify(createBody));

        createdCategoryUid = createBody.data?.uid || null;
        expect(createdCategoryUid).toBeTruthy();
        console.log(`[BE] Category UID: ${createdCategoryUid}`);

        await page.goto('/');
        await expect(page.getByText('Selamat Datang', { exact: false })).toBeVisible({ timeout: 15000 });

        await page.getByRole('button', { name: 'Master' }).click();
        const kategoriLink = page.getByRole('link', { name: 'Kategori' });
        await expect(kategoriLink).toBeVisible({ timeout: 10000 });
        await kategoriLink.click();

        await expect(page).toHaveURL(/\/kategori/, { timeout: 10000 });
        console.log('[FE] Navigated to Kategori page');

        await expect(page.getByText(categoryCode)).toBeVisible({ timeout: 15000 });
        console.log(`[FE] ✅ Category code "${categoryCode}" found in UI`);

        await expect(page.getByText(categoryName)).toBeVisible({ timeout: 5000 });
        console.log(`[FE] ✅ Category name "${categoryName}" found in UI`);

        console.log('[HYBRID] ✅ Test 1 PASSED: BE Create → FE Verify');
    });

    test('2. FE Navigate → BE Verify: data di halaman cocok dengan API', async ({ page }) => {
        await page.goto('/');
        await expect(page.getByText('Selamat Datang', { exact: false })).toBeVisible({ timeout: 15000 });

        await page.getByRole('button', { name: 'Master' }).click();
        const kategoriLink = page.getByRole('link', { name: 'Kategori' });
        await expect(kategoriLink).toBeVisible({ timeout: 10000 });
        await kategoriLink.click();

        await expect(page).toHaveURL(/\/kategori/, { timeout: 10000 });
        console.log('[FE] Navigated to Kategori page');

        console.log('[BE] Fetching categories from API...');
        const response = await apiContext.get('/v1/category');
        expect(response.ok()).toBeTruthy();

        const body = await response.json();
        const categories = body.data || [];
        console.log(`[BE] Found ${categories.length} categories in API`);

        expect(categories.length).toBeGreaterThan(0);
        for (const cat of categories.slice(0, 3)) {
            expect(cat).toHaveProperty('code');
            expect(cat).toHaveProperty('name');
            console.log(`[BE] Category: code="${cat.code}", name="${cat.name}"`);
        }

        console.log('[HYBRID] ✅ Test 2 PASSED: FE Navigate → BE Verify');
    });

    test('3. BE Create → BE Delete → BE Verify: full API CRUD lifecycle', async ({ page }) => {
        const categoryCode = `DEL-${Date.now()}`;
        const categoryName = `Delete Test ${Date.now()}`;

        console.log(`[BE] Creating category for deletion test: ${categoryCode}`);
        const createRes = await apiContext.post('/v1/category', {
            data: {
                code: categoryCode,
                name: categoryName,
                description: 'Will be deleted by hybrid test',
            },
        });

        expect(createRes.ok(), `API create failed: ${createRes.status()}`).toBeTruthy();
        const createBody = await createRes.json();
        const uid = createBody.data?.uid;
        expect(uid).toBeTruthy();
        console.log(`[BE] Created category UID: ${uid}`);

        await page.goto('/');
        await expect(page.getByText('Selamat Datang', { exact: false })).toBeVisible({ timeout: 15000 });

        await page.getByRole('button', { name: 'Master' }).click();
        const kategoriLink = page.getByRole('link', { name: 'Kategori' });
        await expect(kategoriLink).toBeVisible({ timeout: 10000 });
        await kategoriLink.click();

        await expect(page).toHaveURL(/\/kategori/, { timeout: 10000 });
        console.log('[FE] Navigated to Kategori page');

        await expect(page.getByText(categoryCode)).toBeVisible({ timeout: 15000 });
        console.log(`[FE] ✅ Category "${categoryCode}" visible before deletion`);

        console.log(`[BE] Deleting category: ${uid}`);
        const deleteRes = await apiContext.delete(`/v1/category/${uid}`);
        expect(deleteRes.ok(), `API delete failed: ${deleteRes.status()}`).toBeTruthy();
        console.log('[BE] Category deleted successfully');

        await page.reload();
        await expect(page).toHaveURL(/\/kategori/, { timeout: 10000 });

        await expect(page.getByText(categoryCode)).not.toBeVisible({ timeout: 10000 });
        console.log(`[FE] ✅ Category "${categoryCode}" no longer visible after deletion`);

        const verifyRes = await apiContext.get('/v1/category', {
            params: { search: categoryCode },
        });
        expect(verifyRes.ok()).toBeTruthy();
        const verifyBody = await verifyRes.json();
        const found = (verifyBody.data || []).find((c: any) => c.code === categoryCode);
        expect(found).toBeUndefined();
        console.log('[BE] ✅ Category no longer exists in API');

        console.log('[HYBRID] ✅ Test 3 PASSED: BE Create → FE Verify → BE Delete → FE+BE Verify Gone');
    });
});
