'use client'

import { useState } from 'react'
import Image from 'next/image'
import { uploadImage } from '../actions' // Импортируем функцию загрузки

// --- 1. УМНЫЙ ЗАГРУЗЧИК КАРТИНОК ---
export function ImagePicker({ label, name, defaultValue }: { label: string, name: string, defaultValue: string }) {
  const [preview, setPreview] = useState(defaultValue);
  const [path, setPath] = useState(defaultValue);
  const [loading, setLoading] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLoading(true);
      // Создаем временное превью
      const objectUrl = URL.createObjectURL(file);
      setPreview(objectUrl);

      // Загружаем файл на сервер
      const formData = new FormData();
      formData.append('file', file);
      
      try {
        const serverPath = await uploadImage(formData);
        if (serverPath) {
          setPath(serverPath); // Сохраняем путь от сервера
        }
      } catch (err) {
        alert("Ошибка загрузки файла");
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="mb-6">
      <label className="block text-[#800000] font-bold text-lg mb-2 border-b border-[#eee] pb-1">{label}</label>
      <div className="flex flex-col md:flex-row gap-4 items-start bg-gray-50 p-4 rounded border border-gray-300">
        
        {/* Превью */}
        <div className="relative w-40 h-40 bg-white border-2 border-dashed border-gray-300 flex items-center justify-center rounded overflow-hidden shadow-sm">
          {loading ? (
            <span className="text-blue-600 animate-pulse font-bold">Загрузка...</span>
          ) : preview ? (
            <Image src={preview} alt="Preview" fill className="object-contain" />
          ) : (
            <span className="text-gray-400 text-xs text-center">Нет фото</span>
          )}
        </div>

        {/* Управление */}
        <div className="flex-1 w-full">
          <label className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded cursor-pointer shadow mb-3 transition">
            📂 Выбрать фото на компьютере
            <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
          </label>
          
          {/* Скрытое поле для формы, хранит реальный путь */}
          <input type="text" name={name} value={path} readOnly className="w-full bg-white border border-gray-300 p-2 rounded text-sm font-mono text-gray-700" />
          
          <p className="text-xs text-green-700 mt-2 font-bold">
            {loading ? "Загружаем..." : "Фото готово к сохранению."}
          </p>
        </div>
      </div>
    </div>
  )
}

// --- 2. РЕДАКТОР ТЕКСТА (Google Docs Style) ---
export function RichEditor({ label, name, defaultValue, height = "h-64" }: { label: string, name: string, defaultValue: string, height?: string }) {
  return (
    <div className="mb-6">
      <label className="block text-[#800000] font-bold text-lg mb-2">{label}</label>
      
      {/* Контейнер "Лист бумаги" */}
      <div className="border border-gray-300 rounded-lg bg-white shadow-md overflow-hidden focus-within:ring-2 focus-within:ring-[#800000] transition-all">
        
        {/* Панель инструментов */}
        <div className="bg-[#f8f9fa] border-b border-gray-300 p-2 flex gap-2 items-center flex-wrap sticky top-0 z-10">
          <div className="flex bg-white rounded border border-gray-300 overflow-hidden shadow-sm">
            <span className="px-3 py-1 font-bold border-r text-gray-700 cursor-help" title="Жирный (Используйте <strong>...</strong>)">B</span>
            <span className="px-3 py-1 italic border-r text-gray-700 cursor-help" title="Курсив (Используйте <em>...</em>)">I</span>
            <span className="px-3 py-1 underline text-gray-700 cursor-help" title="Подчеркнутый (Используйте <u>...</u>)">U</span>
          </div>
          
          <div className="h-6 w-px bg-gray-300 mx-1"></div>
          
          <div className="text-xs text-gray-500 font-mono ml-auto">HTML Режим (поддерживает теги)</div>
        </div>

        {/* Поле ввода */}
        <textarea 
          name={name} 
          defaultValue={defaultValue} 
          className={`w-full p-6 outline-none resize-y text-gray-900 font-serif text-lg leading-relaxed ${height} selection:bg-yellow-200`}
          placeholder="Введите текст здесь..."
        ></textarea>
      </div>
    </div>
  )
}

// --- 3. КНОПКИ УПРАВЛЕНИЯ ПАПКАМИ ---
export function FolderControls({ path }: { path: string }) {
  // В будущем здесь будет модальное окно для создания папки
  return (
    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-auto bg-black/10 rounded p-0.5 backdrop-blur-sm">
      <button type="button" className="w-6 h-6 flex items-center justify-center bg-white text-blue-700 rounded shadow hover:bg-blue-600 hover:text-white transition" title="Переименовать">✎</button>
      <button type="button" className="w-6 h-6 flex items-center justify-center bg-white text-green-700 rounded shadow hover:bg-green-600 hover:text-white transition" title="Добавить подпапку">+</button>
      <button type="button" className="w-6 h-6 flex items-center justify-center bg-white text-red-700 rounded shadow hover:bg-red-600 hover:text-white transition" title="Удалить">×</button>
    </div>
  )
}