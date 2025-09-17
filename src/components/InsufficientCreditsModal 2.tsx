'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CreditCard, AlertTriangle, ArrowRight, Coins } from 'lucide-react'
import Link from 'next/link'

interface InsufficientCreditsModalProps {
  isOpen: boolean
  onClose: () => void
  required: number
  available: number
  onPurchaseComplete?: () => void
}

export default function InsufficientCreditsModal({ 
  isOpen, 
  onClose, 
  required, 
  available,
  onPurchaseComplete 
}: InsufficientCreditsModalProps) {
  const [isRedirecting, setIsRedirecting] = useState(false)

  const handlePurchaseClick = () => {
    setIsRedirecting(true)
    // Закрываем модалку и перенаправляем на страницу покупки
    onClose()
    window.location.href = '/credits'
  }

  const handleClose = () => {
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md" aria-describedby="insufficient-credits-description">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
              <AlertTriangle className="h-4 w-4 text-red-600" />
            </div>
            <DialogTitle className="text-lg font-semibold">
              Недостаточно кредитов
            </DialogTitle>
          </div>
          <DialogDescription id="insufficient-credits-description" className="text-gray-600">
            Для проведения аудита необходимо больше кредитов, чем доступно на вашем счете.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Текущий баланс */}
          <Card className="border-red-200 bg-red-50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-red-800 flex items-center gap-2">
                <Coins className="h-4 w-4" />
                Текущий баланс
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold text-red-600">{available}</span>
                <span className="text-sm text-red-600">кредитов</span>
              </div>
            </CardContent>
          </Card>

          {/* Требуется */}
          <Card className="border-blue-200 bg-blue-50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-blue-800">
                Требуется для аудита
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold text-blue-600">{required}</span>
                <span className="text-sm text-blue-600">кредитов</span>
              </div>
            </CardContent>
          </Card>

          {/* Недостает */}
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-2">Недостает</p>
            <Badge variant="destructive" className="text-lg px-3 py-1">
              {required - available} кредитов
            </Badge>
          </div>

          {/* Информация о пакетах */}
          <div className="space-y-2">
            <h4 className="font-medium text-gray-900">Доступные пакеты:</h4>
            <div className="grid grid-cols-1 gap-2 text-sm">
              <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                <span>BASIC</span>
                <span className="font-medium">10 кредитов за $1.99</span>
              </div>
              <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                <span>PRO</span>
                <span className="font-medium">50 кредитов за $8.99</span>
              </div>
              <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                <span>TEAM</span>
                <span className="font-medium">200 кредитов за $29.99</span>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button 
            variant="outline" 
            onClick={handleClose}
            className="w-full sm:w-auto"
          >
            Отмена
          </Button>
          <Button 
            onClick={handlePurchaseClick}
            className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700"
            disabled={isRedirecting}
          >
            {isRedirecting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                Переход...
              </>
            ) : (
              <>
                <CreditCard className="h-4 w-4 mr-2" />
                Пополнить баланс
                <ArrowRight className="h-4 w-4 ml-2" />
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
