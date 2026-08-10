/**
 * Image storage helper for HandMadeHub.
 * Persists product and NFT image previews locally in browser storage.
 */

const STORAGE_PREFIX = 'hmh_img_product_';
const NFT_PREFIX = 'hmh_img_nft_';
const DRAFT_KEY = 'hmh_img_draft';

export function saveProductImage(productId: string | bigint | number, dataUrl: string): void {
  try {
    localStorage.setItem(`${STORAGE_PREFIX}${productId.toString()}`, dataUrl);
  } catch (err) {
    console.warn('Could not save product image to localStorage:', err);
  }
}

export function getProductImage(productId: string | bigint | number): string | null {
  try {
    return localStorage.getItem(`${STORAGE_PREFIX}${productId.toString()}`) || localStorage.getItem(DRAFT_KEY);
  } catch {
    return null;
  }
}

export function saveNftImage(tokenId: string | bigint | number, dataUrl: string): void {
  try {
    localStorage.setItem(`${NFT_PREFIX}${tokenId.toString()}`, dataUrl);
  } catch (err) {
    console.warn('Could not save NFT image to localStorage:', err);
  }
}

export function getNftImage(tokenId: string | bigint | number): string | null {
  try {
    return localStorage.getItem(`${NFT_PREFIX}${tokenId.toString()}`);
  } catch {
    return null;
  }
}

export function saveDraftImage(dataUrl: string): void {
  try {
    localStorage.setItem(DRAFT_KEY, dataUrl);
  } catch (err) {
    console.warn('Could not save draft image:', err);
  }
}

export function getDraftImage(): string | null {
  try {
    return localStorage.getItem(DRAFT_KEY);
  } catch {
    return null;
  }
}

export function clearDraftImage(): void {
  try {
    localStorage.removeItem(DRAFT_KEY);
  } catch {
    // ignore
  }
}
