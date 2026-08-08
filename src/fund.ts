/**
 * Fund a tNIGHT address on the active network.
 *
 * The CLI wallet runs on the genesis seed, which the local devnet pre-funds, so
 * it can air-drop tNIGHT to any unshielded address (e.g. a browser-wallet
 * address) — there is no faucet service on the local devnet.
 *
 * Usage:
 *   npm run fund -- <bech32m-address> [amount-tNIGHT]
 */
import { WebSocket } from 'ws';

// Enable WebSocket for GraphQL subscriptions.
// @ts-expect-error Required for wallet sync
globalThis.WebSocket = WebSocket;

import * as Rx from 'rxjs';
import { MidnightBech32m, UnshieldedAddress } from '@midnight-ntwrk/wallet-sdk-address-format';
import { resolveNetwork, getOrCreateSeed } from './network';
import { createWallet, persistWalletState, unshieldedToken } from './wallet';

async function main(): Promise<void> {
  const target = process.argv[2];
  const amount = BigInt(process.argv[3] ?? '1000000');
  if (!target) {
    throw new Error('Usage: npm run fund -- <bech32m-address> [amount-tNIGHT]');
  }

  const { network, config } = resolveNetwork();
  const seed = getOrCreateSeed(network);
  const receiverAddress = MidnightBech32m.parse(target).decode(UnshieldedAddress, network);

  console.log(`\n  Network: ${network}`);
  console.log(`  Recipient: ${target}`);
  console.log(`  Amount: ${amount.toLocaleString()} tNIGHT\n`);
  console.log('  Building wallet (genesis seed)...');

  const ctx = await createWallet({ network, networkConfig: config, seed });
  console.log('  Syncing with network...');
  await ctx.wallet.waitForSyncedState();

  const sourceBalance =
    (await Rx.firstValueFrom(ctx.wallet.state())).unshielded.balances[unshieldedToken().raw] ?? 0n;
  console.log(`  Sender balance: ${sourceBalance.toLocaleString()} tNIGHT`);

  const recipe = await ctx.wallet.transferTransaction(
    [{ type: 'unshielded', outputs: [{ type: unshieldedToken().raw, receiverAddress, amount }] }],
    { shieldedSecretKeys: ctx.shieldedSecretKeys, dustSecretKey: ctx.dustSecretKey },
    { ttl: new Date(Date.now() + 120_000) },
  );

  console.log('  Finalizing and submitting transaction (proof generation can take 30-60s)...');
  const finalized = await ctx.wallet.finalizeRecipe(recipe);
  const txId = await ctx.wallet.submitTransaction(finalized);

  console.log(`\n  ✅ Sent ${amount.toLocaleString()} tNIGHT to ${target}`);
  console.log(`  Transaction ID: ${txId}\n`);

  await persistWalletState(network, ctx);
  await ctx.wallet.stop();
}

main().catch((error) => {
  console.error('\n❌ Error:', error instanceof Error ? error.message : error);
  process.exit(1);
});
