/**
 * lib/solana.ts
 * Core Solana devnet connection and wallet utilities.
 * All agents share one Connection instance (server-side singleton).
 */

import {
  Connection,
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
  TransactionInstruction,
  sendAndConfirmTransaction,
  LAMPORTS_PER_SOL,
  type TransactionSignature,
  type ConfirmedSignatureInfo,
} from "@solana/web3.js"
import crypto from "crypto"

// ── Devnet RPC ────────────────────────────────────────────────────
export const DEVNET_RPC = "https://api.devnet.solana.com"

// Singleton connection (reused across requests in the same process)
let _connection: Connection | null = null
export function getConnection(): Connection {
  if (!_connection) {
    _connection = new Connection(DEVNET_RPC, {
      commitment: "confirmed",
      confirmTransactionInitialTimeout: 60_000,
    })
  }
  return _connection
}

// ── Encryption helpers ────────────────────────────────────────────
const ALGO = "aes-256-gcm"

export function encryptKey(secretKeyHex: string, password: string) {
  const iv = crypto.randomBytes(12)
  const derivedKey = crypto.scryptSync(password, "agentw-salt-v1", 32)
  const cipher = crypto.createCipheriv(ALGO, derivedKey, iv)
  let enc = cipher.update(secretKeyHex, "utf8", "hex")
  enc += cipher.final("hex")
  return {
    enc,
    iv: iv.toString("hex"),
    tag: cipher.getAuthTag().toString("hex"),
  }
}

export function decryptKey(
  enc: string,
  ivHex: string,
  tagHex: string,
  password: string
): string {
  const iv = Buffer.from(ivHex, "hex")
  const tag = Buffer.from(tagHex, "hex")
  const derivedKey = crypto.scryptSync(password, "agentw-salt-v1", 32)
  const decipher = crypto.createDecipheriv(ALGO, derivedKey, iv)
  decipher.setAuthTag(tag)
  let dec = decipher.update(enc, "hex", "utf8")
  dec += decipher.final("utf8")
  return dec
}

// ── Wallet creation ───────────────────────────────────────────────
export interface StoredWallet {
  agentId: string
  publicKey: string
  enc: string
  iv: string
  tag: string
  createdAt: string
}

const ENC_PASSWORD =
  process.env.WALLET_ENCRYPTION_KEY ?? "dev-only-change-in-prod-32chars!!"

export function createAgentWallet(agentId: string): {
  keypair: Keypair
  stored: StoredWallet
} {
  const keypair = Keypair.generate()
  const secretKeyHex = Buffer.from(keypair.secretKey).toString("hex")
  const { enc, iv, tag } = encryptKey(secretKeyHex, ENC_PASSWORD)

  return {
    keypair,
    stored: {
      agentId,
      publicKey: keypair.publicKey.toBase58(),
      enc,
      iv,
      tag,
      createdAt: new Date().toISOString(),
    },
  }
}

export function loadKeypairFromStored(stored: StoredWallet): Keypair {
  const secretKeyHex = decryptKey(stored.enc, stored.iv, stored.tag, ENC_PASSWORD)
  return Keypair.fromSecretKey(Buffer.from(secretKeyHex, "hex"))
}

// ── Balance & history ─────────────────────────────────────────────
export async function getBalanceSOL(publicKey: string): Promise<number> {
  const conn = getConnection()
  const lamports = await conn.getBalance(new PublicKey(publicKey))
  return lamports / LAMPORTS_PER_SOL
}

export async function getTxHistory(
  publicKey: string,
  limit = 15
): Promise<ConfirmedSignatureInfo[]> {
  const conn = getConnection()
  return conn.getSignaturesForAddress(new PublicKey(publicKey), { limit })
}

// ── Airdrop ───────────────────────────────────────────────────────
export async function requestAirdrop(
  publicKey: string,
  amountSOL = 1
): Promise<TransactionSignature> {
  const conn = getConnection()
  const sig = await conn.requestAirdrop(
    new PublicKey(publicKey),
    amountSOL * LAMPORTS_PER_SOL
  )
  const { blockhash, lastValidBlockHeight } = await conn.getLatestBlockhash()
  await conn.confirmTransaction({ signature: sig, blockhash, lastValidBlockHeight })
  return sig
}

// ── SOL transfer ──────────────────────────────────────────────────
export async function sendSOL(
  fromKeypair: Keypair,
  toPublicKey: string,
  amountSOL: number
): Promise<TransactionSignature> {
  const conn = getConnection()
  const tx = new Transaction().add(
    SystemProgram.transfer({
      fromPubkey: fromKeypair.publicKey,
      toPubkey: new PublicKey(toPublicKey),
      lamports: Math.floor(amountSOL * LAMPORTS_PER_SOL),
    })
  )
  return sendAndConfirmTransaction(conn, tx, [fromKeypair], {
    commitment: "confirmed",
  })
}

// ── Memo transaction (used for SELL — real on-chain record) ───────
/**
 * Solana Memo program — records arbitrary UTF-8 data permanently on-chain.
 * Every SELL decision is logged here so it's verifiable on Explorer,
 * even though no SOL changes hands (no counterparty without a deployed program).
 */
const MEMO_PROGRAM_ID = new PublicKey("MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr")

/**
 * Sends a transaction containing only a Memo instruction.
 * The memo string (JSON trade metadata) is signed by the agent's keypair
 * and permanently written to Solana devnet — fully verifiable on Explorer.
 *
 * @param fromKeypair  agent's signing keypair
 * @param memo         UTF-8 string to record (typically JSON)
 * @returns confirmed transaction signature
 */
export async function sendMemoTransaction(
  fromKeypair: Keypair,
  memo: string
): Promise<TransactionSignature> {
  const conn = getConnection()

  const memoInstruction = new TransactionInstruction({
    keys: [{ pubkey: fromKeypair.publicKey, isSigner: true, isWritable: false }],
    programId: MEMO_PROGRAM_ID,
    data: Buffer.from(memo, "utf-8"),
  })

  const tx = new Transaction().add(memoInstruction)

  return sendAndConfirmTransaction(conn, tx, [fromKeypair], {
    commitment: "confirmed",
  })
}