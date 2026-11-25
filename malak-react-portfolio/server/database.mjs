import Database from 'better-sqlite3';
import session from 'express-session';
import { mkdirSync, readFileSync, existsSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';

export function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  return `${salt}:${scryptSync(password, salt, 64).toString('hex')}`;
}

export function verifyPassword(password, saved) {
  if (typeof password !== 'string' || password.length > 256) return false;
  const [salt, hash] = saved.split(':');
  return timingSafeEqual(Buffer.from(hash, 'hex'), scryptSync(password, salt, 64));
}

export function openDatabase(directory) {
  mkdirSync(directory, { recursive: true, mode: 0o700 });
  mkdirSync(join(directory, 'uploads'), { recursive: true, mode: 0o700 });
  const db = new Database(join(directory, 'portfolio.sqlite'));
  db.pragma('journal_mode = WAL');
  db.pragma('busy_timeout = 5000');
  db.exec(`
    CREATE TABLE IF NOT EXISTS content (id INTEGER PRIMARY KEY CHECK(id = 1), document TEXT NOT NULL, updated_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS admins (id INTEGER PRIMARY KEY, username TEXT UNIQUE NOT NULL, password TEXT NOT NULL, must_change INTEGER NOT NULL DEFAULT 1);
    CREATE TABLE IF NOT EXISTS sessions (sid TEXT PRIMARY KEY, document TEXT NOT NULL, expires INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS messages (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, email TEXT NOT NULL, message TEXT NOT NULL, created_at TEXT NOT NULL, is_read INTEGER NOT NULL DEFAULT 0);
  `);
  const seed = JSON.parse(readFileSync(new URL('../shared/content.json', import.meta.url), 'utf8'));
  const existing = db.prepare('SELECT document FROM content WHERE id = 1').get();
  if (!existing) {
    db.prepare('INSERT INTO content VALUES (1, ?, ?)').run(
      JSON.stringify(seed),
      new Date().toISOString(),
    );
  } else {
    // Add new CMS fields without replacing the owner's previously saved content.
    const saved = JSON.parse(existing.document);
    const migrated = {
      ...seed,
      ...saved,
      profile: { ...seed.profile, ...saved.profile },
      pages: { ...seed.pages, ...saved.pages },
      card: { ...seed.card, ...saved.card },
      copy: { ...seed.copy, ...saved.copy },
      settings: { ...seed.settings, ...saved.settings },
    };
    if (JSON.stringify(migrated) !== existing.document)
      db.prepare('UPDATE content SET document = ?, updated_at = ? WHERE id = 1').run(
        JSON.stringify(migrated),
        new Date().toISOString(),
      );
  }
  if (!db.prepare('SELECT id FROM admins LIMIT 1').get()) {
    db.prepare('INSERT INTO admins (username, password, must_change) VALUES (?, ?, 0)').run(
      'admin',
      hashPassword(process.env.INITIAL_ADMIN_PASSWORD || 'admin'),
    );
  }
  if (db.pragma('user_version', { simple: true }) < 2) {
    db.prepare('UPDATE admins SET must_change = 0').run();
    db.pragma('user_version = 2');
  }
  const secretPath = join(directory, '.session-secret');
  if (!existsSync(secretPath))
    writeFileSync(secretPath, randomBytes(48).toString('hex'), { mode: 0o600 });
  const secret = process.env.SESSION_SECRET || readFileSync(secretPath, 'utf8');
  const getContent = () =>
    JSON.parse(db.prepare('SELECT document FROM content WHERE id = 1').get().document);
  const saveContent = (content) => {
    db.prepare('UPDATE content SET document = ?, updated_at = ? WHERE id = 1').run(
      JSON.stringify(content),
      new Date().toISOString(),
    );
    return content;
  };

  class SQLiteSessions extends session.Store {
    get(sid, callback) {
      try {
        const row = db
          .prepare('SELECT document FROM sessions WHERE sid = ? AND expires > ?')
          .get(sid, Date.now());
        callback(null, row ? JSON.parse(row.document) : null);
      } catch (error) {
        callback(error);
      }
    }
    set(sid, value, callback = () => {}) {
      try {
        const expires = value.cookie?.expires
          ? new Date(value.cookie.expires).getTime()
          : Date.now() + 28800000;
        db.prepare('INSERT OR REPLACE INTO sessions VALUES (?, ?, ?)').run(
          sid,
          JSON.stringify(value),
          expires,
        );
        callback(null);
      } catch (error) {
        callback(error);
      }
    }
    destroy(sid, callback = () => {}) {
      try {
        db.prepare('DELETE FROM sessions WHERE sid = ?').run(sid);
        callback(null);
      } catch (error) {
        callback(error);
      }
    }
    touch(sid, value, callback = () => {}) {
      this.set(sid, value, callback);
    }
  }

  const cleanup = setInterval(
    () => db.prepare('DELETE FROM sessions WHERE expires < ?').run(Date.now()),
    900000,
  );
  cleanup.unref();
  return {
    db,
    secret,
    store: new SQLiteSessions(),
    getContent,
    saveContent,
    close: () => {
      clearInterval(cleanup);
      db.close();
    },
  };
}
