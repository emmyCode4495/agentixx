// ─── Utility Types ───────────────────────────────────────────────────────────

/** Make specific keys required in a type */
export type RequiredKeys<T, K extends keyof T> = T & Required<Pick<T, K>>

/** Make specific keys optional in a type */
export type PartialKeys<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>

/** Deeply make all properties optional */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P]
}

/** Extract the resolved type of a Promise */
export type Awaited<T> = T extends Promise<infer R> ? R : T

// ─── App Types ───────────────────────────────────────────────────────────────

export interface ApiResponse<T = unknown> {
  data: T
  error?: string
  status: number
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
  hasMore: boolean
}

export interface NavItem {
  href: string
  label: string
  icon?: string
  external?: boolean
}

export type Theme = "light" | "dark" | "system"

export type Status = "idle" | "loading" | "success" | "error"