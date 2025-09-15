// Простой тест для Sonoma Sky Alpha
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';

async function testSonomaSimple() {
  console.log('🧪 Тестируем Sonoma Sky Alpha с простым запросом...');
  
  try {
    const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://uxaudute.vercel.app',
        'X-Title': 'UX Audit Platform'
      },
      body: JSON.stringify({
        model: 'openrouter/sonoma-sky-alpha',
        messages: [
          {
            role: 'user',
            content: 'Привет! Как дела? Ответь коротко.'
          }
        ],
        max_tokens: 100,
        temperature: 0.7
      })
    });

    console.log('📡 Статус ответа:', response.status);
    console.log('📡 Заголовки:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Ошибка HTTP:', response.status, errorText);
      return;
    }

    const data = await response.json();
    console.log('✅ Полный ответ от Sonoma Sky Alpha:');
    console.log(JSON.stringify(data, null, 2));
    
    if (data.choices && data.choices[0]) {
      console.log('💬 Ответ Sonoma:', data.choices[0].message.content);
    } else {
      console.log('⚠️ Нет ответа в choices');
    }

  } catch (error) {
    console.error('❌ Ошибка запроса:', error.message);
  }
}

testSonomaSimple();



