import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
// @ts-ignore
import db from '@/lib/db'

type TreeNode = { [key: string]: TreeNode };
interface Badge {
  id: number;
  name: string;
  image_path: string;
  folder_path: string;
  year?: string;
  material?: string;
  description?: string;
}

// --- ПОМОЩНИКИ (Те же, что и в каталоге) ---

// Правильное кодирование пути для URL (русские буквы -> %D0...)
const safeEncodePath = (path: string) => {
  if (!path) return '';
  return path.split('/').map(part => encodeURIComponent(part)).join('/');
};

// Исправление пути к картинке
const normalizeImagePath = (dbPath: string) => {
  if (!dbPath) return '/placeholder.png';
  let cleanPath = dbPath;
  // Добавляем слэш в начало, если его нет
  if (!cleanPath.startsWith('/')) {
    cleanPath = '/' + cleanPath;
  }
  return safeEncodePath(cleanPath);
};

export default async function BadgePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  // Микро-пауза для показа loading.tsx
  await new Promise(resolve => setTimeout(resolve, 0));

  let badge: Badge | undefined;
  try {
    const stmt = db.prepare("SELECT * FROM badges WHERE id = ?");
    badge = stmt.get(id) as Badge;
  } catch (error) { console.error("Ошибка БД:", error); }

  if (!badge) notFound();

  // Генерируем безопасный путь для картинки
  const safeImageSrc = normalizeImagePath(badge.image_path);

  // Определяем активный раздел и пути
  const pathParts = badge.folder_path ? badge.folder_path.split('/') : [];
  const activeSection = pathParts[0] || '';
  
  // Исправляем ссылку "В папку" (кодируем русские буквы)
  const backLink = `/catalog/${safeEncodePath(badge.folder_path)}`;

  // --- ЛОГИКА "СОСЕДЕЙ" (Вперед/Назад) ---
  let prevBadgeId: number | null = null;
  let nextBadgeId: number | null = null;
  try {
    const prev = db.prepare("SELECT id FROM badges WHERE folder_path = ? AND name < ? ORDER BY name DESC LIMIT 1").get(badge.folder_path, badge.name) as { id: number };
    const next = db.prepare("SELECT id FROM badges WHERE folder_path = ? AND name > ? ORDER BY name ASC LIMIT 1").get(badge.folder_path, badge.name) as { id: number };
    
    if (prev) prevBadgeId = prev.id;
    if (next) nextBadgeId = next.id;
  } catch (err) {
    console.error("Ошибка поиска соседей:", err);
  }

  // --- СТРОИМ ДЕРЕВО КАТАЛОГА ---
  let tree: TreeNode = {};
  try {
    const rows = db.prepare("SELECT DISTINCT folder_path FROM badges").all() as { folder_path: string }[];
    rows.forEach(row => {
      if (!row.folder_path) return;
      const parts = row.folder_path.split('/').filter(Boolean);
      let currentLevel = tree;
      parts.forEach(part => {
        if (!currentLevel[part]) currentLevel[part] = {};
        currentLevel = currentLevel[part];
      });
    });
  } catch (error) { console.error("Ошибка БД:", error); }

  const RenderTree = ({ nodes, parentPath = [] }: { nodes: TreeNode, parentPath?: string[] }) => {
    const keys = Object.keys(nodes).sort();
    if (keys.length === 0) return null;
    return (
      <ul className="space-y-1 pl-2 border-l border-[#444] ml-1.5">
        {keys.map(key => {
          const fullPathArr = [...parentPath, key];
          // Здесь тоже используем безопасное кодирование путей
          const fullPathStr = safeEncodePath(fullPathArr.join('/'));
          const href = `/catalog/${fullPathStr}`;
          
          const rawPathStr = fullPathArr.join('/');
          const isActive = badge!.folder_path.startsWith(rawPathStr);
          const isExactCurrent = badge!.folder_path === rawPathStr;
          const hasChildren = Object.keys(nodes[key]).length > 0;

          return (
            <li key={key}>
              <div className="group">
                <details open={isActive} className="group">
                  <summary className="cursor-pointer list-none flex items-center gap-2 py-1.5 hover:text-[#ffcc00] outline-none">
                    <div className="min-w-[20px] flex justify-center items-center">
                      {hasChildren ? (
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-[#cc0000] transition-transform duration-200 group-open:rotate-90"><path d="M9 18l6-6-6-6" /></svg>
                      ) : ( <svg viewBox="0 0 24 24" fill="currentColor" className="w-1.5 h-1.5 text-gray-500"><circle cx="12" cy="12" r="12" /></svg> )}
                    </div>
                    <Link href={href} className={`text-base leading-snug transition-colors flex-1 ${isExactCurrent ? 'text-[#ffcc00] font-bold' : 'text-gray-300 hover:text-white'}`}>{key}</Link>
                  </summary>
                  <div className="ml-2"><RenderTree nodes={nodes[key]} parentPath={fullPathArr} /></div>
                </details>
              </div>
            </li>
          );
        })}
      </ul>
    );
  };

  return (
    <main className="min-h-screen pb-10" style={{ backgroundColor: '#2e0a12', backgroundImage: 'repeating-linear-gradient(90deg, #2e0a12, #2e0a12 15px, #21050a 15px, #21050a 30px)' }}>
      <header className="w-full max-w-[1200px] mx-auto pt-4 relative z-10">
        <div className="relative w-full h-[180px] md:h-[220px] border-b-4 border-[#cc0000] bg-[#21050a] shadow-lg">
          <Image src="/banner.jpg" alt="ВЛКСМ Баннер" fill className="object-cover" priority unoptimized />
        </div>
        <nav className="bg-[#1a0505] text-white py-2 px-4 flex flex-wrap gap-6 text-xl font-bold border-b border-[#333] shadow-md justify-center md:justify-start">
          <Link href="/" className="hover:text-[#ffcc00] hover:underline transition">Главная</Link>
          <Link href={`/catalog/${encodeURIComponent('Региональный комсомол')}`} className={`transition ${activeSection === 'Региональный комсомол' ? 'text-[#ffcc00] underline' : 'hover:text-[#ffcc00] hover:underline'}`}>Региональный комсомол</Link>
          <Link href={`/catalog/${encodeURIComponent('ССО')}`} className={`transition ${activeSection === 'ССО' ? 'text-[#ffcc00] underline' : 'hover:text-[#ffcc00] hover:underline'}`}>ССО</Link>
          <Link href={`/catalog/${encodeURIComponent('ВЛКСМ')}`} className={`transition ${activeSection === 'ВЛКСМ' ? 'text-[#ffcc00] underline' : 'hover:text-[#ffcc00] hover:underline'}`}>ВЛКСМ</Link>
          <Link href={`/catalog/${encodeURIComponent('Разное')}`} className={`transition ${activeSection === 'Разное' ? 'text-[#ffcc00] underline' : 'hover:text-[#ffcc00] hover:underline'}`}>Разное</Link>
          <Link href="/contact" className="hover:text-[#ffcc00] hover:underline transition ml-auto">Контакты</Link>
        </nav>
      </header>

      <div className="max-w-[1200px] mx-auto flex flex-col md:flex-row mt-6 gap-4 px-2">
        <aside className="w-full md:w-[320px] flex flex-col gap-4 flex-shrink-0">
          <div className="bg-[#2a0a0a] rounded p-4 shadow-xl border border-[#3d1414] max-h-[800px] overflow-y-auto custom-scrollbar">
            <h2 className="text-[#ffcc00] font-bold text-lg mb-4 border-b border-[#5c1818] pb-2">КАТАЛОГ</h2>
            <div className="-ml-3"><RenderTree nodes={tree} parentPath={[]} /></div>
          </div>
          <div className="bg-[#2a0a0a] p-3 border-2 border-[#3d1414] shadow-2xl relative w-full h-[400px]">
             {/* unoptimized добавлен и сюда */}
             <Image src="/poster.jpg" alt="Плакат ВЛКСМ" fill className="object-cover" unoptimized />
          </div>
        </aside>

        <section className="flex-1 bg-white rounded p-8 shadow-2xl relative">
          <div className="flex items-center justify-between border-b-2 border-[#eee] mb-6 pb-2">
            <h1 className="text-3xl font-serif font-bold text-[#800000]">{badge.name}</h1>
            
            <div className="flex gap-2">
              {prevBadgeId ? (
                <Link href={`/badge/${prevBadgeId}`} className="px-3 py-1 border border-gray-300 rounded hover:bg-[#ffcc00] hover:text-[#2e0a12] text-gray-700 font-bold transition">← Пред.</Link>
              ) : (
                <span className="px-3 py-1 border border-gray-100 rounded text-gray-300 cursor-not-allowed">← Пред.</span>
              )}

              <Link href={backLink} className="px-3 py-1 border border-gray-300 rounded bg-gray-50 hover:bg-gray-100 text-gray-700 font-bold transition">В папку</Link>

              {nextBadgeId ? (
                <Link href={`/badge/${nextBadgeId}`} className="px-3 py-1 border border-gray-300 rounded hover:bg-[#ffcc00] hover:text-[#2e0a12] text-gray-700 font-bold transition">След. →</Link>
              ) : (
                <span className="px-3 py-1 border border-gray-100 rounded text-gray-300 cursor-not-allowed">След. →</span>
              )}
            </div>
          </div>

          <div className="flex flex-col xl:flex-row gap-8">
            <div className="w-full xl:w-1/2 bg-gray-50 border border-gray-200 rounded p-4 flex items-center justify-center shadow-inner min-h-[400px]">
               <div className="relative w-full h-full min-h-[400px]">
                 {/* ВАЖНО: Используем safeImageSrc и unoptimized */}
                 <Image src={safeImageSrc} alt={badge.name} fill className="object-contain" unoptimized />
               </div>
            </div>
            <div className="w-full xl:w-1/2 space-y-6 text-lg">
              <div className="p-6 bg-gray-50 border-l-4 border-[#cc0000] shadow-sm">
                <h3 className="font-bold text-[#800000] mb-4 text-xl">Характеристики</h3>
                <ul className="space-y-2 text-base text-gray-800">
                  <li><span className="font-bold text-gray-500 w-32 inline-block">Путь:</span> {badge.folder_path}</li>
                  <li className="border-t border-gray-200 my-2 pt-2"></li>
                  <li><span className="font-bold text-gray-500 w-32 inline-block">Год:</span> {badge.year || '—'}</li>
                  <li><span className="font-bold text-gray-500 w-32 inline-block">Материал:</span> {badge.material || '—'}</li>
                </ul>
              </div>
              <div>
                <h3 className="font-bold text-[#800000] mb-3 text-xl">Описание</h3>
                <p className="text-gray-700 leading-relaxed text-lg font-serif">{badge.description || 'Описание для этого значка пока отсутствует.'}</p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}