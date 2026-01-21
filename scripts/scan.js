const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

const db = new Database('collection.db');
const BADGES_DIR = path.join(process.cwd(), 'public', 'badges');

console.log('--- ЗАПУСК СКАНИРОВАНИЯ (БЕСКОНЕЧНАЯ ВЛОЖЕННОСТЬ) ---');

// 1. СБРОС И СОЗДАНИЕ ТАБЛИЦЫ
// Теперь мы используем колонку folder_path для хранения всего пути
db.exec("DROP TABLE IF EXISTS badges");
db.exec(`
  CREATE TABLE IF NOT EXISTS badges (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    folder_path TEXT,  -- Полный путь к папке (например: "ВЛКСМ/Съезды/10 съезд")
    image_path TEXT UNIQUE,
    description TEXT,
    year TEXT,
    material TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);
// Создаем индекс для мгновенного поиска по папкам
db.exec("CREATE INDEX IF NOT EXISTS idx_folder_path ON badges(folder_path)");

function scanDirectory(directory) {
  if (!fs.existsSync(directory)) {
    console.error(`Папка ${directory} не найдена!`);
    return;
  }

  const items = fs.readdirSync(directory, { withFileTypes: true });

  for (const item of items) {
    const fullPath = path.join(directory, item.name);

    if (item.isDirectory()) {
      // Идем глубже
      scanDirectory(fullPath);
    } else if (item.isFile()) {
      const ext = path.extname(item.name).toLowerCase();
      if (['.jpg', '.jpeg', '.png', '.webp'].includes(ext)) {
        processFile(fullPath, item.name);
      }
    }
  }
}

function processFile(fullPath, filename) {
  // Получаем путь относительно корня (public/badges)
  const relativePath = path.relative(BADGES_DIR, fullPath);
  
  // Получаем путь к папке, в которой лежит файл
  // Например: для "ВЛКСМ/Съезды/значок.jpg" это будет "ВЛКСМ/Съезды"
  let folderPath = path.dirname(relativePath).split(path.sep).join('/');
  
  // Если файл лежит в корне (folderPath === '.'), называем папку "Корневая" (или обрабатываем отдельно)
  if (folderPath === '.') folderPath = '';

  const name = path.parse(filename).name;
  
  // Путь для веба
  const webPath = '/badges/' + relativePath.split(path.sep).join('/');

  try {
    const insert = db.prepare(`
      INSERT INTO badges (name, folder_path, image_path, description)
      VALUES (?, ?, ?, ?)
    `);

    insert.run(name, folderPath, webPath, 'Загружено автоматически');
    // console.log(`✅ [${folderPath}] ${name}`); // Можно раскомментировать для отладки
  } catch (err) {
    console.error(`Ошибка с файлом ${filename}:`, err.message);
  }
}

scanDirectory(BADGES_DIR);
console.log('✅ Сканирование завершено. База обновлена.');