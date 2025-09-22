import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const { testType } = await request.json()

    // Тестовые случаи для проверки JSON парсинга
    const testCases = {
      // 1. Валидный JSON
      valid: {
        screenDescription: { screenType: "Мобильное приложение", confidence: 85 },
        uxSurvey: { questions: [], overallConfidence: 80 },
        audience: { targetAudience: "Тест", mainPain: "Тест", fears: [] },
        behavior: { 
          userScenarios: { idealPath: "Тест", typicalError: "Тест", alternativeWorkaround: "Тест" },
          behavioralPatterns: "Тест",
          frictionPoints: [],
          actionMotivation: "Тест"
        },
        problemsAndSolutions: [],
        selfCheck: { checklist: {}, varietyCheck: {}, confidence: { analysis: 80 } }
      },

      // 2. Обрезанный JSON (симулируем проблему)
      truncated: `{
        "screenDescription": {
          "screenType": "Мобильное приложение",
          "confidence": 85
        },
        "uxSurvey": {
          "questions": [],
          "overallConfidence": 80
        },
        "audience": {
          "targetAudience": "Тест",
          "mainPain": "Тест",
          "fears": []
        },
        "behavior": {
          "userScenarios": {
            "idealPath": "Тест",
            "typicalError": "Тест",
            "alternativeWorkaround": "Тест"
          },
          "behavioralPatterns": "Тест",
          "frictionPoints": [],
          "actionMotivation": "Тест"
        },
        "problemsAndSolutions": [],
        "selfCheck": {
          "checklist": {},
          "varietyCheck": {},
          "confidence": {
            "analysis": 80`,

      // 3. Полностью сломанный JSON
      broken: `{
        "screenDescription": {
          "screenType": "Мобильное приложение",
          "confidence": 85
        },
        "uxSurvey": {
          "questions": [],
          "overallConfidence": 80
        },
        "audience": {
          "targetAudience": "Тест",
          "mainPain": "Тест",
          "fears": []
        },
        "behavior": {
          "userScenarios": {
            "idealPath": "Тест",
            "typicalError": "Тест",
            "alternativeWorkaround": "Тест"
          },
          "behavioralPatterns": "Тест",
          "frictionPoints": [],
          "actionMotivation": "Тест"
        },
        "problemsAndSolutions": [],
        "selfCheck": {
          "checklist": {},
          "varietyCheck": {},
          "confidence": {
            "analysis": 80
          }
        }
      }`,

      // 4. JSON с лишними символами
      corrupted: `{
        "screenDescription": {
          "screenType": "Мобильное приложение",
          "confidence": 85
        },
        "uxSurvey": {
          "questions": [],
          "overallConfidence": 80
        },
        "audience": {
          "targetAudience": "Тест",
          "mainPain": "Тест",
          "fears": []
        },
        "behavior": {
          "userScenarios": {
            "idealPath": "Тест",
            "typicalError": "Тест",
            "alternativeWorkaround": "Тест"
          },
          "behavioralPatterns": "Тест",
          "frictionPoints": [],
          "actionMotivation": "Тест"
        },
        "problemsAndSolutions": [],
        "selfCheck": {
          "checklist": {},
          "varietyCheck": {},
          "confidence": {
            "analysis": 80
          }
        }
      }`
    }

    const testCase = testCases[testType as keyof typeof testCases]
    
    if (!testCase) {
      return NextResponse.json({ error: 'Invalid test type' }, { status: 400 })
    }

    // Тестируем наш алгоритм восстановления JSON
    const tryParseJSON = (jsonString: string) => {
      try {
        return JSON.parse(jsonString)
      } catch (error) {
        return null
      }
    }

    const fixTruncatedJSON = (jsonStr: string) => {
      let fixed = jsonStr.trim()
      
      if (!fixed.endsWith('}') && !fixed.endsWith(']')) {
        let lastBrace = fixed.lastIndexOf('}')
        let lastBracket = fixed.lastIndexOf(']')
        let lastComplete = Math.max(lastBrace, lastBracket)
        
        if (lastComplete > 0) {
          fixed = fixed.substring(0, lastComplete + 1)
        } else {
          const openBraces = (fixed.match(/\{/g) || []).length
          const closeBraces = (fixed.match(/\}/g) || []).length
          const openBrackets = (fixed.match(/\[/g) || []).length
          const closeBrackets = (fixed.match(/\]/g) || []).length
          
          for (let i = 0; i < openBraces - closeBraces; i++) {
            fixed += '}'
          }
          for (let i = 0; i < openBrackets - closeBrackets; i++) {
            fixed += ']'
          }
        }
      }
      
      return fixed
    }

    let result
    let recoveryMethod = 'none'

    if (typeof testCase === 'string') {
      // Тестируем строку JSON
      let parsedResult = tryParseJSON(testCase)
      
      if (!parsedResult) {
        console.log('⚠️ JSON невалиден, пытаемся восстановить...')
        const fixedJSON = fixTruncatedJSON(testCase)
        parsedResult = tryParseJSON(fixedJSON)
        
        if (parsedResult) {
          recoveryMethod = 'truncation_fix'
          result = parsedResult
        } else {
          recoveryMethod = 'fallback'
          result = {
            screenDescription: { screenType: "Неизвестно", confidence: 0 },
            uxSurvey: { questions: [], overallConfidence: 0 },
            audience: { targetAudience: "Не загружено", mainPain: "Ошибка загрузки", fears: [] },
            behavior: { 
              userScenarios: { idealPath: "Не загружено", typicalError: "Не загружено", alternativeWorkaround: "Не загружено" },
              behavioralPatterns: "Ошибка загрузки",
              frictionPoints: [],
              actionMotivation: "Не загружено"
            },
            problemsAndSolutions: [],
            selfCheck: { checklist: {}, varietyCheck: {}, confidence: { analysis: 0 } }
          }
        }
      } else {
        recoveryMethod = 'direct_parse'
        result = parsedResult
      }
    } else {
      // Уже валидный объект
      recoveryMethod = 'direct_object'
      result = testCase
    }

    return NextResponse.json({
      success: true,
      testType,
      recoveryMethod,
      result,
      hasScreenDescription: !!result.screenDescription,
      hasUxSurvey: !!result.uxSurvey,
      hasAudience: !!result.audience,
      hasBehavior: !!result.behavior,
      hasProblemsAndSolutions: !!result.problemsAndSolutions,
      hasSelfCheck: !!result.selfCheck,
      confidence: result.screenDescription?.confidence || 0
    })

  } catch (error) {
    console.error('❌ Ошибка в тесте JSON парсинга:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

