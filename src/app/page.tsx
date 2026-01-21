import Image from 'next/image'
import Link from 'next/link'
// @ts-ignore
import db from '@/lib/db'

// Функция для получения контента (с запасным вариантом)
function getSiteContent(key: string, fallback: string) {
  try {
    const row = db.prepare("SELECT value FROM site_content WHERE key = ?").get(key) as { value: string };
    return row ? row.value : fallback;
  } catch (e) { return fallback; }
}

export default function Home() {
  // Загружаем данные из базы (или используем дефолтные, если база пустая)
  const title = getSiteContent('home_title', 'Личный сайт Лапина Владислава Анатольевича');
  const imagePath = getSiteContent('home_image', '/header.jpg');
  
  // Ваш оригинальный текст по умолчанию
  const defaultText = `
    <p class="mb-4">
      <strong class="text-[#800000]">Большое спасибо</strong> за внимание к моему сайту.
    </p>
    <p class="mb-4">
      Представляю Вашему вниманию сайт-каталог моей коллекции наград, знаков и значков комсомола.
      Это моя первая попытка систематизировать свою коллекцию по данной теме.
    </p>
    <p class="mb-4">
      На сайте приведены некоторые выдержки из истории СССР, комсомола, так же дано описание некоторых наград ВЛКСМ, это сделано для упрощения систематизации и сохранения тех данных, которые смог найти по данной теме.
    </p>
    <div class="italic text-[#666] border-l-4 border-[#cc0000] pl-4 bg-gray-50 py-2 mb-4">
      <p>Каталог не претендует на полноту, будет пополняться по мере поступления коллекционного материала и информации по знакам.</p>
    </div>
    <p class="mb-4 text-sm text-gray-600">
      Для большей информативности каталога при наведении курсора на скан любого знака высвечивается дополнительная информация...
    </p>
    <p class="mb-2 font-bold text-[#800000]">
      Все знаки и значки посвященные комсомолу можно условно классифицировать на следующие группы:
    </p>
    <ol class="list-decimal list-inside space-y-2 mb-6 ml-2">
      <li>Членские, удостоверяющие принадлежность к ВЛКСМ...</li>
      <li>Наградные (в некоторых классификациях нагрудные)...</li>
      <li>Памятные...</li>
      <li>Юбилейные...</li>
      <li>Служебные...</li>
      <li>Сувенирные...</li>
    </ol>
    <p class="mb-4 font-medium">Всегда готов к сотрудничеству, надеюсь на помощь в пополнении коллекции.</p>
    <p class="font-bold text-right mt-8 text-xl">С Уважением Влад</p>
  `;
  
  const textContent = getSiteContent('home_text', defaultText);

  return (
    <main 
      className="min-h-screen pb-10"
      style={{
        backgroundColor: '#2e0a12',
        backgroundImage: 'repeating-linear-gradient(90deg, #2e0a12, #2e0a12 15px, #21050a 15px, #21050a 30px)'
      }}
    >
      <header className="w-full max-w-[1200px] mx-auto pt-4 relative z-10">
        <div className="relative w-full h-[180px] md:h-[220px] border-b-4 border-[#cc0000] bg-[#21050a] shadow-lg">
          <Image src="/banner.jpg" alt="ВЛКСМ Баннер" fill className="object-cover" priority />
        </div>

        {/* МЕНЮ */}
        <nav className="bg-[#1a0505] text-white py-2 px-4 flex flex-wrap gap-6 text-xl font-bold border-b border-[#333] shadow-md justify-center md:justify-start">
          <Link href="/" className="text-[#ffcc00] underline transition">Главная</Link>
          <Link href="/catalog/Региональный комсомол" className="hover:text-[#ffcc00] hover:underline transition">Региональный комсомол</Link>
          <Link href="/catalog/ССО" className="hover:text-[#ffcc00] hover:underline transition">ССО</Link>
          <Link href="/catalog/ВЛКСМ" className="hover:text-[#ffcc00] hover:underline transition">ВЛКСМ</Link>
          <Link href="/catalog/Разное" className="hover:text-[#ffcc00] hover:underline transition">Разное</Link>
          <Link href="/contact" className="hover:text-[#ffcc00] hover:underline transition ml-auto">Контакты</Link>
        </nav>
      </header>

      <div className="max-w-[1200px] mx-auto flex flex-col md:flex-row mt-6 gap-4 px-2">
        <aside className="w-full md:w-[320px] flex flex-col gap-4 flex-shrink-0">
           <div className="bg-[#2a0a0a] p-3 border-2 border-[#3d1414] shadow-2xl">
             <img src="/poster.jpg" alt="Плакат ВЛКСМ" className="w-full h-auto object-cover" />
           </div>
        </aside>

        <section className="flex-1 bg-white rounded p-8 shadow-2xl relative">
          <div className="absolute top-2 left-2 right-2 bottom-2 border border-gray-200 pointer-events-none"></div>
          
          <h1 className="text-3xl font-serif font-bold text-[#800000] border-b-2 border-[#eee] mb-6 pb-2 relative z-10">
            {title}
          </h1>
          
          <div className="flex flex-col lg:flex-row gap-6 relative z-10">
            {/* Фото владельца */}
            <div className="w-full lg:w-[280px] flex-shrink-0">
              <img src={imagePath} alt="Владелец коллекции" className="w-full rounded shadow-md border border-gray-300 p-1 bg-white" />
            </div>
            
            {/* Текст из базы данных */}
            <div 
              className="w-full text-gray-800 leading-relaxed font-serif text-lg"
              dangerouslySetInnerHTML={{ __html: textContent }}
            />
          </div>
        </section>
      </div>
    </main>
  )
}