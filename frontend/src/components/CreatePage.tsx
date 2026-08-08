import { useState, type FormEvent } from 'react';
import { ImagePlus, RefreshCw, Sparkles } from 'lucide-react';

const CATEGORIES = [
  'Art',
  'Painting',
  'Drawing',
  'HomeUse',
  'WoodCraft',
  'Photography',
  'Home Decor',
  'Jewelry',
  'Fashion',
  'Collectibles',
];

interface CreatePageProps {
  busyAction: string | null;
  onList: (title: string, category: string, price: string) => void;
  onMint: (productId: string, certificate: string) => void;
  onWillMint?: () => void;
}

export function CreatePage({ busyAction, onList, onMint }: CreatePageProps) {
  const busy = busyAction !== null;

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [price, setPrice] = useState('');
  const [productId, setProductId] = useState('');
  const [certificate, setCertificate] = useState('');

  const submitList = (e: FormEvent) => {
    e.preventDefault();
    onList(title, category, price);
  };

  const submitMint = (e: FormEvent) => {
    e.preventDefault();
    onMint(productId, certificate);
  };

  return (
    <div className="p-6 pb-24 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-800 mb-6 text-center">Create Product</h1>

      <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
        <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
          <Sparkles size={20} className="text-purple-500" />
          1 · List a handmade product
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
          <div className="col-span-1">
            <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center min-h-[200px] flex flex-col justify-center items-center bg-gray-50">
              <ImagePlus className="mx-auto mb-3 text-gray-400" size={64} />
              <p className="text-gray-600 font-medium">Product listing</p>
              <p className="text-sm text-gray-400 mt-1">
                Midnight stores title, category, price and seller on-chain.
              </p>
            </div>
          </div>

          <div className="col-span-2">
            <form onSubmit={submitList} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Title *</label>
                  <input
                    type="text"
                    placeholder="Product title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    disabled={busy}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none text-gray-900 disabled:opacity-50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Price (tNIGHT) *
                  </label>
                  <input
                    type="number"
                    step="1"
                    min="1"
                    placeholder="100"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    disabled={busy}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none text-gray-900 disabled:opacity-50"
                  />
                </div>
              </div>

              <div className="w-full sm:w-1/2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Category *</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  disabled={busy}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none bg-white text-gray-900 disabled:opacity-50"
                >
                  <option value="">Select Category</option>
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-800">
                <p className="font-semibold mb-1">
                  📋 What happens when you click &quot;List Product&quot;:
                </p>
                <ol className="list-decimal list-inside space-y-0.5">
                  <li>Your wallet generates a zero-knowledge proof</li>
                  <li>The title, category, price and seller pseudonym are disclosed on-chain</li>
                  <li>The product appears in the public Marketplace catalogue</li>
                  <li>You can then mint an authenticity NFT for it (step 2)</li>
                </ol>
              </div>

              <button
                type="submit"
                disabled={busy}
                className="w-full text-white py-4 rounded-lg font-semibold text-lg hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center"
                style={{ background: 'linear-gradient(to right, rgb(147, 51, 234), rgb(236, 72, 153))' }}
              >
                {busyAction === 'listProduct' ? (
                  <>
                    <RefreshCw size={20} className="mr-2 animate-spin" />
                    Proving &amp; listing…
                  </>
                ) : (
                  'List Product'
                )}
              </button>
            </form>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
          <ImagePlus size={20} className="text-pink-500" />
          2 · Mint authenticity NFT
        </h2>
        <p className="text-sm text-gray-600 mb-4">
          Back a listed product with an NFT. A random 32-byte secret is generated in your browser;
          only its one-way SHA-256 image goes on-chain. The secret is saved locally so you can later
          prove authenticity.
        </p>
        <form onSubmit={submitMint} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Product ID *</label>
            <input
              type="number"
              min="0"
              step="1"
              placeholder="e.g. 1"
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
              disabled={busy}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none text-gray-900 disabled:opacity-50"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Certificate text (public)
            </label>
            <input
              type="text"
              placeholder="e.g. Hand-thrown ceramic mug"
              value={certificate}
              onChange={(e) => setCertificate(e.target.value)}
              disabled={busy}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none text-gray-900 disabled:opacity-50"
            />
          </div>
          <div className="flex items-end">
            <button
              type="submit"
              disabled={busy}
              className="w-full text-white py-3 rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center"
              style={{ background: 'linear-gradient(to right, rgb(236, 72, 153), rgb(251, 146, 60))' }}
            >
              {busyAction === 'mintNft' ? (
                <>
                  <RefreshCw size={18} className="mr-2 animate-spin" />
                  Minting…
                </>
              ) : (
                'Mint NFT'
              )}
            </button>
          </div>
        </form>

        {busyAction === 'mintNft' && (
          <div className="mt-4 rounded-lg border border-purple-200 bg-purple-50 p-3 text-sm text-purple-800 flex items-center gap-2">
            <RefreshCw size={16} className="animate-spin" />
            Generating a zero-knowledge proof — this can take 30–60 seconds.
          </div>
        )}
      </div>
    </div>
  );
}