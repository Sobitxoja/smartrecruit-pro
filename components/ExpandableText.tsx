
import React, { useState } from 'react';

interface Props {
  text: string;
  className?: string;
  maxLines?: number;
}

const ExpandableText: React.FC<Props> = ({ text, className = "", maxLines = 3 }) => {
  const [expanded, setExpanded] = useState(false);
  const isLong = text.length > 200;

  return (
    <div className={`break-words overflow-wrap-anywhere whitespace-normal ${className}`}>
      <p className={`text-sm text-slate-600 dark:text-slate-400 leading-relaxed ${!expanded ? `line-clamp-${maxLines}` : ''}`}>
        {text}
      </p>
      {isLong && (
        <button 
          type="button" 
          onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }} 
          className="text-[10px] font-black text-blue-600 uppercase mt-1 hover:underline focus:outline-none"
        >
          {expanded ? 'Show Less' : 'Show More'}
        </button>
      )}
    </div>
  );
};

export default ExpandableText;
