import { readFileSync as readLanguageFile } from 'node:fs';
import express from 'express';
import session from 'express-session';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';
import multer from 'multer';
import sharp from 'sharp';
import { randomBytes, randomUUID } from 'node:crypto';
import { resolve, join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createServer as createHttpServer } from 'node:http';
import { openDatabase, hashPassword, verifyPassword } from './database.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const text = (value, max = 5000) => typeof value === 'string' && value.length <= max;
const safeUrl = (value, local = false) =>
  text(value, 2048) &&
  (value === '' ||
    /^https:\/\/[^\s]+$/.test(value) ||
    (local && /^\/(images|uploads)\/[a-zA-Z0-9._/-]+$/.test(value)));
const stringList = (value, max = 30) =>
  Array.isArray(value) && value.length <= max && value.every((item) => text(item, 150));
const projectValid = (p) =>
  p &&
  ['id', 'slug', 'title', 'category', 'year', 'summary', 'description', 'challenge'].every((key) =>
    text(p[key], key === 'description' || key === 'challenge' ? 10000 : 500),
  ) &&
  p.title.trim() &&
  /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(p.slug) &&
  safeUrl(p.image, true) &&
  safeUrl(p.url) &&
  stringList(p.tools) &&
  Array.isArray(p.gallery) &&
  p.gallery.length <= 12 &&
  p.gallery.every((url) => safeUrl(url, true)) &&
  typeof p.featured === 'boolean';
const skillValid = (s) =>
  s &&
  text(s.id, 100) &&
  text(s.title, 200) &&
  s.title.trim() &&
  text(s.description, 3000) &&
  stringList(s.tools);
const educationValid = (item) =>
  item &&
  ['id', 'school', 'degree', 'period', 'location', 'description'].every((key) =>
    text(item[key], key === 'description' ? 3000 : 250),
  ) &&
  item.school.trim() &&
  safeUrl(item.logo, true);
const frameworkValid = (item) =>
  item &&
  ['id', 'name', 'category', 'description', 'symbol'].every((key) =>
    text(item[key], key === 'description' ? 3000 : 200),
  ) &&
  item.name.trim() &&
  safeUrl(item.logo, true);

const LANGUAGE_CODES = new Set(
  JSON.parse(readLanguageFile(new URL('../shared/languages.json', import.meta.url), 'utf8')).map(
    ([code]) => code,
  ),
);

export async function createApplication({
  dataDir = process.env.DATA_DIR || join(root, 'data'),
  production = process.env.NODE_ENV === 'production',
  frontend = true,
} = {}) {
  const storage = openDatabase(dataDir);
  const { db, getContent, saveContent } = storage;
  const app = express();
  const httpServer = createHttpServer(app);
  app.disable('x-powered-by');
  app.set('trust proxy', 1);
  app.use(
    helmet({
      contentSecurityPolicy: production
        ? {
            directives: {
              defaultSrc: ["'self'"],
              scriptSrc: [
                "'self'",
                "'unsafe-inline'",
                'https://translate.google.com',
                'https://translate.googleapis.com',
                'https://www.gstatic.com',
              ],
              styleSrc: [
                "'self'",
                "'unsafe-inline'",
                'https://translate.googleapis.com',
                'https://www.gstatic.com',
              ],
              frameSrc: ['https://translate.google.com'],
              imgSrc: ["'self'", 'https:', 'data:', 'blob:'],
              fontSrc: ["'self'", 'data:'],
              connectSrc: ["'self'", 'https://translate.googleapis.com', 'https://translate.google.com'],
              objectSrc: ["'none'"],
              baseUri: ["'self'"],
              frameAncestors: ["'none'"],
              upgradeInsecureRequests: null,
            },
          }
        : false,
      crossOriginEmbedderPolicy: false,
    }),
  );
  app.use(express.json({ limit: '512kb' }));
  app.use('/api', (_req, res, next) => {
    res.set('Cache-Control', 'no-store');
    next();
  });
  app.use(
    '/api',
    session({
      name: 'portfolio.sid',
      secret: storage.secret,
      store: storage.store,
      resave: false,
      saveUninitialized: false,
      cookie: { httpOnly: true, sameSite: 'lax', secure: 'auto', maxAge: 8 * 60 * 60 * 1000 },
    }),
  );

  // Origin checks and a session-bound token protect authenticated mutations.
  app.use('/api', (req, res, next) => {
    if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) return next();
    const origin = req.get('origin');
    const expectedHost = req.get('x-forwarded-host') || req.get('host');
    if (origin) {
      try {
        if (new URL(origin).host !== expectedHost)
          return res.status(403).json({ error: 'Origin tidak diizinkan.' });
      } catch {
        return res.status(403).json({ error: 'Origin tidak valid.' });
      }
    }
    if (req.path === '/messages') return next();
    if (!req.session.csrfToken || req.get('X-CSRF-Token') !== req.session.csrfToken)
      return res.status(403).json({ error: 'Sesi keamanan berakhir. Muat ulang halaman.' });
    next();
  });

  const getAdmin = (req) =>
    req.session.adminId
      ? db
          .prepare('SELECT id, username, must_change FROM admins WHERE id = ?')
          .get(req.session.adminId)
      : null;
  const requireAdmin = (req, res, next) => {
    const admin = getAdmin(req);
    if (!admin) return res.status(401).json({ error: 'Silakan login terlebih dahulu.' });
    if (admin.must_change)
      return res.status(403).json({ error: 'Wajib mengganti password sebelum mengelola konten.' });
    next();
  };
  const authResponse = (req) => {
    if (!req.session.csrfToken) req.session.csrfToken = randomBytes(32).toString('hex');
    const admin = getAdmin(req);
    return {
      authenticated: !!admin,
      username: admin?.username,
      mustChangePassword: !!admin?.must_change,
      csrfToken: req.session.csrfToken,
    };
  };
  app.get('/api/health', (_req, res) => res.json({ ok: true, storage: 'sqlite' }));
  app.get('/api/content', (_req, res) => res.json(getContent()));
  app.get('/api/auth/me', (req, res) => res.json(authResponse(req)));
  const loginLimit = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 15,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    skipSuccessfulRequests: true,
    message: { error: 'Terlalu banyak percobaan login. Coba lagi dalam 15 menit.' },
  });
  app.post('/api/auth/login', loginLimit, (req, res, next) => {
    const { username, password } = req.body || {};
    const admin = text(username, 100)
      ? db.prepare('SELECT * FROM admins WHERE username = ?').get(username)
      : null;
    if (!admin || !verifyPassword(password, admin.password))
      return res.status(401).json({ error: 'Username atau password salah.' });
    req.session.regenerate((error) => {
      if (error) return next(error);
      req.session.adminId = admin.id;
      res.json(authResponse(req));
    });
  });
  app.post('/api/auth/password', loginLimit, (req, res) => {
    const admin = getAdmin(req);
    if (!admin) return res.status(401).json({ error: 'Silakan login terlebih dahulu.' });
    const current = db.prepare('SELECT password FROM admins WHERE id = ?').get(admin.id);
    const { currentPassword, newPassword } = req.body || {};
    if (!verifyPassword(currentPassword, current.password))
      return res.status(400).json({ error: 'Password saat ini tidak benar.' });
    if (
      !text(newPassword, 128) ||
      newPassword.length < 10 ||
      !/[A-Za-z]/.test(newPassword) ||
      !/[0-9]/.test(newPassword) ||
      newPassword === currentPassword
    )
      return res.status(400).json({
        error: 'Gunakan minimal 10 karakter, dengan huruf dan angka, berbeda dari password lama.',
      });
    db.transaction(() => {
      db.prepare('UPDATE admins SET password = ?, must_change = 0 WHERE id = ?').run(
        hashPassword(newPassword),
        admin.id,
      );
      db.prepare('DELETE FROM sessions WHERE sid != ?').run(req.sessionID);
    })();
    req.session.csrfToken = randomBytes(32).toString('hex');
    res.json(authResponse(req));
  });
  app.post('/api/auth/logout', (req, res) =>
    req.session.destroy(() => {
      res.clearCookie('portfolio.sid');
      res.json({ ok: true });
    }),
  );

  app.use('/api/admin', requireAdmin);
  app.put('/api/admin/content', (req, res) => {
    const { profile, pages, skills } = req.body || {};
    const current = getContent();
    const card = req.body?.card ?? current.card;
    const copy = req.body?.copy ?? current.copy;
    const education = req.body?.education ?? current.education;
    const frameworks = req.body?.frameworks ?? current.frameworks;
    const settings = req.body?.settings ?? current.settings;
    const profileKeys = Object.keys(current.profile).filter((key) => key !== 'available');
    if (
      !settings ||
      typeof settings.languageMode !== 'boolean' ||
      !LANGUAGE_CODES.has(settings.language) ||
      !profile ||
      !pages ||
      !profileKeys.every((key) => text(profile[key], 6000)) ||
      !profile.name.trim() ||
      !profile.firstName.trim() ||
      !profile.brand.trim() ||
      typeof profile.available !== 'boolean' ||
      !safeUrl(profile.portrait, true) ||
      !safeUrl(profile.portraitHover, true) ||
      !['github', 'instagram', 'linkedin'].every((key) => safeUrl(profile[key])) ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profile.email) ||
      !Object.keys(current.pages).every((key) => text(pages[key], 6000)) ||
      !Array.isArray(skills) ||
      skills.length > 30 ||
      !skills.every(skillValid) ||
      !card ||
      !Object.keys(current.card).every((key) => text(card[key], 6000)) ||
      !['portrait', 'portraitHover', 'signatureImage', 'logoImage'].every((key) =>
        safeUrl(card[key], true),
      ) ||
      !['accentColor', 'paperColor'].every((key) => /^#[a-fA-F0-9]{6}$/.test(card[key])) ||
      !copy ||
      !Object.keys(current.copy).every((key) => text(copy[key], 6000)) ||
      !Array.isArray(education) ||
      education.length > 30 ||
      !education.every(educationValid) ||
      !Array.isArray(frameworks) ||
      frameworks.length > 40 ||
      !frameworks.every(frameworkValid)
    )
      return res
        .status(400)
        .json({ error: 'Konten tidak valid. Periksa nama, email, URL, dan isian lainnya.' });
    const cleanProfile = Object.fromEntries(
      Object.keys(current.profile).map((key) => [key, profile[key]]),
    );
    const cleanPages = Object.fromEntries(
      Object.keys(current.pages).map((key) => [key, pages[key]]),
    );
    const cleanCard = Object.fromEntries(Object.keys(current.card).map((key) => [key, card[key]]));
    const cleanCopy = Object.fromEntries(Object.keys(current.copy).map((key) => [key, copy[key]]));
    res.json(
      saveContent({
        ...current,
        profile: cleanProfile,
        pages: cleanPages,
        skills,
        card: cleanCard,
        copy: cleanCopy,
        settings: { languageMode: settings.languageMode, language: settings.language },
        education,
        frameworks,
      }),
    );
  });
  app.post('/api/admin/projects', (req, res) => {
    const content = getContent();
    const project = { ...req.body, id: randomUUID() };
    if (!projectValid(project))
      return res.status(400).json({
        error: 'Project tidak valid. Judul, slug, gambar, dan deskripsi wajib diisi dengan benar.',
      });
    if (content.projects.some((p) => p.slug === project.slug))
      return res.status(409).json({ error: 'Slug project sudah digunakan.' });
    content.projects.unshift(project);
    saveContent(content);
    res.status(201).json(project);
  });
  app.put('/api/admin/projects/:id', (req, res) => {
    const content = getContent();
    const index = content.projects.findIndex((p) => p.id === req.params.id);
    if (index < 0) return res.status(404).json({ error: 'Project tidak ditemukan.' });
    const project = { ...req.body, id: req.params.id };
    if (!projectValid(project))
      return res.status(400).json({ error: 'Periksa kembali isian project dan format URL.' });
    if (content.projects.some((p) => p.slug === project.slug && p.id !== project.id))
      return res.status(409).json({ error: 'Slug project sudah digunakan.' });
    content.projects[index] = project;
    saveContent(content);
    res.json(project);
  });
  app.delete('/api/admin/projects/:id', (req, res) => {
    const content = getContent();
    if (!content.projects.some((p) => p.id === req.params.id))
      return res.status(404).json({ error: 'Project tidak ditemukan.' });
    content.projects = content.projects.filter((p) => p.id !== req.params.id);
    saveContent(content);
    res.json({ ok: true });
  });
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024, files: 1 },
    fileFilter: (_req, file, cb) =>
      cb(null, ['image/jpeg', 'image/png', 'image/webp', 'image/avif'].includes(file.mimetype)),
  });
  app.post('/api/admin/upload', upload.single('image'), async (req, res) => {
    if (!req.file)
      return res
        .status(400)
        .json({ error: 'Pilih gambar JPG, PNG, WebP, atau AVIF (maksimal 5 MB).' });
    const filename = `${randomUUID()}.webp`;
    try {
      await sharp(req.file.buffer, { limitInputPixels: 25000000, animated: false })
        .rotate()
        .resize({ width: 1800, height: 1800, fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 85 })
        .toFile(join(dataDir, 'uploads', filename));
      res.status(201).json({ url: `/uploads/${filename}` });
    } catch {
      res.status(400).json({
        error:
          'Gambar tidak dapat diproses. Gunakan gambar statis yang valid, maksimal 25 megapiksel.',
      });
    }
  });
  app.get('/api/admin/messages', (_req, res) =>
    res.json(db.prepare('SELECT * FROM messages ORDER BY id DESC').all()),
  );
  app.patch('/api/admin/messages/:id', (req, res) => {
    db.prepare('UPDATE messages SET is_read = 1 WHERE id = ?').run(req.params.id);
    res.json({ ok: true });
  });
  app.delete('/api/admin/messages/:id', (req, res) => {
    db.prepare('DELETE FROM messages WHERE id = ?').run(req.params.id);
    res.json({ ok: true });
  });
  const messageLimit = rateLimit({
    windowMs: 60000,
    limit: 5,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: { error: 'Tunggu sebentar sebelum mengirim pesan lagi.' },
  });
  app.post('/api/messages', messageLimit, (req, res) => {
    const { name, email, message, website } = req.body || {};
    if (website) return res.status(201).json({ ok: true });
    if (
      !text(name, 150) ||
      name.trim().length < 2 ||
      !text(email, 254) ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
      !text(message, 5000) ||
      message.trim().length < 10
    )
      return res
        .status(400)
        .json({ error: 'Isi nama, email yang valid, dan pesan minimal 10 karakter.' });
    db.prepare('INSERT INTO messages (name, email, message, created_at) VALUES (?, ?, ?, ?)').run(
      name.trim(),
      email.trim(),
      message.trim(),
      new Date().toISOString(),
    );
    res.status(201).json({ ok: true });
  });
  app.use('/api', (_req, res) => res.status(404).json({ error: 'Endpoint tidak ditemukan.' }));
  app.use(
    '/uploads',
    express.static(join(dataDir, 'uploads'), {
      maxAge: '1y',
      immutable: true,
      dotfiles: 'deny',
      setHeaders: (res) => res.set('X-Content-Type-Options', 'nosniff'),
    }),
  );

  let vite;
  if (frontend && !production) {
    const { createServer } = await import('vite');
    vite = await createServer({
      root,
      server: { middlewareMode: true, allowedHosts: true, hmr: { server: httpServer } },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else if (frontend) {
    app.use(express.static(join(root, 'dist'), { maxAge: '1h' }));
    app.get(/.*/, (_req, res) => res.sendFile(join(root, 'dist', 'index.html')));
  }
  app.use((error, _req, res, _next) => {
    console.error(error.message);
    res.status(error instanceof multer.MulterError ? 400 : 500).json({
      error:
        error instanceof multer.MulterError
          ? 'Gambar terlalu besar. Maksimal 5 MB.'
          : 'Terjadi kesalahan server. Silakan coba lagi.',
    });
  });
  return {
    app,
    server: httpServer,
    storage,
    close: async () => {
      await vite?.close();
      await new Promise((done) => httpServer.close(done));
      storage.close();
    },
  };
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const portIndex = process.argv.indexOf('--port');
  const port = Number(process.env.PORT || (portIndex !== -1 ? process.argv[portIndex + 1] : 5173));
  const application = await createApplication();
  application.server.listen(port, '0.0.0.0', () =>
    console.log(`Portfolio running at http://localhost:${port} | Admin: /admin`),
  );
  for (const signal of ['SIGTERM', 'SIGINT'])
    process.on(signal, async () => {
      await application.close();
      process.exit(0);
    });
}
