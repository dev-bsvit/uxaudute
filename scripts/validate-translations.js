#!/usr/bin/env node

/**
 * Translation Validation Tool
 * 
 * Checks for missing translations and validates translation file structure
 */

const fs = require('fs')
const path = require('path')

const LOCALES_DIR = path.join(__dirname, '../public/locales')
const PROMPTS_DIR = path.join(__dirname, '../public/prompts')

// Expected translation files
const REQUIRED_TRANSLATION_FILES = [
  'common.json',
  'navigation.json', 
  'settings.json',
  'analysis-results.json',
  'components.json'
]

// Expected prompt files
const REQUIRED_PROMPT_FILES = [
  'main-prompt.md',
  'json-structured-prompt.md',
  'sonoma-structured-prompt.md',
  'ab-test-prompt.md',
  'business-analytics-prompt.md',
  'hypotheses-prompt.md'
]

// Reference language (complete translations)
const REFERENCE_LANGUAGE = 'ru'

function validateTranslations() {
  console.log('🔍 Validating translations...\n')
  
  const languages = getAvailableLanguages()
  const referenceTranslations = loadReferenceTranslations()
  
  let hasErrors = false
  
  for (const language of languages) {
    console.log(`📋 Checking language: ${language}`)
    
    // Check translation files
    const translationErrors = validateLanguageTranslations(language, referenceTranslations)
    
    // Check prompt files  
    const promptErrors = validateLanguagePrompts(language)
    
    if (translationErrors.length > 0 || promptErrors.length > 0) {
      hasErrors = true
      console.log(`❌ Issues found in ${language}:`)
      
      translationErrors.forEach(error => console.log(`  - ${error}`))
      promptErrors.forEach(error => console.log(`  - ${error}`))
    } else {
      console.log(`✅ ${language} is complete`)
    }
    
    console.log('')
  }
  
  if (hasErrors) {
    console.log('❌ Translation validation failed')
    process.exit(1)
  } else {
    console.log('✅ All translations are valid')
  }
}

function getAvailableLanguages() {
  try {
    return fs.readdirSync(LOCALES_DIR, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name)
  } catch (error) {
    console.error('Error reading locales directory:', error)
    return []
  }
}

function loadReferenceTranslations() {
  const translations = {}
  
  for (const file of REQUIRED_TRANSLATION_FILES) {
    try {
      const filePath = path.join(LOCALES_DIR, REFERENCE_LANGUAGE, file)
      const content = fs.readFileSync(filePath, 'utf8')
      translations[file] = JSON.parse(content)
    } catch (error) {
      console.warn(`Warning: Could not load reference file ${file}:`, error.message)
    }
  }
  
  return translations
}

function validateLanguageTranslations(language, referenceTranslations) {
  const errors = []
  
  // Check if all required files exist
  for (const file of REQUIRED_TRANSLATION_FILES) {
    const filePath = path.join(LOCALES_DIR, language, file)
    
    if (!fs.existsSync(filePath)) {
      errors.push(`Missing translation file: ${file}`)
      continue
    }
    
    try {
      const content = fs.readFileSync(filePath, 'utf8')
      const translations = JSON.parse(content)
      
      // Check for missing keys compared to reference
      if (referenceTranslations[file]) {
        const missingKeys = findMissingKeys(referenceTranslations[file], translations)
        missingKeys.forEach(key => {
          errors.push(`Missing translation key in ${file}: ${key}`)
        })
      }
      
    } catch (error) {
      errors.push(`Invalid JSON in ${file}: ${error.message}`)
    }
  }
  
  return errors
}

function validateLanguagePrompts(language) {
  const errors = []
  
  for (const file of REQUIRED_PROMPT_FILES) {
    const filePath = path.join(PROMPTS_DIR, language, file)
    
    if (!fs.existsSync(filePath)) {
      errors.push(`Missing prompt file: ${file}`)
      continue
    }
    
    try {
      const content = fs.readFileSync(filePath, 'utf8')
      
      // Basic validation - check if file is not empty
      if (content.trim().length === 0) {
        errors.push(`Empty prompt file: ${file}`)
      }
      
      // Check for basic prompt structure (optional)
      if (file === 'json-structured-prompt.md' && !content.includes('JSON')) {
        errors.push(`JSON prompt should mention JSON format: ${file}`)
      }
      
    } catch (error) {
      errors.push(`Error reading prompt file ${file}: ${error.message}`)
    }
  }
  
  return errors
}

function findMissingKeys(reference, target, prefix = '') {
  const missing = []
  
  for (const [key, value] of Object.entries(reference)) {
    const fullKey = prefix ? `${prefix}.${key}` : key
    
    if (!(key in target)) {
      missing.push(fullKey)
    } else if (typeof value === 'object' && value !== null && typeof target[key] === 'object') {
      // Recursively check nested objects
      missing.push(...findMissingKeys(value, target[key], fullKey))
    }
  }
  
  return missing
}

function generateTranslationReport() {
  console.log('📊 Generating translation completeness report...\n')
  
  const languages = getAvailableLanguages()
  const referenceTranslations = loadReferenceTranslations()
  
  // Calculate total keys in reference
  let totalKeys = 0
  for (const translations of Object.values(referenceTranslations)) {
    totalKeys += countKeys(translations)
  }
  
  console.log(`Total translation keys in reference (${REFERENCE_LANGUAGE}): ${totalKeys}\n`)
  
  for (const language of languages) {
    if (language === REFERENCE_LANGUAGE) continue
    
    let translatedKeys = 0
    let missingKeys = 0
    
    for (const file of REQUIRED_TRANSLATION_FILES) {
      const filePath = path.join(LOCALES_DIR, language, file)
      
      if (fs.existsSync(filePath)) {
        try {
          const content = fs.readFileSync(filePath, 'utf8')
          const translations = JSON.parse(content)
          
          translatedKeys += countKeys(translations)
          
          if (referenceTranslations[file]) {
            missingKeys += findMissingKeys(referenceTranslations[file], translations).length
          }
        } catch (error) {
          // Skip invalid files
        }
      }
    }
    
    const completeness = totalKeys > 0 ? ((translatedKeys / totalKeys) * 100).toFixed(1) : 0
    
    console.log(`${language}: ${translatedKeys}/${totalKeys} keys (${completeness}% complete)`)
    if (missingKeys > 0) {
      console.log(`  Missing: ${missingKeys} keys`)
    }
  }
}

function countKeys(obj, count = 0) {
  for (const value of Object.values(obj)) {
    if (typeof value === 'object' && value !== null) {
      count = countKeys(value, count)
    } else {
      count++
    }
  }
  return count
}

// CLI interface
const command = process.argv[2]

switch (command) {
  case 'validate':
    validateTranslations()
    break
  case 'report':
    generateTranslationReport()
    break
  default:
    console.log('Usage:')
    console.log('  node scripts/validate-translations.js validate  - Validate all translations')
    console.log('  node scripts/validate-translations.js report    - Generate completeness report')
    break
}