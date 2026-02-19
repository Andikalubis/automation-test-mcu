import { test, expect } from '@playwright/test';

test.describe('Dashboard CRUD Operations', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/');
        await expect(page).not.toHaveURL(/signin/);
    });

    test('should view dashboard statistics', async ({ page }) => {
        await expect(page.getByText('Selamat Datang, Admin Profile', { exact: false })).toBeVisible();
        await expect(page.getByText('Puskesmas Sehat Sentosa')).toBeVisible();

        await expect(page.getByText('Pasien Baru')).toBeVisible();
        await expect(page.getByText('Konsultasi Hari Ini')).toBeVisible();
        await expect(page.getByText('Jadwal MCU')).toBeVisible();
    });

    test('should navigate to sidebar menus', async ({ page }) => {
        await page.getByRole('link', { name: 'Profile Perusahaan' }).click();
        await expect(page.getByRole('heading', { name: 'Profil Perusahaan' })).toBeVisible();
        await expect(page).toHaveURL(/\/profil_perusahaan/);

        await page.getByRole('link', { name: 'Daftar Project' }).click();
        await expect(page.getByRole('heading', { name: 'Daftar Project' })).toBeVisible();
        await expect(page).toHaveURL(/\/daftar_project/);

        await page.getByRole('link', { name: 'Hasil Pemeriksaan' }).click();
        await expect(page.getByRole('heading', { name: 'Hasil Pemeriksaan' })).toBeVisible();
        await expect(page).toHaveURL(/\/hasil_pemeriksaan/);
    });

    test('should open master data dropdown', async ({ page }) => {
        await page.getByRole('button', { name: 'Master' }).click();

        await expect(page.getByRole('link', { name: 'Dokter' })).toBeVisible();
        await expect(page.getByRole('link', { name: 'Form' })).toBeVisible();
        await expect(page.getByRole('link', { name: 'Kategori' })).toBeVisible();
    });
});

