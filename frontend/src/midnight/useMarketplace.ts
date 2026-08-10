import { useCallback, useRef, useState } from 'react';
import { findDeployedContract } from '@midnight-ntwrk/midnight-js-contracts';
import { unshieldedToken } from '@midnight-ntwrk/midnight-js-protocol/ledger';
import { setNetworkId as setSdkNetworkId } from '@midnight-ntwrk/midnight-js-network-id';
import type { ConnectedAPI } from '@midnight-ntwrk/dapp-connector-api';
import { MidnightBech32m, UnshieldedAddress } from '@midnight-ntwrk/wallet-sdk-address-format';

import { CONTRACT_ADDRESS, NETWORK_ID, connectWallet } from './selectWallet';
import { buildProviders, type BrowserProviders } from './providers';
import {
  PRIVATE_STATE_ID,
  emptyWitnessValues,
  loadContractModule,
  makeCompiledContract,
  readPublicLedger,
  type WitnessValues,
} from './contract';
import { loadSecret, parseSecretHex, randomSecret, saveSecret } from './secrets';

export interface ProductView {
  id: bigint;
  title: string;
  category: string;
  price: bigint;
  seller: Uint8Array;
  status: number; // 0 Listed | 1 Sold | 2 Withdrawn
  nftTokenId: { is_some: boolean; value: bigint };
}

export interface NftView {
  tokenId: bigint;
  productId: bigint;
  artist: Uint8Array;
  commitment: Uint8Array;
  certificate: string;
  verified: boolean;
}

export type StatusKind = 'connecting' | 'proving' | 'success' | 'error';

export interface Status {
  kind: StatusKind;
  title: string;
  detail?: string;
}

export const PRODUCT_STATUS_LABELS = ['Listed', 'Sold', 'Withdrawn'] as const;

function errorMessage(error: unknown): string {
  const msg = error instanceof Error ? error.message : String(error);
  if (msg.includes('Wallet UI disconnected') || msg.includes('disconnected')) {
    return 'The Midnight wallet extension popup disconnected or closed during authorization. Please keep your wallet active and approve the transaction prompt.';
  }
  if (msg.includes('user rejected') || msg.includes('User rejected') || msg.includes('Declined')) {
    return 'Transaction request was declined in your Midnight wallet.';
  }
  return msg;
}

export function useMarketplace() {
  const [wallet, setWallet] = useState<ConnectedAPI | null>(null);
  const [address, setAddress] = useState<string>('');
  const [networkId, setConnectedNetworkId] = useState<string>(NETWORK_ID);
  const [balance, setBalance] = useState<{ tNight: bigint; dust: bigint } | null>(null);
  const [products, setProducts] = useState<ProductView[]>([]);
  const [nfts, setNfts] = useState<NftView[]>([]);
  const [status, setStatus] = useState<Status | null>(null);
  const [busyAction, setBusyAction] = useState<string | null>(null);

  const connectedApiRef = useRef<ConnectedAPI | null>(null);
  const deployedRef = useRef<any>(null);
  const providersRef = useRef<BrowserProviders | null>(null);
  const contractModuleRef = useRef<any>(null);
  const witnessValuesRef = useRef<WitnessValues>(emptyWitnessValues());

  const resetWitnesses = useCallback(() => {
    witnessValuesRef.current = emptyWitnessValues();
  }, []);

  const refresh = useCallback(async () => {
    if (!providersRef.current || !contractModuleRef.current) return;
    try {
      const contractState =
        await providersRef.current.publicDataProvider.queryContractState(CONTRACT_ADDRESS);
      if (!contractState) {
        setProducts([]);
        setNfts([]);
        return;
      }
      const ledger = readPublicLedger(contractModuleRef.current, contractState);
      setProducts(
        [...ledger.products].map(([id, p]: [bigint, any]) => ({
          id,
          title: p.title,
          category: p.category,
          price: p.price,
          seller: new Uint8Array(p.seller),
          status: Number(p.status),
          nftTokenId: { is_some: p.nftTokenId.is_some, value: p.nftTokenId.value },
        })),
      );
      setNfts(
        [...ledger.nfts].map(([tokenId, nft]: [bigint, any]) => ({
          tokenId,
          productId: nft.productId,
          artist: new Uint8Array(nft.artist),
          commitment: new Uint8Array(nft.commitment),
          certificate: nft.certificate,
          verified: Boolean(nft.verified),
        })),
      );
    } catch {
      // The indexer may briefly be unavailable; keep whatever we have.
    }
  }, []);

  const refreshBalance = useCallback(async () => {
    const api = connectedApiRef.current ?? wallet;
    if (!api) return;
    try {
      const unshielded = await api.getUnshieldedBalances();
      const dust = await api.getDustBalance();
      setBalance({ tNight: unshielded[unshieldedToken().raw] ?? 0n, dust: dust.balance });
    } catch {
      // ignore — balances are informational
    }
  }, [wallet]);

  const connect = useCallback(async () => {
    setStatus({ kind: 'connecting', title: 'Connecting to your Midnight wallet…' });
    try {
      const connectedApi = await connectWallet(NETWORK_ID);
      connectedApiRef.current = connectedApi;
      const config = await connectedApi.getConfiguration();
      setSdkNetworkId(config.networkId);
      const { unshieldedAddress } = await connectedApi.getUnshieldedAddress();

      const providers = await buildProviders(() => connectedApiRef.current!);
      const contractModule = await loadContractModule();
      const compiledContract = makeCompiledContract(contractModule, witnessValuesRef.current);

      const deployed = await findDeployedContract(providers as any, {
        compiledContract,
        contractAddress: CONTRACT_ADDRESS,
        privateStateId: PRIVATE_STATE_ID,
        initialPrivateState: {},
      });

      deployedRef.current = deployed;
      providersRef.current = providers;
      contractModuleRef.current = contractModule;
      setWallet(connectedApi);
      setAddress(unshieldedAddress);
      setConnectedNetworkId(config.networkId);
      setStatus(null);

      await refresh();
      await refreshBalance();
    } catch (error) {
      setStatus({ kind: 'error', title: 'Connection failed', detail: errorMessage(error) });
    }
  }, [refresh, refreshBalance]);

  const ensureActiveWallet = useCallback(async (): Promise<{
    api: ConnectedAPI;
    deployed: any;
  }> => {
    let api = connectedApiRef.current ?? wallet;
    if (!api) {
      api = await connectWallet(networkId);
      connectedApiRef.current = api;
      setWallet(api);
    } else {
      try {
        const status = await api.getConnectionStatus();
        if (status.status !== 'connected') {
          api = await connectWallet(networkId);
          connectedApiRef.current = api;
          setWallet(api);
        }
      } catch {
        api = await connectWallet(networkId);
        connectedApiRef.current = api;
        setWallet(api);
      }
    }

    if (!deployedRef.current || !providersRef.current) {
      const providers = await buildProviders(() => connectedApiRef.current!);
      const contractModule = await loadContractModule();
      const compiledContract = makeCompiledContract(contractModule, witnessValuesRef.current);
      const deployed = await findDeployedContract(providers as any, {
        compiledContract,
        contractAddress: CONTRACT_ADDRESS,
        privateStateId: PRIVATE_STATE_ID,
        initialPrivateState: {},
      });
      deployedRef.current = deployed;
      providersRef.current = providers;
      contractModuleRef.current = contractModule;
    }

    // Verify user has sufficient tNIGHT balance for gas/transaction fees
    try {
      const unshielded = await api.getUnshieldedBalances();
      const tNight = unshielded[unshieldedToken().raw] ?? 0n;
      if (tNight === 0n) {
        throw new Error(
          'Your connected wallet has 0 tNIGHT balance. Please fund your address from the Midnight Preview faucet before submitting transactions.',
        );
      }
    } catch (err: any) {
      if (err?.message?.includes('0 tNIGHT balance') || err?.message?.includes('Insufficient')) {
        throw err;
      }
      // non-fatal balance read check
    }

    return { api, deployed: deployedRef.current };
  }, [wallet, networkId]);

  const disconnect = useCallback(() => {
    connectedApiRef.current = null;
    deployedRef.current = null;
    providersRef.current = null;
    contractModuleRef.current = null;
    resetWitnesses();
    setWallet(null);
    setAddress('');
    setBalance(null);
    setProducts([]);
    setNfts([]);
    setStatus(null);
    setBusyAction(null);
  }, [resetWitnesses]);

  /**
   * Re-establish the wallet session and resume sync. Re-runs the same connect
   * flow (the connector re-resolves the session with the extension) and then
   * refreshes ledger state and balances. Never touches stored private state:
   * private state and signing keys live in the extension / browser storage and
   * are intentionally left intact.
   */
  const reauthenticate = useCallback(async () => {
    await connect();
  }, [connect]);

  /**
   * Run a marketplace action with proof-phase status reporting. The witness
   * values are restored to empty before and after, so a secret is only ever in
   * memory while its proof is being built.
   */
  const runAction = useCallback(
    async (actionName: string, provingTitle: string, fn: () => Promise<string>) => {
      if (busyAction) return;
      setBusyAction(actionName);
      setStatus({
        kind: 'proving',
        title: provingTitle,
        detail:
          'Generating a zero-knowledge proof — your secret stays on this device and is never revealed. This can take 30–60 seconds.',
      });
      try {
        const summary = await fn();
        setStatus({ kind: 'success', title: summary });
        await refresh();
        await refreshBalance();
      } catch (error) {
        setStatus({
          kind: 'error',
          title: `${provingTitle} failed`,
          detail: errorMessage(error),
        });
      } finally {
        resetWitnesses();
        setBusyAction(null);
      }
    },
    [busyAction, refresh, refreshBalance, resetWitnesses],
  );

  const listProduct = useCallback(
    (title: string, category: string, priceRaw: string) =>
      runAction('listProduct', 'Listing your product…', async () => {
        const { api, deployed } = await ensureActiveWallet();
        if (!title.trim() || !category.trim()) throw new Error('Title and category are required.');
        let price: bigint;
        try {
          price = BigInt(priceRaw.trim());
        } catch {
          throw new Error('Price must be a valid integer.');
        }
        if (price <= 0n) throw new Error('Price must be a positive integer (tNIGHT).');

        const { unshieldedAddress } = await api.getUnshieldedAddress();
        const seller = new Uint8Array(
          MidnightBech32m.parse(unshieldedAddress).decode(UnshieldedAddress, networkId).data,
        );

        const tx = await deployed.callTx.listProduct(
          title.trim(),
          category.trim(),
          price,
          seller,
        );
        return `Product #${tx.private.result} listed at ${price.toLocaleString()} tNIGHT.`;
      }),
    [runAction, ensureActiveWallet, networkId],
  );

  const mintNft = useCallback(
    (productIdRaw: string, certificate: string) =>
      runAction('mintNft', 'Minting authenticity NFT…', async () => {
        const { deployed } = await ensureActiveWallet();
        if (!productIdRaw.trim()) throw new Error('Product ID is required.');
        let productId: bigint;
        try {
          productId = BigInt(productIdRaw.trim());
        } catch {
          throw new Error('Product ID must be a valid integer.');
        }

        const matchingProduct = products.find((p) => p.id === productId);
        if (!matchingProduct) {
          throw new Error(
            `Product #${productId} was not found in the catalogue. Please list the product first in Step 1.`,
          );
        }
        if (matchingProduct.nftTokenId.is_some) {
          throw new Error(
            `Product #${productId} already has an authenticity NFT (#${matchingProduct.nftTokenId.value}).`,
          );
        }
        if (matchingProduct.status !== 0) {
          throw new Error(`Product #${productId} is no longer listed for sale.`);
        }

        const secret = randomSecret();
        witnessValuesRef.current.makerSecret = secret;

        const tx = await deployed.callTx.mintAuthenticityNft(productId, certificate.trim());
        const tokenId = tx.private.result;
        saveSecret(tokenId, secret);
        return `Authenticity NFT #${tokenId} minted for product #${productId}. The secret is stored only in this browser.`;
      }),
    [runAction, ensureActiveWallet, products],
  );

  const verifyNft = useCallback(
    (tokenIdRaw: string, secretHex?: string) =>
      runAction('verifyNft', 'Verifying authenticity…', async () => {
        const { deployed } = await ensureActiveWallet();
        const tokenId = BigInt(tokenIdRaw.trim());
        const secret =
          (secretHex && secretHex.trim() ? parseSecretHex(secretHex) : null) ??
          loadSecret(tokenId);
        if (!secret) {
          throw new Error(
            'No secret available for this NFT. Paste the 32-byte secret minted with it, or verify from the wallet that minted it.',
          );
        }
        witnessValuesRef.current.candidateSecret = secret;

        const tx = await deployed.callTx.verifyAuthenticity(tokenId);
        const verified = Boolean(tx.private.result);
        if (!verified) {
          throw new Error('The supplied secret does not match this NFT — nothing was revealed on-chain.');
        }
        return `✅ Genuine — the secret matches NFT #${tokenId}. Only the boolean result was disclosed on-chain.`;
      }),
    [runAction, ensureActiveWallet],
  );

  const purchase = useCallback(
    (product: ProductView, pastedSecret?: string) =>
      runAction('purchase', 'Buying this item…', async () => {
        const { deployed } = await ensureActiveWallet();
        if (product.status !== 0) throw new Error('This product is not for sale.');

        if (product.nftTokenId.is_some) {
          const tokenId = product.nftTokenId.value;
          let secret = loadSecret(tokenId);
          if (!secret && pastedSecret?.trim()) secret = parseSecretHex(pastedSecret);
          if (!secret) {
            throw new Error(
              'This item is backed by an authenticity NFT. Provide the artist secret to prove you are the legitimate owner.',
            );
          }
          witnessValuesRef.current.buyerSecret = secret;
        }

        await deployed.callTx.purchaseProduct(product.id, product.price);
        return `Purchased “${product.title}” for ${product.price.toLocaleString()} tNIGHT.`;
      }),
    [runAction, ensureActiveWallet],
  );

  const withdrawProduct = useCallback(
    (productIdRaw: string) =>
      runAction('withdraw', 'Withdrawing your listing…', async () => {
        const { deployed } = await ensureActiveWallet();
        const productId = BigInt(productIdRaw.trim());
        const tx = await deployed.callTx.withdrawProduct(productId);
        return `Listing #${productId} withdrawn (tx ${tx.public.txId.slice(0, 16)}…).`;
      }),
    [runAction, ensureActiveWallet],
  );

  return {
    connected: wallet !== null,
    wallet,
    address,
    networkId,
    balance,
    products,
    nfts,
    status,
    busyAction,
    connect,
    disconnect,
    reauthenticate,
    refresh,
    refreshBalance,
    listProduct,
    mintNft,
    verifyNft,
    purchase,
    withdrawProduct,
    hasSecret: (tokenId: bigint) => loadSecret(tokenId) !== null,
  };
}
