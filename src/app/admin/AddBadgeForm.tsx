'use client'

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AddBadgeForm({ currentFolder, onCreated }: { currentFolder?: string, onCreated?: () => void }) {
  const router = useRouter();
  const [name, setName] = useState('');
  const [year, setYear] = useState('');
  const [material, setMaterial] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!name) { setError('Укажите название'); return; }
    if (!file) { setError('Выберите изображение'); return; }

    setLoading(true);
    try {
      // 1) Upload file
      const fd = new FormData();
      fd.append('file', file);
      const upRes = await fetch('/api/upload', { method: 'POST', body: fd });
      const upJson = await upRes.json();
      if (!upJson?.success) {
        setError(upJson?.message || 'Ошибка загрузки файла');
        setLoading(false);
        return;
      }
      const image_path = upJson.path;

      // 2) Create badge
      const createRes = await fetch('/api/badges', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name, folder_path: currentFolder || null, image_path, year, material, description
        })
      });
      const createJson = await createRes.json();
      if (!createJson?.success) {
        setError(createJson?.message || 'Ошибка создания значка');
        setLoading(false);
        return;
      }

      // Успешно
      setName(''); setYear(''); setMaterial(''); setDescription(''); setFile(null);
      if (onCreated) onCreated();
      router.refresh();
    } catch (err) {
      console.error(err);
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mb-4 p-4 bg-white rounded shadow">
      <h3 className="font-bold mb-2">Добавить новый значок</h3>
      {error && <div className="text-red-600 mb-2">{error}</div>}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
        <input value={name} onChange={e => setName(e.target.value)} placeholder="Название" className="p-2 border rounded" />
        <input value={year} onChange={e => setYear(e.target.value)} placeholder="Год" className="p-2 border rounded" />
        <select value={material} onChange={e => setMaterial(e.target.value)} className="p-2 border rounded">
          <option value="">Материал</option>
          <option>Алюминий</option>
          <option>Тяжелый металл</option>
          <option>Латунь</option>
          <option>Пластмасса</option>
          <option>Сталь</option>
        </select>
      </div>

      <div className="mt-2">
        <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Описание" className="w-full p-2 border rounded" />
      </div>

      <div className="mt-2 flex items-center gap-2">
        <input type="file" accept="image/*" onChange={e => setFile(e.target.files?.[0] ?? null)} />
        <button type="submit" disabled={loading} className="px-4 py-2 bg-[#cc0000] text-white rounded">
          {loading ? 'Загрузка...' : 'Добавить'}
        </button>
      </div>
    </form>
  );
}