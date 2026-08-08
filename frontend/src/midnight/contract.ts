/**
 * Browser counterpart of the repo-root `src/contract.ts`: loads the compiled
 * HandMadeHub contract, attaches the privacy witnesses and reads the public
 * ledger state.
 *
 * Privacy witnesses (makerSecret / candidateSecret / buyerSecret) live in the
 * `witnessValues` object captured at build time. The circuits only ever see
 * these values inside the zero-knowledge proof; the wallet/extension never
 * learns them, and they are never written to the chain.
 */
import { CompiledContract } from '@midnight-ntwrk/midnight-js-protocol/compact-js';

export const CONTRACT_NAME = 'handmade-marketplace';
export const PRIVATE_STATE_ID = 'handmadeMarketplacePrivateState';

export type AnyProvableCircuitId = 'listProduct' | 'mintAuthenticityNft' | 'verifyAuthenticity' | 'purchaseProduct' | 'withdrawProduct';

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

/**
 * Import the compiler-generated `Contract` module. Vite bundles it from the
 * repo-root `contracts/managed/handmade-marketplace` directory (created by
 * `npm run compile`).
 */
export async function loadContractModule(): Promise<any> {
  return import('../../../contracts/managed/handmade-marketplace/contract/index.js');
}

/**
 * Build the compiled contract with privacy witnesses attached. `values` is
 * captured by reference — swap its fields to change what the circuits prove.
 */
export function makeCompiledContract(module: any, values: WitnessValues) {
  return (CompiledContract as any).make(CONTRACT_NAME, module.Contract).pipe(
    (CompiledContract as any).withWitnesses({
      makerSecret: (ctx: any): [unknown, Uint8Array] => [ctx.privateState, values.makerSecret],
      candidateSecret: (ctx: any): [unknown, Uint8Array] => [ctx.privateState, values.candidateSecret],
      buyerSecret: (ctx: any): [unknown, Uint8Array] => [ctx.privateState, values.buyerSecret],
    }),
    (CompiledContract as any).withCompiledFileAssets('zkConfig'),
  );
}

/** Decode the on-chain ledger state into the typed `Ledger`. */
export function readPublicLedger(module: any, contractState: any) {
  return module.ledger(contractState.data);
}
