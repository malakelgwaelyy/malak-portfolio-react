import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import sharp from 'sharp';
import { createApplication } from '../server/index.mjs';
import { hashPassword, verifyPassword } from '../server/database.mjs';

test('Portfolio API: authentication, persistence, project CRUD, uploads, and inbox', async (t) => {
  const dataDir = mkdtempSync(join(tmpdir(), 'portfolio-test-'));
  let app = await createApplication({ dataDir, frontend: false });
  let base;
  const listen = async () => {
    await new Promise((done) => app.server.listen(0, '127.0.0.1', done));
    base = `http://127.0.0.1:${app.server.address().port}`;
  };
  await listen();
  let cookie = '';
  let csrf = '';
  async function request(
    path,
    { method = 'GET', body, token = csrf, anonymous = false, headers = {} } = {},
  ) {
    const response = await fetch(`${base}/api${path}`, {
      method,
      headers: {
        ...(anonymous ? {} : { Cookie: cookie }),
        ...(token ? { 'X-CSRF-Token': token } : {}),
        ...(body && !(body instanceof FormData) ? { 'Content-Type': 'application/json' } : {}),
        ...headers,
      },
      body: body ? (body instanceof FormData ? body : JSON.stringify(body)) : undefined,
    });
    if (!anonymous) {
      const cookies = response.headers.getSetCookie();
      if (cookies.length) cookie = cookies[0].split(';')[0];
    }
    return { status: response.status, body: await response.json(), response };
  }
  let saved;
  try {
    await t.test('Public content is available, private content is not', async () => {
      const content = await request('/content', { anonymous: true });
      assert.equal(content.status, 200);
      assert.equal(content.body.profile.firstName, 'Vano');
      saved = content.body;
      assert.equal((await request('/admin/messages', { anonymous: true })).status, 401);
      const me = await request('/auth/me');
      csrf = me.body.csrfToken;
      assert.equal(me.body.authenticated, false);
      assert.ok(csrf.length >= 32);
      assert.match(me.response.headers.get('set-cookie'), /HttpOnly/);
    });
    await t.test(
      'Basic admin/admin login rotates the session and permits optional password changes',
      async () => {
        assert.equal(
          (
            await request('/auth/login', {
              method: 'POST',
              body: { username: 'admin', password: 'wrong' },
            })
          ).status,
          401,
        );
        const before = cookie;
        const login = await request('/auth/login', {
          method: 'POST',
          body: { username: 'admin', password: 'admin' },
        });
        assert.equal(login.status, 200);
        assert.equal(login.body.mustChangePassword, false);
        assert.notEqual(cookie, before);
        csrf = login.body.csrfToken;
        assert.equal((await request('/admin/content', { method: 'PUT', body: saved })).status, 200);
        assert.equal((await request('/admin/messages')).status, 200);
        assert.equal(
          (
            await request('/auth/password', {
              method: 'POST',
              body: { currentPassword: 'admin', newPassword: 'weak' },
            })
          ).status,
          400,
        );
        const change = await request('/auth/password', {
          method: 'POST',
          body: { currentPassword: 'admin', newPassword: 'SecureStudio2026!' },
        });
        assert.equal(change.status, 200);
        assert.equal(change.body.mustChangePassword, false);
        csrf = change.body.csrfToken;
      },
    );
    await t.test('CSRF, origin, and server-side content validation are enforced', async () => {
      assert.equal(
        (await request('/admin/content', { method: 'PUT', body: saved, token: 'bad-token' }))
          .status,
        403,
      );
      assert.equal(
        (
          await request('/admin/content', {
            method: 'PUT',
            body: saved,
            headers: { Origin: 'https://untrusted.example' },
          })
        ).status,
        403,
      );
      const invalid = structuredClone(saved);
      invalid.profile.github = 'javascript:alert(1)';
      assert.equal((await request('/admin/content', { method: 'PUT', body: invalid })).status, 400);
      saved.profile.name = 'Vano Persistence Test';
      saved.pages.footerNote = 'Stored on the server.';
      const update = await request('/admin/content', { method: 'PUT', body: saved });
      assert.equal(update.status, 200);
      assert.equal(
        (await request('/content', { anonymous: true })).body.profile.name,
        'Vano Persistence Test',
      );
    });
    await t.test(
      'School history, frameworks, card artwork, and public copy are validated and stored globally',
      async () => {
        saved.education[0].school = 'Server School';
        saved.frameworks[0].name = 'React (tested)';
        saved.card.titleLineOne = 'HELLO';
        saved.card.signatureText = 'Test Signature';
        saved.card.portrait = '/images/portrait.webp';
        saved.copy.heroExplore = 'See my projects';
        const result = await request('/admin/content', { method: 'PUT', body: saved });
        assert.equal(result.status, 200);
        const published = (await request('/content', { anonymous: true })).body;
        assert.equal(published.education[0].school, 'Server School');
        assert.equal(published.frameworks[0].name, 'React (tested)');
        assert.equal(published.card.signatureText, 'Test Signature');
        assert.equal(published.copy.heroExplore, 'See my projects');
        const invalidSchool = structuredClone(saved);
        invalidSchool.education[0].logo = 'javascript:alert(1)';
        assert.equal(
          (await request('/admin/content', { method: 'PUT', body: invalidSchool })).status,
          400,
        );
        const invalidCard = structuredClone(saved);
        invalidCard.card.accentColor = 'url(https://example.com)';
        assert.equal(
          (await request('/admin/content', { method: 'PUT', body: invalidCard })).status,
          400,
        );
        const invalidFramework = structuredClone(saved);
        invalidFramework.frameworks[0].name = '';
        assert.equal(
          (await request('/admin/content', { method: 'PUT', body: invalidFramework })).status,
          400,
        );
      },
    );
    await t.test('Project create, update, duplicate protection, and delete work', async () => {
      const project = {
        ...saved.projects[0],
        id: '',
        title: 'API Test Project',
        slug: 'api-test-project',
      };
      const create = await request('/admin/projects', { method: 'POST', body: project });
      assert.equal(create.status, 201);
      const id = create.body.id;
      assert.ok(id);
      assert.equal(
        (await request('/admin/projects', { method: 'POST', body: project })).status,
        409,
      );
      const update = await request(`/admin/projects/${id}`, {
        method: 'PUT',
        body: { ...create.body, title: 'Edited Project' },
      });
      assert.equal(update.status, 200);
      assert.equal(update.body.title, 'Edited Project');
      assert.equal(
        (await request('/content', { anonymous: true })).body.projects[0].title,
        'Edited Project',
      );
      assert.equal((await request(`/admin/projects/${id}`, { method: 'DELETE' })).status, 200);
      assert.equal((await request(`/admin/projects/${id}`, { method: 'DELETE' })).status, 404);
    });
    await t.test('Image uploads are decoded, optimized, and served publicly', async () => {
      const buffer = await sharp({
        create: { width: 100, height: 60, channels: 3, background: '#4477cc' },
      })
        .png()
        .toBuffer();
      const form = new FormData();
      form.append('image', new Blob([buffer], { type: 'image/png' }), 'test.png');
      const uploaded = await request('/admin/upload', { method: 'POST', body: form });
      assert.equal(uploaded.status, 201);
      assert.match(uploaded.body.url, /^\/uploads\/.+\.webp$/);
      const image = await fetch(base + uploaded.body.url);
      assert.equal(image.status, 200);
      assert.match(image.headers.get('content-type'), /webp/);
      const metadata = await sharp(Buffer.from(await image.arrayBuffer())).metadata();
      assert.equal(metadata.format, 'webp');
      const invalid = new FormData();
      invalid.append(
        'image',
        new Blob(['<script>not-an-image</script>'], { type: 'image/jpeg' }),
        'fake.jpg',
      );
      assert.equal((await request('/admin/upload', { method: 'POST', body: invalid })).status, 400);
      const svg = new FormData();
      svg.append('image', new Blob(['<svg/>'], { type: 'image/svg+xml' }), 'fake.svg');
      assert.equal((await request('/admin/upload', { method: 'POST', body: svg })).status, 400);
    });
    await t.test('Contact messages are stored, readable, markable, and deletable', async () => {
      assert.equal(
        (
          await request('/messages', {
            method: 'POST',
            anonymous: true,
            body: { name: 'A', email: 'bad', message: 'short' },
          })
        ).status,
        400,
      );
      assert.equal(
        (
          await request('/messages', {
            method: 'POST',
            anonymous: true,
            body: {
              name: 'Test Visitor',
              email: 'visitor@example.com',
              message: 'A real conversation from the public contact form.',
            },
          })
        ).status,
        201,
      );
      const inbox = await request('/admin/messages');
      assert.equal(inbox.status, 200);
      assert.equal(inbox.body.length, 1);
      const id = inbox.body[0].id;
      assert.equal((await request(`/admin/messages/${id}`, { method: 'PATCH' })).status, 200);
      assert.equal((await request('/admin/messages')).body[0].is_read, 1);
      assert.equal((await request(`/admin/messages/${id}`, { method: 'DELETE' })).status, 200);
      assert.equal((await request('/admin/messages')).body.length, 0);
    });
    await t.test('Content, credentials, and sessions survive a server restart', async () => {
      await app.close();
      app = await createApplication({ dataDir, frontend: false });
      await listen();
      assert.equal(
        (await request('/content', { anonymous: true })).body.profile.name,
        'Vano Persistence Test',
      );
      const persisted = (await request('/content', { anonymous: true })).body;
      assert.equal(persisted.education[0].school, 'Server School');
      assert.equal(persisted.frameworks[0].name, 'React (tested)');
      assert.equal(persisted.card.titleLineOne, 'HELLO');
      assert.equal(persisted.copy.heroExplore, 'See my projects');
      const me = await request('/auth/me');
      assert.equal(me.body.authenticated, true);
      assert.equal(me.body.mustChangePassword, false);
      csrf = me.body.csrfToken;
      await request('/auth/logout', { method: 'POST' });
      const fresh = await request('/auth/me');
      csrf = fresh.body.csrfToken;
      assert.equal(
        (
          await request('/auth/login', {
            method: 'POST',
            body: { username: 'admin', password: 'admin' },
          })
        ).status,
        401,
      );
      assert.equal(
        (
          await request('/auth/login', {
            method: 'POST',
            body: { username: 'admin', password: 'SecureStudio2026!' },
          })
        ).status,
        200,
      );
    });
  } finally {
    await app.close();
    rmSync(dataDir, { recursive: true, force: true });
  }
});

test('Schema migration adds new editors without resetting existing content or passwords', async () => {
  const dataDir = mkdtempSync(join(tmpdir(), 'portfolio-migration-'));
  let app = await createApplication({ dataDir, frontend: false });
  try {
    const old = app.storage.getContent();
    delete old.card;
    delete old.copy;
    delete old.education;
    delete old.frameworks;
    delete old.profile.portraitHover;
    old.profile.name = 'Existing Owner';
    old.projects = old.projects.slice(0, 1);
    app.storage.saveContent(old);
    app.storage.db
      .prepare('UPDATE admins SET password = ?, must_change = 1')
      .run(hashPassword('ExistingPassword2026!'));
    app.storage.db.pragma('user_version = 1');
    await app.close();
    app = await createApplication({ dataDir, frontend: false });
    const current = app.storage.getContent();
    assert.equal(current.profile.name, 'Existing Owner');
    assert.equal(current.projects.length, 1);
    assert.ok(current.card.signatureText);
    assert.ok(current.education.length);
    assert.ok(current.frameworks.length);
    assert.ok(current.copy.navHome);
    const admin = app.storage.db.prepare('SELECT * FROM admins').get();
    assert.equal(verifyPassword('ExistingPassword2026!', admin.password), true);
    assert.equal(admin.must_change, 0);
  } finally {
    await app.close();
    rmSync(dataDir, { recursive: true, force: true });
  }
});
