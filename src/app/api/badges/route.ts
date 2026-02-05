import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, folder_path, image_path, year, material, description } = body;

    if (!name || !image_path) {
      return NextResponse.json({ success: false, message: 'Отсутствуют обязательные поля' }, { status: 400 });
    }

    const stmt = db.prepare(`
      INSERT INTO badges (name, folder_path, image_path, description, year, material)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const info = stmt.run(name, folder_path || null, image_path, description || null, year || null, material || null);

    // better-sqlite3 возвращает lastInsertRowid
    const insertedId = (info as any).lastInsertRowid || null;

    // Опционально — можно ревалидировать кэш (если используется маршрутизация с revalidate)
    // В server actions используйте revalidatePath, здесь это не доступно, но можно вернуть success.

    return NextResponse.json({ success: true, id: insertedId });
  } catch (error) {
    console.error('Create badge error:', error);
    return NextResponse.json({ success: false, message: String(error) }, { status: 500 });
  }
}