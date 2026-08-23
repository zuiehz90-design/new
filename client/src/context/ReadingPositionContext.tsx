import { createContext, useCallback, useContext, type ReactNode } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { useAuth } from './AuthContext';
import { storageKey } from '../lib/storageScope';

interface LastPosition {
  chapter: number;
  verse: number;
}

interface Ctx {
  /** chapter → dernier verset lu */
  positions: Record<number, number>;
  /** position épinglée la plus récente (raccourci « Coran » → verset épinglé) */
  last: LastPosition | null;
  setPosition: (chapter: number, verse: number) => void;
  getPosition: (chapter: number) => number | undefined;
  clearPosition: (chapter: number) => void;
}

const ReadingPositionContext = createContext<Ctx>({
  positions: {},
  last: null,
  setPosition: () => {},
  getPosition: () => undefined,
  clearPosition: () => {},
});

export function useReadingPosition() {
  return useContext(ReadingPositionContext);
}

export function ReadingPositionProvider({ children }: { children: ReactNode }) {
  const { scope } = useAuth();
  const [positions, setPositions] = useLocalStorage<Record<number, number>>(storageKey(scope, 'readingPositions'), {});
  const [last, setLast] = useLocalStorage<LastPosition | null>(storageKey(scope, 'readingLast'), null);

  const setPosition = useCallback(
    (chapter: number, verse: number) => {
      setPositions((prev) => (prev[chapter] === verse ? prev : { ...prev, [chapter]: verse }));
      setLast({ chapter, verse });
    },
    [setPositions, setLast],
  );

  const getPosition = useCallback((chapter: number) => positions[chapter], [positions]);

  const clearPosition = useCallback(
    (chapter: number) => {
      setPositions((prev) => {
        if (!(chapter in prev)) return prev;
        const next = { ...prev };
        delete next[chapter];
        return next;
      });
      setLast((prev) => (prev && prev.chapter === chapter ? null : prev));
    },
    [setPositions, setLast],
  );

  return (
    <ReadingPositionContext.Provider value={{ positions, last, setPosition, getPosition, clearPosition }}>
      {children}
    </ReadingPositionContext.Provider>
  );
}
