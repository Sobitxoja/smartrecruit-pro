import React, { useRef, useEffect } from 'react';

interface Props {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

const RichTextEditor: React.FC<Props> = ({ value, onChange, placeholder, className }) => {
  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      if (value === '') {
        editorRef.current.innerHTML = '';
      } else {
        // Only update if significantly different to avoid cursor jumping
        // This is a simple implementation; for production, use a library like Slate.js or Draft.js
        if (editorRef.current.innerHTML !== value) {
           editorRef.current.innerHTML = value;
        }
      }
    }
  }, [value]);

  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const execCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    if (editorRef.current) {
      editorRef.current.focus();
    }
  };

  return (
    <div className={`border dark:border-slate-600 rounded-2xl overflow-hidden bg-white dark:bg-slate-700 ${className}`}>
      <div className="flex items-center gap-1 p-2 border-b dark:border-slate-600 bg-slate-50 dark:bg-slate-800">
        <button
          type="button"
          onClick={() => execCommand('bold')}
          className="p-2 rounded hover:bg-slate-200 dark:hover:bg-slate-600 font-bold text-slate-700 dark:text-slate-200"
          title="Bold"
        >
          B
        </button>
        <button
          type="button"
          onClick={() => execCommand('italic')}
          className="p-2 rounded hover:bg-slate-200 dark:hover:bg-slate-600 italic text-slate-700 dark:text-slate-200"
          title="Italic"
        >
          I
        </button>
        <button
          type="button"
          onClick={() => execCommand('insertUnorderedList')}
          className="p-2 rounded hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200"
          title="Bullet List"
        >
          • List
        </button>
        <button
          type="button"
          onClick={() => execCommand('insertOrderedList')}
          className="p-2 rounded hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200"
          title="Numbered List"
        >
          1. List
        </button>
      </div>
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        className="p-4 min-h-[160px] outline-none text-slate-900 dark:text-white prose dark:prose-invert max-w-none"
        data-placeholder={placeholder}
      />
      <style>{`
        [contenteditable]:empty:before {
          content: attr(data-placeholder);
          color: #94a3b8;
          pointer-events: none;
          display: block; /* For Firefox */
        }
      `}</style>
    </div>
  );
};

export default RichTextEditor;
