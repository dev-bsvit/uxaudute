export default function RootPage() {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          UX Audit Platform
        </h1>
        <p className="text-gray-600 mb-6">
          Выберите язык:
        </p>
        <div className="space-x-4">
          <a 
            href="/ru" 
            className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Русский
          </a>
          <a 
            href="/uk" 
            className="inline-block px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            Українська
          </a>
        </div>
      </div>
    </div>
  )
}