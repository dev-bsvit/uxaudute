// Простой тест анализа
const testAnalysis = async () => {
  console.log('🧪 Тестируем анализ...')
  
  try {
    const response = await fetch('https://uxaudute.vercel.app/api/health')
    const health = await response.json()
    console.log('✅ Health check:', health)
    
    // Тест простого анализа URL
    const analysisResponse = await fetch('https://uxaudute.vercel.app/api/research-with-credits', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        url: 'https://google.com',
        context: 'Тестовый анализ главной страницы Google'
      })
    })
    
    console.log('📊 Analysis response status:', analysisResponse.status)
    
    if (analysisResponse.status === 401) {
      console.log('⚠️ Требуется авторизация - это нормально')
    } else {
      const analysisData = await analysisResponse.json()
      console.log('📊 Analysis data:', analysisData)
    }
    
  } catch (error) {
    console.error('❌ Ошибка теста:', error)
  }
}

testAnalysis()