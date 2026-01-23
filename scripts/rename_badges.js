const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

const db = new Database('collection.db');
const BADGES_DIR = path.join(process.cwd(), 'public', 'badges');

console.log('--- ЗАПУСК ГЛОБАЛЬНОГО ПЕРЕИМЕНОВАНИЯ ---');

// Получаем все значки из базы, отсортированные по дате или старому пути
const badges = db.prepare("SELECT id, image_path, folder_path FROM badges ORDER BY id ASC").all();

let counter = 1;

db.transaction(() => {
  for (const badge of badges) {
    const oldWebPath = badge.image_path;
    const oldFilePath = path.join(process.cwd(), 'public', oldWebPath);

    if (fs.existsSync(oldFilePath)) {
      const ext = path.extname(oldFilePath).toLowerCase();
      const newFileName = `${counter}${ext}`;
      
      // Сохраняем структуру папок, меняем только имя файла
      const folderDir = path.join(BADGES_DIR, badge.folder_path);
      const newFilePath = path.join(folderDir, newFileName);
      const newWebPath = `/badges/${badge.folder_path}/${newFileName}`.replace(/\/+/g, '/');

      try {
        // Физическое переименование
        fs.renameSync(oldFilePath, newFilePath);
        
        // Обновление в базе
        db.prepare("UPDATE badges SET image_path = ? WHERE id = ?").run(newWebPath, badge.id);
        
        if (counter % 100 === 0) console.log(`Обработано: ${counter}...`);
        counter++;
      } catch (err) {
        console.error(`Ошибка при переименовании ${oldWebPath}:`, err.message);
      }
    }
  }
})();

console.log(`✅ Готово! Переименовано файлов: ${counter - 1}`);