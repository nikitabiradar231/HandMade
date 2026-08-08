/**
 * CLI for interacting with the HandMadeHub contract.
 *
 * Privacy notes:
 *   - Public data (catalogue, NFTs, commitments) is read straight from the
 *     chain. Private witnesses (makerSecret / candidateSecret / buyerSecret)
 *     are held in memory only while a transaction is being proved, then
 *     dropped.
 *   - The authenticity secret for a minted NFT is stored locally under
 *     `secrets/` so the artist can verify/purchase later. It is NEVER
 *     written to the chain and NEVER committed to git (see .gitignore).
 */
import { createInterface } from 'node:readline/promises';
import { stdin, stdout } from 'node:process';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as crypto from 'node:crypto';
import { WebSocket } from 'ws';

import { findDeployedContract } from '@midnight-ntwrk/midnight-js-contracts';
import { resolveNetwork, getOrCreateSeed, getDeployment } from './network';
import { createWallet, persistWalletState, unshieldedToken, type WalletContext } from './wallet';
import {
  CONTRACT_NAME,
  PRIVATE_STATE_ID,
  createProviders,
  loadContractModule,
  makeCompiledContract,
  readPublicLedger,
  type WitnessValues,
} from './contract';

// @ts-expect-error Required for wallet sync
globalThis.WebSocket = WebSocket;

const { network, config: networkConfig } = resolveNetwork();
const SEED = getOrCreateSeed(network);

const SECRETS_DIR = path.resolve(process.cwd(), 'secrets');

function secretFile(tokenId: bigint | number | string): string {
  return path.join(SECRETS_DIR, `nft-${tokenId.toString()}.json`);
}

function saveSecret(tokenId: bigint | number | string, secret: Uint8Array): void {
  fs.mkdirSync(SECRETS_DIR, { recursive: true });
  fs.writeFileSync(secretFile(tokenId), JSON.stringify({ secret: Buffer.from(secret).toString('hex') }, null, 2) + '\n', {
    mode: 0o600,
  });
  console.log(`  🔒 Authenticity secret saved locally to secrets/nft-${tokenId.toString()}.json (never commit this file)`);
}

function loadSecret(tokenId: bigint | number | string): Uint8Array {
  const file = secretFile(tokenId);
  if (!fs.existsSync(file)) {
    console.error(`  ❌ No saved secret for NFT #${tokenId.toString()}. Run: node --input-type=module -e "..." or mint again.`);
    process.exit(1);
  }
  return Uint8Array.from(Buffer.from(JSON.parse(fs.readFileSync(file, 'utf-8')).secret, 'hex'));
}

function randomSecret(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(32));
}

function toHex(bytes: Uint8Array): string {
  return Buffer.from(bytes).toString('hex');
}

async function main() {
  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log('║                   HandMadeHub CLI                           ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');

  const rl = createInterface({ input: stdin, output: stdout });

  const deployment = getDeployment(network);
  if (!deployment) {
    console.error(`No deploy on file for network ${network}. Run \`npm run setup -- --network ${network}\` first.`);
    process.exit(1);
  }
  console.log(`  Contract: ${deployment.address}`);
  console.log(`  Network: ${network}\n`);

  try {
    const walletCtx = await createWallet({ network, networkConfig, seed: SEED });
    const restoredCount = Object.values(walletCtx.restored).filter(Boolean).length;
    if (restoredCount > 0) {
      console.log(`  Restored ${restoredCount}/3 child wallets from .midnight-wallet-state — sync will resume from saved point.`);
    }

    console.log('  Syncing with network...');
    const syncStart = Date.now();
    const syncInterval = setInterval(() => {
      const elapsed = Math.round((Date.now() - syncStart) / 1000);
      process.stdout.write(`\r  ⏳ Still syncing... (${elapsed}s elapsed)   `);
    }, 5000);
    const state = await walletCtx.wallet.waitForSyncedState();
    clearInterval(syncInterval);
    process.stdout.write('\r  ✓ Synced with network.                                      \n');

    await persistWalletState(network, walletCtx);
    const balance = state.unshielded.balances[unshieldedToken().raw] ?? 0n;
    console.log(`  Balance: ${balance.toLocaleString()} tNight\n`);

    if (balance === 0n && network !== 'undeployed' && networkConfig.faucet) {
      const address = walletCtx.unshieldedKeystore.getBech32Address();
      console.log('  ⚠ Wallet has no tNight. Fund it from the faucet to send transactions:');
      console.log(`     ${networkConfig.faucet}`);
      console.log(`     Wallet address: ${address}\n`);
    }

    console.log('  Connecting to contract...');
    const providers = await createProviders(walletCtx, networkConfig);
    const contractModule = await loadContractModule();

    // Runtime witness values — in-memory only, dropped after each transaction.
    const witnessValues: WitnessValues = {
      makerSecret: new Uint8Array(32),
      candidateSecret: new Uint8Array(32),
      buyerSecret: new Uint8Array(32),
    };

    const deployed: any = await findDeployedContract(providers, {
      compiledContract: makeCompiledContract(contractModule, witnessValues) as any,
      contractAddress: deployment.address,
      privateStateId: PRIVATE_STATE_ID,
      initialPrivateState: {},
    });

    console.log('  ✅ Connected!\n');

    let running = true;
    while (running) {
      console.log('─── Menu ───────────────────────────────────────────────────────');
      console.log('  1. List a product');
      console.log('  2. Mint authenticity NFT');
      console.log('  3. Verify authenticity');
      console.log('  4. Purchase a product');
      console.log('  5. Withdraw a listing');
      console.log('  6. Show public catalogue + NFTs');
      console.log('  7. Check wallet balance');
      console.log('  8. Exit\n');

      const choice = await rl.question('  Your choice: ');

      switch (choice.trim()) {
        case '1': {
          const title = await rl.question('  Title: ');
          const category = await rl.question('  Category: ');
          const priceRaw = await rl.question('  Price (tNIGHT): ');
          const price = BigInt(priceRaw);
          console.log('\n  Submitting transaction (proof generation can take 30-60s)...');
          const publicKey = walletCtx.unshieldedKeystore.getPublicKey();
          const publicKeyBytes = Uint8Array.from(Buffer.from(publicKey, 'hex'));
          const tx = await deployed.callTx.listProduct(
            title,
            category,
            price,
            publicKeyBytes,
          );
          console.log(`\n  ✅ Product listed! id=${tx.private.result ?? 'n/a'}`);
          console.log(`  Transaction ID: ${tx.public.txId}`);
          console.log(`  Block height: ${tx.public.blockHeight}\n`);
          break;
        }

        case '2': {
          const productId = BigInt(await rl.question('  Product id: '));
          const certificate = await rl.question('  Certificate text (public): ');
          const secret = randomSecret();
          witnessValues.makerSecret = secret;
          console.log('\n  Proving without revealing your input... (30-60s)');
          const tx = await deployed.callTx.mintAuthenticityNft(productId, certificate);
          const tokenId = tx.private.result;
          saveSecret(tokenId, secret);
          witnessValues.makerSecret = new Uint8Array(32);
          console.log(`\n  ✅ Authenticity NFT minted! tokenId=${tokenId}`);
          console.log(`  Transaction ID: ${tx.public.txId}`);
          console.log(`  Block height: ${tx.public.blockHeight}\n`);
          break;
        }

        case '3': {
          const tokenId = BigInt(await rl.question('  NFT token id: '));
          const secret = loadSecret(tokenId);
          witnessValues.candidateSecret = secret;
          console.log('\n  Proving without revealing your input... (30-60s)');
          try {
            const tx = await deployed.callTx.verifyAuthenticity(tokenId);
            witnessValues.candidateSecret = new Uint8Array(32);
            console.log(`\n  ✅ Authenticity verified: ${tx.private.result}`);
            console.log(`  Transaction ID: ${tx.public.txId}\n`);
          } catch (error) {
            witnessValues.candidateSecret = new Uint8Array(32);
            console.error('\n  ❌ Verification failed:', error instanceof Error ? error.message : error);
            console.log('     (Your secret did not match this NFT — nothing was revealed on-chain.)\n');
          }
          break;
        }

        case '4': {
          const productId = BigInt(await rl.question('  Product id: '));
          const ledgerState = await readPublicLedger(providers, deployment.address, contractModule);
          if (!ledgerState) {
            console.error('  ❌ Could not read contract state\n');
            break;
          }
          const product = ledgerState.products.lookup(productId);
          const price = product.price;
          if (product.nftTokenId.is_some) {
            const secret = loadSecret(product.nftTokenId.value);
            witnessValues.buyerSecret = secret;
            console.log('\n  Proving authenticity without revealing your input... (30-60s)');
          } else {
            console.log('\n  Submitting transaction... (30-60s)');
          }
          try {
            const tx = await deployed.callTx.purchaseProduct(productId, price);
            witnessValues.buyerSecret = new Uint8Array(32);
            console.log(`\n  ✅ Purchased "${product.title}" for ${price.toLocaleString()} tNIGHT`);
            console.log(`  Transaction ID: ${tx.public.txId}`);
            console.log(`  Block height: ${tx.public.blockHeight}\n`);
          } catch (error) {
            witnessValues.buyerSecret = new Uint8Array(32);
            console.error('\n  ❌ Purchase failed:', error instanceof Error ? error.message : error);
            console.log('     (For NFT-backed items the authenticity secret must match.)\n');
          }
          break;
        }

        case '5': {
          const productId = BigInt(await rl.question('  Product id: '));
          console.log('\n  Submitting transaction... (30-60s)');
          try {
            const tx = await deployed.callTx.withdrawProduct(productId);
            console.log(`\n  ✅ Listing withdrawn. Transaction ID: ${tx.public.txId}\n`);
          } catch (error) {
            console.error('\n  ❌ Withdraw failed:', error instanceof Error ? error.message : error);
          }
          break;
        }

        case '6': {
          console.log('\n  Reading on-chain state...');
          try {
            const ledgerState = await readPublicLedger(providers, deployment.address, contractModule);
            if (!ledgerState) {
              console.log('  📋 No contract state found\n');
              break;
            }
            console.log(`\n  Products (${ledgerState.products.size()}):`);
            for (const [id, p] of ledgerState.products) {
              const status = ['Listed', 'Sold', 'Withdrawn'][Number(p.status)];
              const nft = p.nftTokenId.is_some ? ` NFT#${p.nftTokenId.value}` : '';
              console.log(`    #${id} ${p.title} [${p.category}] ${p.price} tNIGHT — ${status}${nft}`);
            }
            console.log(`\n  Authenticity NFTs (${ledgerState.nfts.size()}):`);
            for (const [tokenId, nft] of ledgerState.nfts) {
              console.log(`    #${tokenId} for product#${nft.productId} — commitment ${toHex(nft.commitment).slice(0, 16)}… verified=${nft.verified}`);
            }
            console.log('');
          } catch (error) {
            console.error('\n  ❌ Failed:', error instanceof Error ? error.message : error);
          }
          break;
        }

        case '7': {
          const currentState = await walletCtx.wallet.waitForSyncedState();
          const currentBalance = currentState.unshielded.balances[unshieldedToken().raw] ?? 0n;
          const dustBalance = currentState.dust.balance(new Date());
          console.log(`\n  tNight: ${currentBalance.toLocaleString()}`);
          console.log(`  DUST: ${dustBalance.toLocaleString()}\n`);
          break;
        }

        case '8':
          running = false;
          console.log('\n  👋 Goodbye!\n');
          break;

        default:
          console.log('\n  ❌ Invalid choice. Please enter 1-8.\n');
      }
    }

    await persistWalletState(network, walletCtx);
    await walletCtx.wallet.stop();
  } catch (error) {
    console.error('\n❌ Error:', error instanceof Error ? error.message : error);
  } finally {
    rl.close();
  }
}

main().catch(console.error);
