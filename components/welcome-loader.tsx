export function WelcomeLoader() {
  return (
    <div className="fixed inset-0 bg-gradient-to-br from-slate-900 to-slate-800 flex flex-col justify-center items-center z-50">
      <div className="text-6xl font-black bg-gradient-to-r from-orange-500 to-amber-500 bg-clip-text text-transparent mb-8 animate-pulse">
        VANGO
      </div>
      <div className="w-12 h-12 border-4 border-white/20 border-t-orange-500 rounded-full animate-spin mb-4"></div>
      <p className="text-gray-300 text-center">Loading your delivery experience...</p>
    </div>
  )
}
