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
    <header className="sticky top-0 z-30 bg-white border-b border-slate-200/80 px-3 sm:px-4 lg:px-6 py-2 transition-shadow">
      <div className="flex items-center justify-between gap-2 sm:gap-3 max-w-[1920px] mx-auto">
        {/* Left: Mobile Menu Toggle + Brand Logo */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {onOpenMobileMenu && (
            <button
              onClick={onOpenMobileMenu}
              className="lg:hidden p-1.5 -ml-1 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors"
              title="Open Categories Menu"
              aria-label="Open Categories Menu"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}

          <div className="flex items-center gap-2 sm:gap-2.5">
            <div className="flex items-center justify-center w-8 h-6 sm:w-9 sm:h-6.5 rounded bg-[#de2910] text-[#ffde00] shadow-xs overflow-hidden relative shrink-0">
              {/* Authentic China Flag SVG badge */}
              <svg viewBox="0 0 30 20" className="w-full h-full">
                <rect width="30" height="20" fill="#de2910" />
                <polygon points="5,2.5 6.2,6.5 2.8,4 7.2,4 3.8,6.5" fill="#ffde00" />
                <polygon points="10,1.2 10.5,2.5 9.2,1.8 10.8,1.8 9.5,2.5" fill="#ffde00" />
                <polygon points="12,3 12.5,4.3 11.2,3.6 12.8,3.6 11.5,4.3" fill="#ffde00" />
                <polygon points="12,6 12.5,7.3 11.2,6.6 12.8,6.6 11.5,7.3" fill="#ffde00" />
                <polygon points="10,7.8 10.5,9.1 9.2,8.4 10.8,8.4 9.5,9.1" fill="#ffde00" />
              </svg>
            </div>
            <div>
              <h1 className="text-sm sm:text-base font-bold text-slate-900 leading-tight tracking-tight whitespace-nowrap">
                China Suppliers
                <span className="hidden sm:inline"> Directory</span>
              </h1>
              <p className="hidden sm:block text-[10.5px] font-medium text-slate-500 leading-none mt-0.5">
                Manage • Organize • Source Smarter
              </p>
            </div>
          </div>
        </div>

        {/* Center: Desktop/Tablet Search Field (Hidden on <sm) */}
        <div className="hidden sm:flex flex-1 max-w-md lg:max-w-xl mx-2 lg:mx-6">
          <div className="relative w-full flex items-center">
            <Search className="absolute left-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search company, person, product, city..."
              className="w-full pl-9 pr-8 py-1.5 sm:py-2 bg-slate-50/80 hover:bg-slate-50 focus:bg-white border border-slate-200/90 rounded-lg text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                className="absolute right-2.5 p-0.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-200/60"
                title="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Right: Action Controls (Optimized for all viewports) */}
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          {/* Mobile Search Toggle Button (<sm only) */}
          <button
            onClick={() => setIsMobileSearchOpen(!isMobileSearchOpen)}
            className={`sm:hidden p-2 text-slate-600 rounded-lg border transition-colors ${
              isMobileSearchOpen || searchQuery
                ? 'bg-blue-50 text-blue-600 border-blue-200'
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
            className={`inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-medium rounded-lg border transition-colors ${
              hasActiveFilters
                ? 'bg-blue-50 text-blue-700 border-blue-200'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
            title="Filters"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-500" />
            <span className="hidden md:inline">Filters</span>
            {hasActiveFilters && (
              <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
            )}
          </button>

          {/* Sort Button */}
          <button
            onClick={onOpenSort}
            className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-medium bg-white text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
            title="Sort"
          >
            <ArrowUpDown className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-500" />
            <span className="hidden md:inline">Sort</span>
          </button>

          {/* View Mode Toggle (Hidden on mobile) */}
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
              <LayoutGrid className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
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
              <List className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
          </div>

          {/* Add Supplier Button */}
          <button
            onClick={onOpenAddSupplier}
            className="inline-flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 active:scale-[0.98] rounded-lg shadow-xs transition-all shrink-0"
          >
            <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
            <span className="whitespace-nowrap">
              Add<span className="hidden lg:inline"> Supplier</span>
            </span>
          </button>
        </div>
      </div>

      {/* Mobile Dedicated Search Row (Appears on <sm when toggled or active) */}
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
              className="w-full pl-9 pr-8 py-1.5 bg-slate-50 focus:bg-white border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                className="absolute right-2.5 p-0.5 text-slate-400 hover:text-slate-600 rounded-full"
                title="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
