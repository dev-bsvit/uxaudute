declare module '@markerjs/markerjs-ui' {
  export class AnnotationEditor extends HTMLElement {
    targetImage: HTMLImageElement | null
    addEventListener(event: 'editorsave' | 'close' | 'statechange', listener: (event: any) => void): void
    removeEventListener(event: string, listener: () => void): void
    serializeState(): string
    deserializeState(state: string): void
    clear(): void
  }
}

// Глобальные типы для динамического импорта
declare global {
  interface Window {
    HTMLElement: typeof HTMLElement
  }
}

declare module '@markerjs/markerjs3' {
  // Базовые типы MarkerJS3
  export interface MarkerState {
    [key: string]: any
  }
}
