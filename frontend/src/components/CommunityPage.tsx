import { useMemo, useState } from 'react';
import { RefreshCw, User, Users } from 'lucide-react';
import { toHex } from '@midnight-ntwrk/midnight-js-utils';

import type { NftView, ProductView } from '../midnight/useMarketplace';

interface ArtistSummary {
  key: string;
  hex: string;
  listings: number;
  sold: number;
  nftsMinted: number;
}

interface CommunityPageProps {
  products: ProductView[];
  nfts: NftView[];
  onRefresh: () => void;
}

function buildArtists(products: ProductView[], nfts: NftView[]): ArtistSummary[] {
  const artists = new Map<string, ArtistSummary>();

  const add = (bytes: Uint8Array) => {
    const hex = toHex(bytes);
    if (!artists.has(hex)) {
      artists.set(hex, { key: hex, hex, listings: 0, sold: 0, nftsMinted: 0 });
    }
    return artists.get(hex);
  };

  for (const product of products) {
    const artist = add(product.seller)!;
    if (product.status === 0) artist.listings += 1;
    if (product.status === 1) artist.sold += 1;
  }

  for (const nft of nfts) {
    const artist = add(nft.artist)!;
    artist.nftsMinted += 1;
  }

  return [...artists.values()].sort((a, b) => b.listings + b.sold + b.nftsMinted - (a.listings + a.sold + a.nftsMinted));
}

function shortHex(hex: string): string {
  return `${hex.slice(0, 12)}…${hex.slice(-6)}`;
}

export function CommunityPage({ products, nfts, onRefresh }: CommunityPageProps) {
  const [search, setSearch] = useState('');

  const artists = useMemo(() => buildArtists(products, nfts), [products, nfts]);

  const filtered = useMemo(
    () =>
      artists.filter(
        (a) => !search || a.hex.toLowerCase().includes(search.toLowerCase()),
      ),
    [artists, search],
  );

  return (
    <div className="p-6 pb-24 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Artists</h1>
        <button
          onClick={onRefresh}
          className="p-2 bg-purple-100 rounded-lg hover:bg-purple-200 transition-colors"
          title="Refresh artists"
        >
          <RefreshCw size={20} className="text-purple-600" />
        </button>
      </div>

      <div className="flex flex-col md:flex-row items-center gap-2 mb-6">
        <input
          type="text"
          placeholder="Search artists by pseudonym..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full md:w-1/3 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-200 outline-none text-gray-900"
        />
        <p className="text-sm text-gray-400">
          Artists are derived from the sellers &amp; NFT artists already on-chain.
        </p>
      </div>

      {artists.length === 0 ? (
        <div className="text-center text-gray-500 mt-16">
          <Users className="mx-auto mb-4 text-gray-300" size={64} />
          <p className="font-medium">No artists are on-chain yet</p>
          <p className="text-sm mt-1">Be the first — list a product in the Marketplace!</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center text-gray-500 mt-16">
          <Users className="mx-auto mb-4 text-gray-300" size={64} />
          <p className="font-medium">No artists match your search</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {filtered.map((artist) => (
            <div key={artist.key} className="bg-white rounded-xl shadow-md p-5 hover:shadow-lg transition-shadow">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center shrink-0">
                  <User className="text-purple-600" size={24} />
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-gray-800 truncate">Artist</p>
                  <p className="text-xs text-gray-400 font-mono truncate">{shortHex(artist.hex)}</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-purple-50 rounded-lg py-2">
                  <p className="text-lg font-bold text-purple-700">{artist.listings}</p>
                  <p className="text-[11px] text-gray-500">Listings</p>
                </div>
                <div className="bg-blue-50 rounded-lg py-2">
                  <p className="text-lg font-bold text-blue-700">{artist.sold}</p>
                  <p className="text-[11px] text-gray-500">Sold</p>
                </div>
                <div className="bg-pink-50 rounded-lg py-2">
                  <p className="text-lg font-bold text-pink-600">{artist.nftsMinted}</p>
                  <p className="text-[11px] text-gray-500">NFTs</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}