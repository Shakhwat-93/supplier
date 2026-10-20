import React, { useState } from 'react';
import {
  Heart,
  MapPin,
  User,
  Phone,
  Mail,
  Globe,
  MoreVertical,
  ExternalLink,
  Edit2,
  Trash2,
  Copy,
  ImageOff,
} from 'lucide-react';
import { Supplier, getCategoryBadgeStyle } from '../types/supplier';

interface SupplierCardProps {
  supplier: Supplier;
  isSelected: boolean;
  onSelect: (supplier: Supplier) => void;
  onToggleFavorite: (id: string, e: React.MouseEvent) => void;
  onEdit?: (supplier: Supplier) => void;
  onDelete?: (id: string) => void;
  onCopyInfo?: (supplier: Supplier) => void;
}

export const SupplierCard: React.FC<SupplierCardProps> = ({
  supplier,
  isSelected,
  onSelect,
  onToggleFavorite,
  onEdit,
  onDelete,
  onCopyInfo,
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const [imgError, setImgError] = useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    };
    if (showMenu) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [showMenu]);

  return (
    <div
      onClick={() => onSelect(supplier)}
      className={`group relative bg-white rounded-xl border transition-all duration-200 cursor-pointer overflow-hidden flex flex-col justify-between ${
        isSelected
          ? 'border-blue-500 ring-2 ring-blue-500/20 shadow-md'
          : 'border-slate-200/90 hover:border-slate-300 hover:shadow-card-hover'
      }`}
    >
      {/* Top Business Card Image Preview (exact 5:3 ratio matching 800x480 card) */}
      <div className="relative w-full aspect-[5/3] bg-slate-50 border-b border-slate-100 overflow-hidden select-none flex items-center justify-center p-1 sm:p-1.5">
        {/* Supplier Code Tag Over Image */}
        <div className="absolute top-2 left-2 sm:top-2.5 sm:left-2.5 px-2 py-0.5 rounded-md bg-slate-900/85 backdrop-blur-xs text-white font-mono text-[10px] font-bold tracking-wider shadow-xs z-10">
          {supplier.supplierCode || supplier.id}
        </div>

        {/* QR Decoded Badge if available */}
        {supplier.qrPayload && (
          <div className="absolute bottom-2 left-2 sm:bottom-2.5 sm:left-2.5 px-2 py-0.5 rounded-md bg-emerald-600/90 backdrop-blur-xs text-white text-[9.5px] font-semibold tracking-tight shadow-xs z-10 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
            {supplier.qrPayload.includes('wa.me') ? 'WhatsApp QR' : 'WeChat QR'}
          </div>
        )}

        {!imgError && supplier.cards.frontUrl ? (
          <img
            src={supplier.cards.frontUrl}
            alt={`${supplier.companyName} Business Card Front`}
            className="w-full h-full object-contain rounded-md shadow-xs transition-transform duration-300 group-hover:scale-[1.02]"
            loading="lazy"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="w-full h-full rounded-md border border-dashed border-slate-200 bg-white flex flex-col items-center justify-center p-3 text-center">
            <ImageOff className="w-5 h-5 text-slate-300 mb-1" />
            <span className="text-[11px] font-semibold text-slate-600 line-clamp-1">
              {supplier.companyName}
            </span>
            <span className="text-[10px] text-slate-400">Card Artwork Pending</span>
          </div>
        )}

        {/* Favorite Heart Button Over Image */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite(supplier.id, e);
          }}
          className="absolute top-2 right-2 sm:top-2.5 sm:right-2.5 w-7 h-7 rounded-full bg-white/95 backdrop-blur-xs border border-slate-200/80 shadow-xs flex items-center justify-center transition-all hover:scale-110 active:scale-95 z-10"
          title={supplier.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
        >
          <Heart
            className={`w-3.5 h-3.5 sm:w-4 sm:h-4 transition-colors ${
              supplier.isFavorite
                ? 'fill-rose-500 text-rose-500'
                : 'text-slate-400 hover:text-rose-500'
            }`}
          />
        </button>
      </div>

      {/* Card Content */}
      <div className="p-3 sm:p-4 space-y-2 sm:space-y-2.5 flex-1 flex flex-col justify-between">
        <div className="space-y-1.5 sm:space-y-2">
          {/* Company Name with 2-line clamp & accessible tooltip */}
          <div>
            <h3
              title={supplier.companyName}
              className="font-bold text-sm sm:text-[15px] text-slate-900 leading-snug line-clamp-2 min-h-[2.25rem] sm:min-h-[2.5rem] break-words group-hover:text-blue-600 transition-colors"
            >
              {supplier.companyName}
            </h3>
          </div>

          {/* Badges: Category & Supplier Type */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] sm:text-xs font-medium border ${getCategoryBadgeStyle(
                supplier.category
              )}`}
            >
              {supplier.category}
            </span>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] sm:text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200/80">
              {supplier.supplierType}
            </span>
          </div>

          {/* Metadata Details */}
          <div className="space-y-1 sm:space-y-1.5 pt-0.5 sm:pt-1 text-[11.5px] sm:text-xs text-slate-600">
            {/* Location */}
            <div className="flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="truncate text-slate-500" title={`${supplier.city}, ${supplier.province}`}>
                {supplier.city}, {supplier.province}
              </span>
            </div>

            {/* Contact Person */}
            <div className="flex items-center gap-2">
              <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="truncate font-medium text-slate-700" title={supplier.contactPerson}>
                {supplier.contactPerson}
              </span>
            </div>

            {/* Phone */}
            <div className="flex items-center gap-2">
              <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <a
                href={`tel:${supplier.phone}`}
                onClick={(e) => e.stopPropagation()}
                title={`Call ${supplier.phone}`}
                className="text-slate-700 hover:text-blue-600 hover:underline truncate"
              >
                {supplier.phone}
              </a>
            </div>

            {/* Email */}
            <div className="flex items-center gap-2">
              <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <a
                href={`mailto:${supplier.email}`}
                onClick={(e) => e.stopPropagation()}
                title={supplier.email}
                className="truncate text-slate-600 hover:text-blue-600 hover:underline"
              >
                {supplier.email}
              </a>
            </div>
          </div>
        </div>

        {/* Website & Overflow Menu */}
        <div className="flex items-center justify-between pt-1.5 sm:pt-2 border-t border-slate-100 text-[11.5px] sm:text-xs">
          <div className="flex items-center gap-2 truncate flex-1 mr-2">
            <Globe className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <a
              href={supplier.website.startsWith('http') ? supplier.website : `https://${supplier.website}`}
              target="_blank"
              rel="noreferrer"
              onClick={(e) => e.stopPropagation()}
              title={supplier.website}
              className="truncate text-blue-600 hover:underline font-medium"
            >
              {supplier.website.replace(/^https?:\/\//, '')}
            </a>
          </div>

          {/* Overflow Action Menu */}
          <div className="relative shrink-0" ref={menuRef}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowMenu(!showMenu);
              }}
              className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              title="More actions"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {showMenu && (
              <div
                onClick={(e) => e.stopPropagation()}
                className="absolute right-0 bottom-full mb-1 w-44 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-20 text-xs text-slate-700"
              >
                <button
                  onClick={() => {
                    setShowMenu(false);
                    onSelect(supplier);
                  }}
                  className="w-full px-3 py-1.5 text-left flex items-center gap-2 hover:bg-slate-50"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                  <span>View Details</span>
                </button>
                {onCopyInfo && (
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      onCopyInfo(supplier);
                    }}
                    className="w-full px-3 py-1.5 text-left flex items-center gap-2 hover:bg-slate-50"
                  >
                    <Copy className="w-3.5 h-3.5 text-slate-400" />
                    <span>Copy Contact Info</span>
                  </button>
                )}
                {onEdit && (
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      onEdit(supplier);
                    }}
                    className="w-full px-3 py-1.5 text-left flex items-center gap-2 hover:bg-slate-50"
                  >
                    <Edit2 className="w-3.5 h-3.5 text-slate-400" />
                    <span>Edit Supplier</span>
                  </button>
                )}
                {onDelete && (
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      onDelete(supplier.id);
                    }}
                    className="w-full px-3 py-1.5 text-left flex items-center gap-2 text-rose-600 hover:bg-rose-50"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                    <span>Delete</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
