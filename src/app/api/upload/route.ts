import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const MAX_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED_MIMES = ['image/jpeg', 'image/png', 'image/webp'];

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ success: false, message: 'Файл не передан' }, { status: 400 });
    }

    const mime = file.type;
    if (!ALLOWED_MIMES.includes(mime)) {
      return NextResponse.json({ success: false, message: 'Недопустимый тип файла' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    if (buffer.length > MAX_BYTES) {
      return NextResponse.json({ success: false, message: 'Файл слишком большой (макс 5MB)' }, { status: 400 });
    }

    const origName = (file as any).name || '';
    const ext = path.extname(origName) || (mime === 'image/png' ? '.png' : mime === 'image/webp' ? '.webp' : '.jpg');
    const filename = `${uuidv4()}${ext}`;
    const uploadDir = path.join(process.cwd(), 'public', 'uploads');

    await fs.mkdir(uploadDir, { recursive: true });
    const filePath = path.join(uploadDir, filename);
    await fs.writeFile(filePath, buffer);

    const webPath = `/uploads/${encodeURIComponent(filename)}`;
    return NextResponse.json({ success: true, path: webPath });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ success: false, message: String(error) }, { status: 500 });
  }
}