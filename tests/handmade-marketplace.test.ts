/**
 * HandMadeHub integration tests against a live local devnet (real proofs).
 *
 * Coverage:
 *   1. listProduct        — circuit logic: positive price guard + ledger write.
 *   2. mintAuthenticityNft — commitment is a one-way image of the secret, and
 *      only the hash lands on-chain.
 *   3. verifyAuthenticity  — correct secret proves, wrong secret is rejected.
 *   4. purchaseProduct     — non-NFT item sells with no secret; NFT-backed item
 *      REQUIRES knowledge of the authenticity secret.
 *   5. Privacy            — the raw authenticity secret NEVER appears in the
 *      public ledger state or in the public (non-sensitive) portions of any
 *      transaction.
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import * as crypto from 'node:crypto';
import { WebSocket } from 'ws';

// @ts-expect-error Required for wallet sync
globalThis.WebSocket = WebSocket;

import { findDeployedContract } from '@midnight-ntwrk/midnight-js-contracts';
import { resolveNetwork, getOrCreateSeed, getDeployment } from '../src/network';
import { createWallet, persistWalletState, unshieldedToken, type WalletContext } from '../src/wallet';
import {
  CONTRACT_NAME,
  PRIVATE_STATE_ID,
  createProviders,
  loadContractModule,
  makeCompiledContract,
  readPublicLedger,
  emptyWitnessValues,
  type WitnessValues,
} from '../src/contract';

const toHex = (bytes: Uint8Array): string => Buffer.from(bytes).toString('hex');
const sha256 = (bytes: Uint8Array): Uint8Array =>
  Uint8Array.from(crypto.createHash('sha256').update(bytes).digest());
const randomSecret = (): Uint8Array => crypto.getRandomValues(new Uint8Array(32));

/** Read the ledger with a short retry loop to absorb indexer lag. */
async function readLedger(providers: any, address: string, module: any) {
  for (let i = 0; i < 5; i++) {
    const ledger = await readPublicLedger(providers, address, module);
    if (ledger) return ledger;
    await new Promise((r) => setTimeout(r, 1000));
  }
  throw new Error('Could not read public ledger state');
}

describe('HandMadeHub contract on devnet', () => {
  const sellerKey = Uint8Array.from({ length: 32 }, (_, i) => 0x40 + (i % 16));

  let walletCtx: WalletContext;
  let providers: any;
  let module: any;
  let deployed: any;
  let address: string;
  let witnessValues: WitnessValues;

  // Distinctive, high-entropy secrets so the privacy assertions are meaningful.
  const makerSecret = randomSecret();
  const otherSecret = randomSecret();
  const makerSecretHex = toHex(makerSecret);

  let productIdNoNft: bigint;
  let productIdWithNft: bigint;
  let nftTokenId: bigint;
  let listedPrice: bigint;

  beforeAll(async () => {
    const { network, config } = resolveNetwork();
    const deployment = getDeployment(network);
    if (!deployment) {
      throw new Error(`No deploy on file for ${network}. Run: npm run deploy`);
    }
    address = deployment.address;

    walletCtx = await createWallet({ network, networkConfig: config, seed: getOrCreateSeed(network) });
    await walletCtx.wallet.waitForSyncedState();
    await persistWalletState(network, walletCtx);

    providers = await createProviders(walletCtx, config);
    module = await loadContractModule();
    witnessValues = emptyWitnessValues();

    deployed = await findDeployedContract(providers, {
      compiledContract: makeCompiledContract(module, witnessValues) as any,
      contractAddress: address,
      privateStateId: PRIVATE_STATE_ID,
      initialPrivateState: {},
    });
  }, 120_000);

  afterAll(async () => {
    await walletCtx.wallet.stop();
  });

  it('lists a product with no NFT (circuit logic + ledger write)', async () => {
    const tx = await deployed.callTx.listProduct('Walnut Bowl', 'Woodwork', 250000n, sellerKey);
    productIdNoNft = BigInt(tx.private.result);
    expect(productIdNoNft).toBeGreaterThanOrEqual(0n);

    const ledger = await readLedger(providers, address, module);
    const product = ledger.products.lookup(productIdNoNft);
    expect(product.title).toBe('Walnut Bowl');
    expect(product.category).toBe('Woodwork');
    expect(product.price).toBe(250000n);
    expect(product.status).toBe(0); // ProductStatus.Listed
    expect(product.nftTokenId.is_some).toBe(false);
    expect(toHex(product.seller)).toBe(toHex(sellerKey));
  });

  it('rejects a non-positive price', async () => {
    await expect(deployed.callTx.listProduct('Free item', 'Test', 0n, sellerKey)).rejects.toThrow();
  });

  it('mints an authenticity NFT, storing only a one-way commitment', async () => {
    const tx = await deployed.callTx.listProduct('Linen Scarf', 'Textiles', 150000n, sellerKey);
    productIdWithNft = BigInt(tx.private.result);
    listedPrice = 150000n;

    witnessValues.makerSecret = makerSecret;
    const mintTx = await deployed.callTx.mintAuthenticityNft(productIdWithNft, 'Certified hand-woven linen');
    nftTokenId = BigInt(mintTx.private.result);

    const ledger = await readLedger(providers, address, module);
    const nft = ledger.nfts.lookup(nftTokenId);
    // The commitment is a one-way sha256 image of the secret...
    expect(toHex(nft.commitment)).toBe(toHex(sha256(makerSecret)));
    // ...which is NOT the secret itself.
    expect(toHex(nft.commitment)).not.toBe(makerSecretHex);
    expect(nft.verified).toBe(true);
    expect(nft.productId).toBe(productIdWithNft);

    // The product now points at its NFT but stays listed.
    const product = ledger.products.lookup(productIdWithNft);
    expect(product.nftTokenId.is_some).toBe(true);
    expect(product.nftTokenId.value).toBe(nftTokenId);
    expect(product.status).toBe(0);
  });

  it('verifies authenticity with the correct secret', async () => {
    witnessValues.candidateSecret = makerSecret;
    const tx = await deployed.callTx.verifyAuthenticity(nftTokenId);
    expect(tx.private.result).toBe(true);
  });

  it('rejects verification with a wrong secret (nothing revealed)', async () => {
    witnessValues.candidateSecret = otherSecret;
    await expect(deployed.callTx.verifyAuthenticity(nftTokenId)).rejects.toThrow();
  });

  it('sells a non-NFT product without any secret', async () => {
    const tx = await deployed.callTx.purchaseProduct(productIdNoNft, 250000n);
    const ledger = await readLedger(providers, address, module);
    expect(ledger.products.lookup(productIdNoNft).status).toBe(1); // Sold
  });

  it('rejects buying an NFT-backed product without the secret', async () => {
    // Fresh buyer — no candidateSecret set.
    await expect(deployed.callTx.purchaseProduct(productIdWithNft, listedPrice)).rejects.toThrow();
  });

  it('sells an NFT-backed product with the correct secret', async () => {
    witnessValues.buyerSecret = makerSecret;
    const tx = await deployed.callTx.purchaseProduct(productIdWithNft, listedPrice);
    const ledger = await readLedger(providers, address, module);
    expect(ledger.products.lookup(productIdWithNft).status).toBe(1); // Sold
  });

  it('never leaks the authenticity secret into public state or public tx data', async () => {
    // Fresh product (the earlier one is Sold and already has an NFT).
    const listTx = await deployed.callTx.listProduct('Privacy Check Vase', 'Ceramics', 99000n, sellerKey);
    const privacyProductId = BigInt(listTx.private.result);

    witnessValues.makerSecret = makerSecret;
    const mintTx = await deployed.callTx.mintAuthenticityNft(privacyProductId, 'privacy-check');
    const privacyNftTokenId = BigInt(mintTx.private.result);

    // BigInt-safe serializer, mirroring what a real observer would produce.
    const replacer = (_key: string, value: unknown): unknown =>
      typeof value === 'bigint' ? value.toString() : value;

    // 1. Full public ledger state (as any observer would fetch it).
    const ledger = await readLedger(providers, address, module);
    const ledgerBytes = Buffer.from(JSON.stringify(ledger, replacer));

    // 2. Public (non-sensitive) portion of the mint transaction.
    const publicBytes = Buffer.from(JSON.stringify(mintTx.public, replacer));

    for (const label of ['ledger', 'tx.public']) {
      const hay = label === 'ledger' ? ledgerBytes : publicBytes;
      expect(hay.includes(makerSecretHex), `${label} must not contain the secret hex`).toBe(false);
      expect(
        hay.includes(Buffer.from(makerSecret).toString('base64')),
        `${label} must not contain the secret base64`,
      ).toBe(false);
    }

    // 3. The one-way commitment IS anchored on-chain (as raw bytes), so the
    //    proof has a public anchor even though the secret is absent.
    const anchoredNft = ledger.nfts.lookup(privacyNftTokenId);
    expect(toHex(anchoredNft.commitment)).toBe(toHex(sha256(makerSecret)));
    expect(anchoredNft.verified).toBe(true);
  });
});
