import React from 'react';
import { Heart, MapPin, User, Phone, Mail, Globe, MoreVertical } from 'lucide-react';
import { Supplier, getCategoryBadgeStyle } from '../types/supplier';

interface SupplierListRowProps {
  supplier: Supplier;
  isSelected: boolean;
  onSelect: (supplier: Supplier) => void;
  onToggleFavorite: (id: string, e: React.MouseEvent) => void;
}

export const SupplierListRow: React.FC<SupplierListRowProps> = ({
  supplier,
  isSelected,
  onSelect,
  onToggleFavorite,
}) => {
  return (
    <div
      onClick={() => onSelect(supplier)}
      className={`group flex items-center justify-between p-3.5 bg-white border rounded-xl transition-all cursor-pointer ${
        isSelected
          ? 'border-blue-500 ring-2 ring-blue-500/20 bg-blue-50/10'
          : 'border-slate-200/90 hover:border-slate-300 hover:shadow-xs'
      }`}
    >
      <div className="flex items-center gap-4 flex-1 min-w-0">
        {/* Card Thumbnail */}
        <div className="relative w-16 h-10 rounded-md bg-slate-100 border border-slate-200 overflow-hidden shrink-0">
          <img
            src={supplier.cards.frontUrl}
            alt={supplier.companyName}
            className="w-full h-full object-contain p-0.5 bg-white"
          />
        </div>

        {/* Info */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h4 className="font-bold text-sm text-slate-900 truncate group-hover:text-blue-600">
              {supplier.companyName}
            </h4>
            <span
              className={`hidden sm:inline-flex px-2 py-0.2 rounded-full text-[11px] font-medium border ${getCategoryBadgeStyle(
                supplier.category
              )}`}
            >
              {supplier.category}
            </span>
            <span className="hidden sm:inline-flex px-2 py-0.2 rounded-full text-[11px] font-medium bg-slate-100 text-slate-600">
              {supplier.supplierType}
            </span>
          </div>

          <div className="flex items-center gap-4 text-xs text-slate-500 mt-1 truncate">
            <span className="flex items-center gap-1 shrink-0">
              <MapPin className="w-3 h-3 text-slate-400" />
              {supplier.city}, {supplier.province}
            </span>
            <span className="flex items-center gap-1 shrink-0">
              <User className="w-3 h-3 text-slate-400" />
              {supplier.contactPerson}
            </span>
            <span className="hidden md:flex items-center gap-1 shrink-0">
              <Phone className="w-3 h-3 text-slate-400" />
              {supplier.phone}
            </span>
            <span className="hidden lg:flex items-center gap-1 shrink-0">
              <Mail className="w-3 h-3 text-slate-400" />
              {supplier.email}
            </span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 shrink-0 ml-4">
        <a
          href={supplier.website.startsWith('http') ? supplier.website : `https://${supplier.website}`}
          target="_blank"
          rel="noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="hidden sm:flex items-center gap-1 text-xs text-blue-600 hover:underline font-medium"
        >
          <Globe className="w-3.5 h-3.5" />
          <span className="truncate max-w-[140px]">{supplier.website.replace(/^https?:\/\//, '')}</span>
        </a>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite(supplier.id, e);
          }}
          className="p-1.5 text-slate-400 hover:text-rose-500 rounded-md hover:bg-slate-100"
        >
          <Heart
            className={`w-4 h-4 ${
              supplier.isFavorite ? 'fill-rose-500 text-rose-500' : ''
            }`}
          />
        </button>

        <button
          onClick={(e) => e.stopPropagation()}
          className="p-1.5 text-slate-400 hover:text-slate-600 rounded-md hover:bg-slate-100"
        >
          <MoreVertical className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
