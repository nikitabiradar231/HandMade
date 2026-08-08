import { AlertCircle, CheckCircle, Loader2, XCircle } from 'lucide-react';
import type { Status } from '../midnight/useMarketplace';

export function StatusBanner({ status }: { status: Status | null }) {
  if (!status) return null;

  const isProving = status.kind === 'proving' || status.kind === 'connecting';

  const containerClass =
    status.kind === 'success'
      ? 'border-green-200 bg-green-50 text-green-800'
      : status.kind === 'error'
        ? 'border-red-200 bg-red-50 text-red-800'
        : 'border-blue-200 bg-blue-50 text-blue-800';

  const icon = isProving ? (
    <Loader2 size={20} className="animate-spin text-blue-500" />
  ) : status.kind === 'success' ? (
    <CheckCircle size={20} className="text-green-600" />
  ) : status.kind === 'error' ? (
    <XCircle size={20} className="text-red-500" />
  ) : (
    <AlertCircle size={20} />
  );

  return (
    <div
      className={`max-w-7xl mx-auto mt-4 px-5 py-4 rounded-xl border flex gap-3 items-start ${containerClass}`}
      role="status"
      aria-live="polite"
    >
      <div className="mt-0.5 shrink-0">{icon}</div>
      <div className="min-w-0">
        <p className="font-semibold text-sm">{status.title}</p>
        {status.detail && <p className="mt-0.5 text-xs opacity-80 break-words">{status.detail}</p>}
        {status.kind === 'proving' && (
          <p className="mt-1 text-xs text-amber-600">
            Proving transaction… please keep this tab open (can take 30–60s).
          </p>
        )}
      </div>
    </div>
  );
}
