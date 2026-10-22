import React from 'react';
import { LayoutGrid, Grid2X2, Phone, Mail, Link as LinkIcon } from 'lucide-react';
import { StatsSummary } from '../types/supplier';

interface StatCardsProps {
  stats: StatsSummary;
  activeFilter?: 'phone' | 'email' | 'website' | null;
  onFilterToggle?: (type: 'phone' | 'email' | 'website') => void;
}

export const StatCards: React.FC<StatCardsProps> = ({
  stats,
  activeFilter,
  onFilterToggle,
}) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-2 sm:gap-2.5 lg:gap-3 mb-3 sm:mb-5 select-none">
      {/* 1. Total Suppliers */}
      <div className="bg-white border border-slate-200/90 rounded-xl p-2.5 sm:p-3 flex items-center gap-2.5 shadow-2xs hover:border-slate-300 transition-all">
        <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
          <LayoutGrid className="w-4 h-4 text-blue-600" />
        </div>
        <div className="min-w-0 flex-1">
          <span className="block text-[10px] sm:text-[11px] font-medium text-slate-500 leading-tight truncate">
            Total Suppliers
          </span>
          <span className="text-base sm:text-lg font-bold text-slate-900 leading-snug tracking-tight">
            {stats.total}
          </span>
        </div>
      </div>

      {/* 2. Categories */}
      <div className="bg-white border border-slate-200/90 rounded-xl p-2.5 sm:p-3 flex items-center gap-2.5 shadow-2xs hover:border-slate-300 transition-all">
        <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center shrink-0">
          <Grid2X2 className="w-4 h-4 text-orange-600" />
        </div>
        <div className="min-w-0 flex-1">
          <span className="block text-[10px] sm:text-[11px] font-medium text-slate-500 leading-tight truncate">
            Categories
          </span>
          <span className="text-base sm:text-lg font-bold text-slate-900 leading-snug tracking-tight">
            {stats.categoriesCount}
          </span>
        </div>
      </div>

      {/* 3. With Phone */}
      <button
        type="button"
        onClick={() => onFilterToggle && onFilterToggle('phone')}
        className={`text-left bg-white border rounded-xl p-2.5 sm:p-3 flex items-center gap-2.5 shadow-2xs active:scale-[0.98] transition-all min-h-[44px] ${
          activeFilter === 'phone'
            ? 'border-emerald-500 ring-2 ring-emerald-500/20 bg-emerald-50/30'
            : 'border-slate-200/90 hover:border-slate-300'
        }`}
      >
        <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0">
          <Phone className="w-4 h-4 text-emerald-600" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between">
            <span className="block text-[10px] sm:text-[11px] font-medium text-slate-500 leading-tight truncate">
              With Phone
            </span>
            {activeFilter === 'phone' && (
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            )}
          </div>
          <span className="text-base sm:text-lg font-bold text-slate-900 leading-snug tracking-tight">
            {stats.withPhone}
          </span>
        </div>
      </button>

      {/* 4. With Email */}
      <button
        type="button"
        onClick={() => onFilterToggle && onFilterToggle('email')}
        className={`text-left bg-white border rounded-xl p-2.5 sm:p-3 flex items-center gap-2.5 shadow-2xs active:scale-[0.98] transition-all min-h-[44px] ${
          activeFilter === 'email'
            ? 'border-blue-500 ring-2 ring-blue-500/20 bg-blue-50/30'
            : 'border-slate-200/90 hover:border-slate-300'
        }`}
      >
        <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
          <Mail className="w-4 h-4 text-blue-600" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between">
            <span className="block text-[10px] sm:text-[11px] font-medium text-slate-500 leading-tight truncate">
              With Email
            </span>
            {activeFilter === 'email' && (
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
            )}
          </div>
          <span className="text-base sm:text-lg font-bold text-slate-900 leading-snug tracking-tight">
            {stats.withEmail}
          </span>
        </div>
      </button>

      {/* 5. With Website */}
      <button
        type="button"
        onClick={() => onFilterToggle && onFilterToggle('website')}
        className={`col-span-2 md:col-span-1 text-left bg-white border rounded-xl p-2.5 sm:p-3 flex items-center gap-2.5 shadow-2xs active:scale-[0.98] transition-all min-h-[44px] ${
          activeFilter === 'website'
            ? 'border-purple-500 ring-2 ring-purple-500/20 bg-purple-50/30'
            : 'border-slate-200/90 hover:border-slate-300'
        }`}
      >
        <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center shrink-0">
          <LinkIcon className="w-4 h-4 text-purple-600" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between">
            <span className="block text-[10px] sm:text-[11px] font-medium text-slate-500 leading-tight truncate">
              With Website
            </span>
            {activeFilter === 'website' && (
              <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
            )}
          </div>
          <span className="text-base sm:text-lg font-bold text-slate-900 leading-snug tracking-tight">
            {stats.withWebsite}
          </span>
        </div>
      </button>
    </div>
  );
};
