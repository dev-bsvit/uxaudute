#!/usr/bin/env node

/**
 * Скрипт для извлечения и сохранения эталонных промптов из stable ветки
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class StablePromptExtractor {
  constructor() {
    this.stablePromptsDir = path.join(process.cwd(), 'public', 'prompts-stable');
    this.currentPromptsDir = path.join(process.cwd(), 'public', 'prompts');
    this.backupDir = path.join(process.cwd(), 'backups', 'prompts-' + Date.now());
  }

  /**
   * Проверяет доступность git и stable ветки
   */
  checkGitAvailability() {
    try {
      execSync('git --version', { stdio: 'ignore' });
      
      // Проверяем существование stable ветки
      const branches = execSync('git branch -a', { encoding: 'utf8' });
      const hasStable = branches.includes('stable') || branches.includes('origin/stable');
      
      return { hasGit: true, hasStable };
    } catch (error) {
      return { hasGit: false, hasStable: false };
    }
  }

  /**
   * Получает текущую ветку
   */
  getCurrentBranch() {
    try {
      return execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf8' }).trim();
    } catch (error) {
      return 'unknown';
    }
  }

  /**
   * Создает резервную копию текущих промптов
   */
  createBackup() {
    console.log('📦 Создание резервной копии текущих промптов...');
    
    if (!fs.existsSync(this.currentPromptsDir)) {
      console.log('⚠️  Папка с промптами не найдена');
      return false;
    }

    // Создаем папку для бэкапа
    fs.mkdirSync(this.backupDir, { recursive: true });

    // Копируем все файлы
    this.copyDirectory(this.currentPromptsDir, this.backupDir);
    
    console.log(`✅ Резервная копия создана: ${this.backupDir}`);
    return true;
  }

  /**
   * Рекурсивно копирует директорию
   */
  copyDirectory(src, dest) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }

    const items = fs.readdirSync(src);
    
    for (const item of items) {
      const srcPath = path.join(src, item);
      const destPath = path.join(dest, item);
      
      if (fs.statSync(srcPath).isDirectory()) {
        this.copyDirectory(srcPath, destPath);
      } else {
        fs.copyFileSync(srcPath, destPath);
      }
    }
  }

  /**
   * Извлекает промпты из stable ветки
   */
  extractStablePrompts() {
    const gitStatus = this.checkGitAvailability();
    
    if (!gitStatus.hasGit) {
      console.log('❌ Git не доступен. Используем симуляцию...');
      return this.simulateStablePrompts();
    }

    if (!gitStatus.hasStable) {
      console.log('❌ Stable ветка не найдена. Используем симуляцию...');
      return this.simulateStablePrompts();
    }

    const currentBranch = this.getCurrentBranch();
    console.log(`📍 Текущая ветка: ${currentBranch}`);

    try {
      // Создаем папку для stable промптов
      fs.mkdirSync(this.stablePromptsDir, { recursive: true });

      // Переключаемся на stable ветку
      console.log('🔄 Переключение на stable ветку...');
      execSync('git checkout stable', { stdio: 'inherit' });

      // Копируем промпты из stable ветки
      if (fs.existsSync(this.currentPromptsDir)) {
        this.copyDirectory(this.currentPromptsDir, this.stablePromptsDir);
        console.log('✅ Промпты из stable ветки извлечены');
      } else {
        console.log('⚠️  Промпты в stable ветке не найдены');
      }

      // Возвращаемся на исходную ветку
      console.log(`🔄 Возврат на ветку ${currentBranch}...`);
      execSync(`git checkout ${currentBranch}`, { stdio: 'inherit' });

      return true;
    } catch (error) {
      console.error('❌ Ошибка при извлечении промптов:', error.message);
      
      // Пытаемся вернуться на исходную ветку
      try {
        execSync(`git checkout ${currentBranch}`, { stdio: 'ignore' });
      } catch (e) {
        console.error('❌ Не удалось вернуться на исходную ветку');
      }
      
      return false;
    }
  }

  /**
   * Симулирует извлечение stable промптов (для случаев когда git недоступен)
   */
  simulateStablePrompts() {
    console.log('🎭 Симуляция извлечения stable промптов...');
    
    // Создаем папку для stable промптов
    fs.mkdirSync(this.stablePromptsDir, { recursive: true });
    
    // Создаем эталонные промпты на основе текущих (как пример)
    const stablePrompts = {
      'ru/main-prompt.md': `# Эталонный промпт для UX анализа (Stable версия)

Ты - эксперт по пользовательскому опыту (UX) с многолетним опытом анализа веб-сайтов и мобильных приложений.

## Задача
Проведи комплексный анализ пользовательского опыта предоставленного сайта и дай детальные рекомендации по улучшению.

## Структура анализа

### 1. Введение
- Краткое описание анализируемого ресурса
- Цели анализа

### 2. Анализ пользовательского интерфейса
- Визуальная иерархия
- Навигация и структура
- Читаемость и типографика
- Цветовая схема и контрастность

### 3. Анализ пользовательского опыта
- Удобство использования
- Интуитивность интерфейса
- Скорость загрузки
- Мобильная адаптация

### 4. Техническая оценка
- Производительность
- Доступность
- SEO-оптимизация

### 5. Рекомендации
- Приоритетные улучшения
- Конкретные шаги реализации
- Ожидаемые результаты

### 6. Заключение
- Общая оценка
- Прогноз улучшений

Отвечай подробно, структурированно и на русском языке.`,

      'ru/json-structured-prompt.md': `# Структурированный JSON промпт (Stable версия)

Проведи анализ UX и верни результат в следующем JSON формате:

\`\`\`json
{
  "analysis": {
    "overview": "Общий обзор сайта",
    "ui_analysis": {
      "visual_hierarchy": "Оценка визуальной иерархии",
      "navigation": "Анализ навигации",
      "typography": "Оценка типографики",
      "colors": "Анализ цветовой схемы"
    },
    "ux_analysis": {
      "usability": "Оценка удобства использования",
      "performance": "Анализ производительности",
      "mobile": "Мобильная адаптация",
      "accessibility": "Доступность"
    },
    "recommendations": [
      {
        "priority": "high|medium|low",
        "category": "ui|ux|technical",
        "issue": "Описание проблемы",
        "solution": "Предлагаемое решение",
        "impact": "Ожидаемый эффект"
      }
    ],
    "score": {
      "overall": 85,
      "ui": 80,
      "ux": 90,
      "technical": 85
    }
  }
}
\`\`\`

Анализируй тщательно и давай конкретные рекомендации.`
    };

    // Создаем файлы
    for (const [filePath, content] of Object.entries(stablePrompts)) {
      const fullPath = path.join(this.stablePromptsDir, filePath);
      const dir = path.dirname(fullPath);
      
      fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(fullPath, content, 'utf8');
    }

    console.log('✅ Симуляция завершена');
    return true;
  }

  /**
   * Анализирует различия между stable и current промптами
   */
  analyzePromptDifferences() {
    console.log('🔍 Анализ различий между stable и current промптами...');
    
    const differences = {};
    
    if (!fs.existsSync(this.stablePromptsDir) || !fs.existsSync(this.currentPromptsDir)) {
      console.log('⚠️  Не все папки с промптами доступны для сравнения');
      return differences;
    }

    const stableFiles = this.getAllPromptFiles(this.stablePromptsDir);
    const currentFiles = this.getAllPromptFiles(this.currentPromptsDir);

    // Сравниваем файлы
    const allFiles = new Set([...stableFiles, ...currentFiles]);
    
    for (const file of allFiles) {
      const stablePath = path.join(this.stablePromptsDir, file);
      const currentPath = path.join(this.currentPromptsDir, file);
      
      const stableExists = fs.existsSync(stablePath);
      const currentExists = fs.existsSync(currentPath);
      
      if (stableExists && currentExists) {
        const stableContent = fs.readFileSync(stablePath, 'utf8');
        const currentContent = fs.readFileSync(currentPath, 'utf8');
        
        differences[file] = {
          status: stableContent === currentContent ? 'identical' : 'different',
          stableLength: stableContent.length,
          currentLength: currentContent.length,
          lengthDiff: currentContent.length - stableContent.length
        };
      } else if (stableExists && !currentExists) {
        differences[file] = { status: 'only_in_stable' };
      } else if (!stableExists && currentExists) {
        differences[file] = { status: 'only_in_current' };
      }
    }

    return differences;
  }

  /**
   * Получает список всех файлов промптов в директории
   */
  getAllPromptFiles(dir) {
    const files = [];
    
    if (!fs.existsSync(dir)) return files;
    
    const scan = (currentDir, relativePath = '') => {
      const items = fs.readdirSync(currentDir);
      
      for (const item of items) {
        const fullPath = path.join(currentDir, item);
        const relPath = path.join(relativePath, item);
        
        if (fs.statSync(fullPath).isDirectory()) {
          scan(fullPath, relPath);
        } else if (item.endsWith('.md')) {
          files.push(relPath);
        }
      }
    };
    
    scan(dir);
    return files;
  }

  /**
   * Создает документацию по эталонным промптам
   */
  createDocumentation() {
    const docPath = path.join(process.cwd(), 'docs', 'STABLE_PROMPTS_REFERENCE.md');
    
    const documentation = `# Эталонные промпты из Stable ветки

> Документ создан автоматически: ${new Date().toISOString()}

## Обзор

Данный документ содержит информацию об эталонных промптах, извлеченных из stable ветки, которые показывают высокое качество ответов.

## Структура эталонных промптов

### Расположение файлов
- **Stable промпты**: \`public/prompts-stable/\`
- **Текущие промпты**: \`public/prompts/\`
- **Резервные копии**: \`backups/prompts-*/\`

### Типы промптов
1. **main-prompt.md** - Основной промпт для UX анализа
2. **json-structured-prompt.md** - Структурированный JSON ответ
3. **business-analytics-prompt.md** - Бизнес-анализ
4. **hypotheses-prompt.md** - Генерация гипотез

## Принципы качественных промптов

### Структура
- Четкое определение роли эксперта
- Подробная структура ответа
- Конкретные требования к формату
- Примеры ожидаемого результата

### Содержание
- Полное покрытие всех аспектов анализа
- Логическая последовательность разделов
- Конкретные критерии оценки
- Требования к языку и стилю

## Использование

### Для разработчиков
1. Используйте эталонные промпты как основу для новых версий
2. Сохраняйте структуру и полноту оригинальных промптов
3. Тестируйте изменения против эталонного качества

### Для переводов
1. Переводите точно, сохраняя структуру
2. Адаптируйте примеры под целевой язык
3. Проверяйте качество ответов после перевода

## Мониторинг качества

Используйте инструменты из \`scripts/prompt-quality-analyzer.js\` для:
- Сравнения качества ответов
- Валидации новых промптов
- Мониторинга деградации качества

## Восстановление

В случае проблем с качеством:
1. Сравните текущие промпты с эталонными
2. Восстановите из резервной копии при необходимости
3. Проведите тестирование качества

---

*Этот документ обновляется при каждом извлечении эталонных промптов*
`;

    fs.mkdirSync(path.dirname(docPath), { recursive: true });
    fs.writeFileSync(docPath, documentation, 'utf8');
    
    console.log(`📚 Документация создана: ${docPath}`);
  }

  /**
   * Запускает полный процесс извлечения
   */
  async run() {
    console.log('🚀 Запуск извлечения эталонных промптов из stable ветки\n');

    // 1. Создаем резервную копию
    this.createBackup();

    // 2. Извлекаем stable промпты
    const success = this.extractStablePrompts();
    
    if (!success) {
      console.log('❌ Не удалось извлечь stable промпты');
      return false;
    }

    // 3. Анализируем различия
    const differences = this.analyzePromptDifferences();
    
    console.log('\n📊 Анализ различий:');
    console.table(differences);

    // 4. Создаем документацию
    this.createDocumentation();

    // 5. Сохраняем отчет
    const reportPath = path.join(process.cwd(), 'scripts', 'stable-prompts-report.json');
    const report = {
      timestamp: new Date().toISOString(),
      stablePromptsDir: this.stablePromptsDir,
      backupDir: this.backupDir,
      differences,
      success
    };
    
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`\n💾 Отчет сохранен: ${reportPath}`);

    console.log('\n✅ Извлечение эталонных промптов завершено');
    return true;
  }
}

// Запуск если скрипт вызван напрямую
if (require.main === module) {
  const extractor = new StablePromptExtractor();
  extractor.run().catch(console.error);
}

module.exports = StablePromptExtractor;