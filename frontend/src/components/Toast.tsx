import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import { AlertCircle, CheckCircle, RefreshCw, X, XCircle } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'pending' | 'warning';

interface ToastItem {
  id: number;
  type: ToastType;
  title: string;
  message?: string;
}

interface ToastContextValue {
  notify: (type: ToastType, title: string, message?: string) => void;
}

const ToastContext = createContext<ToastContextValue>({ notify: () => {} });

export function useToast(): ToastContextValue {
  return useContext(ToastContext);
}

let toastIdCounter = 0;

const TOAST_STYLES: Record<ToastType, string> = {
  success: 'bg-green-50 border-green-200 text-green-800',
  error: 'bg-red-50 border-red-200 text-red-800',
  pending: 'bg-blue-50 border-blue-200 text-blue-800',
  warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
};

const TOAST_ICONS: Record<ToastType, ReactNode> = {
  success: <CheckCircle size={18} />,
  error: <XCircle size={18} />,
  pending: <RefreshCw size={18} className="animate-spin" />,
  warning: <AlertCircle size={18} />,
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const notify = useCallback(
    (type: ToastType, title: string, message?: string) => {
      const id = ++toastIdCounter;
      setToasts((prev) => [...prev, { id, type, title, message }]);
      if (type !== 'pending') {
        setTimeout(() => removeToast(id), 6000);
      }
    },
    [removeToast],
  );

  return (
    <ToastContext.Provider value={{ notify }}>
      {children}
      {toasts.length > 0 && (
        <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 max-w-sm w-full px-4 sm:px-0">
          {toasts.map((t) => (
            <div
              key={t.id}
              className={`flex items-start gap-3 p-4 rounded-xl shadow-lg border text-sm ${TOAST_STYLES[t.type]}`}
            >
              <div className="mt-0.5 shrink-0">{TOAST_ICONS[t.type]}</div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold">{t.title}</p>
                {t.message && <p className="text-xs mt-0.5 opacity-80 break-words">{t.message}</p>}
              </div>
              <button
                onClick={() => removeToast(t.id)}
                className="shrink-0 opacity-60 hover:opacity-100"
                aria-label="Dismiss notification"
              >
                <X size={16} />
              </button>
            </div>
          ))}
        </div>
      )}
    </ToastContext.Provider>
  );
}
