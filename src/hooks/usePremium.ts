import { usePremiumContext } from '../context/PremiumContext';
import { useAdContext } from '../context/AdContext';

export function usePremium() {
  const { isPremium, loading, restore } = usePremiumContext();
  const { isDayUnlocked, unlockDay } = useAdContext();

  return {
    isPremium,
    loading,
    restore,
    isDayUnlocked: (date: string) => isPremium || isDayUnlocked(date),
    unlockDay,
  };
}
