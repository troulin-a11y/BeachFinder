import React, { createContext, useContext, useState, useCallback } from 'react';

interface AdState {
  unlockedDays: Set<string>; // YYYY-MM-DD
  unlockDay: (date: string) => void;
  isDayUnlocked: (date: string) => boolean;
}

const AdContext = createContext<AdState>({
  unlockedDays: new Set(),
  unlockDay: () => {},
  isDayUnlocked: () => false,
});

export function AdProvider({ children }: { children: React.ReactNode }) {
  const [unlockedDays, setUnlockedDays] = useState<Set<string>>(new Set());

  const unlockDay = useCallback((date: string) => {
    setUnlockedDays((prev) => new Set([...prev, date]));
  }, []);

  const isDayUnlocked = useCallback(
    (date: string) => {
      const today = new Date().toISOString().split('T')[0];
      if (date === today) return true; // today always unlocked after initial ad
      return unlockedDays.has(date);
    },
    [unlockedDays],
  );

  return (
    <AdContext.Provider value={{ unlockedDays, unlockDay, isDayUnlocked }}>
      {children}
    </AdContext.Provider>
  );
}

export const useAdContext = () => useContext(AdContext);
