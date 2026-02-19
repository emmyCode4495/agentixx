import { Keypair } from "@solana/web3.js"
import { saveEncryptedWallet } from "./keystore"
import crypto from "crypto"


const ALGO = "aes-256-gcm"

const PASSWORD = process.env.WALLET_ENCRYPTION_KEY

function getPassword(): string {
  if (!PASSWORD) {
    throw new Error("WALLET_ENCRYPTION_KEY is not set")
  }
  return PASSWORD
}

function encrypt(secretKeyHex: string) {
  const password = getPassword()

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


export function createAgentWallet(agentId: string) {
  const keypair = Keypair.generate()
  const secretKeyHex = Buffer.from(keypair.secretKey).toString("hex")

  const encrypted = encrypt(secretKeyHex)

  const stored = {
    agentId,
    publicKey: keypair.publicKey.toBase58(),
    ...encrypted,
    createdAt: new Date().toISOString(),
  }

  saveEncryptedWallet(agentId, stored)

  return { keypair, stored }
}
