import React, { useState, useEffect } from 'react';

interface Props {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

const SalaryRange: React.FC<Props> = ({ value, onChange, className }) => {
  const [min, setMin] = useState('');
  const [max, setMax] = useState('');
  const [currency, setCurrency] = useState('$');

  // Parse initial value
  useEffect(() => {
    if (value) {
      // Try to parse "$50 - $80" or similar
      const match = value.match(/([$€£¥])?(\d+)\s*-\s*([$€£¥])?(\d+)/);
      if (match) {
        setCurrency(match[1] || match[3] || '$');
        setMin(match[2]);
        setMax(match[4]);
      } else {
        // Fallback or simple number
        const simpleMatch = value.match(/([$€£¥])?(\d+)/);
        if (simpleMatch) {
            setCurrency(simpleMatch[1] || '$');
            setMin(simpleMatch[2]);
        }
      }
    }
  }, []);

  const updateValue = (newMin: string, newMax: string, newCurr: string) => {
    if (!newMin && !newMax) {
      onChange('');
      return;
    }
    const minStr = newMin ? `${newCurr}${newMin}` : '';
    const maxStr = newMax ? `${newCurr}${newMax}` : '';
    if (minStr && maxStr) {
      onChange(`${minStr} - ${maxStr}`);
    } else if (minStr) {
      onChange(`${minStr}+`);
    } else {
      onChange(value); // Keep old if invalid
    }
  };

  const handleMinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '');
    setMin(val);
    updateValue(val, max, currency);
  };

  const handleMaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '');
    setMax(val);
    updateValue(min, val, currency);
  };

  const handleCurrencyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setCurrency(e.target.value);
    updateValue(min, max, e.target.value);
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <select 
        value={currency} 
        onChange={handleCurrencyChange}
        className="p-3 bg-slate-50 dark:bg-slate-800 border dark:border-slate-600 rounded-xl font-bold text-slate-700 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="$">$</option>
        <option value="€">€</option>
        <option value="£">£</option>
        <option value="¥">¥</option>
      </select>
      <div className="flex-1 relative">
        <input
          type="text"
          value={min}
          onChange={handleMinChange}
          placeholder="Min"
          className="w-full p-3 pl-8 border dark:border-slate-600 rounded-xl dark:bg-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 font-bold"
        />
        <span className="absolute left-3 top-3 text-slate-400 font-bold">{currency}</span>
      </div>
      <span className="text-slate-400 font-bold">-</span>
      <div className="flex-1 relative">
        <input
          type="text"
          value={max}
          onChange={handleMaxChange}
          placeholder="Max"
          className="w-full p-3 pl-8 border dark:border-slate-600 rounded-xl dark:bg-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 font-bold"
        />
        <span className="absolute left-3 top-3 text-slate-400 font-bold">{currency}</span>
      </div>
    </div>
  );
};

export default SalaryRange;
