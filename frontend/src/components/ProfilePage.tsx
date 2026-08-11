import { useEffect, useMemo, useState } from 'react';
import { Database, LogOut, RefreshCw, ShieldCheck, User } from 'lucide-react';
import { toHex } from '@midnight-ntwrk/midnight-js-utils';

import type { NftView, ProductView } from '../midnight/useMarketplace';
import { loadSecret } from '../midnight/secrets';
import { sameSeller } from '../utils/seller';
import { getNftImage, getProductImage } from '../utils/productImage';

interface ProfilePageProps {
  address: string;
  networkId: string;
  balance: { tNight: bigint; dust: bigint } | null;
  products: ProductView[];
  nfts: NftView[];
  busyAction: string | null;
  hasSecret: (tokenId: bigint) => boolean;
  onRefresh?: () => void;
  onVerify: (tokenIdRaw: string, secretHex?: string) => void;
  onDisconnect: () => void;
}

function shortAddress(address: string): string {
  if (address.length <= 20) return address;
  return `${address.slice(0, 12)}…${address.slice(-8)}`;
}

interface NftCardProps {
  nft: NftView;
  matchedProduct?: ProductView;
  busy: boolean;
  busyAction: string | null;
  hasSecret: (tokenId: bigint) => boolean;
  onVerify: (tokenIdRaw: string, secretHex?: string) => void;
}

function NftCard({ nft, matchedProduct, busy, busyAction, hasSecret, onVerify }: NftCardProps) {
  const storedSecret = hasSecret(nft.tokenId) ? toHex(loadSecret(nft.tokenId)!) : '';
  const [secretValue, setSecretValue] = useState(storedSecret);
  const nftImage = getNftImage(nft.tokenId, nft.productId) || getProductImage(nft.productId);

  const title = matchedProduct?.title || nft.certificate || `NFT #${nft.tokenId.toString()}`;
  const price = matchedProduct?.price;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
      <div>
        {nftImage ? (
          <div className="w-full h-44 mb-3 rounded-lg overflow-hidden bg-gray-100 relative">
            <img src={nftImage} alt={title} className="w-full h-full object-cover" />
            <span className="absolute top-2 right-2 bg-purple-600/90 text-white text-xs font-semibold px-2.5 py-0.5 rounded-full backdrop-blur-sm shadow-sm">
              Creator
            </span>
          </div>
        ) : (
          <div className="w-full h-36 mb-3 rounded-lg bg-gradient-to-br from-purple-100 to-pink-100 flex flex-col items-center justify-center relative">
            <ShieldCheck className="text-purple-400 mb-1" size={28} />
            <span className="text-xs text-purple-700 font-medium">NFT #{nft.tokenId.toString()}</span>
            <span className="absolute top-2 right-2 bg-purple-600/90 text-white text-xs font-semibold px-2.5 py-0.5 rounded-full backdrop-blur-sm shadow-sm">
              Creator
            </span>
          </div>
        )}
        <div className="flex items-start justify-between gap-2 mb-1">
          <h4 className="font-bold text-gray-800 text-base line-clamp-1">{title}</h4>
          <span
            className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 flex items-center gap-1 ${
              nft.pending
                ? 'bg-purple-100 text-purple-700 font-medium animate-pulse'
                : nft.verified
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-amber-100 text-amber-700'
            }`}
          >
            <ShieldCheck size={12} />
            {nft.pending ? 'Pending' : nft.verified ? 'Verified' : 'Unverified'}
          </span>
        </div>
        <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
          <span className="font-mono font-medium text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-100">
            Token #{nft.tokenId.toString()}
          </span>
          {price !== undefined && (
            <span className="font-bold text-gray-800 text-sm">
              {price.toLocaleString()} tNIGHT
            </span>
          )}
        </div>
        <p className="text-xs text-gray-500 mb-2">Linked Product #{nft.productId.toString()}</p>
        {nft.certificate && (
          <p className="text-xs text-gray-600 italic mb-3 line-clamp-2" title={nft.certificate}>
            “{nft.certificate}”
          </p>
        )}
      </div>
      <div className="space-y-2 mt-2 pt-2 border-t border-gray-100">
        <input
          type="text"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs font-mono focus:ring-2 focus:ring-purple-500 outline-none text-gray-900"
          placeholder={storedSecret ? 'Secret stored in this browser' : 'Secret (hex)'}
          value={secretValue}
          onChange={(e) => setSecretValue(e.target.value)}
        />
        <button
          onClick={() => onVerify(nft.tokenId.toString(), secretValue.trim() || undefined)}
          disabled={busy}
          className="w-full flex items-center justify-center gap-2 text-xs font-semibold text-purple-700 bg-purple-100 hover:bg-purple-200 rounded-lg py-2 transition-colors disabled:opacity-50"
        >
          {busyAction === 'verifyNft' ? 'Verifying…' : 'Verify Authenticity'}
        </button>
      </div>
    </div>
  );
}

export function ProfilePage({
  address,
  networkId,
  balance,
  products,
  nfts,
  busyAction,
  hasSecret,
  onRefresh,
  onVerify,
  onDisconnect,
}: ProfilePageProps) {
  const busy = busyAction !== null;

  useEffect(() => {
    onRefresh?.();
  }, [onRefresh]);

  const { myListings, mySold, myNfts } = useMemo(() => {
    let myListings = 0;
    let mySold = 0;
    for (const p of products) {
      if (!sameSeller(p.seller, address, networkId)) continue;
      if (p.status === 0) myListings += 1;
      if (p.status === 1) mySold += 1;
    }
    // Include NFTs matching artist address, containing local browser secret, or linked to user product
    const filteredNfts = nfts.filter((n) => {
      if (hasSecret(n.tokenId)) return true;
      if (sameSeller(n.artist, address, networkId)) return true;
      const matchedProduct = products.find((p) => p.id === n.productId);
      if (matchedProduct && sameSeller(matchedProduct.seller, address, networkId)) return true;
      return false;
    });

    // Deduplicate by token ID to ensure duplicate cards are never displayed
    const nftMap = new Map<string, NftView>();
    for (const n of filteredNfts) {
      nftMap.set(n.tokenId.toString(), n);
    }
    const myNfts = Array.from(nftMap.values());

    console.log('[Profile] NFT query: Wallet address =', address, 'Network =', networkId);
    console.log('[Profile] NFTs found:', myNfts.length, myNfts);

    return { myListings, mySold, myNfts };
  }, [products, nfts, address, networkId, hasSecret]);

  const verifiedCount = useMemo(() => myNfts.filter((n) => n.verified).length, [myNfts]);

  return (
    <div className="p-6 pb-24 max-w-7xl mx-auto">
      <div
        className="rounded-2xl p-6 mb-6 text-gray-800 shadow-sm"
        style={{ background: 'linear-gradient(to bottom right, #ede9fe, #fce7f3)' }}
      >
        <div className="flex items-center mb-4">
          <div className="w-20 h-20 rounded-full border-4 border-white mr-4 bg-white flex items-center justify-center shadow-sm">
            <User className="text-purple-600" size={40} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Artist</h2>
            <p className="text-sm text-gray-600">HandMadeHub member</p>
            <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-medium">
              Connected · {networkId}
            </span>
          </div>
        </div>

        <div className="bg-white/60 rounded-lg p-3 border border-white/40">
          <p className="text-xs text-gray-700 mb-1">Wallet Address</p>
          <p className="font-mono text-sm text-gray-800 break-all" title={address}>
            {shortAddress(address)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="rounded-2xl p-4 bg-purple-50 border border-purple-100">
          <p className="text-sm text-gray-600 mb-1">Active Listings</p>
          <p className="text-3xl font-bold text-purple-700">{myListings}</p>
        </div>
        <div className="rounded-2xl p-4 bg-blue-50 border border-blue-100">
          <p className="text-sm text-gray-600 mb-1">Products Sold</p>
          <p className="text-3xl font-bold text-blue-700">{mySold}</p>
        </div>
        <div className="rounded-2xl p-4 bg-rose-50 border border-rose-100">
          <p className="text-sm text-gray-600 mb-1">NFTs Minted</p>
          <p className="text-3xl font-bold text-rose-600">{myNfts.length}</p>
        </div>
        <div className="rounded-2xl p-4 bg-amber-50 border border-amber-100">
          <p className="text-sm text-gray-600 mb-1">tNIGHT Balance</p>
          <p className="text-2xl font-bold text-amber-600">
            {balance ? balance.tNight.toLocaleString() : '—'}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-md p-6 mb-6">
        <h3 className="text-lg font-bold text-gray-800 mb-4">Wallet Details</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-xs text-gray-500 mb-1">Network</p>
            <p className="font-medium text-gray-800">{networkId}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">tNIGHT (unshielded)</p>
            <p className="font-medium text-gray-800">
              {balance ? balance.tNight.toLocaleString() : '—'}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">DUST (shielded)</p>
            <p className="font-medium text-gray-800">
              {balance ? balance.dust.toLocaleString() : '—'}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Verified NFTs</p>
            <p className="font-medium text-gray-800">
              {verifiedCount} / {myNfts.length}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-md p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xl font-bold text-gray-800">Your Collection</h3>
            <p className="text-xs text-gray-500">NFTs minted &amp; owned on Midnight blockchain</p>
          </div>
          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={busy}
              className="p-2 bg-purple-100 rounded-lg hover:bg-purple-200 transition-colors disabled:opacity-50 flex items-center gap-1.5 text-xs font-semibold text-purple-700"
              title="Refresh collection from Midnight ledger"
            >
              <RefreshCw size={14} className={busy ? 'animate-spin' : ''} />
              Refresh
            </button>
          )}
        </div>
        {myNfts.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p className="text-sm">
              No NFTs in your collection yet. List a product on the Create tab, then mint an NFT
              to attach a blockchain-backed authenticity proof.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {myNfts.map((nft) => {
              const matchedProduct = products.find((p) => p.id === nft.productId);
              return (
                <NftCard
                  key={nft.tokenId.toString()}
                  nft={nft}
                  matchedProduct={matchedProduct}
                  busy={busy}
                  busyAction={busyAction}
                  hasSecret={hasSecret}
                  onVerify={onVerify}
                />
              );
            })}
          </div>
        )}
      </div>

      <div className="space-y-3">
        <div className="w-full bg-white rounded-xl shadow-md p-4 flex items-center gap-2">
          <Database size={18} className="text-blue-500 shrink-0" />
          <span className="font-medium text-gray-800 text-sm">
            On-chain data is read in real time from the Midnight public indexer.
          </span>
        </div>

        <button
          onClick={onDisconnect}
          className="w-full bg-red-50 rounded-xl shadow-md p-4 flex items-center justify-center text-red-600 font-medium hover:bg-red-100 transition-colors"
        >
          <LogOut size={20} className="mr-2" />
          Disconnect Wallet
        </button>
      </div>
    </div>
  );
}