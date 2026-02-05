// @ts-ignore
import db from '@/lib/db'
import AdminDashboard from './dashboard'

// Чтобы админка не кэшировалась и всегда показывала свежие данные
export const dynamic = 'force-dynamic';

interface Badge {
  id: number;
  name: string;
  image_path: string;
  year?: string;
  material?: string;
  description?: string;
}

interface Folder {
  path: string;
}

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ folder?: string }>
}) {
  const { folder } = await searchParams;
  const currentFolder = folder || '';

  // 1. Получаем список папок
  let folders: Folder[] = [];
  try {
    folders = db.prepare("SELECT path FROM folders ORDER BY path ASC").all() as Folder[];
  } catch (e) {
    folders = db.prepare("SELECT DISTINCT folder_path as path FROM badges ORDER BY folder_path ASC").all() as Folder[];
  }

  // 2. Получаем значки для выбранной папки
  let badges: Badge[] = [];
  if (currentFolder) {
    badges = db.prepare(`
      SELECT id, name, image_path, year, material, description 
      FROM badges 
      WHERE folder_path = ? 
      ORDER BY name ASC
    `).all(currentFolder) as Badge[];
  }

  return (
    <AdminDashboard 
      folders={folders} 
      badges={badges} 
      currentFolder={currentFolder}
    />
  );
}