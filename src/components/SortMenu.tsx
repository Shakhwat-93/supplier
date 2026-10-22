import React from 'react';
import { X, Check } from 'lucide-react';

export type SortMode = 'recommended' | 'name-asc' | 'name-desc' | 'date-newest' | 'date-oldest' | 'completeness';

interface SortMenuProps {
  isOpen: boolean;
  onClose: () => void;
  currentSort: SortMode;
  onSelectSort: (mode: SortMode) => void;
}

const SORT_OPTIONS: { id: SortMode; label: string; desc: string }[] = [
  { id: 'recommended', label: 'Default / Recommended', desc: 'Featured priority directory ranking' },
  { id: 'name-asc', label: 'Company Name (A → Z)', desc: 'Alphabetical order by business title' },
  { id: 'name-desc', label: 'Company Name (Z → A)', desc: 'Reverse alphabetical order' },
  { id: 'date-newest', label: 'Recently Added', desc: 'Newest supplier records first' },
  { id: 'completeness', label: 'Data Completeness', desc: 'Cards with phone, email, and website first' },
  { id: 'date-oldest', label: 'Oldest Added', desc: 'Earliest added directory suppliers' },
];

export const SortMenu: React.FC<SortMenuProps> = ({
  isOpen,
  onClose,
  currentSort,
  onSelectSort,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/60 backdrop-blur-xs p-0 sm:p-4 animate-in fade-in duration-150">
      <div
        className="fixed inset-0 bg-transparent"
        onClick={onClose}
      />
      <div className="relative w-full sm:max-w-sm bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col z-10 animate-in slide-in-from-bottom duration-200">
        {/* Mobile Drag Indicator */}
        <div className="sm:hidden w-full pt-2.5 pb-1 flex justify-center bg-white cursor-pointer select-none" onClick={onClose}>
          <div className="w-12 h-1.5 rounded-full bg-slate-300" />
        </div>

        <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between bg-white">
          <h3 className="font-bold text-sm sm:text-base text-slate-900">Sort Directory</h3>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 min-w-[36px] min-h-[36px] flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-2 space-y-1 pb-safe">
          {SORT_OPTIONS.map((opt) => {
            const isSelected = currentSort === opt.id;
            return (
              <button
                key={opt.id}
                onClick={() => {
                  onSelectSort(opt.id);
                  onClose();
                }}
                className={`w-full flex items-center justify-between p-3 rounded-xl text-left transition-colors min-h-[48px] active:scale-[0.99] ${
                  isSelected
                    ? 'bg-blue-50 text-blue-700 font-semibold shadow-2xs'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <div>
                  <div className="text-xs sm:text-sm font-semibold">{opt.label}</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">{opt.desc}</div>
                </div>
                {isSelected && <Check className="w-4 h-4 text-blue-600 shrink-0" />}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
