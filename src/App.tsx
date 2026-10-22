import React, { useState, useEffect, useMemo } from 'react';
import { Header } from './components/Header';
import { Sidebar, CategoryCountMap } from './components/Sidebar';
import { StatCards } from './components/StatCards';
import { SupplierCard } from './components/SupplierCard';
import { SupplierListRow } from './components/SupplierListRow';
import { SupplierDrawer } from './components/SupplierDrawer';
import { CardViewerModal } from './components/CardViewerModal';
import { AddSupplierModal } from './components/AddSupplierModal';
import { EditSupplierModal } from './components/EditSupplierModal';
import { DuplicateReviewModal } from './components/DuplicateReviewModal';
import { ReplaceCardModal } from './components/ReplaceCardModal';
import { FilterPopover } from './components/FilterPopover';
import { SortMenu, SortMode } from './components/SortMenu';
import { Toast, ToastMessage } from './components/Toast';
import { Plus, Star, CopyCheck, FolderTree, SlidersHorizontal, ArrowUpDown } from 'lucide-react';
import { Supplier, SupplierCategory, SupplierType, ViewMode, StatsSummary } from './types/supplier';
import { supplierRepository } from './services/supplierRepository';

export const App: React.FC = () => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<SupplierCategory | 'Favorites' | 'Duplicate Review'>('All Suppliers');
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedSupplierId, setSelectedSupplierId] = useState<string | null>(
    typeof window !== 'undefined' && window.innerWidth >= 1280 ? 'sup-001' : null
  );
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');

  // Filters State
  const [isFilterOpen, setIsFilterOpen] = useState<boolean>(false);
  const [supplierTypeFilter, setSupplierTypeFilter] = useState<SupplierType | 'All'>('All');
  const [provinceFilter, setProvinceFilter] = useState<string>('');
  const [hasPhoneOnly, setHasPhoneOnly] = useState<boolean>(false);
  const [hasEmailOnly, setHasEmailOnly] = useState<boolean>(false);
  const [hasWebsiteOnly, setHasWebsiteOnly] = useState<boolean>(false);
  const [quickStatFilter, setQuickStatFilter] = useState<'phone' | 'email' | 'website' | null>(null);

  // Sort State
  const [isSortOpen, setIsSortOpen] = useState<boolean>(false);
  const [currentSort, setCurrentSort] = useState<SortMode>('recommended');

  // Modals & Drawers
  const [isAddOpen, setIsAddOpen] = useState<boolean>(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [isDuplicateReviewOpen, setIsDuplicateReviewOpen] = useState<boolean>(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);
  const [viewerModal, setViewerModal] = useState<{ isOpen: boolean; initialSide: 'front' | 'back' }>({
    isOpen: false,
    initialSide: 'front',
  });
  const [replaceCardModal, setReplaceCardModal] = useState<{
    isOpen: boolean;
    supplier: Supplier | null;
    initialSide: 'front' | 'back';
  }>({
    isOpen: false,
    supplier: null,
    initialSide: 'front',
  });

  // Toasts
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  };

  // Load suppliers
  const loadSuppliers = async () => {
    try {
      const data = await supplierRepository.getAll();
      setSuppliers(data);
      if (!selectedSupplierId && data.length > 0 && typeof window !== 'undefined' && window.innerWidth >= 1280) {
        setSelectedSupplierId(data[0].id);
      }
    } catch (err) {
      console.error(err);
      addToast('Failed to load supplier records', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSuppliers();
  }, []);

  // Selected Supplier object (Single source of truth)
  const selectedSupplier = useMemo(() => {
    if (selectedSupplierId) {
      return suppliers.find((s) => s.id === selectedSupplierId) || null;
    }
    return null;
  }, [suppliers, selectedSupplierId]);

  // Compute category counts strictly derived from active loaded supplier records
  const categoryCounts = useMemo<CategoryCountMap>(() => {
    const counts: CategoryCountMap = {
      'All Suppliers': 0,
      'Bags & Luggage': 0,
      'Garments & Textiles': 0,
      'Toys & Gifts': 0,
      'Electronics': 0,
      'Packaging': 0,
      'Home & Living': 0,
      'Stationery': 0,
      'Machinery': 0,
      'Cosmetics': 0,
      'Accessories': 0,
      'Other': 0,
    };

    suppliers.forEach((s) => {
      if (!s.isDuplicate) {
        counts['All Suppliers'] = (counts['All Suppliers'] || 0) + 1;
        if (counts[s.category] !== undefined) {
          counts[s.category] += 1;
        } else {
          counts[s.category] = 1;
        }
      }
    });

    return counts;
  }, [suppliers]);

  const favoritesCount = useMemo(() => {
    return suppliers.filter((s) => s.isFavorite && !s.isDuplicate).length;
  }, [suppliers]);

  const duplicateSuppliers = useMemo(() => {
    return suppliers.filter((s) => s.isDuplicate);
  }, [suppliers]);

  // Stats Summary strictly derived from active loaded supplier records
  const stats = useMemo<StatsSummary>(() => {
    const active = suppliers.filter((s) => !s.isDuplicate);
    const activeCategories = new Set(active.map((s) => s.category));
    return {
      total: active.length,
      categoriesCount: activeCategories.size,
      withPhone: active.filter((s) => s.phone && s.phone.trim().length > 3).length,
      withEmail: active.filter((s) => s.email && s.email.includes('@')).length,
      withWebsite: active.filter((s) => s.website && s.website.trim().length > 3).length,
    };
  }, [suppliers]);

  // Filtered & Sorted Suppliers
  const displayedSuppliers = useMemo(() => {
    let result = suppliers;

    // Duplicate Review view mode
    if (selectedCategory === 'Duplicate Review') {
      return result.filter((s) => s.isDuplicate);
    }

    // Default: exclude duplicate candidates from normal browsing
    result = result.filter((s) => !s.isDuplicate);

    // Favorites filter
    if (selectedCategory === 'Favorites') {
      result = result.filter((s) => s.isFavorite);
    } else if (selectedCategory !== 'All Suppliers') {
      result = result.filter((s) => s.category === selectedCategory);
    }

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (s) =>
          (s.supplierCode && s.supplierCode.toLowerCase().includes(q)) ||
          s.companyName.toLowerCase().includes(q) ||
          (s.chineseName && s.chineseName.includes(q)) ||
          (s.brand && s.brand.toLowerCase().includes(q)) ||
          s.contactPerson.toLowerCase().includes(q) ||
          s.phone.toLowerCase().includes(q) ||
          s.email.toLowerCase().includes(q) ||
          s.city.toLowerCase().includes(q) ||
          s.province.toLowerCase().includes(q) ||
          (s.rawCategory && s.rawCategory.toLowerCase().includes(q)) ||
          s.productRange.some((p) => p.toLowerCase().includes(q)) ||
          s.notes.toLowerCase().includes(q)
      );
    }

    // Advanced filters
    if (supplierTypeFilter !== 'All') {
      result = result.filter((s) => s.supplierType === supplierTypeFilter);
    }

    if (provinceFilter) {
      result = result.filter((s) => s.province === provinceFilter);
    }

    if (hasPhoneOnly || quickStatFilter === 'phone') {
      result = result.filter((s) => s.phone && s.phone.trim().length > 3);
    }

    if (hasEmailOnly || quickStatFilter === 'email') {
      result = result.filter((s) => s.email && s.email.includes('@'));
    }

    if (hasWebsiteOnly || quickStatFilter === 'website') {
      result = result.filter((s) => s.website && s.website.trim().length > 3);
    }

    // Sorting
    result = [...result].sort((a, b) => {
      switch (currentSort) {
        case 'name-asc':
          return a.companyName.localeCompare(b.companyName);
        case 'name-desc':
          return b.companyName.localeCompare(a.companyName);
        case 'date-newest':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'date-oldest':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'completeness': {
          const score = (s: Supplier) =>
            (s.phone ? 1 : 0) + (s.email ? 1 : 0) + (s.website ? 1 : 0) + (s.address ? 1 : 0);
          return score(b) - score(a);
        }
        default:
          return 0;
      }
    });

    return result;
  }, [
    suppliers,
    selectedCategory,
    searchQuery,
    supplierTypeFilter,
    provinceFilter,
    hasPhoneOnly,
    hasEmailOnly,
    hasWebsiteOnly,
    quickStatFilter,
    currentSort,
  ]);

  // Synchronize selectedSupplierId with active displayedSuppliers
  useEffect(() => {
    if (displayedSuppliers.length === 0) {
      if (selectedSupplierId !== null) {
        setSelectedSupplierId(null);
      }
      return;
    }

    const isCurrentInView = displayedSuppliers.some((s) => s.id === selectedSupplierId);

    if (!isCurrentInView) {
      if (typeof window !== 'undefined' && window.innerWidth >= 1280) {
        // Desktop: auto-select first item
        setSelectedSupplierId(displayedSuppliers[0].id);
      } else {
        // Mobile: close drawer when filter shifts
        setSelectedSupplierId(null);
      }
    }
  }, [displayedSuppliers, selectedSupplierId]);

  // Actions
  const handleToggleFavorite = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const isFav = await supplierRepository.toggleFavorite(id);
      setSuppliers((prev) =>
        prev.map((s) => (s.id === id ? { ...s, isFavorite: isFav } : s))
      );
      addToast(isFav ? 'Added to favorites' : 'Removed from favorites', 'info');
    } catch {
      addToast('Error updating favorite', 'error');
    }
  };

  const handleAddSupplier = async (newSupplierData: Omit<Supplier, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const created = await supplierRepository.create(newSupplierData);
      setSuppliers((prev) => [created, ...prev]);
      setSelectedSupplierId(created.id);
      addToast(`Added supplier "${created.companyName}"`, 'success');
    } catch {
      addToast('Failed to add supplier', 'error');
    }
  };

  const handleSaveSupplier = async (id: string, updates: Partial<Supplier>) => {
    try {
      const updated = await supplierRepository.update(id, updates);
      setSuppliers((prev) => prev.map((s) => (s.id === id ? updated : s)));
      addToast(`Updated "${updated.companyName}"`, 'success');
    } catch {
      addToast('Failed to update supplier', 'error');
    }
  };

  const handleDeleteSupplier = async (id: string) => {
    const toDelete = suppliers.find((s) => s.id === id);
    if (!toDelete) return;
    if (window.confirm(`Are you sure you want to delete "${toDelete.companyName}"?`)) {
      try {
        await supplierRepository.delete(id);
        setSuppliers((prev) => prev.filter((s) => s.id !== id));
        if (selectedSupplierId === id) {
          const remaining = suppliers.filter((s) => s.id !== id && !s.isDuplicate);
          setSelectedSupplierId(remaining[0]?.id || null);
        }
        addToast(`Deleted "${toDelete.companyName}"`, 'info');
      } catch {
        addToast('Failed to delete supplier', 'error');
      }
    }
  };

  const handleMergeDuplicates = async (primaryId: string, duplicateId: string) => {
    try {
      const merged = await supplierRepository.mergeDuplicates(primaryId, duplicateId);
      await loadSuppliers();
      addToast(`Merged duplicate into "${merged.companyName}"`, 'success');
    } catch {
      addToast('Error merging duplicates', 'error');
    }
  };

  const handleDismissDuplicate = async (duplicateId: string) => {
    try {
      await supplierRepository.dismissDuplicate(duplicateId);
      await loadSuppliers();
      addToast('Duplicate review dismissed', 'info');
    } catch {
      addToast('Error dismissing duplicate', 'error');
    }
  };

  const handleOpenReplaceCard = (supplier: Supplier, side: 'front' | 'back' = 'front') => {
    setReplaceCardModal({
      isOpen: true,
      supplier,
      initialSide: side,
    });
  };

  const handleSaveCardReplacement = async (
    supplierId: string,
    side: 'front' | 'back',
    file: File
  ): Promise<Supplier> => {
    const updated = await supplierRepository.replaceCardImage(supplierId, side, file);
    setSuppliers((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
    return updated;
  };

  const handleCardReplacementSuccess = (updatedSupplier: Supplier) => {
    setSuppliers((prev) => prev.map((s) => (s.id === updatedSupplier.id ? updatedSupplier : s)));
    addToast(`Business card replaced for "${updatedSupplier.companyName}"`, 'success');
  };

  const handleCopyInfo = (supplier: Supplier) => {
    const text = `${supplier.companyName}
Contact: ${supplier.contactPerson} (${supplier.position || 'Sales'})
Phone: ${supplier.phone}
Email: ${supplier.email}
Website: ${supplier.website}
Address: ${supplier.address}
Products: ${supplier.productRange.join(', ')}`;
    navigator.clipboard.writeText(text);
    addToast('Contact info copied to clipboard', 'success');
  };

  const hasActiveFilters =
    supplierTypeFilter !== 'All' ||
    provinceFilter !== '' ||
    hasPhoneOnly ||
    hasEmailOnly ||
    hasWebsiteOnly ||
    quickStatFilter !== null;

  const handleResetFilters = () => {
    setSupplierTypeFilter('All');
    setProvinceFilter('');
    setHasPhoneOnly(false);
    setHasEmailOnly(false);
    setHasWebsiteOnly(false);
    setQuickStatFilter(null);
    addToast('Filters reset', 'info');
  };

  const handleCategorySelect = (cat: SupplierCategory | 'Favorites' | 'Duplicate Review') => {
    setSelectedCategory(cat);
    if (cat === 'Duplicate Review') {
      setIsDuplicateReviewOpen(true);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col font-sans">
      {/* 1. Header Navigation */}
      <Header
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onOpenFilters={() => setIsFilterOpen(true)}
        hasActiveFilters={hasActiveFilters}
        onOpenSort={() => setIsSortOpen(true)}
        sortLabel={currentSort}
        onOpenAddSupplier={() => setIsAddOpen(true)}
        onOpenMobileMenu={() => setIsMobileSidebarOpen(true)}
      />

      {/* Main Workspace Layout */}
      <div className="flex-1 flex max-w-[1920px] w-full mx-auto">
        {/* 2. Left Category Sidebar (Desktop fixed, docked on >=1024px) */}
        <div className="hidden lg:block">
          <Sidebar
            selectedCategory={selectedCategory}
            onSelectCategory={handleCategorySelect}
            counts={categoryCounts}
            favoritesCount={favoritesCount}
            duplicateCount={duplicateSuppliers.length}
          />
        </div>

        {/* Mobile / Tablet Drawer Sidebar (<1024px) */}
        <Sidebar
          selectedCategory={selectedCategory}
          onSelectCategory={handleCategorySelect}
          counts={categoryCounts}
          favoritesCount={favoritesCount}
          duplicateCount={duplicateSuppliers.length}
          isMobileDrawer={true}
          isMobileOpen={isMobileSidebarOpen}
          onCloseMobile={() => setIsMobileSidebarOpen(false)}
        />

        {/* 3. Center Dashboard Directory Area */}
        <main className="flex-1 min-w-0 px-3 sm:px-5 lg:px-8 py-2.5 sm:py-5 pb-24 md:pb-8 overflow-y-auto">
          {/* Mobile Category Horizontal Scrolling Chips */}
          <div className="lg:hidden flex items-center gap-1.5 overflow-x-auto pb-2 mb-2.5 scrollbar-none select-none -mx-3 px-3">
            {(
              [
                'All Suppliers',
                'Bags & Luggage',
                'Garments & Textiles',
                'Toys & Gifts',
                'Electronics',
                'Packaging',
                'Home & Living',
                'Stationery',
                'Machinery',
                'Cosmetics',
                'Accessories',
                'Other',
              ] as SupplierCategory[]
            ).map((cat) => {
              const isSelected = selectedCategory === cat;
              const count = categoryCounts[cat] || 0;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap shrink-0 transition-all flex items-center gap-1.5 border active:scale-95 min-h-[34px] ${
                    isSelected
                      ? 'bg-blue-600 text-white border-blue-600 shadow-2xs font-semibold'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <span>{cat}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-semibold ${
                      isSelected
                        ? 'bg-blue-700 text-white'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}

            {/* Favorites Chip on Mobile */}
            <button
              onClick={() => setSelectedCategory('Favorites')}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap shrink-0 transition-all flex items-center gap-1.5 border active:scale-95 min-h-[34px] ${
                selectedCategory === 'Favorites'
                  ? 'bg-blue-600 text-white border-blue-600 shadow-2xs font-semibold'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
              <span>Favorites</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-semibold ${
                  selectedCategory === 'Favorites'
                    ? 'bg-blue-700 text-white'
                    : 'bg-slate-100 text-slate-500'
                }`}
              >
                {favoritesCount}
              </span>
            </button>

            {/* Duplicate Review Chip on Mobile */}
            <button
              onClick={() => handleCategorySelect('Duplicate Review')}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap shrink-0 transition-all flex items-center gap-1.5 border active:scale-95 min-h-[34px] ${
                selectedCategory === 'Duplicate Review'
                  ? 'bg-amber-600 text-white border-amber-600 shadow-2xs font-semibold'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <CopyCheck className="w-3.5 h-3.5 text-amber-600" />
              <span>Duplicates</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-semibold ${
                  selectedCategory === 'Duplicate Review'
                    ? 'bg-amber-700 text-white'
                    : 'bg-amber-100 text-amber-700'
                }`}
              >
                {duplicateSuppliers.length}
              </span>
            </button>
          </div>

          {/* Top 5 KPI Stat Cards */}
          <StatCards
            stats={stats}
            activeFilter={quickStatFilter}
            onFilterToggle={(type) => {
              setQuickStatFilter((curr) => (curr === type ? null : type));
            }}
          />

          {/* Directory Content Header */}
          <div className="flex items-center justify-between mb-3 sm:mb-4 flex-wrap gap-2">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                  <span>{selectedCategory}</span>
                  <span className="text-[11px] sm:text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                    {displayedSuppliers.length} {displayedSuppliers.length === 1 ? 'Supplier' : 'Suppliers'}
                  </span>
                </h2>
                {searchQuery && (
                  <span className="text-xs font-normal text-slate-500 truncate max-w-[150px] sm:max-w-none">
                    matching "{searchQuery}"
                  </span>
                )}
              </div>
              <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5">
                Browse and manage verified China supplier contacts
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>{suppliers.filter((s) => !s.isDuplicate).length} Verified Records</span>
              </span>
            </div>
          </div>

          {/* Supplier Directory List / Grid */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div
                  key={i}
                  className="bg-white rounded-xl border border-slate-200 p-4 space-y-3 animate-pulse"
                >
                  <div className="w-full aspect-[5/3] bg-slate-200 rounded-lg" />
                  <div className="h-4 bg-slate-200 rounded w-3/4" />
                  <div className="h-3 bg-slate-200 rounded w-1/2" />
                </div>
              ))}
            </div>
          ) : displayedSuppliers.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-8 sm:p-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400 font-bold">
                0
              </div>
              <h3 className="font-bold text-slate-800 text-sm">No suppliers match your criteria</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Try adjusting your search query, clearing filters, or adding a new supplier record.
              </p>
              {hasActiveFilters && (
                <button
                  onClick={handleResetFilters}
                  className="px-4 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-xs font-semibold hover:bg-blue-100 transition-colors"
                >
                  Clear All Filters
                </button>
              )}
            </div>
          ) : viewMode === 'grid' ? (
            /* Responsive Supplier Cards Grid */
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
              {displayedSuppliers.map((supplier) => (
                <SupplierCard
                  key={supplier.id}
                  supplier={supplier}
                  isSelected={selectedSupplier?.id === supplier.id}
                  onSelect={(sup) => setSelectedSupplierId(sup.id)}
                  onToggleFavorite={handleToggleFavorite}
                  onEdit={(sup) => setEditingSupplier(sup)}
                  onDelete={handleDeleteSupplier}
                  onCopyInfo={handleCopyInfo}
                  onReplaceCard={handleOpenReplaceCard}
                />
              ))}

              {/* Responsive Quick-Add Slot when only 1 record exists in category */}
              {displayedSuppliers.length === 1 && selectedCategory !== 'Duplicate Review' && (
                <div
                  onClick={() => setIsAddOpen(true)}
                  className="rounded-xl border border-dashed border-slate-300 bg-white/60 hover:bg-white hover:border-blue-400 hover:shadow-xs transition-all p-4 sm:p-6 flex flex-col items-center justify-center text-center cursor-pointer group min-h-[160px] sm:min-h-[260px]"
                >
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-blue-50 group-hover:bg-blue-100 flex items-center justify-center text-blue-600 mb-2 transition-colors">
                    <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                  <h4 className="font-semibold text-xs text-slate-800 group-hover:text-blue-600 transition-colors">
                    Add Supplier to {selectedCategory === 'All Suppliers' ? 'Directory' : selectedCategory}
                  </h4>
                  <p className="text-[10.5px] sm:text-[11px] text-slate-400 max-w-[200px] mt-0.5">
                    Upload a business card or enter contact details
                  </p>
                </div>
              )}
            </div>
          ) : (
            /* Alternate List View */
            <div className="space-y-2">
              {displayedSuppliers.map((supplier) => (
                <SupplierListRow
                  key={supplier.id}
                  supplier={supplier}
                  isSelected={selectedSupplier?.id === supplier.id}
                  onSelect={(sup: Supplier) => setSelectedSupplierId(sup.id)}
                  onToggleFavorite={handleToggleFavorite}
                  onReplaceCard={handleOpenReplaceCard}
                />
              ))}
            </div>
          )}
        </main>

        {/* 4. Right-side Supplier Details Drawer (Docked on desktop >=1280px) */}
        {selectedSupplier && (
          <div className="hidden xl:block">
            <SupplierDrawer
              supplier={selectedSupplier}
              onClose={() => setSelectedSupplierId(null)}
              onToggleFavorite={handleToggleFavorite}
              onOpenCardViewer={(side) => setViewerModal({ isOpen: true, initialSide: side })}
              onEditSupplier={(sup) => setEditingSupplier(sup)}
              onCopyInfo={handleCopyInfo}
              onReplaceCard={handleOpenReplaceCard}
            />
          </div>
        )}
      </div>

      {/* Mobile & Tablet Slide-in Drawer (<1280px, zero top gap, full-height slide-over) */}
      {selectedSupplier && (
        <div className="xl:hidden fixed inset-0 z-50 flex justify-end animate-in fade-in duration-150">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
            onClick={() => setSelectedSupplierId(null)}
          />
          <div className="relative w-full sm:w-[440px] max-w-full h-full bg-white shadow-2xl flex flex-col z-10 animate-in slide-in-from-right duration-200">
            <SupplierDrawer
              supplier={selectedSupplier}
              onClose={() => setSelectedSupplierId(null)}
              onToggleFavorite={handleToggleFavorite}
              onOpenCardViewer={(side) => setViewerModal({ isOpen: true, initialSide: side })}
              onEditSupplier={(sup) => setEditingSupplier(sup)}
              onCopyInfo={handleCopyInfo}
              onReplaceCard={handleOpenReplaceCard}
            />
          </div>
        </div>
      )}

      {/* 5. Business Card Interactive Full-Screen Modal Viewer */}
      <CardViewerModal
        supplier={selectedSupplier}
        initialSide={viewerModal.initialSide}
        isOpen={viewerModal.isOpen}
        onClose={() => setViewerModal((v) => ({ ...v, isOpen: false }))}
        onReplaceCard={handleOpenReplaceCard}
      />

      {/* 6. Add Supplier Modal */}
      <AddSupplierModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onAdd={handleAddSupplier}
        defaultCategory={
          selectedCategory !== 'Favorites' &&
          selectedCategory !== 'Duplicate Review' &&
          selectedCategory !== 'All Suppliers'
            ? selectedCategory
            : undefined
        }
      />

      {/* 7. Edit Supplier Modal */}
      <EditSupplierModal
        supplier={editingSupplier}
        isOpen={editingSupplier !== null}
        onClose={() => setEditingSupplier(null)}
        onSave={handleSaveSupplier}
      />

      {/* 8. Duplicate Review Modal */}
      <DuplicateReviewModal
        isOpen={isDuplicateReviewOpen}
        onClose={() => setIsDuplicateReviewOpen(false)}
        duplicates={duplicateSuppliers}
        allSuppliers={suppliers}
        onMerge={handleMergeDuplicates}
        onDismiss={handleDismissDuplicate}
      />

      {/* 8b. Mobile-First Business Card Replacement Modal */}
      <ReplaceCardModal
        supplier={replaceCardModal.supplier}
        initialSide={replaceCardModal.initialSide}
        isOpen={replaceCardModal.isOpen}
        onClose={() => setReplaceCardModal((prev) => ({ ...prev, isOpen: false }))}
        onSuccess={handleCardReplacementSuccess}
        onSave={handleSaveCardReplacement}
      />

      {/* 9. Advanced Filters Popover */}
      <FilterPopover
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        supplierType={supplierTypeFilter}
        onSupplierTypeChange={setSupplierTypeFilter}
        province={provinceFilter}
        onProvinceChange={setProvinceFilter}
        hasPhoneOnly={hasPhoneOnly}
        onHasPhoneChange={setHasPhoneOnly}
        hasEmailOnly={hasEmailOnly}
        onHasEmailChange={setHasEmailOnly}
        hasWebsiteOnly={hasWebsiteOnly}
        onHasWebsiteChange={setHasWebsiteOnly}
        onReset={handleResetFilters}
      />

      {/* 10. Sort Popover */}
      <SortMenu
        isOpen={isSortOpen}
        onClose={() => setIsSortOpen(false)}
        currentSort={currentSort}
        onSelectSort={setCurrentSort}
      />

      {/* 11. Mobile Thumb-Friendly Action Dock (<md mobile screens) */}
      <nav
        aria-label="Mobile Navigation"
        className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-200/90 py-1.5 px-3 shadow-lg z-30 flex items-center justify-around pb-safe select-none"
      >
        <button
          onClick={() => setIsMobileSidebarOpen(true)}
          className="flex flex-col items-center justify-center p-1 text-slate-600 hover:text-blue-600 active:scale-95 transition-all min-w-[54px]"
        >
          <FolderTree className="w-5 h-5 mb-0.5 text-slate-500" />
          <span className="text-[10px] font-medium leading-tight">Categories</span>
        </button>

        <button
          onClick={() => handleCategorySelect(selectedCategory === 'Favorites' ? 'All Suppliers' : 'Favorites')}
          className={`flex flex-col items-center justify-center p-1 active:scale-95 transition-all min-w-[54px] relative ${
            selectedCategory === 'Favorites' ? 'text-blue-600 font-semibold' : 'text-slate-600 hover:text-blue-600'
          }`}
        >
          <Star className={`w-5 h-5 mb-0.5 ${selectedCategory === 'Favorites' ? 'fill-amber-400 text-amber-500' : 'text-slate-500'}`} />
          <span className="text-[10px] leading-tight">Favorites</span>
          {favoritesCount > 0 && (
            <span className="absolute top-0 right-2 w-4 h-4 rounded-full bg-blue-600 text-white text-[9px] font-bold flex items-center justify-center">
              {favoritesCount}
            </span>
          )}
        </button>

        {/* Center Primary Action: Add Supplier */}
        <button
          onClick={() => setIsAddOpen(true)}
          className="flex items-center justify-center -mt-4 w-12 h-12 rounded-full bg-slate-900 text-white shadow-lg shadow-slate-900/30 hover:bg-slate-800 active:scale-90 transition-all border-2 border-white"
          title="Add New Supplier"
          aria-label="Add New Supplier"
        >
          <Plus className="w-6 h-6" />
        </button>

        <button
          onClick={() => setIsFilterOpen(true)}
          className={`flex flex-col items-center justify-center p-1 active:scale-95 transition-all min-w-[54px] relative ${
            hasActiveFilters ? 'text-blue-600 font-semibold' : 'text-slate-600 hover:text-blue-600'
          }`}
        >
          <SlidersHorizontal className="w-5 h-5 mb-0.5 text-slate-500" />
          <span className="text-[10px] leading-tight">Filter</span>
          {hasActiveFilters && (
            <span className="absolute top-0.5 right-3 w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
          )}
        </button>

        <button
          onClick={() => setIsSortOpen(true)}
          className="flex flex-col items-center justify-center p-1 text-slate-600 hover:text-blue-600 active:scale-95 transition-all min-w-[54px]"
        >
          <ArrowUpDown className="w-5 h-5 mb-0.5 text-slate-500" />
          <span className="text-[10px] font-medium leading-tight">Sort</span>
        </button>
      </nav>

      {/* Toast Notification Layer */}
      <Toast toasts={toasts} onDismiss={(id) => setToasts((prev) => prev.filter((t) => t.id !== id))} />
    </div>
  );
};

export default App;
