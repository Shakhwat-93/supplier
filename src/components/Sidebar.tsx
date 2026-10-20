import React from 'react';
import {
  LayoutGrid,
  ShoppingBag,
  Shirt,
  Gift,
  Smartphone,
  Package,
  Home,
  Pencil,
  Cog,
  Sparkles,
  Watch,
  FolderMinus,
  Star,
  CopyCheck,
  X,
} from 'lucide-react';
import { SupplierCategory } from '../types/supplier';

export interface CategoryCountMap {
  [key: string]: number;
}

interface SidebarProps {
  selectedCategory: SupplierCategory | 'Favorites' | 'Duplicate Review';
  onSelectCategory: (cat: SupplierCategory | 'Favorites' | 'Duplicate Review') => void;
  counts: CategoryCountMap;
  favoritesCount: number;
  duplicateCount: number;
  isMobileDrawer?: boolean;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

interface CategoryConfig {
  id: SupplierCategory;
  name: string;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  iconColor: string;
}

const CATEGORIES: CategoryConfig[] = [
  { id: 'Bags & Luggage', name: 'Bags & Luggage', icon: ShoppingBag, iconColor: '#0d9488' },
  { id: 'Garments & Textiles', name: 'Garments & Textiles', icon: Shirt, iconColor: '#06b6d4' },
  { id: 'Toys & Gifts', name: 'Toys & Gifts', icon: Gift, iconColor: '#f97316' },
  { id: 'Electronics', name: 'Electronics', icon: Smartphone, iconColor: '#3b82f6' },
  { id: 'Packaging', name: 'Packaging', icon: Package, iconColor: '#6366f1' },
  { id: 'Home & Living', name: 'Home & Living', icon: Home, iconColor: '#ec4899' },
  { id: 'Stationery', name: 'Stationery', icon: Pencil, iconColor: '#eab308' },
  { id: 'Machinery', name: 'Machinery', icon: Cog, iconColor: '#0284c7' },
  { id: 'Cosmetics', name: 'Cosmetics', icon: Sparkles, iconColor: '#f43f5e' },
  { id: 'Accessories', name: 'Accessories', icon: Watch, iconColor: '#2563eb' },
  { id: 'Other', name: 'Other', icon: FolderMinus, iconColor: '#64748b' },
];

export const Sidebar: React.FC<SidebarProps> = ({
  selectedCategory,
  onSelectCategory,
  counts,
  favoritesCount,
  duplicateCount,
  isMobileDrawer = false,
  isMobileOpen = false,
  onCloseMobile,
}) => {
  const totalCount = counts['All Suppliers'] || 0;

  const handleItemClick = (cat: SupplierCategory | 'Favorites' | 'Duplicate Review') => {
    onSelectCategory(cat);
    if (onCloseMobile) {
      onCloseMobile();
    }
  };

  const content = (
    <div className="flex flex-col justify-between h-full py-4 select-none">
      <div className="space-y-1 px-3">
        {/* Mobile Header with Close button */}
        {isMobileDrawer && (
          <div className="flex items-center justify-between pb-3 mb-2 border-b border-slate-100 px-1">
            <span className="font-bold text-sm text-slate-800">Browse Categories</span>
            {onCloseMobile && (
              <button
                onClick={onCloseMobile}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        )}

        {/* All Suppliers Item */}
        <button
          onClick={() => handleItemClick('All Suppliers')}
          className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
            selectedCategory === 'All Suppliers'
              ? 'bg-blue-50/90 text-blue-600 font-semibold'
              : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
          }`}
        >
          <div className="flex items-center gap-3">
            <LayoutGrid
              className={`w-4 h-4 ${
                selectedCategory === 'All Suppliers' ? 'text-blue-600' : 'text-blue-500'
              }`}
            />
            <span>All Suppliers</span>
          </div>
          <span
            className={`text-xs ${
              selectedCategory === 'All Suppliers' ? 'text-blue-600 font-semibold' : 'text-slate-400'
            }`}
          >
            {totalCount}
          </span>
        </button>

        {/* Categories List */}
        <div className="pt-1 space-y-0.5">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const isSelected = selectedCategory === cat.id;
            const count = counts[cat.id] || 0;

            return (
              <button
                key={cat.id}
                onClick={() => handleItemClick(cat.id)}
                className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-sm transition-colors ${
                  isSelected
                    ? 'bg-blue-50/90 text-blue-600 font-semibold'
                    : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-3 truncate">
                  <div className="w-5 flex items-center justify-center shrink-0">
                    <Icon className="w-4 h-4" style={{ color: cat.iconColor }} />
                  </div>
                  <span className="truncate text-[13.5px]">{cat.name}</span>
                </div>
                <span
                  className={`text-xs ml-2 shrink-0 ${
                    isSelected ? 'text-blue-600 font-semibold' : 'text-slate-400'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Bottom Section: Favorites & Duplicate Review */}
      <div className="px-3 pt-4 border-t border-slate-100 mt-4 space-y-1">
        {/* Favorites */}
        <button
          onClick={() => handleItemClick('Favorites')}
          className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
            selectedCategory === 'Favorites'
              ? 'bg-blue-50/90 text-blue-600 font-semibold'
              : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
          }`}
        >
          <div className="flex items-center gap-3">
            <Star
              className={`w-4 h-4 ${
                selectedCategory === 'Favorites' ? 'text-blue-600 fill-blue-600' : 'text-slate-400'
              }`}
            />
            <span className="text-[13.5px]">Favorites</span>
          </div>
          <span
            className={`text-xs ${
              selectedCategory === 'Favorites' ? 'text-blue-600 font-semibold' : 'text-slate-400'
            }`}
          >
            {favoritesCount}
          </span>
        </button>

        {/* Duplicate Review */}
        <button
          onClick={() => handleItemClick('Duplicate Review')}
          className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
            selectedCategory === 'Duplicate Review'
              ? 'bg-blue-50/90 text-blue-600 font-semibold'
              : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
          }`}
        >
          <div className="flex items-center gap-3">
            <CopyCheck
              className={`w-4 h-4 ${
                selectedCategory === 'Duplicate Review' ? 'text-blue-600' : 'text-slate-400'
              }`}
            />
            <span className="text-[13.5px]">Duplicate Review</span>
          </div>
          <span
            className={`text-xs px-1.5 py-0.2 rounded-full font-medium ${
              duplicateCount > 0
                ? 'bg-amber-100 text-amber-700'
                : 'text-slate-400'
            }`}
          >
            {duplicateCount}
          </span>
        </button>
      </div>
    </div>
  );

  // If mobile drawer mode
  if (isMobileDrawer) {
    if (!isMobileOpen) return null;
    return (
      <div className="fixed inset-0 z-50 lg:hidden">
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
          onClick={onCloseMobile}
        />
        <aside className="fixed inset-y-0 left-0 w-72 max-w-[80vw] bg-white shadow-2xl flex flex-col z-50 animate-in slide-in-from-left duration-200">
          {content}
        </aside>
      </div>
    );
  }

  // Desktop fixed aside
  return (
    <aside className="w-60 shrink-0 bg-white border-r border-slate-200/80 min-h-[calc(100vh-57px)] sticky top-[57px] flex flex-col justify-between select-none">
      {content}
    </aside>
  );
};
