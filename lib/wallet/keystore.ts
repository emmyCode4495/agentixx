import fs from "fs"
import path from "path"
import crypto from "crypto"

const STORE_DIR = path.join(process.cwd(), ".agent-keystore")
if (!fs.existsSync(STORE_DIR)) fs.mkdirSync(STORE_DIR)

const ALGO = "aes-256-gcm"
const PASSWORD =
  process.env.WALLET_ENCRYPTION_KEY ?? "dev-only-change-me-32-chars!!"

export function saveEncryptedWallet(agentId: string, data: any) {
  fs.writeFileSync(
    path.join(STORE_DIR, `${agentId}.json`),
    JSON.stringify(data, null, 2)
  )
}

export function loadEncryptedWallet(agentId: string) {
  const file = path.join(STORE_DIR, `${agentId}.json`)
  if (!fs.existsSync(file)) return null
  return JSON.parse(fs.readFileSync(file, "utf8"))
}
