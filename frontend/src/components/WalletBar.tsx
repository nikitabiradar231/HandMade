import type { ConnectedAPI } from '@midnight-ntwrk/dapp-connector-api';

interface WalletBarProps {
  connected: boolean;
  wallet: ConnectedAPI | null;
  address: string;
  networkId: string;
  balance: { tNight: bigint; dust: bigint } | null;
  busy: boolean;
  onConnect: () => void;
  onDisconnect: () => void;
  onReauth: () => void;
}

function shortAddress(address: string): string {
  if (address.length <= 20) return address;
  return `${address.slice(0, 12)}…${address.slice(-8)}`;
}

export function WalletBar({
  connected,
  address,
  networkId,
  balance,
  busy,
  onConnect,
  onDisconnect,
  onReauth,
}: WalletBarProps) {
  if (!connected) {
    return (
      <div className="flex items-center gap-3">
        <button
          onClick={onConnect}
          disabled={busy}
          className="text-white font-semibold rounded-lg px-4 py-2 text-sm flex items-center gap-2 disabled:opacity-50 transition-all hover:shadow-lg"
          style={{ background: 'linear-gradient(to right, rgb(79, 70, 229), rgb(147, 51, 234))' }}
        >
          {busy ? 'Connecting…' : 'Connect 1AM Wallet'}
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2.5 bg-purple-50 border border-purple-200 rounded-full px-4 py-2">
        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]" aria-hidden="true" />
        <div className="leading-tight">
          <p className="text-xs font-semibold text-gray-800" title={address}>
            {shortAddress(address)}
          </p>
          <p className="text-[10px] text-gray-500">
            <code>{networkId}</code>
            {balance !== null && (
              <>
                {' · '}
                <strong>{balance.tNight.toLocaleString()}</strong> tNIGHT ·{' '}
                <strong>{balance.dust.toLocaleString()}</strong> DUST
              </>
            )}
          </p>
        </div>
      </div>
      <button
        onClick={onReauth}
        disabled={busy}
        className="text-sm font-medium text-purple-600 border border-purple-200 rounded-lg px-3 py-2 hover:bg-purple-50 transition-colors disabled:opacity-50"
        title="Re-establish the wallet session and resume syncing"
      >
        Re-authenticate
      </button>
      <button
        onClick={onDisconnect}
        className="text-sm font-medium text-gray-500 border border-gray-200 rounded-lg px-3 py-2 hover:bg-gray-100 hover:text-gray-700 transition-colors"
      >
        Disconnect
      </button>
    </div>
  );
}
