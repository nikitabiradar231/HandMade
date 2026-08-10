import { useState } from 'react';

import { useMarketplace } from './midnight/useMarketplace';
import { WalletBar } from './components/WalletBar';
import { StatusBanner } from './components/StatusBanner';
import { ToastProvider } from './components/Toast';
import { LoginPage } from './components/LoginPage';
import { BottomNav, type PageId } from './components/BottomNav';
import { DashboardPage } from './components/DashboardPage';
import { MarketplacePage } from './components/MarketplacePage';
import { CreatePage } from './components/CreatePage';
import { CommunityPage } from './components/CommunityPage';
import { ProfilePage } from './components/ProfilePage';

export default function App() {
  const {
    connected,
    wallet,
    address,
    networkId,
    balance,
    products,
    nfts,
    status,
    busyAction,
    connect,
    disconnect,
    reauthenticate,
    refresh,
    listAndMintNft,
    verifyNft,
    purchase,
    withdrawProduct,
    hasSecret,
  } = useMarketplace();

  const [currentPage, setCurrentPage] = useState<PageId>('dashboard');

  return (
    <ToastProvider>
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
          <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-3">
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center text-white font-bold"
                style={{ background: 'linear-gradient(to bottom right, rgb(147, 51, 234), rgb(236, 72, 153))' }}
              >
                HM
              </div>
              <div className="leading-tight">
                <p className="font-bold text-gray-800">HandMadeHub</p>
                <p className="text-xs text-gray-500">Artist marketplace on Midnight</p>
              </div>
            </div>
            <WalletBar
              connected={connected}
              wallet={wallet}
              address={address}
              networkId={networkId}
              balance={balance}
              busy={busyAction !== null}
              onConnect={connect}
              onDisconnect={disconnect}
              onReauth={reauthenticate}
            />
          </div>
        </header>

        <div className="max-w-7xl mx-auto w-full">
          <StatusBanner status={status} />
        </div>

        {!connected ? (
          <main className="flex-1">
            <LoginPage networkId={networkId} busy={busyAction !== null} onConnect={connect} />
          </main>
        ) : (
          <main className="flex-1">
            {currentPage === 'dashboard' && (
              <DashboardPage
                products={products}
                nfts={nfts}
                address={address}
                networkId={networkId}
                balance={balance}
                busyAction={busyAction}
                onRefresh={refresh}
                onWithdraw={withdrawProduct}
                onVerify={verifyNft}
                onNavigate={(page) => setCurrentPage(page)}
              />
            )}
            {currentPage === 'marketplace' && (
              <MarketplacePage
                products={products}
                address={address}
                networkId={networkId}
                busyAction={busyAction}
                onRefresh={refresh}
                onPurchase={purchase}
              />
            )}
            {currentPage === 'create' && (
              <CreatePage busyAction={busyAction} onMintNft={listAndMintNft} />
            )}
            {currentPage === 'community' && (
              <CommunityPage products={products} nfts={nfts} onRefresh={refresh} />
            )}
            {currentPage === 'profile' && (
              <ProfilePage
                address={address}
                networkId={networkId}
                balance={balance}
                products={products}
                nfts={nfts}
                busyAction={busyAction}
                hasSecret={hasSecret}
                onVerify={verifyNft}
                onDisconnect={disconnect}
              />
            )}
          </main>
        )}

        <BottomNav
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          visible={!!connected}
        />

        <footer className="text-center text-xs text-gray-400 py-4 px-4">
          HandMadeHub runs entirely on the Midnight blockchain — art meets zero-knowledge proofs.
        </footer>
      </div>
    </ToastProvider>
  );
}