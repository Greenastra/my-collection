import Image from 'next/image'
import Link from 'next/link'
import { Suspense } from 'react'
// @ts-ignore
import db from '@/lib/db'

type TreeNode = { [key: string]: TreeNode };

interface Badge {
  id: number;
  name: string;
  image_path: string;
  description?: string;
}

const PAGE_SIZE = 50;

// 1. ОСНОВНОЙ КОМПОНЕНТ-ОБЕРТКА
export default async function UniversalCatalogPage(props: { 
  params: Promise<{ slug?: string[] }>,
  searchParams: Promise<{ page?: string }>
}) {
  const params = await props.params;
  const searchParams = await props.searchParams;
  
  const slugKey = params.slug ? params.slug.join('/') : 'root';
  const pageKey = searchParams.page || '1';
  const uniqueKey = `${slugKey}-page-${pageKey}`;

  return (
    <Suspense key={uniqueKey} fallback={<LoadingScreen />}>
      <CatalogContent params={props.params} searchParams={props.searchParams} />
    </Suspense>
  )
}

// 2. ЭКРАН ЗАГРУЗКИ (Ваш дизайн)
function LoadingScreen() {
  return (
    <div className="min-h-screen bg-[#2e0a12] flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-[#ffcc00] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-[#ffcc00] text-xl font-bold animate-pulse">Загрузка коллекции...</p>
      </div>
    </div>
  )
}

// 3. ОСНОВНОЙ КОНТЕНТ
async function CatalogContent({ 
  params, 
  searchParams 
}: { 
  params: Promise<{ slug?: string[] }>,
  searchParams: Promise<{ page?: string }>
}) {
  const { slug } = await params;
  const { page } = await searchParams;
  
  // Убрана искусственная задержка для максимальной скорости

  const currentPage = parseInt(page || '1', 10) || 1;
  const offset = (currentPage - 1) * PAGE_SIZE;

  const currentPath = slug || []; 
  const decodedPath = currentPath.map(p => decodeURIComponent(p));
  const currentPathString = decodedPath.join('/');
  
  const activeSection = decodedPath[0];

  // --- СТРОИМ ДЕРЕВО ---
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
  } catch (error) { 
    console.error("Ошибка БД (дерево):", error); 
  }

  // --- ПОЛУЧАЕМ ЗНАЧКИ ---
  let badges: Badge[] = [];
  let totalBadges = 0;
  let totalPages = 0;

  try {
    const countResult = db.prepare("SELECT COUNT(*) as count FROM badges WHERE folder_path = ?").get(currentPathString) as { count: number };
    totalBadges = countResult ? countResult.count : 0;
    totalPages = Math.ceil(totalBadges / PAGE_SIZE);

    if (totalBadges > 0) {
      badges = db.prepare("SELECT * FROM badges WHERE folder_path = ? ORDER BY name LIMIT ? OFFSET ?")
                 .all(currentPathString, PAGE_SIZE, offset) as Badge[];
    }
  } catch (err) {
    console.error("Ошибка поиска значков:", err);
  }

  const title = decodedPath.length > 0 ? decodedPath[decodedPath.length - 1] : "Каталог коллекции";

  // --- МЕНЮ СЛЕВА ---
  const RenderTree = ({ nodes, parentPath = [] }: { nodes: TreeNode, parentPath?: string[] }) => {
    const keys = Object.keys(nodes).sort();
    if (keys.length === 0) return null;
    return (
      <ul className="space-y-1 pl-2 border-l border-[#444] ml-1.5">
        {keys.map(key => {
          const fullPathArr = [...parentPath, key];
          const fullPathStr = fullPathArr.join('/');
          const href = `/catalog/${fullPathStr}`;
          
          const isActive = currentPathString.startsWith(fullPathStr);
          const isExactCurrent = currentPathString === fullPathStr;
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
          <Image src="/banner.jpg" alt="ВЛКСМ Баннер" fill className="object-cover" priority />
        </div>
        <nav className="bg-[#1a0505] text-white py-2 px-4 flex flex-wrap gap-6 text-xl font-bold border-b border-[#333] shadow-md justify-center md:justify-start">
          <Link href="/" className="hover:text-[#ffcc00] hover:underline transition">Главная</Link>
          <Link href="/catalog/Региональный комсомол" className={`transition ${activeSection === 'Региональный комсомол' ? 'text-[#ffcc00] underline' : 'hover:text-[#ffcc00] hover:underline'}`}>Региональный комсомол</Link>
          <Link href="/catalog/ССО" className={`transition ${activeSection === 'ССО' ? 'text-[#ffcc00] underline' : 'hover:text-[#ffcc00] hover:underline'}`}>ССО</Link>
          <Link href="/catalog/ВЛКСМ" className={`transition ${activeSection === 'ВЛКСМ' ? 'text-[#ffcc00] underline' : 'hover:text-[#ffcc00] hover:underline'}`}>ВЛКСМ</Link>
          <Link href="/catalog/Разное" className={`transition ${activeSection === 'Разное' ? 'text-[#ffcc00] underline' : 'hover:text-[#ffcc00] hover:underline'}`}>Разное</Link>
          <Link href="/contact" className="hover:text-[#ffcc00] hover:underline transition ml-auto">Контакты</Link>
        </nav>
      </header>

      <div className="max-w-[1200px] mx-auto flex flex-col md:flex-row mt-6 gap-4 px-2">
        <aside className="w-full md:w-[320px] flex flex-col gap-4 flex-shrink-0">
          <div className="bg-[#2a0a0a] rounded p-4 shadow-xl border border-[#3d1414] max-h-[800px] overflow-y-auto custom-scrollbar">
            <h2 className="text-[#ffcc00] font-bold text-lg mb-4 border-b border-[#5c1818] pb-2">КАТАЛОГ</h2>
            <div className="-ml-3"><RenderTree nodes={tree} parentPath={[]} /></div>
          </div>
          <div className="bg-[#2a0a0a] p-3 border-2 border-[#3d1414] shadow-2xl">
             <img src="/poster.jpg" alt="Плакат ВЛКСМ" className="w-full h-auto object-cover" />
          </div>
        </aside>

        <section className="flex-1 bg-white rounded p-8 shadow-2xl relative min-h-[600px]">
          <div className="text-sm text-gray-500 mb-4 border-b border-gray-100 pb-2">
             <Link href="/" className="hover:underline">Каталог</Link>
             {decodedPath.map((part, i) => <span key={i}> / <span className="font-bold text-gray-700">{part}</span></span>)}
          </div>
          <h1 className="text-3xl font-serif font-bold text-[#800000] border-b-2 border-[#eee] mb-6 pb-2">{title}</h1>
          <div className="bg-gray-50 border-l-4 border-[#cc0000] p-4 mb-8">
            <h3 className="font-bold text-[#800000] mb-2">Историческая справка</h3>
            <p className="text-gray-700 leading-relaxed font-serif">Здесь будет расположена историческая информация, посвященная разделу «{title}».</p>
          </div>
          
          {badges.length > 0 ? (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-800">Значки <span className="text-sm font-normal text-gray-500">({totalBadges} шт.)</span></h2>
                {totalPages > 1 && <span className="text-sm text-gray-500">Страница {currentPage} из {totalPages}</span>}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                {badges.map((badge) => (
                  <Link key={badge.id} href={`/badge/${badge.id}`} className="flex flex-col group">
                    <div className="relative w-full aspect-square bg-white border border-gray-200 rounded shadow-sm hover:shadow-xl hover:border-[#cc0000] transition-all cursor-pointer overflow-hidden p-2">
                      <Image src={badge.image_path} alt={badge.name} fill className="object-contain" />
                    </div>
                    <span className="text-xs text-center mt-2 font-bold text-gray-700 group-hover:text-[#800000] truncate px-1">{badge.name}</span>
                  </Link>
                ))}
              </div>

              {/* ПАГИНАЦИЯ */}
              {totalPages > 1 && (
                <div className="mt-8 flex justify-center gap-2 flex-wrap pb-4">
                  {/* Кнопка НАЗАД */}
                  {currentPage > 1 ? (
                    <Link 
                      href={`/catalog/${currentPathString}?page=${currentPage - 1}`} 
                      className="px-3 py-1 border border-gray-300 bg-white text-black rounded hover:bg-gray-100"
                    >
                      ←
                    </Link>
                  ) : (
                    <span className="px-3 py-1 border border-gray-200 bg-white text-gray-300 rounded cursor-not-allowed">←</span>
                  )}

                  {/* ЦИФРЫ */}
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(pageNum => {
                    const isCurrent = pageNum === currentPage;
                    const showPage = 
                      pageNum === 1 || 
                      pageNum === totalPages || 
                      (pageNum >= currentPage - 2 && pageNum <= currentPage + 2);

                    if (showPage) {
                      return (
                        <Link 
                          key={pageNum} 
                          href={`/catalog/${currentPathString}?page=${pageNum}`} 
                          className={`px-3 py-1 border rounded font-medium transition-colors ${
                            isCurrent 
                              ? 'bg-[#800000] text-white border-[#800000]' 
                              : 'bg-white text-black border-gray-300 hover:bg-gray-100'
                          }`}
                        >
                          {pageNum}
                        </Link>
                      );
                    } else if (pageNum === currentPage - 3 || pageNum === currentPage + 3) {
                      return <span key={pageNum} className="px-1 text-gray-500 font-bold self-end pb-1">...</span>;
                    }
                    return null;
                  })}

                  {/* Кнопка ВПЕРЕД */}
                  {currentPage < totalPages ? (
                    <Link 
                      href={`/catalog/${currentPathString}?page=${currentPage + 1}`} 
                      className="px-3 py-1 border border-gray-300 bg-white text-black rounded hover:bg-gray-100"
                    >
                      →
                    </Link>
                  ) : (
                    <span className="px-3 py-1 border border-gray-200 bg-white text-gray-300 rounded cursor-not-allowed">→</span>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-10 text-gray-400"><p>В этой папке нет прямых значков.</p><p className="text-sm">Выберите подкатегорию в меню слева.</p></div>
          )}
        </section>
      </div>
    </main>
  )
}