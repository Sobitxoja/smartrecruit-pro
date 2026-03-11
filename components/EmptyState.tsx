import React from 'react';

interface Props {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
}

const EmptyState: React.FC<Props> = ({ title, description, actionLabel, onAction, icon }) => {
  return (
    <div className="flex flex-col items-center justify-center p-10 text-center bg-white dark:bg-slate-800 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-700 animate-in fade-in duration-500">
      <div className="mb-6 p-6 bg-slate-50 dark:bg-slate-700 rounded-full text-4xl text-slate-400 dark:text-slate-500">
        {icon || '📂'}
      </div>
      <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2">{title}</h3>
      <p className="text-slate-500 dark:text-slate-400 max-w-md mb-6">{description}</p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="px-6 py-3 bg-blue-600 text-white rounded-xl font-black uppercase text-xs hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 dark:shadow-none"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};

export default EmptyState;
