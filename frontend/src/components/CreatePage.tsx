import { useState, useRef, type FormEvent, type DragEvent, type ChangeEvent } from 'react';
import { ImagePlus, RefreshCw, Sparkles, UploadCloud, Trash2, CheckCircle2 } from 'lucide-react';
import { saveDraftImage, getDraftImage, clearDraftImage } from '../utils/productImage';

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

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED_MIME_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif'];

interface CreatePageProps {
  busyAction: string | null;
  onMintNft: (title: string, category: string, price: string, certificate: string) => void;
}

export function CreatePage({ busyAction, onMintNft }: CreatePageProps) {
  const busy = busyAction !== null;

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [price, setPrice] = useState('');
  const [certificate, setCertificate] = useState('');

  const [selectedImage, setSelectedImage] = useState<string | null>(() => getDraftImage());
  const [imageError, setImageError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const processFile = (file: File) => {
    setImageError(null);

    // Validate file type
    const isImageMime = ALLOWED_MIME_TYPES.includes(file.type.toLowerCase()) || file.type.startsWith('image/');
    if (!isImageMime) {
      setImageError('Invalid file type. Only PNG, JPG, JPEG, WEBP, and GIF images are supported.');
      return;
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE_BYTES) {
      const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
      setImageError(`File is too large (${sizeMb} MB). Maximum allowed image size is 5 MB.`);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (result) {
        setSelectedImage(result);
        saveDraftImage(result);
      }
    };
    reader.onerror = () => {
      setImageError('Failed to load image file. Please try selecting another file.');
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  };

  const removeImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedImage(null);
    clearDraftImage();
    setImageError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (selectedImage) {
      saveDraftImage(selectedImage);
    }
    onMintNft(title, category, price, certificate);
  };

  return (
    <div className="p-6 pb-24 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-800 mb-2 text-center">Mint Authenticity NFT</h1>
      <p className="text-gray-600 text-center mb-6">
        List your handmade creation on Midnight with an NFT-backed proof of authenticity
      </p>

      <div className="bg-white rounded-2xl shadow-lg p-6 max-w-4xl mx-auto">
        <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
          <Sparkles size={22} className="text-purple-500" />
          Product Details &amp; NFT Authenticity
        </h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
            <div className="md:col-span-5">
              <label className="block text-sm font-medium text-gray-700 mb-2">Product Image</label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/webp,image/gif"
                onChange={handleFileChange}
                className="hidden"
              />
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`relative border-2 border-dashed rounded-xl p-4 text-center min-h-[240px] flex flex-col justify-center items-center cursor-pointer transition-all duration-200 group overflow-hidden ${
                  isDragging
                    ? 'border-purple-500 bg-purple-50 scale-[1.01]'
                    : selectedImage
                    ? 'border-purple-300 bg-gray-900'
                    : 'border-gray-300 bg-gray-50 hover:border-purple-400 hover:bg-purple-50/50'
                }`}
              >
                {selectedImage ? (
                  <div className="relative w-full h-full min-h-[220px] flex flex-col items-center justify-center">
                    <img
                      src={selectedImage}
                      alt="Product preview"
                      className="w-full h-52 object-cover rounded-lg shadow-inner"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-3 p-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          fileInputRef.current?.click();
                        }}
                        className="px-3 py-1.5 bg-white text-purple-700 rounded-lg text-xs font-semibold shadow hover:bg-purple-50 transition-colors flex items-center gap-1"
                      >
                        <UploadCloud size={14} /> Change Image
                      </button>
                      <button
                        type="button"
                        onClick={removeImage}
                        className="px-3 py-1.5 bg-rose-600 text-white rounded-lg text-xs font-semibold shadow hover:bg-rose-700 transition-colors flex items-center gap-1"
                      >
                        <Trash2 size={14} /> Remove
                      </button>
                    </div>
                    <div className="mt-2 text-xs text-white bg-black/60 px-2.5 py-1 rounded-full flex items-center gap-1">
                      <CheckCircle2 size={12} className="text-emerald-400" /> Image attached to NFT
                    </div>
                  </div>
                ) : (
                  <>
                    <UploadCloud className="mx-auto mb-3 text-purple-500 group-hover:scale-110 transition-transform" size={56} />
                    <p className="text-gray-700 font-semibold">Click or drag image to upload</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Supports PNG, JPG, WEBP, GIF (max 5 MB)
                    </p>
                    <p className="text-xs text-purple-600 font-medium mt-2">
                      Selected image is stored with your NFT authenticity record.
                    </p>
                  </>
                )}
              </div>
              {imageError && (
                <div className="mt-2 p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 font-medium flex items-center gap-1.5">
                  <span>⚠️</span> {imageError}
                </div>
              )}
            </div>

            <div className="md:col-span-7 space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Title *</label>
                <input
                  type="text"
                  placeholder="e.g. Handcrafted Ceramic Mug"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  disabled={busy}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none text-gray-900 disabled:opacity-50"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
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

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Certificate text / Authenticity description (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Authentic hand-thrown ceramic mug with 100% lead-free glaze"
                  value={certificate}
                  onChange={(e) => setCertificate(e.target.value)}
                  disabled={busy}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none text-gray-900 disabled:opacity-50"
                />
              </div>

              <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 text-xs text-purple-800">
                <p className="font-semibold mb-1 flex items-center gap-1">
                  <ImagePlus size={14} className="text-purple-600" />
                  What happens when you click &quot;Mint NFT&quot;:
                </p>
                <ol className="list-decimal list-inside space-y-0.5">
                  <li>Your connected Midnight wallet prompts for transaction approval</li>
                  <li>A zero-knowledge proof is generated locally on your device</li>
                  <li>An authenticity NFT is minted and listed on the Midnight blockchain</li>
                </ol>
              </div>

              <button
                type="submit"
                disabled={busy}
                className="w-full text-white py-4 rounded-xl font-bold text-lg hover:shadow-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                style={{ background: 'linear-gradient(to right, rgb(147, 51, 234), rgb(236, 72, 153))' }}
              >
                {busyAction === 'mintNft' || busyAction === 'listProduct' ? (
                  <>
                    <RefreshCw size={20} className="animate-spin" />
                    Minting Authenticity NFT…
                  </>
                ) : (
                  <>
                    <Sparkles size={20} />
                    Mint NFT
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}