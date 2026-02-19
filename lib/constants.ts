export const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME ?? "My Next App"
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"

export const ROUTES = {
  home: "/",
  about: "/about",
  dashboard: "/dashboard",
} as const

export const API_ROUTES = {
  health: "/api/health",
} as const