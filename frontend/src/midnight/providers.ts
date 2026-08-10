import type { ConnectedAPI } from '@midnight-ntwrk/dapp-connector-api';
import { FetchZkConfigProvider } from '@midnight-ntwrk/midnight-js-fetch-zk-config-provider';
import { httpClientProofProvider } from '@midnight-ntwrk/midnight-js-http-client-proof-provider';
import { indexerPublicDataProvider } from '@midnight-ntwrk/midnight-js-indexer-public-data-provider';
import { levelPrivateStateProvider } from '@midnight-ntwrk/midnight-js-level-private-state-provider';
import { setNetworkId } from '@midnight-ntwrk/midnight-js-network-id';
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
 * Official Midnight public data endpoints per network. These are the
 * unauthenticated public indexer endhpoints for the Midnight network (see
 * docs.midnight.network). Wallet extensions such as 1AM route their own
 * traffic through an IAM-gated gateway, so the DApp must not adopt the
 * extension's reported indexer/prover URIs as its own data plane.
 */
const OFFICIAL_INDEXERS: Record<string, { http: string; ws: string }> = {
  undeployed: {
    http: 'http://127.0.0.1:8088/api/v4/graphql',
    ws: 'ws://127.0.0.1:8088/api/v4/graphql/ws',
  },
  preview: {
    http: 'https://indexer.preview.midnight.network/api/v4/graphql',
    ws: 'wss://indexer.preview.midnight.network/api/v4/graphql/ws',
  },
  preprod: {
    http: 'https://indexer.preprod.midnight.network/api/v4/graphql',
    ws: 'wss://indexer.preprod.midnight.network/api/v4/graphql/ws',
  },
};

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
  setNetworkId(config.networkId);
  const shielded = await connectedApi.getShieldedAddresses();

  // Resolve the indexer from, in order of precedence:
  //   1. an explicit frontend override (VITE_*)
  //   2. the official public Midnight indexer for the network the wallet is
  //      connected to — the wallet extension's own gateway (e.g. 1AM's
  //      api-preview.1am.xyz) is IAM-gated and returns 401 without a session
  //   3. the wallet's reported configuration as a last resort
  const officialIndexer = OFFICIAL_INDEXERS[config.networkId];
  const indexerUri = import.meta.env.VITE_INDEXER_URL?.trim() || officialIndexer?.http || config.indexerUri;
  const indexerWsUri =
    import.meta.env.VITE_INDEXER_WS_URL?.trim() || officialIndexer?.ws || config.indexerWsUri;

  // ZK artifacts (zkir + keys) are served from /zkConfig — copied from
  // contracts/managed/handmade-marketplace by scripts/copy-zk.mjs.
  const zkConfigProvider = new FetchZkConfigProvider(
    `${window.location.origin}/zkConfig`,
    fetch.bind(window),
  );

  // Proving is delegated to the connected wallet via its `getProvingProvider`
  // (connector v4 API); the wallet performs any required IAM/gateway proving
  // itself. An HTTP proof server is only used when the developer explicitly
  // configures one (VITE_PROOF_SERVER_URL) — never the wallet's reported
  // proverServerUri, which may require credentials this DApp owns.
  const proofServerUrl = import.meta.env.VITE_PROOF_SERVER_URL?.trim() || undefined;
  const proofProvider = proofServerUrl
    ? httpClientProofProvider(proofServerUrl, zkConfigProvider)
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
