import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.resolve(process.cwd(), 'collection.db');

// --- SINGLETON PATTERN ---
const globalForDb = global as unknown as { db: Database.Database };

const db = globalForDb.db || new Database(dbPath, { 
  // verbose: console.log 
});

if (process.env.NODE_ENV !== 'production') {
  globalForDb.db = db;
}

// Настройки надежности
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');
db.pragma('busy_timeout = 5000'); 

// --- СОЗДАНИЕ ТАБЛИЦ ---

// 1. ПАПКИ
db.exec(`
  CREATE TABLE IF NOT EXISTS folders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    path TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    parent_path TEXT,
    level INTEGER DEFAULT 0
  );
  CREATE INDEX IF NOT EXISTS idx_folders_parent ON folders(parent_path);
`);

// 2. ЗНАЧКИ
db.exec(`
  CREATE TABLE IF NOT EXISTS badges (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    folder_path TEXT,
    image_path TEXT UNIQUE NOT NULL,
    description TEXT,
    year TEXT,
    material TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  CREATE INDEX IF NOT EXISTS idx_badges_folder ON badges(folder_path);
  CREATE INDEX IF NOT EXISTS idx_badges_year ON badges(year);
`);

// 3. МЕТАДАННЫЕ И ТЕГИ (FTS5 УДАЛЕН ДЛЯ СТАБИЛЬНОСТИ)
db.exec(`CREATE TABLE IF NOT EXISTS site_content (key TEXT PRIMARY KEY, value TEXT)`);
db.exec(`CREATE TABLE IF NOT EXISTS folder_meta (folder_path TEXT PRIMARY KEY, description TEXT, title TEXT)`);
db.exec(`CREATE TABLE IF NOT EXISTS tags (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT UNIQUE)`);
db.exec(`CREATE TABLE IF NOT EXISTS badge_tags (badge_id INTEGER, tag_id INTEGER, PRIMARY KEY (badge_id, tag_id))`);

export default db;