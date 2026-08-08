import { ImagePlus, Loader2, Wallet } from 'lucide-react';

interface LoginPageProps {
  networkId: string;
  busy: boolean;
  onConnect: () => void;
}

export function LoginPage({ networkId, busy, onConnect }: LoginPageProps) {
  return (
    <div
      className="w-screen min-h-screen flex flex-col justify-center items-center p-8"
      style={{ background: 'linear-gradient(to bottom right, rgb(147, 51, 234), rgb(236, 72, 153), rgb(251, 146, 60))' }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
        <div className="text-center mb-8">
          <div
            className="w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center"
            style={{ background: 'linear-gradient(to bottom right, rgb(147, 51, 234), rgb(236, 72, 153))' }}
          >
            <ImagePlus className="text-white" size={40} />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">HandMadeHub</h1>
          <p className="text-gray-600">Where craft meets zero-knowledge proofs</p>
        </div>

        <div className="mb-6">
          <button
            onClick={onConnect}
            disabled={busy}
            className="w-full text-white py-3 rounded-lg font-semibold hover:shadow-lg transform hover:scale-105 transition-all flex items-center justify-center disabled:opacity-50 disabled:transform-none"
            style={{ background: 'linear-gradient(to right, rgb(79, 70, 229), rgb(147, 51, 234))' }}
          >
            {busy ? (
              <>
                <Loader2 size={20} className="mr-2 animate-spin" />
                Connecting…
              </>
            ) : (
              <>
                <Wallet size={20} className="mr-2" />
                Connect 1AM Wallet to Continue
              </>
            )}
          </button>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
          <p className="font-semibold mb-2">📌 Requirements:</p>
          <ol className="list-decimal list-inside space-y-1 text-xs">
            <li>Install the Midnight browser extension (1AM Wallet)</li>
            <li>Connect it to the <code>{networkId}</code> network</li>
            <li>Ensure the wallet has some tNIGHT for transactions</li>
            <li>Connect your wallet above</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
