import React from 'react';
import { X, RotateCcw, Check } from 'lucide-react';
import { SupplierType } from '../types/supplier';

interface FilterPopoverProps {
  isOpen: boolean;
  onClose: () => void;
  supplierType: SupplierType | 'All';
  onSupplierTypeChange: (type: SupplierType | 'All') => void;
  province: string;
  onProvinceChange: (prov: string) => void;
  hasPhoneOnly: boolean;
  onHasPhoneChange: (val: boolean) => void;
  hasEmailOnly: boolean;
  onHasEmailChange: (val: boolean) => void;
  hasWebsiteOnly: boolean;
  onHasWebsiteChange: (val: boolean) => void;
  onReset: () => void;
}

const PROVINCES = [
  'All Provinces',
  'Guangdong',
  'Zhejiang',
  'Jiangsu',
  'Fujian',
  'Shandong',
  'Shanghai',
];

const TYPES: (SupplierType | 'All')[] = [
  'All',
  'Manufacturer',
  'Supplier',
  'Trading Company',
  'Factory',
];

export const FilterPopover: React.FC<FilterPopoverProps> = ({
  isOpen,
  onClose,
  supplierType,
  onSupplierTypeChange,
  province,
  onProvinceChange,
  hasPhoneOnly,
  onHasPhoneChange,
  hasEmailOnly,
  onHasEmailChange,
  hasWebsiteOnly,
  onHasWebsiteChange,
  onReset,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between bg-white">
          <h3 className="font-bold text-sm text-slate-900">
            Filter Suppliers
          </h3>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 text-xs">
          {/* Supplier Type */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1.5">
              Business Type
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              {TYPES.map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => onSupplierTypeChange(type)}
                  className={`px-3 py-2 rounded-lg border text-left font-medium transition-colors ${
                    supplierType === type
                      ? 'bg-blue-50 text-blue-700 border-blue-300 font-semibold'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {type === 'All' ? 'All Types' : type}
                </button>
              ))}
            </div>
          </div>

          {/* Province */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1.5">
              Region / Province
            </label>
            <select
              value={province}
              onChange={(e) => onProvinceChange(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
            >
              {PROVINCES.map((p) => (
                <option key={p} value={p === 'All Provinces' ? '' : p}>
                  {p}
                </option>
              ))}
            </select>
          </div>

          {/* Quick Verification Requirements */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1.5">
              Verification Requirements
            </label>
            <div className="space-y-2">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasPhoneOnly}
                  onChange={(e) => onHasPhoneChange(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                />
                <span className="text-slate-700">Must have phone / mobile number</span>
              </label>

              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasEmailOnly}
                  onChange={(e) => onHasEmailChange(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                />
                <span className="text-slate-700">Must have direct email address</span>
              </label>

              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasWebsiteOnly}
                  onChange={(e) => onHasWebsiteChange(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                />
                <span className="text-slate-700">Must have website link</span>
              </label>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            onClick={onReset}
            className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 font-medium"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Filters</span>
          </button>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1 shadow-xs"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Apply Filters</span>
          </button>
        </div>
      </div>
    </div>
  );
};
