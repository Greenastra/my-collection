import Image from 'next/image'
import Link from 'next/link'

export default function ContactPage() {
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

        {/* МЕНЮ: Активна страница Контакты */}
        <nav className="bg-[#1a0505] text-white py-2 px-4 flex flex-wrap gap-6 text-sm font-bold border-b border-[#333] shadow-md justify-center md:justify-start">
          <Link href="/" className="hover:text-[#ffcc00] hover:underline transition">Главная</Link>
          <Link href="/regional" className="hover:text-[#ffcc00] hover:underline transition">Региональный комсомол</Link>
          <Link href="/sso" className="hover:text-[#ffcc00] hover:underline transition">ССО</Link>
          <Link href="/vlksm" className="hover:text-[#ffcc00] hover:underline transition">ВЛКСМ</Link>
          <Link href="/contact" className="text-[#ffcc00] underline transition ml-auto">Контакты</Link>
        </nav>
      </header>

      <div className="max-w-[1200px] mx-auto flex flex-col md:flex-row mt-6 gap-4 px-2">
        {/* ЛЕВАЯ ПАНЕЛЬ (Только плакат, как на Главной) */}
        <aside className="w-full md:w-[320px] flex flex-col gap-4 flex-shrink-0">
          <div className="bg-[#2a0a0a] p-3 border-2 border-[#3d1414] shadow-2xl">
             <img src="/poster.jpg" alt="Плакат ВЛКСМ" className="w-full h-auto object-cover" />
          </div>
        </aside>

        {/* ПРАВАЯ ЧАСТЬ (Контактная информация) */}
        <section className="flex-1 bg-white rounded p-8 shadow-2xl relative">
          <h1 className="text-3xl font-serif font-bold text-[#800000] border-b-2 border-[#eee] mb-6 pb-2">
            Связь с автором
          </h1>
          
          <div className="text-gray-800 leading-relaxed font-serif text-lg space-y-4">
            <p>
              Если у вас есть вопросы по коллекции, предложения по обмену или вы заметили неточность в описании значков, буду рад получить от вас сообщение.
            </p>
            
            <div className="bg-gray-50 border-l-4 border-[#cc0000] p-4 my-6">
              <p className="font-bold text-[#800000]">Электронная почта:</p>
              <a href="mailto:email@example.com" className="text-blue-700 hover:underline">
                email@example.com
              </a>
            </div>

            <h2 className="text-xl font-bold text-[#800000] mt-8 mb-4 border-b border-gray-200 pb-1">
              Написать сообщение
            </h2>
            
            {/* Форма обратной связи */}
            <form className="space-y-4 max-w-lg">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Ваше имя</label>
                <input type="text" className="w-full border border-gray-300 p-2 rounded focus:outline-none focus:border-[#800000]" placeholder="Иван Иванов" />
              </div>
              
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Ваш Email</label>
                <input type="email" className="w-full border border-gray-300 p-2 rounded focus:outline-none focus:border-[#800000]" placeholder="ivan@example.com" />
              </div>
              
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Сообщение</label>
                <textarea className="w-full border border-gray-300 p-2 rounded h-32 focus:outline-none focus:border-[#800000]" placeholder="Текст вашего сообщения..."></textarea>
              </div>
              
              <button type="button" className="bg-[#800000] text-white font-bold py-2 px-6 rounded hover:bg-[#600000] transition shadow-md">
                Отправить
              </button>
            </form>
          </div>
        </section>
      </div>
    </main>
  )
}