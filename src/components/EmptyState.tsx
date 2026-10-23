import React from 'react';

export interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
    icon?: React.ReactNode;
  };
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  className = '',
}) => {
  return (
    <div
      className={`py-12 px-6 text-center flex flex-col items-center justify-center max-w-md mx-auto ${className}`}
    >
      <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-500 border border-slate-200 flex items-center justify-center mb-3">
        {icon}
      </div>
      <h3 className="text-base font-bold text-[#06345A] font-heading tracking-tight">
        {title}
      </h3>
      <p className="text-xs sm:text-sm text-[#6B7280] mt-1 mb-4 leading-relaxed">
        {description}
      </p>
      {action && (
        <button
          type="button"
          onClick={action.onClick}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 min-h-[38px] rounded-lg bg-[#1497F2] hover:bg-[#06345A] text-white text-xs sm:text-sm font-semibold font-heading shadow-xs transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#1497F2]/20"
        >
          {action.icon}
          <span>{action.label}</span>
        </button>
      )}
    </div>
  );
};
