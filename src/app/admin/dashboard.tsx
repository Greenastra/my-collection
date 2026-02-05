'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import AddBadgeForm from './AddBadgeForm';
// 1. Добавили createBadge в импорт
import { updateBadge, createBadge } from '@/app/actions'

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

export default function AdminDashboard({ 
  folders, 
  badges, 
  currentFolder
}: { 
  folders: Folder[], 
  badges: Badge[], 
  currentFolder: string
}) {
  const router = useRouter(); 
  const [editingBadge, setEditingBadge] = useState<Badge | null>(null);
  // 2. Добавили состояние для окна создания
  const [isCreating, setIsCreating] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredFolders = folders.filter(f => 
    f.path.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex h-screen bg-gray-100 text-gray-900 font-sans">
      
      {/* БОКОВОЕ МЕНЮ */}
      <aside className="w-64 bg-[#2e0a12] text-white flex flex-col flex-shrink-0">
        <div className="p-4 border-b border-gray-700 font-bold text-xl text-[#ffcc00]">
          Админка
        </div>
        
        <nav className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
          <div className="mt-2 px-3 text-xs text-gray-400 uppercase font-bold">Папки каталога</div>
          <input 
            type="text" 
            placeholder="Поиск папки..." 
            className="w-full bg-black/20 text-sm p-1.5 rounded mt-2 mb-4 border border-gray-700 focus:border-[#ffcc00] outline-none text-gray-200"
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          
          <div className="space-y-0.5">
            {filteredFolders.map((f) => (
              <Link 
                key={f.path} 
                href={`/admin?folder=${encodeURIComponent(f.path)}`}
                className={`block px-3 py-1.5 text-sm rounded truncate ${currentFolder === f.path ? 'bg-[#ffcc00] text-black font-bold' : 'text-gray-300 hover:text-white hover:bg-white/10'}`}
              >
                {f.path}
              </Link>
            ))}
          </div>
        </nav>
      </aside>

      {/* ОСНОВНАЯ ОБЛАСТЬ */}
      <main className="flex-1 overflow-y-auto p-8 relative">
        {currentFolder && (
  <AddBadgeForm currentFolder={currentFolder} onCreated={() => router.refresh()} />
)}
        <header className="mb-6 flex justify-between items-end border-b pb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              {currentFolder || 'Выберите папку слева'}
            </h1>
            <p className="text-gray-500">Значков в папке: {badges.length}</p>
          </div>
          
          <div className="flex gap-4 items-center">
            {currentFolder && (
              <>
                 <Link href={`/catalog/${currentFolder}`} target="_blank" className="text-blue-600 hover:underline text-sm">
                  Открыть на сайте →
                </Link>
                {/* 3. КНОПКА ДОБАВЛЕНИЯ */}
                <button 
                  onClick={() => setIsCreating(true)}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded font-bold shadow transition"
                >
                  + Добавить значок
                </button>
              </>
            )}
          </div>
        </header>

        {badges.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            {currentFolder ? 'В этой папке нет значков.' : 'Выберите папку в меню слева.'}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {badges.map(badge => (
              <div 
                key={badge.id} 
                onClick={() => setEditingBadge(badge)}
                className="border bg-white rounded p-2 cursor-pointer hover:shadow-xl hover:border-[#cc0000] transition group"
              >
                <div className="aspect-square relative mb-2">
                    <Image 
                      src={badge.image_path} 
                      alt={badge.name} 
                      fill 
                      className="object-contain" 
                      unoptimized 
                    />
                </div>
                <div className="text-xs font-bold text-center truncate">{badge.name}</div>
                <div className="text-[10px] text-center text-gray-500 h-4">
                  {badge.year ? badge.year : <span className="text-red-300">• год не указан</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* МОДАЛЬНОЕ ОКНО РЕДАКТИРОВАНИЯ (СУЩЕСТВУЮЩЕЕ) */}
      {editingBadge && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm" onClick={() => setEditingBadge(null)}>
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-4xl flex overflow-hidden max-h-[90vh]" onClick={e => e.stopPropagation()}>
            {/* Картинка */}
            <div className="w-1/2 bg-gray-100 p-4 flex items-center justify-center border-r">
               <div className="relative w-full h-full min-h-[300px]">
                 <Image src={editingBadge.image_path} alt={editingBadge.name} fill className="object-contain" unoptimized />
               </div>
            </div>
            {/* Форма редактирования */}
            <div className="w-1/2 p-6 overflow-y-auto">
              <h3 className="text-xl font-bold mb-4 text-[#800000]">Редактирование</h3>
              <form action={async (formData) => {
                  const result = await updateBadge(formData);
                  if (result.success) {
                    alert('Сохранено!'); router.refresh(); setEditingBadge(null);
                  } else {
                    alert('Ошибка: ' + result.message);
                  }
              }} className="space-y-4">
                <input type="hidden" name="id" value={editingBadge.id} />
                <div>
                  <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Название</label>
                  <input name="name" defaultValue={editingBadge.name} className="w-full p-2 border rounded" required />
                </div>
                {/* ...Остальные поля редактирования... */}
                <div className="grid grid-cols-2 gap-4">
                   <input name="year" defaultValue={editingBadge.year || ''} placeholder="Год" className="w-full p-2 border rounded" />
                   <input name="material" defaultValue={editingBadge.material || ''} placeholder="Материал" className="w-full p-2 border rounded" />
                </div>
                <textarea name="description" rows={5} defaultValue={editingBadge.description || ''} className="w-full p-2 border rounded" placeholder="Описание..." />
                
                <div className="pt-4 flex justify-end gap-2">
                  <button type="button" onClick={() => setEditingBadge(null)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded">Отмена</button>
                  <button type="submit" className="px-6 py-2 bg-[#cc0000] text-white rounded font-bold">Сохранить</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* 4. НОВОЕ МОДАЛЬНОЕ ОКНО СОЗДАНИЯ */}
      {isCreating && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm" onClick={() => setIsCreating(false)}>
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
            <h3 className="text-xl font-bold mb-4 text-green-700">Добавление нового значка</h3>
            
            <form action={async (formData) => {
                // Добавляем текущую папку
                formData.append('folder_path', currentFolder);
                const result = await createBadge(formData);
                
                if (result.success) {
                  alert('Значок добавлен!'); 
                  router.refresh(); 
                  setIsCreating(false);
                } else {
                  alert('Ошибка: ' + result.message);
                }
            }} className="space-y-4">
              
              <div>
                <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Название *</label>
                <input name="name" className="w-full p-2 border rounded focus:border-green-500 outline-none" required />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Путь к картинке *</label>
                <input name="image_path" placeholder="/img/papka/badge.jpg" className="w-full p-2 border rounded focus:border-green-500 outline-none" required />
                <p className="text-[10px] text-gray-400 mt-1">Файл должен лежать в папке public/...</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Год</label>
                  <input name="year" className="w-full p-2 border rounded" />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Материал</label>
                  <input name="material" className="w-full p-2 border rounded" />
                </div>
              </div>

              <div>
                  <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Описание</label>
                  <textarea name="description" rows={3} className="w-full p-2 border rounded" />
              </div>

              <div className="pt-4 flex justify-end gap-2">
                <button type="button" onClick={() => setIsCreating(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded">Отмена</button>
                <button type="submit" className="px-6 py-2 bg-green-600 text-white rounded font-bold hover:bg-green-700">Создать</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}