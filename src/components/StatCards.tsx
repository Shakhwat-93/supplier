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
    <div className="flex sm:grid sm:grid-cols-2 md:grid-cols-3 2xl:grid-cols-5 gap-2 sm:gap-2.5 lg:gap-3 overflow-x-auto scrollbar-none pb-1 sm:pb-0 mb-3 sm:mb-5 select-none">
      {/* 1. Total Suppliers */}
      <div className="shrink-0 min-w-[120px] sm:min-w-0 bg-white border border-slate-200/90 rounded-xl p-2 sm:p-2.5 xl:p-3 flex items-center gap-2 sm:gap-2.5 shadow-xs hover:border-slate-300 transition-all">
        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
          <LayoutGrid className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600" />
        </div>
        <div className="min-w-0">
          <span className="block text-[10px] sm:text-[11px] font-medium text-slate-500 leading-tight">
            Total Suppliers
          </span>
          <span className="text-sm sm:text-base xl:text-lg font-bold text-slate-900 leading-snug tracking-tight">
            {stats.total}
          </span>
        </div>
      </div>

      {/* 2. Categories */}
      <div className="shrink-0 min-w-[110px] sm:min-w-0 bg-white border border-slate-200/90 rounded-xl p-2 sm:p-2.5 xl:p-3 flex items-center gap-2 sm:gap-2.5 shadow-xs hover:border-slate-300 transition-all">
        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-orange-50 flex items-center justify-center shrink-0">
          <Grid2X2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-orange-600" />
        </div>
        <div className="min-w-0">
          <span className="block text-[10px] sm:text-[11px] font-medium text-slate-500 leading-tight truncate">
            Categories
          </span>
          <span className="text-sm sm:text-base xl:text-lg font-bold text-slate-900 leading-snug tracking-tight">
            {stats.categoriesCount}
          </span>
        </div>
      </div>

      {/* 3. With Phone */}
      <div
        onClick={() => onFilterToggle && onFilterToggle('phone')}
        className={`shrink-0 min-w-[110px] sm:min-w-0 bg-white border rounded-xl p-2 sm:p-2.5 xl:p-3 flex items-center gap-2 sm:gap-2.5 shadow-xs cursor-pointer transition-all ${
          activeFilter === 'phone'
            ? 'border-emerald-500 ring-2 ring-emerald-100 bg-emerald-50/20'
            : 'border-slate-200/90 hover:border-slate-300'
        }`}
      >
        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0">
          <Phone className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600" />
        </div>
        <div className="min-w-0">
          <span className="block text-[10px] sm:text-[11px] font-medium text-slate-500 leading-tight">
            With Phone
          </span>
          <span className="text-sm sm:text-base xl:text-lg font-bold text-slate-900 leading-snug tracking-tight">
            {stats.withPhone}
          </span>
        </div>
      </div>

      {/* 4. With Email */}
      <div
        onClick={() => onFilterToggle && onFilterToggle('email')}
        className={`shrink-0 min-w-[110px] sm:min-w-0 bg-white border rounded-xl p-2 sm:p-2.5 xl:p-3 flex items-center gap-2 sm:gap-2.5 shadow-xs cursor-pointer transition-all ${
          activeFilter === 'email'
            ? 'border-blue-500 ring-2 ring-blue-100 bg-blue-50/20'
            : 'border-slate-200/90 hover:border-slate-300'
        }`}
      >
        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
          <Mail className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600" />
        </div>
        <div className="min-w-0">
          <span className="block text-[10px] sm:text-[11px] font-medium text-slate-500 leading-tight">
            With Email
          </span>
          <span className="text-sm sm:text-base xl:text-lg font-bold text-slate-900 leading-snug tracking-tight">
            {stats.withEmail}
          </span>
        </div>
      </div>

      {/* 5. With Website */}
      <div
        onClick={() => onFilterToggle && onFilterToggle('website')}
        className={`shrink-0 min-w-[115px] sm:min-w-0 bg-white border rounded-xl p-2 sm:p-2.5 xl:p-3 flex items-center gap-2 sm:gap-2.5 shadow-xs cursor-pointer transition-all ${
          activeFilter === 'website'
            ? 'border-purple-500 ring-2 ring-purple-100 bg-purple-50/20'
            : 'border-slate-200/90 hover:border-slate-300'
        }`}
      >
        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-purple-50 flex items-center justify-center shrink-0">
          <LinkIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-600" />
        </div>
        <div className="min-w-0">
          <span className="block text-[10px] sm:text-[11px] font-medium text-slate-500 leading-tight">
            With Website
          </span>
          <span className="text-sm sm:text-base xl:text-lg font-bold text-slate-900 leading-snug tracking-tight">
            {stats.withWebsite}
          </span>
        </div>
      </div>
    </div>
  );
};
