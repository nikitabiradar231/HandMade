/**
 * Local store for NFT authenticity secrets.
 *
 * When an artist mints an authenticity NFT they generate a random 32-byte
 * secret. Only `sha256(secret)` is committed on-chain — the secret itself is
 * kept in this browser's localStorage, keyed by token id, so the same wallet
 * can later prove authenticity or purchase an NFT-backed item. The secret is
 * NEVER uploaded anywhere.
 */
import { fromHex, toHex } from '@midnight-ntwrk/midnight-js-utils';

const KEY_PREFIX = 'handmadehub:nft-secret:';

export function randomSecret(): Uint8Array {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return bytes;
}

export function saveSecret(tokenId: bigint, secret: Uint8Array): void {
  try {
    localStorage.setItem(`${KEY_PREFIX}${tokenId.toString()}`, toHex(secret));
  } catch {
    // localStorage may be unavailable (private mode) — the transaction still
    // succeeds on-chain, the user just cannot re-verify later from this device.
  }
}

export function loadSecret(tokenId: bigint): Uint8Array | null {
  const hex = localStorage.getItem(`${KEY_PREFIX}${tokenId.toString()}`);
  if (!hex) return null;
  try {
    const secret = fromHex(hex);
    return secret.length === 32 ? secret : null;
  } catch {
    return null;
  }
}

export function deleteSecret(tokenId: bigint): void {
  localStorage.removeItem(`${KEY_PREFIX}${tokenId.toString()}`);
}

/** Parse a hex secret pasted by the user (must be exactly 32 bytes). */
export function parseSecretHex(hex: string): Uint8Array {
  const trimmed = hex.trim().replace(/^0x/i, '');
  const secret = fromHex(trimmed);
  if (secret.length !== 32) {
    throw new Error('The authenticity secret must be exactly 32 bytes (64 hex characters).');
  }
  return secret;
}
