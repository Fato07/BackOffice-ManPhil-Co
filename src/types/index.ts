export * from './property'

// Common UI types
export type ActionResult<T = void> = 
  | { success: true; data?: T }
  | { success: false; error: string }

export type LoadingState = 'idle' | 'loading' | 'error' | 'success'

export type SortDirection = 'asc' | 'desc'

export type SortConfig = {
  field: string
  direction: SortDirection
}