/**
 * Получает отображаемое название аудита
 * @param audit - объект аудита
 * @returns строка с названием для отображения
 */
export function getAuditDisplayTitle(audit: {
  name: string;
  status: string;
  result_data?: any;
  input_data?: any;
}): string {
  // Если аудит завершен и есть описание экрана
  if (audit.status === 'completed' && audit.result_data?.screenDescription?.userGoal) {
    return audit.result_data.screenDescription.userGoal;
  }
  
  // Если аудит завершен и есть описание в input_data
  if (audit.status === 'completed' && audit.input_data?.description) {
    return audit.input_data.description;
  }
  
  // Если аудит завершен и есть screenshotDescription
  if (audit.status === 'completed' && audit.input_data?.screenshotDescription) {
    return audit.input_data.screenshotDescription;
  }
  
  // Для незавершенных аудитов показываем временное название
  if (audit.status === 'in_progress' || audit.status === 'draft') {
    return 'Анализ в процессе';
  }
  
  // Если статус failed или другой, показываем оригинальное название
  return audit.name;
}
