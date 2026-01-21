import db from './db';

export interface FolderItem {
  type: 'folder';
  name: string;
}

export interface BadgeItem {
  type: 'badge';
  id: number;
  name: string;
  image_path: string;
}

// Эта функция получает "путь" (массив папок) и возвращает содержимое
export function getFolderContents(pathParts: string[]) {
  // pathParts[0] = section (Раздел)
  // pathParts[1] = subsection (Подраздел)
  // pathParts[2] = region (Регион)
  // pathParts[3] = city (Город)

  const level = pathParts.length;
  const currentSection = pathParts[0];
  const currentSubsection = pathParts[1];
  const currentRegion = pathParts[2];
  const currentCity = pathParts[3];

  let folders: FolderItem[] = [];
  let badges: BadgeItem[] = [];

  try {
    // 1. Ищем ПОДПАПКИ на текущем уровне
    if (level === 0) {
      // Корневой уровень: ищем уникальные Секции (ВЛКСМ, ССО...)
      const rows = db.prepare("SELECT DISTINCT section FROM badges WHERE section IS NOT NULL ORDER BY section").all() as any[];
      folders = rows.map(r => ({ type: 'folder', name: r.section }));
    } 
    else if (level === 1) {
      // Внутри Секции: ищем Подразделы (РСФСР, Наградные...)
      const rows = db.prepare("SELECT DISTINCT subsection FROM badges WHERE section = ? AND subsection IS NOT NULL ORDER BY subsection").all(currentSection) as any[];
      folders = rows.map(r => ({ type: 'folder', name: r.subsection }));
    }
    else if (level === 2) {
      // Внутри Подраздела: ищем Регионы
      const rows = db.prepare("SELECT DISTINCT region FROM badges WHERE section = ? AND subsection = ? AND region IS NOT NULL ORDER BY region").all(currentSection, currentSubsection) as any[];
      folders = rows.map(r => ({ type: 'folder', name: r.region }));
    }
    else if (level === 3) {
      // Внутри Региона: ищем Города
      const rows = db.prepare("SELECT DISTINCT city FROM badges WHERE section = ? AND subsection = ? AND region = ? AND city IS NOT NULL ORDER BY city").all(currentSection, currentSubsection, currentRegion) as any[];
      folders = rows.map(r => ({ type: 'folder', name: r.city }));
    }

    // 2. Ищем ЗНАЧКИ, которые лежат прямо здесь
    let query = "SELECT id, name, image_path FROM badges WHERE ";
    let params: any[] = [];

    // Строим запрос в зависимости от глубины вложенности
    if (level === 1) {
      query += "section = ? AND subsection IS NULL";
      params = [currentSection];
    } else if (level === 2) {
      query += "section = ? AND subsection = ? AND region IS NULL";
      params = [currentSection, currentSubsection];
    } else if (level === 3) {
      query += "section = ? AND subsection = ? AND region = ? AND city IS NULL";
      params = [currentSection, currentSubsection, currentRegion];
    } else if (level === 4) {
      query += "section = ? AND subsection = ? AND region = ? AND city = ?";
      params = [currentSection, currentSubsection, currentRegion, currentCity];
    }

    // Выполняем запрос значков только если мы не в корне (в корне значков нет, только папки)
    if (level > 0) {
      const badgeRows = db.prepare(query).all(...params) as any[];
      badges = badgeRows.map(r => ({
        type: 'badge',
        id: r.id,
        name: r.name,
        image_path: r.image_path
      }));
    }

  } catch (err) {
    console.error("Ошибка при чтении папки:", err);
  }

  return { folders, badges };
}