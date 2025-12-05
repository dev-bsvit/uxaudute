/**
 * Email уведомления для блога
 * Использует Supabase для простых уведомлений
 */

interface BlogPublishedEmailData {
  userEmail: string
  userName: string
  postTitle: string
  postUrl: string
  postExcerpt: string
}

/**
 * Отправляет email уведомление пользователю о публикации статьи
 * ПРИМЕЧАНИЕ: В production следует использовать Resend, SendGrid или другой email сервис
 * Сейчас логируем в консоль для тестирования
 */
export async function sendBlogPublishedEmail(data: BlogPublishedEmailData): Promise<boolean> {
  try {
    // В production здесь должна быть интеграция с email сервисом
    // Например: Resend, SendGrid, AWS SES и т.д.

    console.log('\n📧 ===== EMAIL УВЕДОМЛЕНИЕ =====')
    console.log('Кому:', data.userEmail)
    console.log('Тема: Ваша статья опубликована в блоге UX Audit!')
    console.log('\nТекст письма:')
    console.log(`
Здравствуйте, ${data.userName}!

Отличные новости! Ваша статья была опубликована в нашем блоге.

📝 Название: ${data.postTitle}

${data.postExcerpt}

🔗 Читать статью: ${data.postUrl}

Спасибо, что согласились поделиться результатами вашего UX-аудита с сообществом!

---
С уважением,
Команда UX Audit
    `)
    console.log('================================\n')

    // TODO: Добавить реальную отправку email
    // Пример с Resend:
    // const { Resend } = require('resend')
    // const resend = new Resend(process.env.RESEND_API_KEY)
    // await resend.emails.send({
    //   from: 'UX Audit <noreply@ux-audit.com>',
    //   to: data.userEmail,
    //   subject: 'Ваша статья опубликована в блоге UX Audit!',
    //   html: emailTemplate(data)
    // })

    return true
  } catch (error) {
    console.error('❌ Ошибка отправки email:', error)
    return false
  }
}

/**
 * HTML шаблон для email (для будущей интеграции)
 */
function emailTemplate(data: BlogPublishedEmailData): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      line-height: 1.6;
      color: #334155;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      background: linear-gradient(135deg, #2563eb 0%, #4f46e5 100%);
      color: white;
      padding: 30px;
      border-radius: 12px;
      margin-bottom: 30px;
    }
    .content {
      background: #f8fafc;
      padding: 30px;
      border-radius: 12px;
      margin-bottom: 20px;
    }
    .button {
      display: inline-block;
      background: #2563eb;
      color: white;
      padding: 12px 24px;
      border-radius: 8px;
      text-decoration: none;
      font-weight: 600;
    }
    .footer {
      text-align: center;
      color: #94a3b8;
      font-size: 14px;
      margin-top: 30px;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1 style="margin: 0;">🎉 Ваша статья опубликована!</h1>
  </div>

  <div class="content">
    <p>Здравствуйте, ${data.userName}!</p>

    <p>Отличные новости! Ваша статья была опубликована в нашем блоге.</p>

    <h2 style="color: #1e293b; margin-top: 24px;">${data.postTitle}</h2>

    <p style="color: #64748b;">${data.postExcerpt}</p>

    <div style="margin-top: 30px; text-align: center;">
      <a href="${data.postUrl}" class="button">
        Читать статью →
      </a>
    </div>
  </div>

  <div class="footer">
    <p>Спасибо, что согласились поделиться результатами вашего UX-аудита с сообществом!</p>
    <p>© ${new Date().getFullYear()} UX Audit. Все права защищены.</p>
  </div>
</body>
</html>
  `
}
