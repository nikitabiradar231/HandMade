import { MidnightBech32m, UnshieldedAddress } from '@midnight-ntwrk/wallet-sdk-address-format';
import { toHex } from '@midnight-ntwrk/midnight-js-utils';

/**
 * Convert a bech32m unshielded address (as returned by the wallet) into the
 * seller pseudonym bytes that the contract stores in `Product.seller`. Must
 * match the derivation used in `useMarketplace.listProduct`.
 */
export function addressToSellerBytes(address: string, networkId: string): Uint8Array {
  return new Uint8Array(
    MidnightBech32m.parse(address).decode(UnshieldedAddress, networkId).data,
  );
}

export function sameSeller(seller: Uint8Array, address: string, networkId: string): boolean {
  const mine = addressToSellerBytes(address, networkId);
  if (mine.length !== seller.length) return false;
  return mine.every((byte, i) => byte === seller[i]);
}

export function sellerHexShort(seller: Uint8Array): string {
  const hex = toHex(seller);
  return `0x${hex.slice(0, 16)}…`;
}
