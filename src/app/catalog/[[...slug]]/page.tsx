import Image from 'next/image'
import Link from 'next/link'
import { Suspense } from 'react'
import { notFound } from 'next/navigation'
// @ts-ignore
import db from '@/lib/db'

// Интерфейсы данных
interface Badge { 
  id: number; 
  name: string; 
  image_path: string; 
  description?: string; 
}

interface Folder {
  name: string;
  path: string;
  level: number;
}

type TreeNode = { [key: string]: TreeNode };

const PAGE_SIZE = 50;

// --- ПОМОЩНИКИ ---

const safeEncodePath = (path: string) => {
  if (!path) return '';
  return path.split('/').map(part => encodeURIComponent(part)).join('/');
};

const normalizeImagePath = (dbPath: string) => {
  if (!dbPath) return '/placeholder.png';
  let cleanPath = dbPath;
  if (!cleanPath.startsWith('/')) cleanPath = '/' + cleanPath;
  return safeEncodePath(cleanPath);
};

// --- ГЛАВНЫЙ КОМПОНЕНТ ---

export default async function UniversalCatalogPage(props: { 
  params: Promise<{ slug?: string[] }>, 
  searchParams: Promise<{ page?: string }> 
}) {
  const params = await props.params;
  const searchParams = await props.searchParams;
  
  const slugKey = params.slug ? params.slug.join('-') : 'root';
  const pageKey = searchParams.page || '1';
  
  return (
    <Suspense key={`${slugKey}-${pageKey}`} fallback={<LoadingScreen />}>
      <CatalogContent params={props.params} searchParams={props.searchParams} />
    </Suspense>
  )
}

function LoadingScreen() {
  return (
    <div className="min-h-screen bg-[#2e0a12] flex items-center justify-center">
      <div className="w-16 h-16 border-4 border-[#ffcc00] border-t-transparent rounded-full animate-spin"></div>
    </div>
  )
}

async function CatalogContent({ params, searchParams }: { 
  params: Promise<{ slug?: string[] }>, 
  searchParams: Promise<{ page?: string }> 
}) {
  const { slug } = await params;
  const { page } = await searchParams;

  const currentPage = parseInt(page || '1', 10) || 1;
  const offset = (currentPage - 1) * PAGE_SIZE;

  // 1. Текущий путь
  const rawSlug = slug || []; 
  const decodedSlug = rawSlug.map(p => decodeURIComponent(p));
  const currentFolderPath = decodedSlug.join('/');

  // Определяем активную секцию для подсветки в меню (первая часть пути)
  const activeSection = decodedSlug[0] || '';
  
  // 2. СТРОИМ ДЕРЕВО (ИСПРАВЛЕННАЯ ЛОГИКА)
  let tree: TreeNode = {};
  try {
    // Получаем все пути из таблицы folders
    // Если таблица пустая (вдруг), используем fallback к badges (на всякий случай)
    let paths: string[] = [];
    
    // Сначала пробуем из folders
    const folderRows = db.prepare("SELECT path FROM folders ORDER BY path ASC").all() as { path: string }[];
    if (folderRows.length > 0) {
      paths = folderRows.map(r => r.path);
    } else {
      // Fallback: если папки еще не созданы, берем из badges (как раньше)
      const badgeRows = db.prepare("SELECT DISTINCT folder_path FROM badges").all() as { folder_path: string }[];
      paths = badgeRows.map(r => r.folder_path).filter(Boolean);
    }
    
    paths.forEach(pathStr => {
        if (!pathStr) return;
        // Разбиваем путь (ВЛКСМ/Съезды -> ['ВЛКСМ', 'Съезды'])
        // Используем прямой слэш как разделитель
        const parts = pathStr.split('/').filter(Boolean);
        let currentLevel = tree;
        
        parts.forEach(part => {
          if (!currentLevel[part]) {
            currentLevel[part] = {};
          }
          currentLevel = currentLevel[part];
        });
    });
  } catch (error) {
    console.error("Ошибка загрузки меню:", error);
  }

  // 3. ЗАГРУЖАЕМ ЗНАЧКИ
  let badges: Badge[] = [];
  let totalBadges = 0;
  let totalPages = 0;

  try {
    // Считаем количество
    const countStmt = db.prepare("SELECT COUNT(*) as count FROM badges WHERE folder_path = ?");
    const countResult = countStmt.get(currentFolderPath) as { count: number };
    totalBadges = countResult ? countResult.count : 0;
    
    totalPages = Math.ceil(totalBadges / PAGE_SIZE);

    if (totalBadges > 0) {
      // Забираем значки
      const dataStmt = db.prepare("SELECT id, name, image_path FROM badges WHERE folder_path = ? ORDER BY name LIMIT ? OFFSET ?");
      badges = dataStmt.all(currentFolderPath, PAGE_SIZE, offset) as Badge[];
    }
  } catch (err) {
    console.error("Ошибка загрузки значков:", err);
  }

  const title = decodedSlug.length > 0 ? decodedSlug[decodedSlug.length - 1] : "Каталог коллекции";

  // Хелпер для ссылок пагинации
  const createPageLink = (pageNum: number) => {
    const urlPath = rawSlug.length > 0 ? '/' + rawSlug.join('/') : ''; 
    return `/catalog${urlPath}?page=${pageNum}`;
  };

  // Рекурсивный рендер меню
  const RenderTree = ({ nodes, parentPath = [] }: { nodes: TreeNode, parentPath?: string[] }) => {
    const keys = Object.keys(nodes).sort();
    if (keys.length === 0) return null; // Если узлов нет, ничего не рисуем

    return (
      <ul className="space-y-1 pl-2 border-l border-[#444] ml-1.5">
        {keys.map(key => {
          const fullPathArr = [...parentPath, key];
          const linkHref = `/catalog/${safeEncodePath(fullPathArr.join('/'))}`;
          
          const fullPathDecoded = fullPathArr.join('/');
          // Проверка: открыта ли эта ветка?
          // Ветка открыта, если текущая папка начинается с этого пути
          const isActive = currentFolderPath.startsWith(fullPathDecoded);
          const isExactCurrent = currentFolderPath === fullPathDecoded;
          const hasChildren = Object.keys(nodes[key]).length > 0;
          
          return (
            <li key={key}>
              <div className="group">
                <details open={isActive} className="group">
                  <summary className="cursor-pointer list-none flex items-center gap-2 py-1.5 hover:text-[#ffcc00] outline-none">
                    <div className="min-w-[20px] flex justify-center items-center">
                      <span className="text-[#cc0000] font-bold transition-transform group-open:rotate-90">
                        {hasChildren ? '>' : '•'}
                      </span>
                    </div>
                    <Link href={linkHref} className={`text-base leading-snug flex-1 truncate ${isExactCurrent ? 'text-[#ffcc00] font-bold' : 'text-gray-300 hover:text-white'}`}>
                      {key}
                    </Link>
                  </summary>
                  {hasChildren && (
                    <div className="ml-2">
                      <RenderTree nodes={nodes[key]} parentPath={fullPathArr} />
                    </div>
                  )}
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
        {/* ЛЕВАЯ КОЛОНКА: МЕНЮ */}
        <aside className="w-full md:w-[320px] flex flex-col gap-4 flex-shrink-0">
          <div className="bg-[#2a0a0a] rounded p-4 shadow-xl border border-[#3d1414] max-h-[800px] overflow-y-auto custom-scrollbar">
            <h2 className="text-[#ffcc00] font-bold text-lg mb-4 border-b border-[#5c1818] pb-2">КАТАЛОГ</h2>
            <div className="-ml-3">
              <RenderTree nodes={tree} parentPath={[]} />
            </div>
          </div>
          
          <div className="bg-[#2a0a0a] p-3 border-2 border-[#3d1414] shadow-2xl relative w-full h-[400px]">
             <Image src="/poster.jpg" alt="Плакат" fill className="object-cover" unoptimized />
          </div>
        </aside>

        {/* ПРАВАЯ КОЛОНКА: КОНТЕНТ */}
        <section className="flex-1 bg-white rounded p-8 shadow-2xl relative min-h-[600px]">
          {/* Хлебные крошки */}
          <div className="text-sm text-gray-500 mb-4 border-b border-gray-100 pb-2 flex flex-wrap gap-1">
             <Link href="/" className="hover:underline">Каталог</Link>
             {decodedSlug.map((part, i) => (
               <span key={i}> / <span className="font-bold text-gray-700">{part}</span></span>
             ))}
          </div>
          
          <div className="flex justify-between items-end border-b-2 border-[#eee] mb-6 pb-2">
            <h1 className="text-3xl font-serif font-bold text-[#800000]">{title}</h1>
            <span className="text-gray-500 text-sm">Значков: {totalBadges}</span>
          </div>

          {badges.length > 0 ? (
            <div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                {badges.map((badge) => {
                  const safeSrc = normalizeImagePath(badge.image_path);
                  return (
                    <Link key={badge.id} href={`/badge/${badge.id}`} className="flex flex-col group">
                      <div className="relative w-full aspect-square bg-white border border-gray-200 rounded shadow-sm hover:shadow-xl hover:border-[#cc0000] transition-all cursor-pointer overflow-hidden p-2">
                        <Image 
                          src={safeSrc} 
                          alt={badge.name} 
                          fill 
                          className="object-contain" 
                          sizes="(max-width: 768px) 50vw, 20vw" 
                          unoptimized 
                        />
                      </div>
                      <span className="text-xs text-center mt-2 font-bold text-gray-700 group-hover:text-[#800000] truncate px-1" title={badge.name}>
                        {badge.name}
                      </span>
                    </Link>
                  );
                })}
              </div>

              {/* ПАГИНАЦИЯ */}
              {totalPages > 1 && (
                <div className="mt-8 flex justify-center gap-2 flex-wrap pb-4">
                  {currentPage > 1 && (
                    <Link href={createPageLink(currentPage - 1)} className="px-3 py-1 border border-gray-300 bg-white text-black rounded hover:bg-gray-100">←</Link>
                  )}
                  <span className="px-3 py-1 border bg-[#800000] text-white rounded font-bold">{currentPage}</span>
                  {currentPage < totalPages && (
                    <Link href={createPageLink(currentPage + 1)} className="px-3 py-1 border border-gray-300 bg-white text-black rounded hover:bg-gray-100">→</Link>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-10 text-gray-400 bg-gray-50 rounded border border-gray-200">
              <p className="text-lg mb-2">В этой папке значков нет.</p>
              <p className="text-sm">Попробуйте открыть вложенные папки в меню слева.</p>
            </div>
          )}
        </section>
      </div>
    </main>
  )
}