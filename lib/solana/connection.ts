import { Connection } from "@solana/web3.js"

export const DEVNET_RPC =
  process.env.SOLANA_RPC_URL ?? "https://api.devnet.solana.com"

let connection: Connection | null = null

export function getConnection(): Connection {
  if (!connection) {
    connection = new Connection(DEVNET_RPC, {
      commitment: "confirmed",
      confirmTransactionInitialTimeout: 60_000,
    })
  }
  return connection
}
