import React from 'react';
import { Heart, MapPin, User, Phone, Mail, Globe, MoreVertical, Camera } from 'lucide-react';
import { Supplier, getCategoryBadgeStyle } from '../types/supplier';

interface SupplierListRowProps {
  supplier: Supplier;
  isSelected: boolean;
  onSelect: (supplier: Supplier) => void;
  onToggleFavorite: (id: string, e: React.MouseEvent) => void;
  onReplaceCard?: (supplier: Supplier, side?: 'front' | 'back') => void;
}

export const SupplierListRow: React.FC<SupplierListRowProps> = ({
  supplier,
  isSelected,
  onSelect,
  onToggleFavorite,
  onReplaceCard,
}) => {
  return (
    <div
      onClick={() => onSelect(supplier)}
      className={`group flex items-center justify-between p-3 sm:p-3.5 bg-white border rounded-xl transition-all cursor-pointer min-h-[56px] active:scale-[0.99] ${
        isSelected
          ? 'border-blue-500 ring-2 ring-blue-500/20 bg-blue-50/20'
          : 'border-slate-200/90 hover:border-slate-300 hover:shadow-2xs'
      }`}
    >
      <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0 mr-2">
        {/* Card Thumbnail */}
        <div className="relative w-14 h-9 sm:w-16 sm:h-10 rounded-md bg-slate-100 border border-slate-200 overflow-hidden shrink-0">
          <img
            src={supplier.cards.frontUrl}
            alt={supplier.companyName}
            className="w-full h-full object-contain p-0.5 bg-white"
            loading="lazy"
          />
        </div>

        {/* Info */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
            <h4 className="font-bold text-xs sm:text-sm text-slate-900 truncate max-w-[200px] sm:max-w-none group-hover:text-blue-600">
              {supplier.companyName}
            </h4>
            <span
              className={`inline-flex px-1.5 sm:px-2 py-0.2 rounded-full text-[10px] sm:text-[11px] font-medium border ${getCategoryBadgeStyle(
                supplier.category
              )}`}
            >
              {supplier.category}
            </span>
            <span className="hidden sm:inline-flex px-1.5 sm:px-2 py-0.2 rounded-full text-[10px] sm:text-[11px] font-medium bg-slate-100 text-slate-600">
              {supplier.supplierType}
            </span>
          </div>

          <div className="flex items-center gap-3 sm:gap-4 text-[11px] sm:text-xs text-slate-500 mt-1 truncate">
            {(supplier.city || supplier.province) && (
              <span className="flex items-center gap-1 shrink-0">
                <MapPin className="w-3 h-3 text-slate-400" />
                <span className="truncate max-w-[120px] sm:max-w-none">{supplier.city}, {supplier.province}</span>
              </span>
            )}
            {supplier.contactPerson && (
              <span className="flex items-center gap-1 shrink-0">
                <User className="w-3 h-3 text-slate-400" />
                <span className="truncate max-w-[100px] sm:max-w-none">{supplier.contactPerson}</span>
              </span>
            )}
            {supplier.phone && (
              <span className="hidden md:flex items-center gap-1 shrink-0">
                <Phone className="w-3 h-3 text-slate-400" />
                <span>{supplier.phone}</span>
              </span>
            )}
            {supplier.email && (
              <span className="hidden lg:flex items-center gap-1 shrink-0">
                <Mail className="w-3 h-3 text-slate-400" />
                <span className="truncate max-w-[150px]">{supplier.email}</span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
        {supplier.website && supplier.website.trim().length > 3 && (
          <a
            href={supplier.website.startsWith('http') ? supplier.website : `https://${supplier.website}`}
            target="_blank"
            rel="noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="hidden sm:flex items-center gap-1 text-xs text-blue-600 hover:underline font-medium p-1.5"
            title={supplier.website}
          >
            <Globe className="w-3.5 h-3.5" />
            <span className="truncate max-w-[120px]">{supplier.website.replace(/^https?:\/\//, '')}</span>
          </a>
        )}

        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite(supplier.id, e);
          }}
          className="p-2 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-slate-100 min-w-[36px] min-h-[36px] flex items-center justify-center active:scale-95 transition-transform"
          title={supplier.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
        >
          <Heart
            className={`w-4 h-4 transition-colors ${
              supplier.isFavorite ? 'fill-rose-500 text-rose-500' : 'text-slate-400'
            }`}
          />
        </button>

        {onReplaceCard && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onReplaceCard(supplier, 'front');
            }}
            className="p-2 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-slate-100 min-w-[36px] min-h-[36px] flex items-center justify-center active:scale-95 transition-transform"
            title="Replace Business Card"
          >
            <Camera className="w-4 h-4" />
          </button>
        )}

        <button
          onClick={(e) => {
            e.stopPropagation();
            onSelect(supplier);
          }}
          className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 min-w-[36px] min-h-[36px] flex items-center justify-center"
          title="More options"
        >
          <MoreVertical className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
