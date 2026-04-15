import { useState, useEffect } from 'react';

/**
 * Hook for managing debounced price state to avoid excessive re-renders
 * Separates visual feedback (local state) from filter effects (debounced callback)
 */
export function useDebouncedPrice(
  initialPrice: number,
  onPriceChange: (price: number) => void,
  delay: number = 300
) {
  const [localPrice, setLocalPrice] = useState(initialPrice);
  const [debouncedPrice, setDebouncedPrice] = useState(initialPrice);

  // Debounce the price change callback
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedPrice(localPrice);
      onPriceChange(localPrice);
    }, delay);

    return () => clearTimeout(timer);
  }, [localPrice, onPriceChange, delay]);

  return { localPrice, setLocalPrice, debouncedPrice };
}
