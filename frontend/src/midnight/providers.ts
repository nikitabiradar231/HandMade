import type { ConnectedAPI } from '@midnight-ntwrk/dapp-connector-api';
import { FetchZkConfigProvider } from '@midnight-ntwrk/midnight-js-fetch-zk-config-provider';
import { httpClientProofProvider } from '@midnight-ntwrk/midnight-js-http-client-proof-provider';
import { indexerPublicDataProvider } from '@midnight-ntwrk/midnight-js-indexer-public-data-provider';
import { levelPrivateStateProvider } from '@midnight-ntwrk/midnight-js-level-private-state-provider';
import {
  Binding,
  CostModel,
  Proof,
  SignatureEnabled,
  Transaction,
  type FinalizedTransaction,
  type TransactionId,
} from '@midnight-ntwrk/midnight-js-protocol/ledger';
import type { UnboundTransaction } from '@midnight-ntwrk/midnight-js-types';
import { fromHex, toHex } from '@midnight-ntwrk/midnight-js-utils';
import { dappConnectorProofProvider } from '@midnight-ntwrk/midnight-js-dapp-connector-proof-provider';

/**
 * Browser-appropriate replacement for the placeholder used by the CLI. In a
 * real deployment the user would choose/enter this secret; for the devnet demo
 * we keep the same value everywhere so state survives reloads.
 */
const PRIVATE_STATE_PASSWORD = 'Local-Devnet-Development-Placeholder-1';

/**
 * The providers that midnight-js-contracts consumes. The DApp Connector bridge
 * deliberately keeps these loosely typed — the connector's serialized-string
 * API maps onto the object-based midnight-js contracts with casts at the seams.
 */
export interface BrowserProviders {
  privateStateProvider: any;
  publicDataProvider: any;
  zkConfigProvider: any;
  proofProvider: any;
  walletProvider: any;
  midnightProvider: any;
}

/**
 * Bridge the DApp Connector wallet (`ConnectedAPI`) to the provider interfaces
 * that midnight-js-contracts expects.
 *
 * The connector works with *serialized* transaction strings and bech32m keys,
 * while midnight-js works with ledger transaction objects, so we serialize on
 * the way out and deserialize on the way back:
 *
 *   balanceTx: UnboundTransaction -(serialize)-> hex -> balanceUnsealedTransaction -> hex
 *              -(deserialize as FinalizedTransaction)>
 *   submitTx : FinalizedTransaction -(serialize)-> hex -> submitTransaction
 */
export async function buildProviders(connectedApi: ConnectedAPI): Promise<BrowserProviders> {
  const config = await connectedApi.getConfiguration();
  const shielded = await connectedApi.getShieldedAddresses();

  // Prefer the Preview endpoints declared by the frontend env over whatever
  // the wallet extension reports, so the SDK always talks to the network the
  // DApp is configured for. Falls back to the wallet's own configuration.
  const indexerUri = import.meta.env.VITE_INDEXER_URL || config.indexerUri;
  const indexerWsUri = import.meta.env.VITE_INDEXER_WS_URL || config.indexerWsUri;
  const proofServerUri = import.meta.env.VITE_PROOF_SERVER_URL || config.proverServerUri;

  // ZK artifacts (zkir + keys) are served from /zkConfig — copied from
  // contracts/managed/handmade-marketplace by scripts/copy-zk.mjs.
  const zkConfigProvider = new FetchZkConfigProvider(
    `${window.location.origin}/zkConfig`,
    fetch.bind(window),
  );

  // The wallet's own proof server (from getConfiguration) is preferred so the
  // user's configured proving modality is honoured. If it is absent (older
  // wallets), delegate proving back to the wallet extension instead.
  const proofProvider = proofServerUri
    ? httpClientProofProvider(proofServerUri, zkConfigProvider)
    : await dappConnectorProofProvider(connectedApi, zkConfigProvider, CostModel.initialCostModel());

  return {
    privateStateProvider: levelPrivateStateProvider({
      privateStateStoreName: 'handmade-marketplace-state',
      accountId: (await connectedApi.getUnshieldedAddress()).unshieldedAddress,
      privateStoragePasswordProvider: async () => PRIVATE_STATE_PASSWORD,
    }),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    publicDataProvider: indexerPublicDataProvider(indexerUri, indexerWsUri, WebSocket as any),
    zkConfigProvider,
    proofProvider,
    walletProvider: {
      getCoinPublicKey: () => shielded.shieldedCoinPublicKey,
      getEncryptionPublicKey: () => shielded.shieldedEncryptionPublicKey,
      async balanceTx(tx: UnboundTransaction): Promise<FinalizedTransaction> {
        const serialized = toHex(tx.serialize());
        const balanced = await connectedApi.balanceUnsealedTransaction(serialized);
        return Transaction.deserialize<SignatureEnabled, Proof, Binding>(
          'signature',
          'proof',
          'binding',
          fromHex(balanced.tx),
        );
      },
    },
    midnightProvider: {
      async submitTx(tx: FinalizedTransaction): Promise<TransactionId> {
        await connectedApi.submitTransaction(toHex(tx.serialize()));
        return tx.identifiers()[0];
      },
    },
  };
}
