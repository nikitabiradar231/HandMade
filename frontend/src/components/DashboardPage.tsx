import { useMemo, useState } from 'react';
import { toHex } from '@midnight-ntwrk/midnight-js-utils';
import {
  CheckCircle2,
  ImagePlus,
  RefreshCw,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
} from 'lucide-react';

import type { NftView, ProductView } from '../midnight/useMarketplace';
import { PRODUCT_STATUS_LABELS } from '../midnight/useMarketplace';
import { loadSecret } from '../midnight/secrets';
import { sellerHexShort, sameSeller } from '../utils/seller';
import { getProductImage, getNftImage } from '../utils/productImage';

interface DashboardPageProps {
  products: ProductView[];
  nfts: NftView[];
  address: string;
  networkId: string;
  balance: { tNight: bigint; dust: bigint } | null;
  busyAction: string | null;
  onRefresh?: () => void;
  onWithdraw: (productId: string) => void;
  onVerify: (tokenIdRaw: string, secretHex?: string) => void;
  onNavigate: (page: 'create') => void;
}

export function DashboardPage({
  products,
  nfts,
  address,
  networkId,
  balance,
  busyAction,
  onRefresh,
  onWithdraw,
  onVerify,
  onNavigate,
}: DashboardPageProps) {
  const busy = busyAction !== null;
  const [verifySecrets, setVerifySecrets] = useState<Record<string, string>>({});

  const myListings = useMemo(
    () => products.filter((p) => p.status === 0 && sameSeller(p.seller, address, networkId)),
    [products, address, networkId],
  );

  const myNfts = useMemo(
    () => nfts.filter((n) => sameSeller(n.artist, address, networkId)),
    [nfts, address, networkId],
  );

  return (
    <div className="p-6 pb-24 max-w-7xl mx-auto">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Welcome back!</h1>
          <p className="text-gray-600">Your HandMadeHub dashboard on Midnight</p>
        </div>
        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={busy}
            className="p-2 bg-purple-100 rounded-lg hover:bg-purple-200 transition-colors disabled:opacity-50 flex items-center gap-1.5 text-xs font-semibold text-purple-700"
            title="Refresh dashboard state from Midnight ledger"
          >
            <RefreshCw size={16} className={busy ? 'animate-spin' : ''} />
            Refresh
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="rounded-2xl p-4 bg-purple-50 border border-purple-100">
          <p className="text-sm text-gray-600 mb-1">My Listings</p>
          <p className="text-3xl font-bold text-purple-700">{myListings.length}</p>
        </div>
        <div className="rounded-2xl p-4 bg-blue-50 border border-blue-100">
          <p className="text-sm text-gray-600 mb-1">NFTs Minted</p>
          <p className="text-3xl font-bold text-blue-700">{myNfts.length}</p>
        </div>
        <div className="rounded-2xl p-4 bg-rose-50 border border-rose-100">
          <p className="text-sm text-gray-600 mb-1">tNIGHT</p>
          <p className="text-2xl font-bold text-rose-600">
            {balance ? balance.tNight.toLocaleString() : '—'}
          </p>
        </div>
        <div className="rounded-2xl p-4 bg-amber-50 border border-amber-100">
          <p className="text-sm text-gray-600 mb-1">DUST</p>
          <p className="text-2xl font-bold text-amber-600">
            {balance ? balance.dust.toLocaleString() : '—'}
          </p>
        </div>
      </div>

      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Your Listings</h2>
        {myListings.length === 0 ? (
          <div className="text-center py-10 bg-white rounded-xl shadow-sm text-gray-500">
            <ShoppingBag className="mx-auto mb-4 text-gray-300" size={64} />
            <p>No active listings yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {myListings.map((p) => {
              const imgUrl = getProductImage(p.id) || (p.nftTokenId.is_some ? getNftImage(p.nftTokenId.value) : null);
              return (
                <div key={p.id.toString()} className="bg-white rounded-xl shadow-md p-5 flex flex-col justify-between">
                  <div>
                    {imgUrl && (
                      <div className="w-full h-36 mb-3 rounded-lg overflow-hidden bg-gray-100">
                        <img src={imgUrl} alt={p.title} className="w-full h-full object-cover" />
                      </div>
                    )}
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-gray-800">{p.title}</h3>
                      <span className="bg-emerald-100 text-emerald-700 text-xs px-2 py-0.5 rounded-full font-medium">
                        {PRODUCT_STATUS_LABELS[p.status]}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mb-1">
                      #{p.id.toString()} · {p.category}
                    </p>
                    <p className="text-purple-600 font-bold mb-3">{p.price.toLocaleString()} tNIGHT</p>
                    {p.nftTokenId.is_some && (
                      <span
                        className={`inline-block text-xs px-2 py-0.5 rounded-full mb-3 ${
                          p.pending
                            ? 'bg-purple-100 text-purple-700 font-medium animate-pulse'
                            : 'bg-amber-100 text-amber-700 font-medium'
                        }`}
                      >
                        {p.pending ? 'Minting NFT (Pending confirmation)' : `NFT#${p.nftTokenId.value.toString()} backed`}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => onWithdraw(p.id.toString())}
                    disabled={busy}
                    className="w-full text-sm font-medium text-gray-600 border border-gray-200 rounded-lg py-2 hover:bg-gray-100 transition-colors disabled:opacity-50 mt-2"
                  >
                    {busyAction === 'withdraw' ? 'Withdrawing…' : 'Withdraw listing'}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Your Authenticity NFTs</h2>
        {myNfts.length === 0 ? (
          <div className="text-center py-10 bg-white rounded-xl shadow-sm text-gray-500">
            <ImagePlus className="mx-auto mb-4 text-gray-300" size={64} />
            <p>No authenticity NFTs yet. Mint one from the Create tab.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {myNfts.map((nft) => {
              const stored = loadSecret(nft.tokenId);
              const key = nft.tokenId.toString();
              const nftImg = getNftImage(nft.tokenId) || getProductImage(nft.productId);
              return (
                <div key={key} className="bg-white rounded-xl shadow-md p-5 flex flex-col justify-between">
                  <div>
                    {nftImg && (
                      <div className="w-full h-36 mb-3 rounded-lg overflow-hidden bg-gray-100">
                        <img src={nftImg} alt={`NFT #${key}`} className="w-full h-full object-cover" />
                      </div>
                    )}
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-gray-800">NFT #{nft.tokenId.toString()}</h3>
                      {nft.verified ? (
                        <span className="bg-emerald-100 text-emerald-700 text-xs px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                          <CheckCircle2 size={12} /> verified
                        </span>
                      ) : (
                        <span className="bg-gray-100 text-gray-500 text-xs px-2 py-0.5 rounded-full font-medium">
                          unverified
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mb-1">for product #{nft.productId.toString()}</p>
                    <p className="text-xs text-gray-400 font-mono mb-2">
                      commitment {sellerHexShort(nft.commitment)}
                    </p>
                    <p className="text-sm text-gray-700 italic mb-3">“{nft.certificate}”</p>
                  </div>
                  <div className="space-y-2 mt-2">
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                      placeholder={stored ? 'Secret stored in this browser' : 'Secret (hex)'}
                      value={verifySecrets[key] ?? (stored ? toHex(stored) : '')}
                      onChange={(e) => setVerifySecrets((s) => ({ ...s, [key]: e.target.value }))}
                      readOnly={!!stored && !verifySecrets[key]}
                    />
                    <button
                      onClick={() =>
                        onVerify(key, verifySecrets[key]?.trim() || undefined)
                      }
                      disabled={busy}
                      className="w-full flex items-center justify-center gap-2 text-sm font-semibold text-purple-700 bg-purple-100 hover:bg-purple-200 rounded-lg py-2 transition-colors disabled:opacity-50"
                    >
                      <ShieldCheck size={16} />
                      {busyAction === 'verifyNft' ? 'Verifying…' : 'Verify authenticity'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div
        className="rounded-2xl p-6 text-gray-800 shadow-sm"
        style={{ background: 'linear-gradient(to right, rgb(254, 240, 138), rgb(253, 164, 175))' }}
      >
        <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
          <Sparkles size={20} className="text-rose-500" />
          Start Creating!
        </h3>
        <p className="text-sm text-gray-700 mb-4">
          List your handmade goods and back them with NFT authenticity proofs.
        </p>
        <button
          onClick={() => onNavigate('create')}
          className="bg-white text-rose-600 px-4 py-2 rounded-lg font-semibold text-sm hover:shadow-md transition-all"
        >
          Create Product
        </button>
      </div>
    </div>
  );
}
