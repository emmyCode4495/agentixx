import { SystemProgram, Transaction, PublicKey } from "@solana/web3.js"
import { BaseAgent } from "./baseAgent"

export class TraderAgent extends BaseAgent {
  async decide() {
    const tx = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: (this as any).wallet.keypair.publicKey,
        toPubkey: new PublicKey(
          (this as any).wallet.keypair.publicKey
        ),
        lamports: 1000,
      })
    )

    await (this as any).wallet.execute(tx)
  }
}
