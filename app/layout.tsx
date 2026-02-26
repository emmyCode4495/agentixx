import type { Metadata, Viewport } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: {
    default: "Agentixx",
    template: "%s · Agentixx",
  },
  description: "Solana autonomous agent framework.",
  keywords: ["Next.js", "React", "TypeScript"],
  authors: [{ name: "#emmyCode" }],
  creator: "#emmyCode",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
  openGraph: {
    type: "website",
    locale: "en_US",
    title: "Agentixx",
    description: "Solana autonomous agent framework.",
    siteName: "Agentixx",
  },
  twitter: {
    card: "summary_large_image",
    title: "Agentixx",
    description: "Solana autonomous agent framework.",
  },
  robots: {
    index: true,
    follow: true,
  },
}

export const viewport: Viewport = {
  themeColor: "#0a0a0f",
  width: "device-width",
  initialScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  )
}