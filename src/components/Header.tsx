import React, { useState } from 'react';
import {
  Search,
  SlidersHorizontal,
  ArrowUpDown,
  LayoutGrid,
  List,
  Plus,
  X,
  Menu,
} from 'lucide-react';
import { ViewMode } from '../types/supplier';

interface HeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  onOpenFilters: () => void;
  hasActiveFilters: boolean;
  onOpenSort: () => void;
  sortLabel: string;
  onOpenAddSupplier: () => void;
  onOpenMobileMenu?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  searchQuery,
  onSearchChange,
  viewMode,
  onViewModeChange,
  onOpenFilters,
  hasActiveFilters,
  onOpenSort,
  onOpenAddSupplier,
  onOpenMobileMenu,
}) => {
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-2.5 sm:px-4 lg:px-6 py-2 transition-shadow shadow-xs">
      <div className="flex items-center justify-between gap-1.5 sm:gap-3 max-w-[1920px] mx-auto">
        {/* Left: Mobile Menu Toggle + Brand Logo */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0 min-w-0">
          {onOpenMobileMenu && (
            <button
              onClick={onOpenMobileMenu}
              className="lg:hidden p-2 -ml-1 text-slate-600 hover:text-slate-900 active:scale-95 rounded-lg hover:bg-slate-100 transition-all shrink-0 min-w-[40px] min-h-[40px] flex items-center justify-center"
              title="Open Categories Menu"
              aria-label="Open Categories Menu"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}

          <div className="flex items-center gap-2 shrink-0">
            <div className="flex items-center justify-center w-7 h-5 sm:w-8 sm:h-5.5 rounded bg-[#de2910] text-[#ffde00] shadow-xs overflow-hidden relative shrink-0">
              {/* China Flag SVG badge */}
              <svg viewBox="0 0 30 20" className="w-full h-full">
                <rect width="30" height="20" fill="#de2910" />
                <polygon points="5,2.5 6.2,6.5 2.8,4 7.2,4 3.8,6.5" fill="#ffde00" />
                <polygon points="10,1.2 10.5,2.5 9.2,1.8 10.8,1.8 9.5,2.5" fill="#ffde00" />
                <polygon points="12,3 12.5,4.3 11.2,3.6 12.8,3.6 11.5,4.3" fill="#ffde00" />
                <polygon points="12,6 12.5,7.3 11.2,6.6 12.8,6.6 11.5,7.3" fill="#ffde00" />
                <polygon points="10,7.8 10.5,9.1 9.2,8.4 10.8,8.4 9.5,9.1" fill="#ffde00" />
              </svg>
            </div>
            <div className="truncate">
              <h1 className="text-xs sm:text-base font-bold text-slate-900 leading-tight tracking-tight whitespace-nowrap truncate">
                China Suppliers
                <span className="hidden md:inline"> Directory</span>
              </h1>
              <p className="hidden md:block text-[10.5px] font-medium text-slate-500 leading-none mt-0.5">
                Manage • Organize • Source Smarter
              </p>
            </div>
          </div>
        </div>

        {/* Center: Tablet & Desktop Search Field (Hidden on <sm) */}
        <div className="hidden sm:flex flex-1 min-w-[120px] max-w-sm lg:max-w-xl mx-2 lg:mx-6">
          <div className="relative w-full flex items-center">
            <Search className="absolute left-3 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search company, person, product..."
              className="w-full pl-9 pr-8 py-1.5 sm:py-2 bg-slate-50/90 hover:bg-slate-50 focus:bg-white border border-slate-200/90 rounded-lg text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                className="absolute right-2.5 p-1 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-200/60"
                title="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Right: Action Controls (Responsive touch targets) */}
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          {/* Mobile Search Toggle Button (<sm only) */}
          <button
            onClick={() => setIsMobileSearchOpen(!isMobileSearchOpen)}
            className={`sm:hidden p-2 text-slate-600 rounded-lg border transition-all min-w-[38px] min-h-[38px] flex items-center justify-center active:scale-95 ${
              isMobileSearchOpen || searchQuery
                ? 'bg-blue-50 text-blue-600 border-blue-200 shadow-2xs'
                : 'bg-white border-slate-200 hover:bg-slate-50'
            }`}
            title="Toggle Search"
            aria-label="Toggle Search"
          >
            <Search className="w-4 h-4" />
          </button>

          {/* Filters Button */}
          <button
            onClick={onOpenFilters}
            className={`inline-flex items-center justify-center gap-1.5 px-2.5 sm:px-3 py-2 text-xs sm:text-sm font-medium rounded-lg border transition-all min-h-[38px] active:scale-95 ${
              hasActiveFilters
                ? 'bg-blue-50 text-blue-700 border-blue-300 shadow-2xs font-semibold'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
            title="Filters"
          >
            <SlidersHorizontal className="w-4 h-4 text-slate-500" />
            <span className="hidden md:inline">Filters</span>
            {hasActiveFilters && (
              <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
            )}
          </button>

          {/* Sort Button */}
          <button
            onClick={onOpenSort}
            className="inline-flex items-center justify-center gap-1.5 px-2.5 sm:px-3 py-2 text-xs sm:text-sm font-medium bg-white text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50 active:scale-95 transition-all min-h-[38px]"
            title="Sort"
          >
            <ArrowUpDown className="w-4 h-4 text-slate-500" />
            <span className="hidden md:inline">Sort</span>
          </button>

          {/* View Mode Toggle (Tablet & Desktop) */}
          <div className="hidden sm:flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200/80">
            <button
              onClick={() => onViewModeChange('grid')}
              className={`p-1.5 rounded-md text-sm transition-all ${
                viewMode === 'grid'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => onViewModeChange('list')}
              className={`p-1.5 rounded-md text-sm transition-all ${
                viewMode === 'list'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="List View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          {/* Add Supplier Button (Hidden on <sm mobile since floating dock button handles it) */}
          <button
            onClick={onOpenAddSupplier}
            className="hidden sm:inline-flex items-center justify-center gap-1 sm:gap-1.5 px-2.5 sm:px-3.5 py-2 text-xs sm:text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 active:scale-[0.97] rounded-lg shadow-xs transition-all shrink-0 min-h-[38px]"
          >
            <Plus className="w-4 h-4 shrink-0" />
            <span className="whitespace-nowrap">
              Add<span className="hidden sm:inline"> Supplier</span>
            </span>
          </button>
        </div>
      </div>

      {/* Mobile Dedicated Search Row (Smooth slide-in on <sm) */}
      {(isMobileSearchOpen || searchQuery) && (
        <div className="sm:hidden pt-2 pb-0.5 animate-in fade-in slide-in-from-top-1 duration-150">
          <div className="relative flex items-center">
            <Search className="absolute left-3 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              autoFocus={isMobileSearchOpen}
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search company, person, product..."
              className="w-full pl-9 pr-8 py-2 bg-slate-50 focus:bg-white border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                className="absolute right-2.5 p-1 text-slate-400 hover:text-slate-600 rounded-full"
                title="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
