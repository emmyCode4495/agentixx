import { WalletEngine } from "../wallet/engine"

export abstract class BaseAgent {
  constructor(
    public id: string,
    protected wallet: WalletEngine
  ) {}

  abstract decide(): Promise<void>
}
