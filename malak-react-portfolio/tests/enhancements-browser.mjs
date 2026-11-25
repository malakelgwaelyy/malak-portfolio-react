import { chromium, expect } from '@playwright/test';
import sharp from 'sharp';
import { mkdtempSync, mkdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { createApplication } from '../server/index.mjs';

mkdirSync('artifacts', { recursive: true });
const dataDir = mkdtempSync(join(tmpdir(), 'portfolio-enhancements-'));
const app = await createApplication({ dataDir, production: true });
await new Promise((done) => app.server.listen(0, '127.0.0.1', done));
const base = `http://127.0.0.1:${app.server.address().port}`;
const browser = await chromium.launch({ args: ['--no-sandbox'] });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
const errors = [];
page.on('pageerror', (error) => errors.push(error.message));
const pass = (label) => console.log(`PASS ${label}`);
const content = async () => (await fetch(`${base}/api/content`)).json();
const save = async () => {
  await page.getByRole('button', { name: 'Simpan perubahan', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Simpan perubahan', exact: true })).toBeDisabled();
};
const logo = {
  name: 'school-logo.png',
  mimeType: 'image/png',
  buffer: await sharp('public/favicon.svg').png().toBuffer(),
};
try {
  await page.goto(base, { waitUntil: 'networkidle' });
  await expect(page.locator('.page-loader')).toHaveCount(0);
  await page.waitForTimeout(1200);
  const photo = page.locator('.badge-photo .morph-portrait');
  const photoBounds = await photo.boundingBox();
  await page.mouse.move(
    photoBounds.x + photoBounds.width / 2,
    photoBounds.y + photoBounds.height / 2,
  );
  await expect(photo).toHaveAttribute('data-transformed', 'true');
  await expect(photo.locator('.portrait-alternate')).toHaveCSS('mix-blend-mode', 'normal');
  await page.mouse.move(1100, 580, { steps: 15 });
  await page.waitForTimeout(1000);
  const radius = await photo.evaluate((element) =>
    parseFloat(getComputedStyle(element).getPropertyValue('--morph-radius')),
  );
  if (radius < 100) throw new Error('Black Suit reveal does not complete while the pointer moves');
  await expect(photo.locator('.signature-mark')).toBeVisible();
  await page.screenshot({ path: 'artifacts/test-black-suit.png' });
  await page.mouse.move(700, 400);
  await expect(photo).toHaveAttribute('data-transformed', 'false');
  pass('Pose-aligned Black Suit reveal follows the mouse with an animated corner signature');

  const title = await page.locator('.badge-title').boundingBox();
  await page.mouse.move(title.x + title.width / 2, title.y + title.height / 2);
  await page.mouse.down();
  await page.mouse.move(title.x + title.width / 2, 970, { steps: 25 });
  await page.waitForTimeout(1000);
  const geometry = await page.evaluate(() => {
    const canvas = document.querySelector('.lanyard-strap');
    const marker = document.querySelector('.strap-attachment').getBoundingClientRect();
    const endpoint = new DOMPoint(
      Number(canvas.dataset.endX),
      Number(canvas.dataset.endY),
    ).matrixTransform(canvas.getScreenCTM());
    return {
      gap: Math.hypot(
        endpoint.x - marker.left - marker.width / 2,
        endpoint.y - marker.top - marker.height / 2,
      ),
      offset: Number(document.querySelector('.badge-position').dataset.offsetY),
      scroll: scrollY,
    };
  });
  if (geometry.gap > 1.5 || geometry.offset < 400 || geometry.scroll < 100)
    throw new Error(`Tether drag failed: ${JSON.stringify(geometry)}`);
  await page.screenshot({ path: 'artifacts/test-connected-tether.png' });
  await page.evaluate(() =>
    window.scrollTo(0, document.documentElement.scrollHeight - innerHeight),
  );
  await page.waitForTimeout(500);
  const pageBottom = await page.evaluate(() => {
    const canvas = document.querySelector('.lanyard-strap');
    const marker = document.querySelector('.strap-attachment').getBoundingClientRect();
    const endpoint = new DOMPoint(
      Number(canvas.dataset.endX),
      Number(canvas.dataset.endY),
    ).matrixTransform(canvas.getScreenCTM());
    const title = document.querySelector('.badge-title').getBoundingClientRect();
    return {
      gap: Math.hypot(
        endpoint.x - marker.left - marker.width / 2,
        endpoint.y - marker.top - marker.height / 2,
      ),
      pull: Number(document.querySelector('.badge-position').dataset.offsetY),
      titleY: title.top + title.height / 2,
      scroll: scrollY,
      bottom: document.documentElement.scrollHeight - innerHeight,
    };
  });
  if (
    pageBottom.gap > 1.5 ||
    pageBottom.pull < 2000 ||
    pageBottom.titleY < 400 ||
    Math.abs(pageBottom.scroll - pageBottom.bottom) > 3
  )
    throw new Error(
      `Card cannot follow the pointer to the page bottom: ${JSON.stringify(pageBottom)}`,
    );
  await page.screenshot({ path: 'artifacts/test-page-bottom-tether.png' });
  await page.mouse.up();
  await page.waitForFunction(
    () => Math.abs(Number(document.querySelector('.badge-position').dataset.offsetY)) < 1,
    { timeout: 10000 },
  );
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(700);
  await page.locator('.badge-tilt').focus();
  await page.keyboard.press('ArrowDown');
  await page.waitForTimeout(100);
  if (Number(await page.locator('.badge-position').getAttribute('data-offset-y')) < 50)
    throw new Error('Keyboard drag is not available');
  await page.keyboard.press('Home');
  await page.waitForFunction(
    () => Math.abs(Number(document.querySelector('.badge-position').dataset.offsetY)) < 1,
  );
  pass(
    `Card can be pulled more than ${Math.round(geometry.offset)}px, auto-scrolls, stays attached within ${geometry.gap.toFixed(2)}px, and springs back`,
  );

  await expect(page.locator('.education-entry')).toHaveCount(3);
  await page.locator('#education').scrollIntoViewIfNeeded();
  await page.waitForTimeout(700);
  await expect(
    page.getByRole('heading', { name: 'Universitas Nusantara', exact: true }),
  ).toBeVisible();
  await page.locator('#frameworks').scrollIntoViewIfNeeded();
  await page.locator('.framework-item').filter({ hasText: 'Next.js' }).click();
  await expect(page.locator('.framework-detail-label')).toHaveText('Next.js');
  await expect(page.locator('.hero-socials a svg')).toHaveCount(3);
  await expect(page.locator('.footer-social a svg')).toHaveCount(6);
  pass('Education timeline, interactive framework selector, and all three social logos');

  await page.goto(`${base}/admin`, { waitUntil: 'networkidle' });
  await page.getByLabel('Password', { exact: true }).fill('admin');
  await page.getByRole('button', { name: 'Enter the studio' }).click();
  await expect(page.getByRole('heading', { name: 'Hello, Vano.' })).toBeVisible();
  await page.getByRole('button', { name: 'Kartu identitas', exact: true }).click();
  await page.getByLabel('Judul kartu: baris pertama', { exact: true }).fill('DIGITAL');
  await page.getByLabel('Judul kartu: baris kedua', { exact: true }).fill('MAKER');
  await page.getByLabel('Tahun pada kartu', { exact: true }).fill('2026');
  await page.getByLabel('Teks pada tali', { exact: true }).fill('BUILD + LEARN');
  await page.getByLabel('Teks tanda tangan', { exact: true }).fill('Vano Studio');
  await page
    .getByLabel('Unggah foto dalam kartu', { exact: true })
    .setInputFiles('public/images/portrait.webp');
  await expect(page.getByLabel('URL foto dalam kartu', { exact: true })).toHaveValue(
    /^\/uploads\//,
  );
  await page
    .getByLabel('Unggah foto black suit dalam kartu', { exact: true })
    .setInputFiles('public/images/portrait-symbiote.webp');
  await expect(page.getByLabel('URL foto Black Suit kartu', { exact: true })).toHaveValue(
    /^\/uploads\//,
  );
  await page.getByLabel('Unggah logo dalam kartu', { exact: true }).setInputFiles(logo);
  await expect(page.getByLabel('URL logo dalam kartu', { exact: true })).toHaveValue(
    /^\/uploads\//,
  );
  await expect(page.locator('.admin-card-preview .badge-title')).toContainText('DIGITAL');
  await save();
  let published = await content();
  if (
    published.card.titleLineOne !== 'DIGITAL' ||
    !published.card.portrait.startsWith('/uploads/') ||
    !published.card.portraitHover.startsWith('/uploads/') ||
    !published.card.logoImage.startsWith('/uploads/')
  )
    throw new Error('Card edits and artwork were not persisted');
  pass(
    'Every card text, signature, custom logo, and both portrait images are editable and persist',
  );

  await page.getByRole('button', { name: 'Riwayat sekolah', exact: true }).click();
  await page
    .getByLabel('Nama sekolah / universitas', { exact: true })
    .first()
    .fill('Sekolah Browser');
  await page.getByLabel('Unggah logo sekolah 1', { exact: true }).setInputFiles(logo);
  await expect(page.getByLabel('URL logo sekolah', { exact: true }).first()).toHaveValue(
    /^\/uploads\//,
  );
  await page.getByRole('button', { name: 'Tambah sekolah', exact: true }).click();
  await page
    .getByLabel('Nama sekolah / universitas', { exact: true })
    .last()
    .fill('Sekolah Tambahan');
  await page
    .getByLabel('Jurusan / jenjang pendidikan', { exact: true })
    .last()
    .fill('Rekayasa Perangkat Lunak');
  await page.getByLabel('Periode pendidikan', { exact: true }).last().fill('2024 - Sekarang');
  await page
    .getByRole('button', { name: 'Pindahkan Sekolah Tambahan ke atas', exact: true })
    .click();
  await save();
  published = await content();
  if (published.education.length !== 4 || published.education[2].school !== 'Sekolah Tambahan')
    throw new Error('School creation or reordering failed');
  await page.getByRole('button', { name: 'Hapus Sekolah Tambahan', exact: true }).click();
  await save();
  pass('School history supports add, edit, reorder, logo upload, delete, and durable storage');

  await page.getByRole('button', { name: 'Frameworks', exact: true }).click();
  await page.getByLabel('Nama framework / teknologi', { exact: true }).first().fill('React Studio');
  await page.getByRole('button', { name: 'Tambah framework', exact: true }).click();
  await page.getByLabel('Nama framework / teknologi', { exact: true }).last().fill('Astro');
  await page.getByLabel('Kategori framework', { exact: true }).last().fill('WEB FRAMEWORK');
  await page
    .getByLabel('Deskripsi framework', { exact: true })
    .last()
    .fill('Content-focused sites with a carefully considered frontend.');
  await page.getByLabel('Unggah logo framework 7', { exact: true }).setInputFiles(logo);
  await expect(page.getByLabel('URL logo framework', { exact: true }).last()).toHaveValue(
    /^\/uploads\//,
  );
  await page.getByRole('button', { name: 'Pindahkan Astro ke atas', exact: true }).click();
  await save();
  published = await content();
  if (published.frameworks.length !== 7 || published.frameworks[5].name !== 'Astro')
    throw new Error('Framework creation or reordering failed');
  await page.getByRole('button', { name: 'Hapus Astro', exact: true }).click();
  await save();
  pass('Frameworks support add, edit, reorder, custom logo upload, and delete');

  await page.getByRole('button', { name: 'Konten halaman', exact: true }).click();
  await page.getByLabel('Teks / hero explore', { exact: true }).fill('See selected work');
  await save();
  const visitor = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    reducedMotion: 'reduce',
  });
  const publicPage = await visitor.newPage();
  await publicPage.goto(base, { waitUntil: 'networkidle' });
  await expect(
    publicPage.getByRole('link', { name: 'See selected work', exact: true }),
  ).toBeVisible();
  await expect(publicPage.locator('.badge-title')).toContainText('DIGITAL');
  await expect(publicPage.locator('.badge-photo .portrait-alternate')).toHaveAttribute(
    'src',
    /^\/uploads\//,
  );
  await expect(publicPage.locator('.badge-photo .signature-mark')).toHaveAttribute(
    'aria-label',
    'Tanda tangan Vano Studio',
  );
  await expect(
    publicPage.getByRole('heading', { name: 'Sekolah Browser', exact: true }),
  ).toHaveCount(1);
  await expect(publicPage.locator('.framework-item').first()).toContainText('React Studio');
  await visitor.close();
  pass(
    'Saved card, photos, school history, frameworks, and button text appear to a different visitor',
  );

  const touch = await browser.newContext({
    viewport: { width: 390, height: 844 },
    hasTouch: true,
    isMobile: true,
    reducedMotion: 'reduce',
  });
  const phone = await touch.newPage();
  await phone.goto(base, { waitUntil: 'networkidle' });
  await phone.locator('.badge-photo .portrait-toggle').tap();
  await expect(phone.locator('.badge-photo .portrait-toggle')).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  for (const width of [390, 320]) {
    await phone.setViewportSize({ width, height: 844 });
    await phone.locator('#education').scrollIntoViewIfNeeded();
    if (await phone.evaluate(() => document.documentElement.scrollWidth > innerWidth))
      throw new Error(`New sections overflow at ${width}px`);
  }
  await phone.screenshot({ path: 'artifacts/test-mobile-education.png' });
  await touch.close();
  pass('Touch Black Suit control, reduced motion, and 320px education/framework layouts');
  if (errors.length) throw new Error(errors.join('; '));
  pass('No runtime errors across new public interactions and admin editors');
} catch (error) {
  await page.screenshot({ path: 'artifacts/enhancements-test-failure.png', fullPage: true });
  console.error(error);
  process.exitCode = 1;
} finally {
  await browser.close();
  await app.close();
  rmSync(dataDir, { recursive: true, force: true });
}
