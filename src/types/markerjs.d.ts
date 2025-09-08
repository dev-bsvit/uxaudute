declare module '@markerjs/markerjs-ui' {
  export class AnnotationEditor {
    targetImage: HTMLImageElement | null
    addEventListener(event: string, listener: () => void): void
    removeEventListener(event: string, listener: () => void): void
    serializeState(): string
    deserializeState(state: string): void
    clear(): void
    close(): void
    show(): void
    hide(): void
  }
}

declare module '@markerjs/markerjs3' {
  // Базовые типы MarkerJS3
  export interface MarkerState {
    [key: string]: any
  }
}
