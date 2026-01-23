import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
// @ts-ignore
import db from '@/lib/db'
import { saveBadge } from '../../../actions'
import { RichEditor, ImagePicker } from '../../ui'

// 1. Определяем интерфейс значка, чтобы TypeScript знал все поля
interface Badge {
  id: number;
  name: string;
  image_path: string;
  folder_path: string;
  year?: string;
  material?: string;
  description?: string;
}

export default async function EditBadgePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  // 2. Выполняем запрос и явно приводим результат к типу Badge | undefined
  let badge: Badge | undefined;
  try {
    const stmt = db.prepare("SELECT * FROM badges WHERE id = ?");
    const result = stmt.get(id);
    if (result) {
      badge = result as Badge;
    }
  } catch (e) {
    console.error("Ошибка при загрузке значка для редактирования:", e);
  }

  // 3. Если значок не найден, показываем 404
  if (!badge) return notFound();

  return (
    <main className="min-h-screen pb-10" style={{ backgroundColor: '#2e0a12', backgroundImage: 'repeating-linear-gradient(90deg, #2e0a12, #2e0a12 15px, #21050a 15px, #21050a 30px)' }}>
      <header className="w-full max-w-[1200px] mx-auto pt-4 relative z-10">
        <div className="relative w-full h-[180px] md:h-[220px] border-b-4 border-[#cc0000] bg-[#21050a] shadow-lg">
          <Image src="/banner.jpg" alt="ВЛКСМ Баннер" fill className="object-cover" priority />
          <div className="absolute top-0 right-0 bg-red-600 text-white px-3 py-1 text-xs font-bold uppercase shadow-md">
            Редактирование
          </div>
        </div>
        <nav className="bg-[#1a0505] text-white py-2 px-4 flex justify-between items-center border-b border-[#333] shadow-md">
          <span className="text-xl font-bold text-[#ffcc00]">Редактор значка</span>
          {/* Теперь TypeScript видит свойство folder_path */}
          <Link 
            href={`/admin?tab=catalog&path=${encodeURIComponent(badge.folder_path)}`} 
            className="bg-gray-700 px-4 py-1 rounded hover:bg-gray-600 font-bold text-sm"
          >
            Отмена / Назад
          </Link>
        </nav>
      </header>

      <div className="max-w-[1200px] mx-auto mt-6 px-2">
        <section className="bg-white rounded p-8 shadow-2xl relative">
          <form action={saveBadge.bind(null, badge.id)}>
            <div className="flex items-center justify-between border-b-2 border-[#eee] mb-6 pb-2">
              <div className="w-full mr-4">
                <label className="block text-xs text-gray-500 font-bold uppercase mb-1">Название значка</label>
                <input 
                  type="text" 
                  name="name" 
                  defaultValue={badge.name} 
                  className="w-full text-3xl font-serif font-bold text-[#800000] border-b-2 border-gray-300 focus:border-[#800000] outline-none bg-white text-black" 
                />
              </div>
            </div>

            <div className="flex flex-col xl:flex-row gap-8">
              <div className="w-full xl:w-1/2">
                 <ImagePicker label="ИЗОБРАЖЕНИЕ" name="image_path" defaultValue={badge.image_path} />
              </div>

              <div className="w-full xl:w-1/2 space-y-6 text-lg">
                <div className="p-6 bg-gray-50 border-l-4 border-[#cc0000] shadow-sm">
                  <h3 className="font-bold text-[#800000] mb-4 text-xl">ХАРАКТЕРИСТИКИ</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 uppercase">Папка (Путь)</label>
                      <input 
                        type="text" 
                        value={badge.folder_path} 
                        readOnly 
                        className="w-full bg-gray-200 border border-gray-300 rounded p-2 text-gray-600 text-sm font-mono" 
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-bold text-gray-700 uppercase">Год</label>
                        <input 
                          type="text" 
                          name="year" 
                          defaultValue={badge.year} 
                          className="w-full border-2 border-gray-300 rounded p-2 focus:border-[#800000] outline-none text-black" 
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-700 uppercase">Материал</label>
                        <input 
                          type="text" 
                          name="material" 
                          defaultValue={badge.material} 
                          className="w-full border-2 border-gray-300 rounded p-2 focus:border-[#800000] outline-none text-black" 
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <RichEditor label="ОПИСАНИЕ / ИСТОРИЯ" name="description" defaultValue={badge.description || ''} height="h-64" />
                
                <div className="flex justify-end pt-4 border-t border-gray-200">
                  <button type="submit" className="bg-[#800000] text-white px-8 py-3 rounded font-bold text-lg hover:bg-[#600000] shadow-lg transform hover:scale-105 transition">
                    СОХРАНИТЬ ИЗМЕНЕНИЯ
                  </button>
                </div>
              </div>
            </div>
          </form>
        </section>
      </div>
    </main>
  )
}