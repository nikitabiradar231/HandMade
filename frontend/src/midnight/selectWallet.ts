import type { ConnectedAPI, InitialAPI } from '@midnight-ntwrk/dapp-connector-api';
import { setNetworkId } from '@midnight-ntwrk/midnight-js-network-id';

/** Environment defaults (overridable via `frontend/.env`). */
export const NETWORK_ID: string = import.meta.env.VITE_NETWORK_ID ?? 'preview';

// The Midnight.js runtime and contract layers call getNetworkId() for every
// wallet, provider, contract and transaction operation. Configure it up front —
// before any of those run — so ledger deserialization, address parsing and
// transaction building are bound to the network declared by the frontend.
setNetworkId(NETWORK_ID);

/**
 * Ledger address of the deployed HandMadeHub contract. The default is the
 * address recorded in `.midnight-state.json` for the local devnet.
 */
export const CONTRACT_ADDRESS: string =
  import.meta.env.VITE_CONTRACT_ADDRESS ??
  '9179c501783942ab18521482387195f3098418a73bbe04a38ea16358dbbeadd6';

/**
 * The Midnight browser wallet injects an object under `window.midnight` whose
 * values are `InitialAPI` instances (one per supported API version). We use
 * the connector API v4.x family.
 */
const COMPATIBLE_CONNECTOR_API_VERSION = '4';

export function findWallets(): InitialAPI[] {
  const injected = window.midnight;
  if (!injected) return [];
  return Object.values(injected).filter(
    (wallet): wallet is InitialAPI =>
      !!wallet && typeof wallet === 'object' && 'apiVersion' in wallet,
  );
}

export function findCompatibleWallet(): InitialAPI | undefined {
  return findWallets().find(
    (wallet) => wallet.apiVersion?.startsWith(COMPATIBLE_CONNECTOR_API_VERSION),
  );
}

/** All `InitialAPI`s, used to render a wallet picker. */
export function listWalletDescriptors(): { rdns: string; name: string; icon: string }[] {
  return findWallets().map(({ rdns, name, icon }) => ({ rdns, name, icon }));
}

/**
 * Connect to the Midnight wallet on the requested network.
 *
 * @throws if no compatible wallet extension is installed, the user rejects the
 * connection, or the wallet is already connected to a different network.
 */
export async function connectWallet(networkId: string = NETWORK_ID): Promise<ConnectedAPI> {
  const wallet = findCompatibleWallet();
  if (!wallet) {
    throw new Error(
      'No compatible Midnight wallet found. Install the Midnight browser extension (connector API v4.x) and reload this page.',
    );
  }

  const connectedApi = await wallet.connect(networkId);
  const status = await connectedApi.getConnectionStatus();
  if (status.status !== 'connected' || status.networkId !== networkId) {
    const actual = status.status === 'connected' ? `'${status.networkId}'` : 'nothing';
    throw new Error(`Wallet is connected to ${actual}, but HandMadeHub requires '${networkId}'.`);
  }

  return connectedApi;
}
