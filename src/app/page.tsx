import Image from 'next/image'
import Link from 'next/link'

export default function Home() {
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

        {/* МЕНЮ: Обновленное (без uppercase, Контакты) */}
        <nav className="bg-[#1a0505] text-white py-2 px-4 flex flex-wrap gap-6 text-sm font-bold border-b border-[#333] shadow-md justify-center md:justify-start">
          <Link href="/" className="text-[#ffcc00] underline transition">Главная</Link>
          <Link href="/regional" className="hover:text-[#ffcc00] hover:underline transition">Региональный комсомол</Link>
          <Link href="/sso" className="hover:text-[#ffcc00] hover:underline transition">ССО</Link>
          <Link href="/vlksm" className="hover:text-[#ffcc00] hover:underline transition">ВЛКСМ</Link>
          <Link href="/contact" className="hover:text-[#ffcc00] hover:underline transition ml-auto">Контакты</Link>
        </nav>
      </header>

      <div className="max-w-[1200px] mx-auto flex flex-col md:flex-row mt-6 gap-4 px-2">
        <aside className="w-full md:w-[320px] flex-shrink-0">
           <div className="bg-[#2a0a0a] p-3 border-2 border-[#3d1414] shadow-2xl">
             <img src="/poster.jpg" alt="Плакат ВЛКСМ" className="w-full h-auto object-cover" />
           </div>
        </aside>

        <section className="flex-1 bg-white rounded p-8 shadow-2xl relative">
          <div className="absolute top-2 left-2 right-2 bottom-2 border border-gray-200 pointer-events-none"></div>
          
          <h1 className="text-3xl font-serif font-bold text-[#800000] border-b-2 border-[#eee] mb-6 pb-2 relative z-10">
            Личный сайт Лапина Владислава Анатольевича
          </h1>
          
          <div className="flex flex-col lg:flex-row gap-6 relative z-10">
            {/* Фото владельца */}
            <div className="w-full lg:w-[280px] flex-shrink-0">
              <img src="/header.jpg" alt="Владелец коллекции" className="w-full rounded shadow-md border border-gray-300 p-1 bg-white" />
            </div>
            
            {/* Полный текст приветствия */}
            <div className="w-full text-gray-800 leading-relaxed font-serif text-lg">
              <p className="mb-4">
                <strong className="text-[#800000]">Большое спасибо</strong> за внимание к моему сайту.
              </p>
              <p className="mb-4">
                Представляю Вашему вниманию сайт-каталог моей коллекции наград, знаков и значков комсомола. Это моя первая попытка систематизировать свою коллекцию по данной теме.
              </p>
              <p className="mb-4">
                На сайте приведены некоторые выдержки из истории СССР, комсомола, так же дано описание некоторых наград ВЛКСМ, это сделано для упрощения систематизации и сохранения тех данных, которые смог найти по данной теме.
              </p>
              <p className="italic text-[#666] border-l-4 border-[#cc0000] pl-4 bg-gray-50 py-2 mb-4">
                Каталог не претендует на полноту, будет пополняться по мере поступления коллекционного материала и информации по знакам.
              </p>
              <p className="mb-4 text-sm text-gray-600">
                Для большей информативности каталога при наведении курсора на скан любого знака высвечивается дополнительная информация: какое крепление у знака и из каких материалов он изготовлен, в последующем постараюсь добавить туда размеры знака и вид штампа завода изготовителя, а так же год выпуска, примерный тираж, редкость для знаков по которым найду информацию.
              </p>
              
              <p className="mb-2 font-bold text-[#800000]">
                Все знаки и значки посвященные комсомолу можно условно классифицировать на следующие группы:
              </p>
              <ul className="list-decimal list-inside space-y-1 mb-6 text-base ml-2">
                <li>Членские, удостоверяющие принадлежность к ВЛКСМ, а так же к различным клубам и объединениям.</li>
                <li>Наградные (в некоторых классификациях нагрудные), вручаемые за высокие достижения в труде, учебе, военном деле, общественной жизни и так далее.</li>
                <li>Памятные, выпускаемые в ознаменование какого либо события или выдающегося деятеля.</li>
                <li>Юбилейные, посвященные годовщинам комсомола.</li>
                <li>Служебные, указывающие на принадлежность к ведомству, предприятию, организации.</li>
                <li>Сувенирные, посвященные историческим местам, городам и т.д. Обычно на обратной стороне сувенирных значков указывалась их цена.</li>
              </ul>

              <p className="mb-4">
                Всегда готов к сотрудничеству, надеюсь на помощь в пополнении коллекции.
              </p>
              
              <p className="font-bold text-right mt-8">
                С Уважением, Влад
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}