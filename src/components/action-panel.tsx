'use client'

import { Button } from "@/components/ui/button"
import { ACTIONS, type ActionType } from "@/lib/utils"

interface ActionPanelProps {
  onAction: (action: ActionType) => void
  className?: string
}

export function ActionPanel({ onAction, className }: ActionPanelProps) {
  return (
    <div className={`flex flex-wrap gap-2 mt-6 p-4 bg-gray-50 rounded-lg border-t ${className}`}>
      {ACTIONS.map((action) => (
        <Button
          key={action.id}
          variant="outline"
          size="sm"
          onClick={() => onAction(action.id)}
          className="text-sm hover:bg-blue-50 hover:border-blue-300"
        >
          {action.label}
        </Button>
      ))}
    </div>
  )
}
