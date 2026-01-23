'use server'

import db from '@/lib/db'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import fs from 'fs'
import path from 'path'

// --- СОХРАНЕНИЕ КОНТЕНТА ---
export async function saveSiteContent(formData: FormData) {
  const updates = Array.from(formData.entries());
  
  const insert = db.prepare(`
    INSERT INTO site_content (key, value) VALUES (?, ?)
    ON CONFLICT(key) DO UPDATE SET value=excluded.value
  `);

  const updateMany = db.transaction((items) => {
    for (const [key, value] of items) {
      if (typeof value === 'string' && key.startsWith('content_')) {
        insert.run(key.replace('content_', ''), value);
      }
    }
  });

  updateMany(updates);
  revalidatePath('/', 'layout');
}

// --- УПРАВЛЕНИЕ ПАПКАМИ ---
export async function createFolder(parentPath: string, formData: FormData) {
  const folderName = formData.get('folderName') as string;
  if (!folderName) return;

  const newPath = parentPath ? `${parentPath}/${folderName}` : folderName;
  const sysPath = path.join(process.cwd(), 'public', 'badges', newPath);

  if (!fs.existsSync(sysPath)) {
    fs.mkdirSync(sysPath, { recursive: true });
  }
  
  revalidatePath('/admin');
  redirect(`/admin?tab=catalog&path=${encodeURIComponent(newPath)}`);
}

export async function deleteFolder(folderPath: string) {
  db.prepare("DELETE FROM badges WHERE folder_path = ?").run(folderPath);
  db.prepare("DELETE FROM folder_meta WHERE folder_path = ?").run(folderPath);
  
  revalidatePath('/admin');
  redirect('/admin?tab=catalog');
}

export async function saveFolderMeta(folderPath: string, formData: FormData) {
  const description = formData.get('description') as string;
  const insert = db.prepare(`
    INSERT INTO folder_meta (folder_path, description) VALUES (?, ?)
    ON CONFLICT(folder_path) DO UPDATE SET description=excluded.description
  `);
  insert.run(folderPath, description);
  revalidatePath('/catalog', 'layout'); 
  revalidatePath('/admin', 'layout');
}

// --- ЗАГРУЗКА ФАЙЛОВ (ПРАВИЛО ХРОНОЛОГИИ) ---
export async function uploadImage(formData: FormData) {
  const file = formData.get('file') as File;
  if (!file || file.size === 0) return null;

  // Правило хронологии: берем максимальный ID из базы и прибавляем 1
  const lastBadge = db.prepare("SELECT MAX(id) as maxId FROM badges").get() as { maxId: number };
  const nextNumber = (lastBadge?.maxId || 0) + 1;
  
  const buffer = Buffer.from(await file.arrayBuffer());
  const ext = path.extname(file.name).toLowerCase() || '.jpg';
  const filename = `${nextNumber}${ext}`; // Новое имя файла - это просто номер
  
  const uploadDir = path.join(process.cwd(), 'public', 'uploads');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const filepath = path.join(uploadDir, filename);
  fs.writeFileSync(filepath, buffer);

  return `/uploads/${filename}`;
}

// --- РАБОТА СО ЗНАЧКАМИ ---
export async function saveBadge(id: number, formData: FormData) {
  const name = formData.get('name') as string;
  const year = formData.get('year') as string;
  const material = formData.get('material') as string;
  const description = formData.get('description') as string;
  const image_path = formData.get('image_path') as string;
  
  const update = db.prepare(`
    UPDATE badges SET name=?, year=?, material=?, description=?, image_path=? WHERE id=?
  `);
  
  update.run(name, year, material, description, image_path, id);
  
  const badge = db.prepare("SELECT folder_path FROM badges WHERE id = ?").get(id) as { folder_path: string };
  revalidatePath(`/badge/${id}`);
  revalidatePath('/admin');
  redirect(`/admin?tab=catalog&path=${encodeURIComponent(badge.folder_path)}`);
}

export async function deleteBadge(id: number) {
  db.prepare("DELETE FROM badges WHERE id = ?").run(id);
  revalidatePath('/admin');
}

export async function createBadge(folderPath: string, formData: FormData) {
  // При создании черновика тоже можно сразу зарезервировать номер, но мы сделаем это при сохранении
  const name = "Новый значок";
  const insert = db.prepare(`
    INSERT INTO badges (name, folder_path, image_path) VALUES (?, ?, '/poster.jpg')
  `);
  const info = insert.run(name, folderPath);
  
  revalidatePath('/admin');
  redirect(`/admin/badge/${info.lastInsertRowid}`);
}