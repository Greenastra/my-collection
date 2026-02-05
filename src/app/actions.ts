'use server'

import db from '@/lib/db'
import { revalidatePath } from 'next/cache'

// --- 1. РЕДАКТИРОВАНИЕ ЗНАЧКА ---
export async function updateBadge(formData: FormData) {
  const idRaw = formData.get('id');
  const name = formData.get('name') as string;
  const year = formData.get('year') as string;
  const material = formData.get('material') as string;
  const description = formData.get('description') as string;

  const id = Number(idRaw);

  console.log(`[ACTION] Запуск обновления. ID: ${id}, Name: ${name}`);

  if (!id) {
    return { success: false, message: "Ошибка: ID значка не передан." };
  }

  try {
    const stmt = db.prepare(`
      UPDATE badges 
      SET name = ?, year = ?, material = ?, description = ? 
      WHERE id = ?
    `);
    
    // Получаем информацию о выполнении запроса
    const info = stmt.run(name, year, material, description, id);
    
    console.log(`[ACTION] Результат SQL:`, info);

    if (info.changes === 0) {
      return { success: false, message: `Ошибка: Значок с ID ${id} не найден в базе.` };
    }

    // Обновление кэша
    const badge = db.prepare("SELECT folder_path FROM badges WHERE id = ?").get(id) as { folder_path: string };
    
    revalidatePath('/admin');
    revalidatePath('/admin', 'page');
    revalidatePath(`/badge/${id}`);
    if (badge?.folder_path) {
      revalidatePath(`/catalog/${badge.folder_path}`);
    }

    return { success: true, message: "Значок успешно сохранен!" };

  } catch (error) {
    console.error("[ACTION] Ошибка:", error);
    return { success: false, message: `Сбой сервера: ${String(error)}` };
  }
}

// --- 2. РЕДАКТИРОВАНИЕ ПАПКИ ---
export async function updateFolderInfo(formData: FormData) {
  const folderPath = formData.get('folder_path') as string;
  const title = formData.get('title') as string;
  const description = formData.get('description') as string;

  if (!folderPath) return { success: false, message: "Путь папки не указан" };

  try {
    const stmt = db.prepare(`
      INSERT INTO folder_meta (folder_path, title, description) 
      VALUES (?, ?, ?)
      ON CONFLICT(folder_path) DO UPDATE SET 
        title = excluded.title,
        description = excluded.description
    `);

    stmt.run(folderPath, title, description);

    revalidatePath('/admin');
    revalidatePath(`/catalog/${folderPath}`);
    return { success: true, message: "Папка обновлена" };
  } catch (error) {
    console.error("Ошибка при обновлении папки:", error);
    return { success: false, message: String(error) };
  }
}

// --- 3. РЕДАКТИРОВАНИЕ ГЛАВНОЙ СТРАНИЦЫ ---
export async function updateHomeContent(formData: FormData) {
  try {
    const insert = db.prepare(`
      INSERT INTO site_content (key, value) 
      VALUES (?, ?) 
      ON CONFLICT(key) DO UPDATE SET value=excluded.value
    `);

    for (const [key, value] of Array.from(formData.entries())) {
      if (typeof value === 'string') {
        insert.run(key, value);
      }
    }

    revalidatePath('/admin');
    revalidatePath('/', 'layout');
    return { success: true, message: "Главная страница обновлена" };
  } catch (error) {
    console.error("Ошибка обновления главной:", error);
    return { success: false, message: String(error) };
  }
}

export async function deleteBadge(id: number) {
  try {
    db.prepare("DELETE FROM badges WHERE id = ?").run(id);
    revalidatePath('/admin');
    revalidatePath('/catalog');
  } catch (error) {
    console.error("Ошибка удаления:", error);
  }
}
// --- 4. СОЗДАНИЕ НОВОГО ЗНАЧКА ---
export async function createBadge(formData: FormData) {
  const name = formData.get('name') as string;
  const folder_path = formData.get('folder_path') as string;
  const image_path = formData.get('image_path') as string; // Здесь должен быть путь к загруженной картинке
  const year = formData.get('year') as string;
  const material = formData.get('material') as string;
  const description = formData.get('description') as string;

  try {
    const stmt = db.prepare(`
      INSERT INTO badges (name, folder_path, image_path, year, material, description)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    
    stmt.run(name, folder_path, image_path, year, material, description);

    revalidatePath('/admin');
    revalidatePath(`/catalog/${folder_path}`);
    
    return { success: true, message: "Значок успешно добавлен!" };
  } catch (error) {
    console.error("Ошибка при создании значка:", error);
    return { success: false, message: "Ошибка: возможно, такой путь к картинке уже существует." };
  }
}