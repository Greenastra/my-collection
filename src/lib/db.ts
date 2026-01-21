import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.resolve(process.cwd(), 'collection.db');
const db = new Database(dbPath, { verbose: console.log });
db.pragma('journal_mode = WAL');

// 1. Таблица значков
db.exec(`
  CREATE TABLE IF NOT EXISTS badges (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    folder_path TEXT,
    image_path TEXT UNIQUE,
    description TEXT,
    year TEXT,
    material TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// 2. Таблица для контента страниц (Главная, Контакты)
db.exec(`
  CREATE TABLE IF NOT EXISTS site_content (
    key TEXT PRIMARY KEY,
    value TEXT
  )
`);

// 3. Таблица для описаний папок
db.exec(`
  CREATE TABLE IF NOT EXISTS folder_meta (
    folder_path TEXT PRIMARY KEY,
    description TEXT,
    title TEXT
  )
`);

export default db;