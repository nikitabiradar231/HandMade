import { useMemo, useState } from 'react';
import { RefreshCw, ShoppingBag, X, ImagePlus } from 'lucide-react';

import type { ProductView } from '../midnight/useMarketplace';
import { PRODUCT_STATUS_LABELS } from '../midnight/useMarketplace';
import { sameSeller, sellerHexShort } from '../utils/seller';

const CATEGORIES = [
  'All',
  'Art',
  'Painting',
  'Drawing',
  'HomeUse',
  'WoodCraft',
  'Photography',
  'Home Decor',
  'Jewelry',
  'Fashion',
];

interface MarketplacePageProps {
  products: ProductView[];
  address: string;
  networkId: string;
  busyAction: string | null;
  onRefresh: () => void;
  onPurchase: (product: ProductView, pastedSecret?: string) => void;
}

function productKey(product: ProductView): string {
  return product.id.toString();
}

export function MarketplacePage({
  products,
  address,
  networkId,
  busyAction,
  onRefresh,
  onPurchase,
}: MarketplacePageProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selected, setSelected] = useState<ProductView | null>(null);
  const [pastedSecret, setPastedSecret] = useState('');
  const busy = busyAction !== null;

  const isOwn = (seller: Uint8Array) => {
    try {
      return sameSeller(seller, address, networkId);
    } catch {
      return false;
    }
  };

  const listed = useMemo(() => products.filter((p) => p.status === 0), [products]);

  const filtered = useMemo(
    () =>
      listed.filter((product) => {
        const matchSearch =
          !searchTerm ||
          product.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          product.category.toLowerCase().includes(searchTerm.toLowerCase());
        const matchCat = selectedCategory === 'All' || product.category === selectedCategory;
        return matchSearch && matchCat;
      }),
    [listed, searchTerm, selectedCategory],
  );

  return (
    <div className="p-6 pb-24 max-w-7xl mx-auto">
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Marketplace</h1>
        <button
          onClick={onRefresh}
          disabled={busy}
          className="p-2 bg-purple-100 rounded-lg hover:bg-purple-200 transition-colors disabled:opacity-50"
          title="Refresh marketplace"
        >
          <RefreshCw size={20} className={`text-purple-600 ${busy ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <input
        type="text"
        placeholder="Search products..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none text-gray-900 mb-4"
      />

      <div className="flex gap-2 mb-6 overflow-x-auto no-scrollbar pb-2">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors
              ${selectedCategory === cat
                ? 'bg-purple-600 text-white'
                : 'bg-purple-100 text-purple-700 hover:bg-purple-200'}`}
          >
            {cat}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <ShoppingBag className="mx-auto mb-4 text-gray-300" size={64} />
          <p>No products available in the marketplace</p>
          <p className="text-sm mt-2">Be the first to list your handmade item!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.map((product) => (
            <div
              key={productKey(product)}
              onClick={() => {
                setPastedSecret('');
                setSelected(product);
              }}
              className="bg-white rounded-xl shadow-md overflow-hidden cursor-pointer hover:shadow-xl transition-shadow flex flex-col"
            >
              <div className="w-full h-40 bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center">
                <div className="w-20 h-20 rounded-full bg-white shadow flex items-center justify-center">
                  <ShoppingBag className="text-purple-400" size={36} />
                </div>
              </div>
              <div className="p-4 flex flex-col flex-1">
                <p className="font-semibold text-gray-800 mb-1 truncate">{product.title}</p>
                <p className="text-xs text-gray-500 mb-2 truncate">
                  by {sellerHexShort(product.seller)}
                </p>
                <div className="mt-auto flex justify-between items-center">
                  <p className="text-purple-600 font-bold">
                    {product.price.toLocaleString()}
                    <span className="text-xs"> tNIGHT</span>
                  </p>
                  {!isOwn(product.seller) ? (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setPastedSecret('');
                        setSelected(product);
                      }}
                      className="text-white px-3 py-1 rounded-lg text-xs font-semibold"
                      style={{ background: 'linear-gradient(to right, rgb(147, 51, 234), rgb(236, 72, 153))' }}
                    >
                      Buy
                    </button>
                  ) : (
                    <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-full">
                      Yours
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {selected && (
        <div
          className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50"
          onClick={() => {
            setSelected(null);
            setPastedSecret('');
          }}
        >
          <div className="bg-white rounded-2xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xl font-bold text-gray-800">{selected.title}</h3>
              <button
                onClick={() => {
                  setSelected(null);
                  setPastedSecret('');
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>

            <div className="w-full h-48 bg-gradient-to-br from-purple-100 to-pink-100 rounded-xl mb-4 flex items-center justify-center">
              <div className="w-24 h-24 rounded-full bg-white shadow flex items-center justify-center">
                <ImagePlus className="text-purple-300" size={48} />
              </div>
            </div>

            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="bg-purple-100 text-purple-700 text-xs px-2 py-0.5 rounded-full font-medium">
                {selected.category}
              </span>
              <span className="bg-emerald-100 text-emerald-700 text-xs px-2 py-0.5 rounded-full font-medium">
                {PRODUCT_STATUS_LABELS[selected.status]}
              </span>
              {selected.nftTokenId.is_some && (
                <span className="bg-amber-100 text-amber-700 text-xs px-2 py-0.5 rounded-full font-medium">
                  NFT #{selected.nftTokenId.value.toString()}
                </span>
              )}
            </div>

            <p className="text-gray-500 text-sm mb-1">
              Seller: <span className="font-mono">{sellerHexShort(selected.seller)}</span>
            </p>
            <p className="text-xs text-gray-400 mb-3">Product ID: #{selected.id.toString()}</p>

            <p className="text-2xl font-bold text-purple-600 mb-4">
              {selected.price.toLocaleString()} tNIGHT
            </p>

            {!isOwn(selected.seller) ? (
              <div className="space-y-3">
                {selected.nftTokenId.is_some && (
                  <div>
                    <input
                      type="text"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 outline-none text-gray-900"
                      placeholder="Artist secret (hex) — required for NFT-backed items"
                      value={pastedSecret}
                      onChange={(e) => setPastedSecret(e.target.value)}
                    />
                    <p className="text-xs text-gray-400 mt-1">
                      Provide the 32-byte secret minted with this item, or buy through the wallet that
                      minted it. Your proof reveals only that you know the secret.
                    </p>
                  </div>
                )}
                <button
                  onClick={() => onPurchase(selected, pastedSecret.trim() || undefined)}
                  disabled={busy}
                  className="w-full text-white py-3 rounded-lg font-semibold disabled:opacity-50 disabled:transform-none hover:shadow-lg transform hover:scale-[1.01] transition-all flex items-center justify-center"
                  style={{ background: 'linear-gradient(to right, rgb(147, 51, 234), rgb(236, 72, 153))' }}
                >
                  {busy && busyAction === 'purchase' ? (
                    <>
                      <RefreshCw size={18} className="mr-2 animate-spin" />
                      Proving purchase…
                    </>
                  ) : (
                    <>Purchase product</>
                  )}
                </button>
              </div>
            ) : (
              <div className="text-center text-gray-500 bg-gray-50 rounded-lg py-3">
                This is your listing
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}