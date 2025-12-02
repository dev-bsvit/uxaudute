/**
 * =====================================================
 * LIQPAY ИНТЕГРАЦИЯ
 * =====================================================
 * Документация: https://www.liqpay.ua/documentation/api/aquiring/checkout/doc
 *
 * LiqPay - украинская платежная система
 * Поддерживает карты Visa/Mastercard, Apple Pay, Google Pay
 */

import crypto from 'crypto'

// =====================================================
// КОНФИГУРАЦИЯ
// =====================================================

export const LIQPAY_CONFIG = {
  // Тестовые ключи (замените на боевые в production)
  PUBLIC_KEY: process.env.LIQPAY_PUBLIC_KEY || 'sandbox_i00000000',
  PRIVATE_KEY: process.env.LIQPAY_PRIVATE_KEY || 'sandbox_XXXXXXXXXXXXXXXXXXXXXXXX',

  // URL API
  API_URL: 'https://www.liqpay.ua/api/',
  CHECKOUT_URL: 'https://www.liqpay.ua/api/3/checkout',

  // Версия API
  VERSION: 3,

  // Валюта (UAH)
  CURRENCY: 'UAH',

  // Язык интерфейса
  LANGUAGE: 'uk' // uk, ru, en
}

// =====================================================
// ТИПЫ
// =====================================================

export interface LiqPayPaymentParams {
  amount: number // Сумма в гривнах
  currency?: string // Валюта (по умолчанию UAH)
  description: string // Описание платежа
  orderId: string // Уникальный ID заказа

  // Опциональные параметры
  productName?: string
  productDescription?: string
  productCategory?: string
  productUrl?: string

  // Callback URLs
  resultUrl?: string // URL для редиректа после оплаты
  serverUrl?: string // URL для webhook уведомлений
}

export interface LiqPayCheckoutData {
  public_key: string
  version: number
  action: string
  amount: number
  currency: string
  description: string
  order_id: string
  result_url?: string
  server_url?: string
  language?: string
  [key: string]: any
}

export interface LiqPayEncodedData {
  data: string
  signature: string
}

export interface LiqPayWebhookData {
  public_key: string
  version: number
  action: string
  payment_id: number
  status: string
  amount: number
  currency: string
  order_id: string
  description: string
  sender_card_mask2?: string
  sender_card_bank?: string
  sender_card_type?: string
  sender_card_country?: number
  create_date: number
  end_date: number
  transaction_id: number
  [key: string]: any
}

// Статусы платежей LiqPay
export type LiqPayStatus =
  | 'success'       // Успешный платеж
  | 'failure'       // Неуспешный платеж
  | 'error'         // Ошибка
  | 'reversed'      // Платеж возвращен
  | 'subscribed'    // Подписка создана
  | 'unsubscribed'  // Подписка отменена
  | 'processing'    // Платеж обрабатывается
  | 'sandbox'       // Тестовый платеж
  | 'wait_accept'   // Ожидает подтверждения
  | 'wait_card'     // Ожидает карточки

// =====================================================
// ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
// =====================================================

/**
 * Кодирование данных в Base64
 */
function encodeBase64(data: any): string {
  const jsonString = JSON.stringify(data)
  return Buffer.from(jsonString, 'utf-8').toString('base64')
}

/**
 * Декодирование данных из Base64
 */
function decodeBase64(data: string): any {
  const jsonString = Buffer.from(data, 'base64').toString('utf-8')
  return JSON.parse(jsonString)
}

/**
 * Генерация подписи (signature) для LiqPay
 * signature = base64(sha1(private_key + data + private_key))
 */
function generateSignature(data: string, privateKey: string): string {
  const signatureString = privateKey + data + privateKey
  const sha1 = crypto.createHash('sha1')
  sha1.update(signatureString)
  return sha1.digest('base64')
}

/**
 * Проверка подписи от LiqPay (для webhook)
 */
export function verifySignature(data: string, signature: string, privateKey: string = LIQPAY_CONFIG.PRIVATE_KEY): boolean {
  const expectedSignature = generateSignature(data, privateKey)
  return signature === expectedSignature
}

// =====================================================
// ОСНОВНЫЕ ФУНКЦИИ
// =====================================================

/**
 * Создание данных для checkout формы
 * Возвращает data и signature для отправки на LiqPay
 */
export function createCheckoutData(params: LiqPayPaymentParams): LiqPayEncodedData {
  const checkoutData: LiqPayCheckoutData = {
    public_key: LIQPAY_CONFIG.PUBLIC_KEY,
    version: LIQPAY_CONFIG.VERSION,
    action: 'pay', // Действие: pay, hold, subscribe
    amount: params.amount,
    currency: params.currency || LIQPAY_CONFIG.CURRENCY,
    description: params.description,
    order_id: params.orderId,
    language: LIQPAY_CONFIG.LANGUAGE
  }

  // Добавляем callback URLs если указаны
  if (params.resultUrl) {
    checkoutData.result_url = params.resultUrl
  }

  if (params.serverUrl) {
    checkoutData.server_url = params.serverUrl
  }

  // Добавляем информацию о продукте если указана
  if (params.productName) {
    checkoutData.product_name = params.productName
  }
  if (params.productDescription) {
    checkoutData.product_description = params.productDescription
  }
  if (params.productCategory) {
    checkoutData.product_category = params.productCategory
  }
  if (params.productUrl) {
    checkoutData.product_url = params.productUrl
  }

  // Кодируем данные
  const data = encodeBase64(checkoutData)

  // Генерируем подпись
  const signature = generateSignature(data, LIQPAY_CONFIG.PRIVATE_KEY)

  return { data, signature }
}

/**
 * Создание подписки (recurring payment)
 */
export function createSubscriptionData(params: LiqPayPaymentParams): LiqPayEncodedData {
  const subscriptionData: LiqPayCheckoutData = {
    public_key: LIQPAY_CONFIG.PUBLIC_KEY,
    version: LIQPAY_CONFIG.VERSION,
    action: 'subscribe', // subscribe для подписок
    amount: params.amount,
    currency: params.currency || LIQPAY_CONFIG.CURRENCY,
    description: params.description,
    order_id: params.orderId,
    language: LIQPAY_CONFIG.LANGUAGE,
    subscribe_periodicity: 'month', // month, year
    subscribe_date_start: new Date().toISOString().split('T')[0] // YYYY-MM-DD
  }

  // Добавляем callback URLs
  if (params.resultUrl) {
    subscriptionData.result_url = params.resultUrl
  }
  if (params.serverUrl) {
    subscriptionData.server_url = params.serverUrl
  }

  // Кодируем данные
  const data = encodeBase64(subscriptionData)

  // Генерируем подпись
  const signature = generateSignature(data, LIQPAY_CONFIG.PRIVATE_KEY)

  return { data, signature }
}

/**
 * Проверка статуса платежа
 * Используется для проверки статуса существующего платежа
 */
export async function checkPaymentStatus(orderId: string): Promise<any> {
  const requestData = {
    public_key: LIQPAY_CONFIG.PUBLIC_KEY,
    version: LIQPAY_CONFIG.VERSION,
    action: 'status',
    order_id: orderId
  }

  const data = encodeBase64(requestData)
  const signature = generateSignature(data, LIQPAY_CONFIG.PRIVATE_KEY)

  // Отправляем POST запрос к LiqPay API
  const response = await fetch(`${LIQPAY_CONFIG.API_URL}request`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: new URLSearchParams({ data, signature })
  })

  if (!response.ok) {
    throw new Error(`LiqPay API error: ${response.statusText}`)
  }

  const result = await response.json()
  return result
}

/**
 * Парсинг webhook данных от LiqPay
 */
export function parseWebhookData(data: string, signature: string): LiqPayWebhookData | null {
  // Проверяем подпись
  if (!verifySignature(data, signature)) {
    console.error('LiqPay webhook: invalid signature')
    return null
  }

  // Декодируем данные
  try {
    const webhookData = decodeBase64(data) as LiqPayWebhookData
    return webhookData
  } catch (error) {
    console.error('LiqPay webhook: failed to parse data', error)
    return null
  }
}

/**
 * Проверка успешности платежа
 */
export function isPaymentSuccessful(status: LiqPayStatus): boolean {
  return status === 'success' || status === 'sandbox'
}

/**
 * Генерация HTML формы для checkout (для встраивания на страницу)
 */
export function generateCheckoutForm(params: LiqPayPaymentParams): string {
  const { data, signature } = createCheckoutData(params)

  return `
    <form method="POST" action="${LIQPAY_CONFIG.CHECKOUT_URL}" accept-charset="utf-8">
      <input type="hidden" name="data" value="${data}" />
      <input type="hidden" name="signature" value="${signature}" />
      <button type="submit">Pay with LiqPay</button>
    </form>
  `
}

/**
 * Получение ссылки для оплаты (редирект)
 */
export function getCheckoutUrl(params: LiqPayPaymentParams): string {
  const { data, signature } = createCheckoutData(params)
  const url = new URL(LIQPAY_CONFIG.CHECKOUT_URL)
  url.searchParams.append('data', data)
  url.searchParams.append('signature', signature)
  return url.toString()
}

// =====================================================
// ЭКСПОРТ
// =====================================================

export default {
  createCheckoutData,
  createSubscriptionData,
  checkPaymentStatus,
  parseWebhookData,
  verifySignature,
  isPaymentSuccessful,
  generateCheckoutForm,
  getCheckoutUrl,
  LIQPAY_CONFIG
}
