
import React, { useState, useRef, useEffect } from 'react';

interface Props {
  label: string;
  placeholder: string;
  suggestions: string[];
  selectedItems: string[];
  onSelectionChange: (items: string[]) => void;
  singleSelect?: boolean;
  disabled?: boolean;
}

const Autocomplete: React.FC<Props> = ({ 
  label, 
  placeholder, 
  suggestions, 
  selectedItems, 
  onSelectionChange,
  singleSelect = false,
  disabled = false
}) => {
  const [inputValue, setInputValue] = useState('');
  const [filteredSuggestions, setFilteredSuggestions] = useState<string[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (singleSelect && selectedItems.length > 0) {
      setInputValue(selectedItems[0]);
    } else if (singleSelect && selectedItems.length === 0) {
      setInputValue('');
    }
  }, [selectedItems, singleSelect]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleFocus = () => {
    if (disabled) return;
    
    // Show all suggestions that aren't selected
    let baseSuggestions = suggestions;
    if (inputValue.trim()) {
      baseSuggestions = suggestions.filter(item => 
        item.toLowerCase().includes(inputValue.toLowerCase())
      );
    }
    
    setFilteredSuggestions(baseSuggestions.filter(item => !selectedItems.includes(item)).slice(0, 50)); // Limit to 50 for performance if list is huge
    setIsOpen(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);
    
    if (value.trim()) {
      const filtered = suggestions.filter(item => 
        item.toLowerCase().includes(value.toLowerCase()) && 
        !selectedItems.includes(item)
      ).slice(0, 50);
      setFilteredSuggestions(filtered);
      setIsOpen(true);
    } else {
      // Show full list if input cleared
      setFilteredSuggestions(suggestions.filter(item => !selectedItems.includes(item)).slice(0, 50));
      setIsOpen(true);
    }
  };

  const addItem = (item: string) => {
    const trimmed = item.trim();
    if (trimmed && !selectedItems.includes(trimmed)) {
      if (singleSelect) {
        onSelectionChange([trimmed]);
        setInputValue(trimmed);
      } else {
        onSelectionChange([...selectedItems, trimmed]);
        setInputValue('');
      }
      setIsOpen(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      // If one exact match or first suggestion
      if (filteredSuggestions.length > 0) {
        addItem(filteredSuggestions[0]);
      } else if (inputValue) {
        // Optional: allow adding custom values not in list? 
        // For country/city we strictly prefer list, but for skills custom is ok.
        // Keeping previous logic:
        addItem(inputValue);
      }
    } else if (e.key === 'Backspace' && !inputValue && selectedItems.length > 0 && !singleSelect) {
      onSelectionChange(selectedItems.slice(0, -1));
    }
  };

  const removeItem = (itemToRemove: string) => {
    onSelectionChange(selectedItems.filter(item => item !== itemToRemove));
    if (singleSelect) setInputValue('');
  };

  return (
    <div className={`relative ${disabled ? 'opacity-50 pointer-events-none' : ''}`} ref={wrapperRef}>
      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
        {label}
      </label>
      
      <div className={`
        relative w-full p-2 border dark:border-slate-600 rounded-2xl 
        bg-white dark:bg-slate-700 dark:text-white transition-all
        focus-within:ring-4 focus-within:ring-blue-500/10 flex flex-wrap gap-2 min-h-[58px] items-center
      `}>
        {!singleSelect && selectedItems.map(item => (
          <span key={item} className="flex items-center px-3 py-1.5 bg-blue-50 dark:bg-blue-900/30 text-[10px] font-black uppercase rounded-xl border border-blue-100 dark:border-blue-800 dark:text-blue-300 animate-in zoom-in-95 duration-200">
            {item}
            <button 
              type="button" 
              onClick={() => removeItem(item)} 
              className="ml-2 text-red-400 hover:text-red-600"
            >
              ✕
            </button>
          </span>
        ))}

        <input
          type="text"
          disabled={disabled}
          className="flex-1 bg-transparent outline-none min-w-[120px] p-2 text-sm font-bold placeholder:font-normal"
          placeholder={singleSelect && selectedItems.length > 0 ? "" : placeholder}
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          onClick={handleFocus}
        />
        
        {singleSelect && selectedItems.length > 0 && !disabled && (
          <button 
            type="button" 
            onClick={() => removeItem(selectedItems[0])}
            className="absolute right-4 text-slate-400 hover:text-slate-600"
          >
            ✕
          </button>
        )}
      </div>

      {isOpen && !disabled && (
        <div className="absolute z-50 w-full mt-2 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border dark:border-slate-700 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 max-h-60 overflow-y-auto">
          {filteredSuggestions.length > 0 ? (
            filteredSuggestions.map(suggestion => (
              <button
                key={suggestion}
                type="button"
                onClick={() => addItem(suggestion)}
                className="w-full text-left px-5 py-3 hover:bg-slate-50 dark:hover:bg-slate-700 dark:text-white text-sm font-bold border-b dark:border-slate-600 last:border-0"
              >
                + {suggestion}
              </button>
            ))
          ) : (
             <div className="px-5 py-3 text-xs text-slate-400 font-bold uppercase tracking-wide">
               {inputValue ? `Press Enter to add "${inputValue}"` : 'No suggestions found'}
             </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Autocomplete;
