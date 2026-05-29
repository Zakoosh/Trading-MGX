import { useEffect, useRef, useState } from 'react';

type Initializer<T> = T | (() => T);

function resolveInitializer<T>(value: Initializer<T>): T {
  return typeof value === 'function' ? (value as () => T)() : value;
}

export function usePersistentState<T>(
  key: string,
  initialValue: Initializer<T>
): [T, (value: T | ((prev: T) => T)) => void] {
  const isHydrated = useRef(false);
  const [state, setState] = useState<T>(() => {
    if (typeof window === 'undefined') {
      return resolveInitializer(initialValue);
    }
    try {
      const raw = window.localStorage.getItem(key);
      const fallback = resolveInitializer(initialValue);
      if (!raw) return fallback;
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object' && typeof fallback === 'object') {
        return { ...(fallback as Record<string, unknown>), ...(parsed as Record<string, unknown>) } as T;
      }
      return parsed as T;
    } catch {
      return resolveInitializer(initialValue);
    }
  });

  useEffect(() => {
    if (!isHydrated.current) {
      isHydrated.current = true;
      return;
    }
    try {
      window.localStorage.setItem(key, JSON.stringify(state));
    } catch {
      // ignore write errors (storage full / disabled)
    }
  }, [key, state]);

  const updateState = (value: T | ((prev: T) => T)) => {
    setState((prev) => (typeof value === 'function' ? (value as (prev: T) => T)(prev) : value));
  };

  return [state, updateState];
}
