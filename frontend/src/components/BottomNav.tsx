import { Home, ImagePlus, ShoppingBag, User, Users } from 'lucide-react';

export type PageId = 'dashboard' | 'marketplace' | 'create' | 'community' | 'profile';

const ITEMS: { id: PageId; icon: typeof Home; label: string }[] = [
  { id: 'dashboard', icon: Home, label: 'Home' },
  { id: 'marketplace', icon: ShoppingBag, label: 'Market' },
  { id: 'create', icon: ImagePlus, label: 'Create' },
  { id: 'community', icon: Users, label: 'Community' },
  { id: 'profile', icon: User, label: 'Profile' },
];

interface BottomNavProps {
  currentPage: PageId;
  setCurrentPage: (page: PageId) => void;
  visible?: boolean;
}

export function BottomNav({ currentPage, setCurrentPage, visible = true }: BottomNavProps) {
  if (!visible) return null;
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-2.5 flex justify-around items-center z-40 pb-[max(0.625rem,env(safe-area-inset-bottom))]">
      {ITEMS.map(({ id, icon: Icon, label }) => {
        const active = currentPage === id;
        return (
          <button
            key={id}
            onClick={() => setCurrentPage(id)}
            className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-colors ${
              active ? 'text-purple-600' : 'text-gray-400 hover:text-gray-600'
            }`}
            aria-label={label}
            aria-current={active ? 'page' : undefined}
          >
            <Icon size={24} />
            <span className="text-[11px] mt-0.5">{label}</span>
          </button>
        );
      })}
    </nav>
  );
}
