import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Action types for UX analysis
export type ActionType = 'research' | 'collect' | 'analytics' | 'ab-test' | 'hypotheses'

// Available actions for UX analysis
export const ACTIONS: { id: ActionType }[] = [
  { id: 'research' },
  { id: 'collect' },
  { id: 'analytics' },
  { id: 'ab-test' },
  { id: 'hypotheses' }
]
