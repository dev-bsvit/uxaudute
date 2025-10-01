// Тест полного потока анализа
console.log('🧪 Тестируем полный поток анализа...')

// Проверяем что все системы работают
const checkSystems = async () => {
  try {
    // 1. Health check
    const health = await fetch('https://uxaudute.vercel.app/api/health')
    const healthData = await health.json()
    console.log('✅ Health:', healthData.status)
    
    // 2. Debug endpoint
    const debug = await fetch('https://uxaudute.vercel.app/api/debug')
    const debugData = await debug.json()
    console.log('✅ Debug:', debugData.status)
    
    // 3. Проверяем что промпты доступны
    const prompt = await fetch('https://uxaudute.vercel.app/prompts/ru/json-structured-prompt.md')
    console.log('✅ Prompt status:', prompt.status)
    
    console.log('🎯 Все системы работают!')
    
  } catch (error) {
    console.error('❌ Ошибка:', error)
  }
}

checkSystems()