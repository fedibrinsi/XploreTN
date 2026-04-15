import React, { useMemo } from 'react';

interface PriceRangeSliderProps {
  value: number;
  onLocalChange: (price: number) => void;
  min?: number;
  max?: number;
}

export const PriceRangeSlider = React.memo(({
  value,
  onLocalChange,
  min = 20,
  max = 500,
}: PriceRangeSliderProps) => {
  // Memoize the position calculation to avoid recalculating on every render
  const tooltipPosition = useMemo(() => {
    const percentage = ((value - min) / (max - min)) * 100;
    const offset = 8 - (percentage / 100) * 16;
    return {
      percentage,
      offset,
    };
  }, [value, min, max]);

  const displayPrice = value >= max ? `${max}+` : value;

  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-4">
        Max Investment
      </p>
      <div className="relative pt-6 pb-1">
        {/* Tooltip */}
        <div
          className="absolute top-0 -translate-x-1/2 bg-primary text-white text-[10px] font-bold py-1 px-2 rounded-md shadow-md transition-all duration-100 ease-out z-10 whitespace-nowrap pointer-events-none before:content-[''] before:absolute before:top-full before:left-1/2 before:-translate-x-1/2 before:border-4 before:border-transparent before:border-t-primary"
          style={{
            left: `calc(${tooltipPosition.percentage}% + ${tooltipPosition.offset}px)`,
          }}
        >
          {displayPrice} TND
        </div>

        {/* Slider Input */}
        <input
          className="w-full h-2 bg-secondary-fixed-dim rounded-lg appearance-none cursor-pointer accent-primary relative z-0"
          type="range"
          min={min}
          max={max}
          value={value}
          onChange={(e) => onLocalChange(Number(e.target.value))}
        />

        {/* Labels */}
        <div className="flex justify-between text-xs mt-2 font-medium">
          <span>{min} TND</span>
          <span>{max}+ TND</span>
        </div>
      </div>
    </div>
  );
});

PriceRangeSlider.displayName = 'PriceRangeSlider';
