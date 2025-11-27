-- Получить context и target_audience проблемного проекта
SELECT 
  id,
  name,
  context,
  target_audience,
  LENGTH(context) as context_length,
  LENGTH(target_audience) as audience_length,
  LENGTH(COALESCE(context, '') || COALESCE(target_audience, '')) as total_length
FROM projects
ORDER BY created_at DESC
LIMIT 5;
