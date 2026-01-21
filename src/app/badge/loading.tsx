export default function Loading() {
  return (
    <div className="min-h-screen bg-[#2e0a12] flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-[#ffcc00] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-[#ffcc00] text-xl font-bold animate-pulse">Открываем значок...</p>
      </div>
    </div>
  )
}