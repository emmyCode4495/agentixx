import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  images: {
    formats: ["image/avif", "image/webp"],
  },

  // Turbopack config (Next.js 15+ default bundler)
  // @solana/web3.js references Node built-ins — resolve them to empty on client
  turbopack: {
    resolveAlias: {
      fs: { browser: "./lib/empty.ts" },
      net: { browser: "./lib/empty.ts" },
      tls: { browser: "./lib/empty.ts" },
      crypto: { browser: "./lib/empty.ts" },
    },
  },

  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
    ]
  },
}

export default nextConfig