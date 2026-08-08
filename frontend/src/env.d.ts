/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Midnight network id the wallet must be connected to. */
  readonly VITE_NETWORK_ID?: string;
  /** Ledger address of the deployed HandMadeHub contract. */
  readonly VITE_CONTRACT_ADDRESS?: string;
  readonly VITE_INDEXER_URL?: string;
  readonly VITE_INDEXER_WS_URL?: string;
  readonly VITE_PROOF_SERVER_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
