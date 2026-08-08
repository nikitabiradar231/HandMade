/**
 * Shared HandMadeHub contract wiring: loads the compiled contract, attaches
 * the privacy witnesses (makerSecret / candidateSecret / buyerSecret), builds
 * the midnight-js providers, and reads the public ledger state back.
 *
 * The three witnesses are the ONLY place secrets enter the system. They are
 * supplied by the caller (CLI / tests / frontend), used inside the ZK proof,
 * and never written into any ledger field.
 */
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { WebSocket } from 'ws';

import { CompiledContract } from '@midnight-ntwrk/midnight-js-protocol/compact-js';
import { indexerPublicDataProvider } from '@midnight-ntwrk/midnight-js-indexer-public-data-provider';
import { levelPrivateStateProvider } from '@midnight-ntwrk/midnight-js-level-private-state-provider';
import { NodeZkConfigProvider } from '@midnight-ntwrk/midnight-js-node-zk-config-provider';
import { httpClientProofProvider } from '@midnight-ntwrk/midnight-js-http-client-proof-provider';

import type { NetworkConfig } from './network';
import type { WalletContext } from './wallet';

// @ts-expect-error Required for wallet sync
globalThis.WebSocket = WebSocket;

export const CONTRACT_NAME = 'handmade-marketplace';
export const PRIVATE_STATE_ID = 'handmadeMarketplacePrivateState';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const zkConfigPath = path.resolve(__dirname, '..', 'contracts', 'managed', CONTRACT_NAME);

export interface WitnessValues {
  makerSecret: Uint8Array;
  candidateSecret: Uint8Array;
  buyerSecret: Uint8Array;
}

export const emptyWitnessValues = (): WitnessValues => ({
  makerSecret: new Uint8Array(32),
  candidateSecret: new Uint8Array(32),
  buyerSecret: new Uint8Array(32),
});

/** Load the compiler-generated `Contract` class. */
export async function loadContractModule(): Promise<any> {
  const contractPath = path.join(zkConfigPath, 'contract', 'index.js');
  if (!fs.existsSync(contractPath)) {
    throw new Error('Contract not compiled! Run: npm run compile');
  }
  return import(pathToFileURL(contractPath).href);
}

/**
 * Build the compiled contract with privacy witnesses attached.
 * `values` is captured at build time; swap it to change what the circuit
 * proves without rebuilding the object graph.
 */
export function makeCompiledContract(module: any, values: WitnessValues) {
  return (CompiledContract as any).make(CONTRACT_NAME, module.Contract).pipe(
    (CompiledContract as any).withWitnesses({
      makerSecret: (ctx: any): [unknown, Uint8Array] => [ctx.privateState, values.makerSecret],
      candidateSecret: (ctx: any): [unknown, Uint8Array] => [ctx.privateState, values.candidateSecret],
      buyerSecret: (ctx: any): [unknown, Uint8Array] => [ctx.privateState, values.buyerSecret],
    }),
    (CompiledContract as any).withCompiledFileAssets(zkConfigPath),
  );
}

/** Build all midnight-js providers for a wallet + network. */
export async function createProviders(walletCtx: WalletContext, networkConfig: NetworkConfig) {
  const privateStatePassword =
    process.env.PRIVATE_STATE_PASSWORD?.trim() || 'Local-Devnet-Development-Placeholder-1';

  const walletProvider = {
    getCoinPublicKey: () => walletCtx.shieldedSecretKeys.coinPublicKey,
    getEncryptionPublicKey: () => walletCtx.shieldedSecretKeys.encryptionPublicKey,
    async balanceTx(tx: any, ttl?: Date) {
      const recipe = await walletCtx.wallet.balanceUnboundTransaction(
        tx,
        { shieldedSecretKeys: walletCtx.shieldedSecretKeys, dustSecretKey: walletCtx.dustSecretKey },
        { ttl: ttl ?? new Date(Date.now() + 30 * 60 * 1000) },
      );
      return walletCtx.wallet.finalizeRecipe(recipe);
    },
    submitTx: (tx: any) => walletCtx.wallet.submitTransaction(tx) as any,
  };

  const zkConfigProvider = new NodeZkConfigProvider(zkConfigPath);
  const accountId = walletCtx.unshieldedKeystore.getBech32Address().toString();

  return {
    privateStateProvider: levelPrivateStateProvider({
      privateStateStoreName: 'handmade-marketplace-state',
      accountId,
      privateStoragePasswordProvider: () => privateStatePassword,
    }),
    publicDataProvider: indexerPublicDataProvider(networkConfig.indexer, networkConfig.indexerWS),
    zkConfigProvider,
    proofProvider: httpClientProofProvider(networkConfig.proofServer, zkConfigProvider),
    walletProvider,
    midnightProvider: walletProvider,
  };
}

/** Decode the on-chain ledger state into the typed `Ledger`. */
export async function readPublicLedger(providers: any, contractAddress: string, module: any) {
  const contractState = await providers.publicDataProvider.queryContractState(contractAddress);
  if (!contractState) return null;
  return module.ledger(contractState.data);
}
