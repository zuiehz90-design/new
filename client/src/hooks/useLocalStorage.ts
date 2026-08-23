import { useCallback, useEffect, useState } from 'react';

export function useLocalStorage<T>(key: string | null, initial: T): [T, (v: T | ((prev: T) => T)) => void] {
  const [value, setValue] = useState<T>(() => {
    // clé null = état en mémoire uniquement (aucune persistance)
    if (key == null) return initial;
    try {
      const raw = localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as T) : initial;
    } catch {
      return initial;
    }
  });

  useEffect(() => {
    if (key == null) return;
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // quota dépassé, silencieux
    }
  }, [key, value]);

  const update = useCallback(
    (v: T | ((prev: T) => T)) => {
      setValue((prev) => (typeof v === 'function' ? (v as (prev: T) => T)(prev) : v));
    },
    [],
  );

  return [value, update];
}
