import { chromium, expect } from '@playwright/test';
import { mkdtempSync, mkdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createApplication } from '../server/index.mjs';

mkdirSync('artifacts', { recursive: true });
const dataDir = mkdtempSync(join(tmpdir(), 'portfolio-browser-'));
const application = await createApplication({ dataDir, production: true });
await new Promise((done) => application.server.listen(0, '127.0.0.1', done));
const base = `http://127.0.0.1:${application.server.address().port}`;
const browser = await chromium.launch({ args: ['--no-sandbox'] });
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
const page = await context.newPage();
const errors = [];
page.on('pageerror', (error) => errors.push(error.message));
const pass = (message) => console.log(`PASS ${message}`);
try {
  await page.goto(base, { waitUntil: 'networkidle' });
  await expect(page.locator('.page-loader')).toHaveCount(0);
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Vano');
  await page.getByRole('link', { name: 'Explore my work' }).click();
  await page.getByRole('tab', { name: 'UI/UX Design' }).click();
  await expect(page.locator('.project-card')).toHaveCount(2);
  await page.getByRole('tab', { name: 'All projects' }).click();
  await expect(page.locator('.project-card')).toHaveCount(4);
  await page.locator('.project-card').first().click();
  await expect(page).toHaveURL(/\/projects\/forma-studio$/);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Forma Studio');
  await page.getByRole('button', { name: 'Perbesar gambar project' }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.locator('.next-project a').click();
  await expect(page).toHaveURL(/\/projects\/orbit-dashboard$/);
  await page.waitForTimeout(700);
  await page.goBack();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Forma Studio');
  await page.getByRole('link', { name: 'Back to selected work' }).click();
  await expect(page).toHaveURL(/\/#projects$/);
  await page.waitForTimeout(700);
  await page.getByRole('button', { name: /Motion & Interaction/ }).click();
  await expect(page.getByRole('button', { name: /Motion & Interaction/ })).toHaveAttribute(
    'aria-expanded',
    'true',
  );
  await page.getByRole('button', { name: 'Gunakan tema terang' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await page.getByRole('button', { name: 'Gunakan tema gelap' }).click();
  pass('Navigation, project filters, route transitions, gallery, accordion, and theme');

  await page.locator('input[name="name"]').fill('Browser Test Visitor');
  await page.locator('input[name="email"]').fill('browser@example.com');
  await page
    .locator('textarea[name="message"]')
    .fill('Hello from the browser integration test. I would like to discuss a project.');
  await page.getByRole('button', { name: 'Kirim pesan', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Pesanmu sudah masuk.' })).toBeVisible();
  pass('Contact form stores a real message');

  await page.goto(`${base}/admin`, { waitUntil: 'networkidle' });
  await page.getByLabel('Password', { exact: true }).fill('admin');
  await page.getByRole('button', { name: 'Enter the studio' }).click();
  await expect(page.getByRole('heading', { name: 'Hello, Vano.' })).toBeVisible();
  await page.screenshot({ path: 'artifacts/admin-dashboard.png' });
  pass('Basic admin/admin login opens the dashboard directly');
  await page.getByRole('button', { name: 'Keamanan', exact: true }).click();
  await page.getByLabel('Password saat ini', { exact: true }).fill('admin');
  await page.getByLabel('Password baru', { exact: true }).fill('StudioBrowser2026!');
  await page.getByLabel('Konfirmasi password baru', { exact: true }).fill('StudioBrowser2026!');
  await page.getByRole('button', { name: 'Perbarui password' }).click();
  await expect(page.getByRole('status')).toContainText('Password berhasil diganti');
  pass('Password can still be changed securely from the Security settings');

  await page.getByRole('button', { name: 'Profil saya', exact: true }).click();
  await page.getByLabel('Nama lengkap', { exact: true }).fill('Dimas Pratama');
  await page.getByLabel('Nama panggilan', { exact: true }).fill('Dimas');
  await page.getByLabel('Wordmark / brand', { exact: false }).fill('dimas');
  await page
    .getByLabel('Unggah foto profil', { exact: true })
    .setInputFiles('public/images/portrait.webp');
  await expect(page.getByLabel('URL foto profil', { exact: true })).toHaveValue(
    /^\/uploads\/.+\.webp$/,
  );
  await page.getByRole('button', { name: 'Simpan perubahan' }).click();
  await expect(page.getByRole('status')).toContainText('Perubahan disimpan');
  const visitor = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    reducedMotion: 'reduce',
  });
  const publicPage = await visitor.newPage();
  await publicPage.goto(base, { waitUntil: 'networkidle' });
  await expect(publicPage.getByRole('heading', { level: 1 })).toContainText('Dimas');
  await expect(publicPage.locator('.hero-lanyard .portrait-original')).toHaveAttribute(
    'src',
    /^\/uploads\//,
  );
  await visitor.close();
  pass('Profile and optimized uploaded image are visible in a separate visitor session');

  await page.getByRole('button', { name: 'Skills & services', exact: true }).click();
  await page.getByRole('button', { name: 'Tambah layanan' }).click();
  await page.getByLabel('Nama layanan').last().fill('Brand Systems');
  await page
    .getByLabel('Deskripsi', { exact: true })
    .last()
    .fill('A clear design system for your brand.');
  await page.getByLabel('Teknologi / tools').last().fill('Figma, Strategy');
  await page.getByRole('button', { name: 'Pindahkan Brand Systems ke atas' }).click();
  await page.getByRole('button', { name: 'Simpan perubahan' }).click();
  await expect(page.getByRole('button', { name: 'Simpan perubahan' })).toBeDisabled();
  let latest = await (await fetch(`${base}/api/content`)).json();
  if (latest.skills[2].title !== 'Brand Systems')
    throw new Error('Skill reordering was not persisted');
  await page.getByRole('button', { name: 'Hapus skill Brand Systems' }).click();
  await page.getByRole('button', { name: 'Simpan perubahan' }).click();
  await expect(page.getByRole('button', { name: 'Simpan perubahan' })).toBeDisabled();
  pass('Skills can be created, edited, reordered, deleted, and persisted');

  await page.getByRole('button', { name: 'Konten halaman', exact: true }).click();
  await page
    .getByLabel('Footer: catatan pendek', { exact: true })
    .fill('A thoughtful browser-tested portfolio.');
  await page.getByRole('button', { name: 'Simpan perubahan' }).click();
  await expect(page.getByRole('button', { name: 'Simpan perubahan' })).toBeDisabled();
  await page.getByRole('button', { name: 'Informasi kontak', exact: true }).click();
  await page.getByLabel('Email kontak', { exact: true }).fill('dimas@example.com');
  await page.getByRole('button', { name: 'Simpan perubahan' }).click();
  await expect(page.getByRole('button', { name: 'Simpan perubahan' })).toBeDisabled();
  latest = await (await fetch(`${base}/api/content`)).json();
  if (
    latest.profile.email !== 'dimas@example.com' ||
    latest.pages.footerNote !== 'A thoughtful browser-tested portfolio.'
  )
    throw new Error('Page and contact changes were not persisted');
  pass('Page copy and contact configuration are saved globally');

  await page.getByRole('button', { name: 'Projects', exact: true }).click();
  await page.getByRole('button', { name: 'Tambah project' }).click();
  let dialog = page.getByRole('dialog');
  await dialog.getByLabel('Judul project', { exact: true }).fill('Browser Integration Project');
  await dialog
    .getByLabel('Ringkasan singkat', { exact: true })
    .fill('A complete browser-tested project.');
  await dialog
    .getByLabel('Cerita project', { exact: true })
    .fill('This project was created from the real admin interface and stored in SQLite.');
  await dialog
    .getByLabel('Unggah cover project', { exact: true })
    .setInputFiles('public/images/project-forma.webp');
  await expect(dialog.getByLabel('URL gambar cover', { exact: true })).toHaveValue(
    /^\/uploads\/.+\.webp$/,
  );
  await dialog
    .getByLabel('Galeri project (opsional)', { exact: false })
    .fill('/images/interior.webp');
  await dialog.getByRole('button', { name: 'Simpan project' }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  let tile = page.locator('.admin-project-tile').filter({ hasText: 'Browser Integration Project' });
  await expect(tile).toBeVisible();
  await tile.getByRole('button', { name: 'Edit project' }).click();
  dialog = page.getByRole('dialog');
  await dialog
    .getByLabel('Judul project', { exact: true })
    .fill('Browser Integration Project Edited');
  await dialog.getByRole('button', { name: 'Simpan project' }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  tile = page
    .locator('.admin-project-tile')
    .filter({ hasText: 'Browser Integration Project Edited' });
  await expect(tile).toBeVisible();
  await tile
    .getByRole('button', { name: 'Hapus Browser Integration Project Edited', exact: true })
    .click();
  await page
    .getByRole('dialog')
    .getByRole('button', { name: 'Hapus project', exact: true })
    .click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.locator('.admin-project-tile')).toHaveCount(4);
  pass('Projects can be created, given uploaded covers and galleries, edited, and deleted');

  await page.getByRole('button', { name: /Pesan masuk/ }).click();
  await page.locator('.inbox-message').filter({ hasText: 'Browser Test Visitor' }).click();
  await expect(page.locator('.inbox-detail')).toContainText(
    'Hello from the browser integration test.',
  );
  await expect(page.getByRole('link', { name: 'Balas via email' })).toHaveAttribute(
    'href',
    /^mailto:browser@example.com/,
  );
  await page.screenshot({ path: 'artifacts/admin-inbox.png' });
  pass('The contact submission reaches the admin inbox and can be read and replied to');

  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole('button', { name: 'Buka navigasi studio' }).click();
  await expect(page.locator('.admin-sidebar')).toHaveClass(/open/);
  await page.getByRole('button', { name: 'Ringkasan', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Hello, Dimas.' })).toBeVisible();
  await expect(page.locator('.admin-sidebar')).not.toHaveClass(/open/);
  await page.waitForTimeout(350);
  await page.screenshot({ path: 'artifacts/admin-mobile.png' });
  await page.goto(base, { waitUntil: 'networkidle' });
  await expect(page.locator('.page-loader')).toHaveCount(0);
  await page.getByRole('button', { name: 'Buka menu navigasi' }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.getByRole('dialog').getByRole('link', { name: '02 About' }).click();
  await expect(page.getByRole('dialog')).not.toBeVisible();
  await page.waitForTimeout(1200);
  if (await page.evaluate(() => document.documentElement.scrollWidth > innerWidth))
    throw new Error('Mobile layout overflows horizontally');
  pass('Mobile admin navigation, animated public menu, and responsive layout');

  const reduced = await browser.newContext({
    viewport: { width: 390, height: 844 },
    reducedMotion: 'reduce',
  });
  const reducedPage = await reduced.newPage();
  await reducedPage.goto(base, { waitUntil: 'networkidle' });
  await expect(reducedPage.locator('.page-loader')).toHaveCount(0);
  await expect(reducedPage.locator('.hero-words')).toHaveCSS('opacity', '1');
  await reducedPage.locator('#contact').scrollIntoViewIfNeeded();
  await expect(reducedPage.locator('.contact-copy')).toBeVisible();
  await reduced.close();
  pass('Reduced-motion visitors receive visible content and native scrolling');
  if (errors.length) throw new Error(`Browser runtime errors: ${errors.join('; ')}`);
  pass('No browser runtime errors in the complete production workflow');
} catch (error) {
  await page.screenshot({ path: 'artifacts/browser-test-failure.png', fullPage: true });
  console.error(error);
  process.exitCode = 1;
} finally {
  await browser.close();
  await application.close();
  rmSync(dataDir, { recursive: true, force: true });
}
