import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';
import { Loader2 } from 'lucide-react';

const LoadingContext = createContext({
  isLoading: false,
  startLoading: () => {},
  stopLoading: () => {},
});

export function LoadingProvider({ children }) {
  const [isLoading, setIsLoading] = useState(false);
  const [counter, setCounter] = useState(0);

  const startLoading = useCallback(() => {
    setCounter((prev) => {
      const next = prev + 1;
      if (next > 0) setIsLoading(true);
      return next;
    });
  }, []);

  const stopLoading = useCallback(() => {
    setCounter((prev) => {
      const next = Math.max(prev - 1, 0);
      if (next === 0) setIsLoading(false);
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({ isLoading, startLoading, stopLoading }),
    [isLoading, startLoading, stopLoading],
  );

  return (
    <LoadingContext.Provider value={value}>
      {children}
      <LoadingOverlay />
    </LoadingContext.Provider>
  );
}

export function useLoading() {
  const ctx = useContext(LoadingContext);
  if (!ctx) {
    throw new Error('useLoading debe usarse dentro de LoadingProvider');
  }
  return ctx;
}

export function LoadingOverlay() {
  const { isLoading } = useContext(LoadingContext);

  if (!isLoading) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-3 rounded-2xl bg-white px-6 py-4 shadow-xl">
        <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
        <p className="text-sm font-medium text-slate-700">Procesando…</p>
        <p className="text-xs text-slate-400">Por favor espera un momento.</p>
      </div>
    </div>
  );
}

export default LoadingContext;
