import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

// Настройки
const DB_PATH = 'collection.db';
const PUBLIC_DIR = 'public';
const BADGES_ROOT = 'badges'; 

const db = new Database(DB_PATH);
console.log('📦 Подключение к БД...');

// --- НАСТРОЙКИ БЕЗОПАСНОСТИ (ВАЖНО) ---
db.pragma('journal_mode = WAL');
db.pragma('busy_timeout = 5000'); // Ждать 5 секунд, если база занята
db.pragma('foreign_keys = ON');

// --- 1. СОЗДАНИЕ ВСЕХ ТАБЛИЦ ---
// Создаем полную структуру, чтобы база была готова к работе сразу

// Папки
db.exec(`
  CREATE TABLE IF NOT EXISTS folders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    path TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    parent_path TEXT,
    level INTEGER DEFAULT 0
  );
  CREATE INDEX IF NOT EXISTS idx_folders_parent ON folders(parent_path);
  CREATE INDEX IF NOT EXISTS idx_folders_path ON folders(path);
`);

// Значки
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
  CREATE INDEX IF NOT EXISTS idx_badges_image_path ON badges(image_path);
`);

// Остальные таблицы (Теги, Контент)
db.exec(`CREATE TABLE IF NOT EXISTS site_content (key TEXT PRIMARY KEY, value TEXT)`);
db.exec(`CREATE TABLE IF NOT EXISTS folder_meta (folder_path TEXT PRIMARY KEY, description TEXT, title TEXT)`);
db.exec(`CREATE TABLE IF NOT EXISTS tags (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT UNIQUE)`);
db.exec(`CREATE TABLE IF NOT EXISTS badge_tags (badge_id INTEGER, tag_id INTEGER, PRIMARY KEY (badge_id, tag_id))`);


// --- 2. ПОДГОТОВКА К СИНХРОНИЗАЦИИ ---
const foundFolderPaths = new Set();
const foundBadgePaths = new Set();

const insertFolderStmt = db.prepare(`
  INSERT OR IGNORE INTO folders (path, name, parent_path, level) 
  VALUES (?, ?, ?, ?)
`);

const insertBadgeStmt = db.prepare(`
  INSERT OR IGNORE INTO badges (name, folder_path, image_path) 
  VALUES (?, ?, ?)
`);

// --- 3. ФУНКЦИЯ СКАНИРОВАНИЯ ---
function scanDirectory(currentPath, level = 0) {
  const fullPath = path.join(process.cwd(), PUBLIC_DIR, BADGES_ROOT, currentPath);
  
  if (!fs.existsSync(fullPath)) return;

  const items = fs.readdirSync(fullPath, { withFileTypes: true });

  for (const item of items) {
    if (item.name.startsWith('.')) continue;

    const itemName = item.name.normalize('NFC'); // Исправление для русских букв
    const relativePath = path.join(currentPath, itemName);
    
    // Веб-пути (всегда прямые слэши)
    const webPath = relativePath.split(path.sep).join('/');
    const parentWebPath = currentPath.split(path.sep).join('/');

    if (item.isDirectory()) {
      foundFolderPaths.add(webPath);
      insertFolderStmt.run(webPath, itemName, parentWebPath || null, level);
      scanDirectory(relativePath, level + 1);

    } else if (item.isFile()) {
      const ext = path.extname(itemName).toLowerCase();
      if (['.jpg', '.jpeg', '.png', '.webp'].includes(ext)) {
        
        const imageWebPath = `/${BADGES_ROOT}/${webPath}`;
        const name = path.basename(itemName, ext);

        foundBadgePaths.add(imageWebPath);
        insertBadgeStmt.run(name, parentWebPath, imageWebPath);
      }
    }
  }
}

// --- 4. ЗАПУСК ---
console.log('🚀 Начинаю полное сканирование...');
const startTime = Date.now();

const syncTransaction = db.transaction(() => {
  // 1. Добавляем новое
  scanDirectory('');

  // 2. Удаляем старое (Smart Sync)
  const allFolders = db.prepare("SELECT path FROM folders").all();
  let deletedFolders = 0;
  for (const folder of allFolders) {
    if (!foundFolderPaths.has(folder.path)) {
      db.prepare("DELETE FROM folders WHERE path = ?").run(folder.path);
      deletedFolders++;
    }
  }

  const allBadges = db.prepare("SELECT image_path FROM badges").all();
  let deletedBadges = 0;
  for (const badge of allBadges) {
    if (!foundBadgePaths.has(badge.image_path)) {
      db.prepare("DELETE FROM badges WHERE image_path = ?").run(badge.image_path);
      deletedBadges++;
    }
  }

  console.log(`🧹 Очистка: удалено ${deletedFolders} папок и ${deletedBadges} значков.`);
});

try {
    syncTransaction();
    const endTime = Date.now();
    console.log(`✅ Синхронизация завершена за ${(endTime - startTime) / 1000} сек.`);

    const badgesCount = db.prepare('SELECT COUNT(*) as c FROM badges').get().c;
    console.log(`📊 Итого в базе: ${badgesCount} значков.`);
} catch (error) {
    console.error("❌ Ошибка:", error);
}