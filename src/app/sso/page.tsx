import Image from 'next/image'
import Link from 'next/link'

export default function SSOPage() {
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
        <nav className="bg-[#1a0505] text-white py-2 px-4 flex flex-wrap gap-6 text-sm font-bold border-b border-[#333] shadow-md justify-center md:justify-start">
          <Link href="/" className="hover:text-[#ffcc00] hover:underline transition">Главная</Link>
          <Link href="/regional" className="hover:text-[#ffcc00] hover:underline transition">Региональный комсомол</Link>
          <Link href="/sso" className="text-[#ffcc00] underline transition">ССО</Link>
          <Link href="/vlksm" className="hover:text-[#ffcc00] hover:underline transition">ВЛКСМ</Link>
          <Link href="/contact" className="hover:text-[#ffcc00] hover:underline transition ml-auto">Контакты</Link>
        </nav>
      </header>

      <div className="max-w-[1200px] mx-auto flex flex-col md:flex-row mt-6 gap-4 px-2">
        <aside className="w-full md:w-[320px] flex flex-col gap-4 flex-shrink-0">
          <div className="bg-[#2a0a0a] rounded p-4 shadow-xl border border-[#3d1414]">
            <h2 className="text-[#ffcc00] font-bold text-lg mb-3 border-b border-[#5c1818] pb-1">КАТАЛОГ</h2>
            <div className="text-gray-300 space-y-2 text-sm">
              <Link href="/regional" className="block font-bold text-white hover:text-[#ffcc00] border-b border-[#3d1414] pb-2 mb-2">
                Региональный комсомол
              </Link>
              {/* Активен этот раздел (без текста "Выбрано") */}
              <div className="font-bold text-[#ffcc00] cursor-pointer bg-[#3d0a0a] p-1 pl-2 border-l-2 border-[#cc0000]">
                ССО
              </div>
              <Link href="/vlksm" className="block font-bold text-white hover:text-[#ffcc00] border-t border-[#3d1414] pt-2 mt-2">
                ВЛКСМ
              </Link>
            </div>
          </div>
          <div className="bg-[#2a0a0a] p-3 border-2 border-[#3d1414] shadow-2xl">
             <img src="/poster.jpg" alt="Плакат ВЛКСМ" className="w-full h-auto object-cover" />
          </div>
        </aside>

        <section className="flex-1 bg-white rounded p-8 shadow-2xl relative">
          <h1 className="text-3xl font-serif font-bold text-[#800000] border-b-2 border-[#eee] mb-6 pb-2">
            Студенческие Строительные Отряды
          </h1>
          <p className="text-gray-600">Здесь будет коллекция значков ССО...</p>
        </section>
      </div>
    </main>
  )
}