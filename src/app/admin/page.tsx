import Image from 'next/image'
import Link from 'next/link'
// @ts-ignore
import db from '@/lib/db'
import { saveSiteContent, saveFolderMeta, deleteBadge, createBadge } from '../actions'
import { RichEditor, ImagePicker, FolderControls } from './ui'

const PAGE_SIZE = 50;

type TreeNode = { [key: string]: TreeNode };
interface Badge {
  id: number;
  name: string;
  image_path: string;
  folder_path: string;
}

// Получение данных
function getSiteContent(key: string, defaultValue: string = '') {
  try {
    const row = db.prepare("SELECT value FROM site_content WHERE key = ?").get(key) as { value: string };
    return row ? row.value : defaultValue;
  } catch (e) { return defaultValue; }
}
function getFolderDescription(path: string) {
  try {
    const row = db.prepare("SELECT description FROM folder_meta WHERE folder_path = ?").get(path) as { description: string };
    return row ? row.description : '';
  } catch (e) { return ''; }
}

export default async function AdminPage({
  searchParams
}: {
  searchParams: Promise<{ path?: string; page?: string; tab?: string }>
}) {
  const { path, page, tab } = await searchParams;
  const currentTab = tab || 'main'; 

  // --- ЛОГИКА КАТАЛОГА ---
  const currentPathString = path ? decodeURIComponent(path) : '';
  const decodedPath = currentPathString ? currentPathString.split('/') : [];
  const currentPage = parseInt(page || '1', 10) || 1;
  const offset = (currentPage - 1) * PAGE_SIZE;

  // Дерево
  let tree: TreeNode = {};
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

  // Значки
  let badges: Badge[] = [];
  let totalBadges = 0;
  let totalPages = 0;
  if (currentTab === 'catalog') {
    const countResult = db.prepare("SELECT COUNT(*) as count FROM badges WHERE folder_path = ?").get(currentPathString) as { count: number };
    totalBadges = countResult.count;
    totalPages = Math.ceil(totalBadges / PAGE_SIZE);
    badges = db.prepare("SELECT * FROM badges WHERE folder_path = ? ORDER BY name LIMIT ? OFFSET ?")
               .all(currentPathString, PAGE_SIZE, offset) as Badge[];
  }

  const folderDesc = getFolderDescription(currentPathString);
  
  // --- ПОЛНЫЙ ТЕКСТ ДЛЯ ГЛАВНОЙ ---
  const fullHomeText = `
<p class="mb-4"><strong class="text-[#800000]">Большое спасибо</strong> за внимание к моему сайту. Представляю Вашему вниманию сайт-каталог моей коллекции наград, знаков и значков комсомола.</p>
<p class="mb-4">Это моя первая попытка систематизировать свою коллекцию по данной теме.</p>
<p class="mb-4">На сайте приведены некоторые выдержки из истории СССР, комсомола, так же дано описание некоторых наград ВЛКСМ, это сделано для упрощения систематизации и сохранения тех данных, которые смог найти по данной теме.</p>
<div class="italic text-[#666] border-l-4 border-[#cc0000] pl-4 bg-gray-50 py-2 mb-4">
  <p>Каталог не претендует на полноту, будет пополняться по мере поступления коллекционного материала и информации по знакам.</p>
</div>
<p class="mb-4 text-sm text-gray-600">Для большей информативности каталога при наведении курсора на скан любого знака высвечивается дополнительная информация: какое крепление у знака и из каких материалов он изготовлен, в последующем постараюсь добавить туда размеры знака и вид штампа завода изготовителя, а так же год выпуска, примерный тираж, редкость для знаков по которым найду информацию.</p>
<p class="mb-2 font-bold text-[#800000]">Все знаки и значки посвященные комсомолу можно условно классифицировать на следующие группы:</p>
<ol class="list-decimal list-inside space-y-2 mb-6 ml-2">
  <li>Членские, удостоверяющие принадлежность к ВЛКСМ, а так же к различным клубам и объединениям.</li>
  <li>Наградные (в некоторых классификациях нагрудные), вручаемые за высокие достижения в труде, учебе, военном деле, общественной жизни и так далее.</li>
  <li>Памятные, выпускаемые в ознаменование какого либо события или выдающегося деятеля.</li>
  <li>Юбилейные, посвященные годовщинам комсомола.</li>
  <li>Служебные, указывающие на принадлежность к ведомству, предприятию, организации.</li>
  <li>Сувенирные, посвященные историческим местам, городам и т.д. Обычно на обратной стороне сувенирных значков указывалась их цена.</li>
</ol>
<p class="mb-4 font-medium">Всегда готов к сотрудничеству, надеюсь на помощь в пополнении коллекции.</p>
<p class="font-bold text-right mt-8 text-xl">С Уважением Влад</p>
  `;

  const homeTitle = getSiteContent('home_title', 'Личный сайт Лапина Владислава Анатольевича');
  const homeText = getSiteContent('home_text', fullHomeText);
  const homeImage = getSiteContent('home_image', '/header.jpg');

  const contactEmail = getSiteContent('contact_email', 'email@example.com');
  const contactIntro = getSiteContent('contact_intro', 'Если у вас есть вопросы...');

  // Дерево
  const RenderTree = ({ nodes, parentPath = [] }: { nodes: TreeNode, parentPath?: string[] }) => {
    const keys = Object.keys(nodes).sort();
    return (
      <ul className="space-y-1 pl-2 border-l border-[#444] ml-1.5">
        {keys.map(key => {
          const fullPathArr = [...parentPath, key];
          const fullPathStr = fullPathArr.join('/');
          const href = `/admin?tab=catalog&path=${encodeURIComponent(fullPathStr)}`;
          const isActive = currentPathString.startsWith(fullPathStr);
          const isExact = currentPathString === fullPathStr;
          const hasChildren = Object.keys(nodes[key]).length > 0;
          return (
            <li key={key}>
              <div className="group flex items-center justify-between hover:bg-[#3d1414] pr-1 rounded cursor-pointer">
                <details open={isActive} className="flex-1">
                  <summary className="list-none flex items-center gap-2 py-1.5 hover:text-[#ffcc00] outline-none">
                    <div className="min-w-[20px] flex justify-center items-center">
                      {hasChildren ? <span className="text-[#cc0000] font-bold text-sm transition-transform group-open:rotate-90">{'>'}</span> : <span className="text-gray-500">•</span>}
                    </div>
                    <Link href={href} className={`text-base leading-snug flex-1 ${isExact ? 'text-[#ffcc00] font-bold' : 'text-gray-300 hover:text-white'}`}>{key}</Link>
                  </summary>
                  <div className="ml-2"><RenderTree nodes={nodes[key]} parentPath={fullPathArr} /></div>
                </details>
                <FolderControls path={fullPathStr} />
              </div>
            </li>
          );
        })}
      </ul>
    );
  };

  return (
    <main className="min-h-screen pb-10" style={{ backgroundColor: '#2e0a12', backgroundImage: 'repeating-linear-gradient(90deg, #2e0a12, #2e0a12 15px, #21050a 15px, #21050a 30px)' }}>
      {/* ШАПКА */}
      <header className="w-full max-w-[1200px] mx-auto pt-4 relative z-10">
        <div className="relative w-full h-[180px] md:h-[220px] border-b-4 border-[#cc0000] bg-[#21050a] shadow-lg">
          <Image src="/banner.jpg" alt="ВЛКСМ Баннер" fill className="object-cover" priority />
          <div className="absolute top-0 right-0 bg-red-600 text-white px-4 py-1 font-bold uppercase shadow-md border-b-2 border-l-2 border-white/20">
            Режим Редактирования
          </div>
        </div>

        {/* МЕНЮ */}
        <nav className="bg-[#1a0505] text-white py-2 px-4 flex flex-wrap gap-6 text-xl font-bold border-b border-[#333] shadow-md justify-center md:justify-start">
          <Link href="/admin?tab=main" className={`transition ${currentTab === 'main' ? 'text-[#ffcc00] underline' : 'hover:text-[#ffcc00]'}`}>Главная</Link>
          <Link href="/admin?tab=catalog&path=Региональный комсомол" className={`transition ${currentPathString.startsWith('Региональный комсомол') ? 'text-[#ffcc00] underline' : 'hover:text-[#ffcc00]'}`}>Региональный комсомол</Link>
          <Link href="/admin?tab=catalog&path=ССО" className={`transition ${currentPathString.startsWith('ССО') ? 'text-[#ffcc00] underline' : 'hover:text-[#ffcc00]'}`}>ССО</Link>
          <Link href="/admin?tab=catalog&path=ВЛКСМ" className={`transition ${currentPathString.startsWith('ВЛКСМ') ? 'text-[#ffcc00] underline' : 'hover:text-[#ffcc00]'}`}>ВЛКСМ</Link>
          <Link href="/admin?tab=catalog&path=Разное" className={`transition ${currentPathString.startsWith('Разное') ? 'text-[#ffcc00] underline' : 'hover:text-[#ffcc00]'}`}>Разное</Link>
          <Link href="/admin?tab=contacts" className={`transition ${currentTab === 'contacts' ? 'text-[#ffcc00] underline' : 'hover:text-[#ffcc00]'}`}>Контакты</Link>
          <Link href="/" className="hover:text-[#ffcc00] hover:underline transition ml-auto text-gray-400 pl-4 border-l border-gray-700">Выход</Link>
        </nav>
      </header>

      <div className="max-w-[1200px] mx-auto mt-6 px-2">
        
        {/* --- ЛЕВАЯ ПАНЕЛЬ --- */}
        {(currentTab === 'catalog') ? (
          <aside className="w-full md:w-[320px] flex flex-col gap-4 flex-shrink-0">
            <div className="bg-[#2a0a0a] rounded p-4 shadow-xl border border-[#3d1414] max-h-[800px] overflow-y-auto custom-scrollbar">
              <div className="flex justify-between items-center border-b border-[#5c1818] pb-2 mb-2">
                <h2 className="text-[#ffcc00] font-bold text-lg">СТРУКТУРА</h2>
                <button className="text-green-500 font-bold hover:text-white px-2 border border-green-900 bg-green-900/30 rounded" title="Создать папку">+</button>
              </div>
              <div className="-ml-3"><RenderTree nodes={tree} parentPath={[]} /></div>
            </div>
            <div className="bg-[#2a0a0a] p-3 border-2 border-[#3d1414] shadow-2xl">
               <img src="/poster.jpg" alt="Плакат ВЛКСМ" className="w-full h-auto object-cover" />
            </div>
          </aside>
        ) : (
          <aside className="w-full md:w-[320px] flex flex-col gap-4 flex-shrink-0">
             <div className="bg-[#2a0a0a] p-3 border-2 border-[#3d1414] shadow-2xl">
               <img src="/poster.jpg" alt="Плакат ВЛКСМ" className="w-full h-auto object-cover" />
             </div>
          </aside>
        )}

        {/* --- ПРАВАЯ ПАНЕЛЬ --- */}
        <section className="flex-1 bg-white rounded p-8 shadow-2xl relative min-h-[600px]">
          <div className="absolute top-2 left-2 right-2 bottom-2 border border-gray-200 pointer-events-none"></div>
          
          {/* 1. РЕДАКТОР ГЛАВНОЙ */}
          {currentTab === 'main' && (
            <form action={saveSiteContent} className="relative z-10">
              <h1 className="text-3xl font-serif font-bold text-[#800000] border-b-2 border-[#eee] mb-6 pb-2">Редактирование: Главная</h1>
              
              <div className="flex flex-col lg:flex-row gap-6">
                <div className="w-full lg:w-[280px] flex-shrink-0">
                  <ImagePicker label="ФОТО ВЛАДЕЛЬЦА" name="content_home_image" defaultValue={homeImage} />
                </div>
                
                <div className="w-full">
                  <div className="mb-6">
                    <label className="block text-[#800000] font-bold text-lg mb-2 border-b border-[#eee] pb-1">ЗАГОЛОВОК СТРАНИЦЫ</label>
                    <input type="text" name="content_home_title" defaultValue={homeTitle} className="w-full border-2 border-gray-300 p-3 rounded text-2xl font-serif font-bold text-black outline-none focus:border-[#800000] bg-white" />
                  </div>
                  
                  <RichEditor label="ПРИВЕТСТВЕННЫЙ ТЕКСТ" name="content_home_text" defaultValue={homeText} height="h-[500px]" />
                  
                  <div className="flex justify-end mt-4">
                    <button className="bg-[#800000] text-white px-8 py-3 rounded font-bold text-lg hover:bg-[#600000] shadow-lg">СОХРАНИТЬ ИЗМЕНЕНИЯ</button>
                  </div>
                </div>
              </div>
            </form>
          )}

          {/* 2. РЕДАКТОР КОНТАКТОВ */}
          {currentTab === 'contacts' && (
            <form action={saveSiteContent} className="relative z-10">
              <h1 className="text-3xl font-serif font-bold text-[#800000] border-b-2 border-[#eee] mb-6 pb-2">Редактирование: Контакты</h1>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-[#800000] font-bold text-lg mb-2 border-b border-[#eee] pb-1">EMAIL ДЛЯ СВЯЗИ</label>
                  <input type="text" name="content_contact_email" defaultValue={contactEmail} className="w-full border-2 border-gray-300 p-3 rounded text-xl text-black focus:border-[#800000] outline-none bg-white" />
                </div>
                
                <RichEditor label="ВСТУПИТЕЛЬНЫЙ ТЕКСТ" name="content_contact_intro" defaultValue={contactIntro} height="h-64" />
                
                <div className="flex justify-end mt-4">
                  <button className="bg-[#800000] text-white px-8 py-3 rounded font-bold text-lg hover:bg-[#600000] shadow-lg">СОХРАНИТЬ ИЗМЕНЕНИЯ</button>
                </div>
              </div>
            </form>
          )}

          {/* 3. РЕДАКТОР КАТАЛОГА */}
          {currentTab === 'catalog' && (
            <div className="relative z-10">
              <div className="text-sm text-gray-500 mb-4 border-b border-gray-100 pb-2">
                 <span>Каталог</span>
                 {decodedPath.map((part, i) => <span key={i}> / <span className="font-bold text-gray-700">{part}</span></span>)}
              </div>

              <div className="flex justify-between items-center border-b-2 border-[#eee] mb-6 pb-2">
                <h1 className="text-3xl font-serif font-bold text-[#800000]">
                  {decodedPath.length > 0 ? decodedPath[decodedPath.length - 1] : "Корень каталога"}
                </h1>
                <form action={createBadge.bind(null, currentPathString)}>
                  <button className="bg-blue-600 text-white px-4 py-2 rounded font-bold shadow hover:bg-blue-700 text-sm flex items-center gap-2">
                    <span className="text-xl leading-none">+</span> Добавить значок
                  </button>
                </form>
              </div>

              {/* Редактор описания папки */}
              {currentPathString && (
                <form action={saveFolderMeta.bind(null, currentPathString)} className="mb-8 p-4 bg-yellow-50 border border-yellow-200 rounded">
                  <RichEditor label="Историческая справка (Редактирование)" name="description" defaultValue={folderDesc} height="h-40" />
                  <div className="flex justify-end -mt-2">
                    <button type="submit" className="bg-[#800000] text-white px-6 py-2 rounded font-bold hover:bg-[#600000] text-sm">Сохранить справку</button>
                  </div>
                </form>
              )}

              {/* Сетка значков */}
              {badges.length > 0 ? (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-bold text-gray-800">Список значков ({totalBadges})</h2>
                    {totalPages > 1 && <span className="text-sm text-gray-500">Стр. {currentPage}</span>}
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6 mb-6">
                    {badges.map((badge) => (
                      <div key={badge.id} className="flex flex-col group relative border border-gray-200 rounded p-2 hover:shadow-xl transition bg-white">
                        <div className="relative w-full aspect-square mb-2 bg-gray-50 border border-gray-100 rounded">
                          <Image src={badge.image_path} alt={badge.name} fill className="object-contain opacity-90 group-hover:opacity-100" />
                          
                          {/* КНОПКИ */}
                          <div className="absolute inset-0 bg-black/70 hidden group-hover:flex flex-col items-center justify-center gap-2 rounded transition-opacity">
                            <Link href={`/admin/badge/${badge.id}`} className="bg-blue-600 text-white px-4 py-2 rounded font-bold text-sm hover:bg-blue-500 shadow">Редактировать</Link>
                            <form action={deleteBadge.bind(null, badge.id)}>
                              <button className="bg-red-600 text-white px-4 py-2 rounded font-bold text-sm hover:bg-red-500 shadow">Удалить</button>
                            </form>
                          </div>
                        </div>
                        <span className="text-xs text-center font-bold text-gray-700 truncate px-1">{badge.name}</span>
                      </div>
                    ))}
                  </div>
                  
                  {/* Пагинация */}
                  {totalPages > 1 && (
                    <div className="mt-8 flex justify-center gap-2 flex-wrap pb-4">
                      {currentPage > 1 ? (
                        <Link href={`/admin?tab=catalog&path=${encodeURIComponent(currentPathString)}&page=${currentPage - 1}`} className="px-3 py-1 border border-gray-300 bg-white text-black rounded hover:bg-gray-100">←</Link>
                      ) : <span className="px-3 py-1 border border-gray-200 bg-white text-gray-300 rounded cursor-not-allowed">←</span>}

                      {Array.from({ length: totalPages }, (_, i) => i + 1).map(pageNum => {
                        const isCurrent = pageNum === currentPage;
                        if (pageNum === 1 || pageNum === totalPages || (pageNum >= currentPage - 2 && pageNum <= currentPage + 2)) {
                          return (
                            <Link key={pageNum} href={`/admin?tab=catalog&path=${encodeURIComponent(currentPathString)}&page=${pageNum}`} className={`px-3 py-1 border rounded font-medium transition-colors ${isCurrent ? 'bg-[#800000] text-white border-[#800000]' : 'bg-white text-black border-gray-300 hover:bg-gray-100'}`}>
                              {pageNum}
                            </Link>
                          );
                        } else if (pageNum === currentPage - 3 || pageNum === currentPage + 3) return <span key={pageNum} className="px-1 text-gray-500 self-end pb-1">...</span>;
                        return null;
                      })}

                      {currentPage < totalPages ? (
                        <Link href={`/admin?tab=catalog&path=${encodeURIComponent(currentPathString)}&page=${currentPage + 1}`} className="px-3 py-1 border border-gray-300 bg-white text-black rounded hover:bg-gray-100">→</Link>
                      ) : <span className="px-3 py-1 border border-gray-200 bg-white text-gray-300 rounded cursor-not-allowed">→</span>}
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-20 text-gray-400">
                  <p className="text-xl mb-2">Здесь пока пусто</p>
                  <p className="text-sm">Нажмите кнопку "+ Значок" выше, чтобы добавить первый.</p>
                </div>
              )}
            </div>
          )}
        </section>
      </div>
    </main>
  )
}