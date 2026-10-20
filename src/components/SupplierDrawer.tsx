import React, { useState } from 'react';
import {
  X,
  Heart,
  MoreHorizontal,
  Maximize2,
  Download,
  ExternalLink,
  Edit,
  ChevronLeft,
  ChevronRight,
  MessageCircle,
  Copy,
  Check,
} from 'lucide-react';
import { Supplier, getCategoryBadgeStyle } from '../types/supplier';

interface SupplierDrawerProps {
  supplier: Supplier | null;
  onClose: () => void;
  onToggleFavorite: (id: string, e: React.MouseEvent) => void;
  onOpenCardViewer: (initialSide: 'front' | 'back') => void;
  onEditSupplier: (supplier: Supplier) => void;
  onCopyInfo: (supplier: Supplier) => void;
}

type TabType = 'overview' | 'card' | 'notes';

export const SupplierDrawer: React.FC<SupplierDrawerProps> = ({
  supplier,
  onClose,
  onToggleFavorite,
  onOpenCardViewer,
  onEditSupplier,
  onCopyInfo,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [activeCardSide, setActiveCardSide] = useState<'front' | 'back'>('front');
  const [copiedField, setCopiedField] = useState<string | null>(null);

  if (!supplier) return null;

  const handleCopy = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleDownloadCard = (side: 'front' | 'back') => {
    const url = side === 'front' ? supplier.cards.frontUrl : supplier.cards.backUrl;
    const a = document.createElement('a');
    a.href = url;
    a.download = `${supplier.companyName.replace(/[^a-zA-Z0-9]/g, '_')}_Card_${side.toUpperCase()}.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleOpenInNewTab = (side: 'front' | 'back') => {
    const url = side === 'front' ? supplier.cards.frontUrl : supplier.cards.backUrl;
    window.open(url, '_blank');
  };

  return (
    <aside className="w-full h-full lg:w-[420px] xl:w-[460px] shrink-0 bg-white lg:border-l border-slate-200/90 lg:h-[calc(100vh-57px)] lg:sticky lg:top-[57px] flex flex-col z-20 shadow-drawer overflow-hidden animate-in slide-in-from-right duration-200">
      {/* Header with Full Non-Truncated Company Name */}
      <div className="p-3 sm:p-4 border-b border-slate-100 flex items-start justify-between gap-2.5 sm:gap-3 bg-white">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 mb-1 flex-wrap">
            <span className="px-2 py-0.5 rounded bg-slate-900 text-white font-mono text-[10.5px] font-bold tracking-wider shadow-2xs">
              {supplier.supplierCode || supplier.id}
            </span>
            {supplier.verificationStatus && (
              <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-amber-50 text-amber-800 border border-amber-200">
                {supplier.verificationStatus}
              </span>
            )}
          </div>
          <h2 className="font-bold text-sm sm:text-base lg:text-lg text-slate-900 break-words leading-snug">
            {supplier.companyName}
          </h2>
          {supplier.chineseName && (
            <p className="text-[11px] sm:text-xs text-slate-500 font-medium mt-0.5">
              {supplier.chineseName}
            </p>
          )}
          {supplier.brand && (
            <p className="text-[11px] text-blue-600 font-semibold mt-0.5">
              Brand: {supplier.brand}
            </p>
          )}
        </div>
        <div className="flex items-center gap-0.5 sm:gap-1 shrink-0 mt-0.5">
          <button
            onClick={(e) => onToggleFavorite(supplier.id, e)}
            className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-slate-50 transition-colors"
            title={supplier.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
          >
            <Heart
              className={`w-4 h-4 sm:w-5 sm:h-5 transition-colors ${
                supplier.isFavorite ? 'fill-rose-500 text-rose-500' : 'text-slate-400'
              }`}
            />
          </button>
          <button
            onClick={() => onCopyInfo(supplier)}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-50 transition-colors"
            title="Copy Contact Information"
          >
            <MoreHorizontal className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-50 transition-colors"
            title="Close Drawer"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center px-3 sm:px-4 border-b border-slate-200/80 bg-white text-xs sm:text-sm font-medium">
        <button
          onClick={() => setActiveTab('overview')}
          className={`py-2.5 sm:py-3 px-2.5 sm:px-3 relative transition-colors ${
            activeTab === 'overview'
              ? 'text-blue-600 font-semibold'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          Overview
          {activeTab === 'overview' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-t" />
          )}
        </button>
        <button
          onClick={() => setActiveTab('card')}
          className={`py-2.5 sm:py-3 px-2.5 sm:px-3 relative transition-colors ${
            activeTab === 'card'
              ? 'text-blue-600 font-semibold'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          Business Card
          {activeTab === 'card' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-t" />
          )}
        </button>
        <button
          onClick={() => setActiveTab('notes')}
          className={`py-2.5 sm:py-3 px-2.5 sm:px-3 relative transition-colors ${
            activeTab === 'notes'
              ? 'text-blue-600 font-semibold'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          Notes
          {activeTab === 'notes' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-t" />
          )}
        </button>
      </div>

      {/* Scrollable Content Body */}
      <div className="flex-1 overflow-y-auto p-3.5 sm:p-4 space-y-4 sm:space-y-6">
        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <>
            {/* Front & Back Business Card Previews */}
            <div className="space-y-2.5 sm:space-y-3">
              <div className="relative group/cards">
                <div className="grid grid-cols-2 gap-2 sm:gap-3">
                  {/* Front Side Card */}
                  <div
                    onClick={() => {
                      setActiveCardSide('front');
                      onOpenCardViewer('front');
                    }}
                    className="cursor-pointer group flex flex-col items-center"
                  >
                    <div className="w-full aspect-[5/3] rounded-lg border border-slate-200/90 shadow-xs overflow-hidden bg-slate-50 hover:shadow-md hover:border-blue-400 transition-all flex items-center justify-center p-1">
                      <img
                        src={supplier.cards.frontUrl}
                        alt={`${supplier.companyName} Front Card`}
                        className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                    <span className="mt-1 text-[11px] sm:text-xs font-semibold text-blue-600">
                      Front Side
                    </span>
                  </div>

                  {/* Back Side Card */}
                  <div
                    onClick={() => {
                      if (supplier.cards.backUrl) {
                        setActiveCardSide('back');
                        onOpenCardViewer('back');
                      }
                    }}
                    className={`group flex flex-col items-center ${
                      supplier.cards.backUrl ? 'cursor-pointer' : 'cursor-default opacity-60'
                    }`}
                  >
                    <div className="w-full aspect-[5/3] rounded-lg border border-slate-200/90 shadow-xs overflow-hidden bg-slate-50 hover:shadow-md hover:border-blue-400 transition-all flex items-center justify-center p-1">
                      {supplier.cards.backUrl ? (
                        <img
                          src={supplier.cards.backUrl}
                          alt={`${supplier.companyName} Back Card`}
                          className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="text-center p-2 text-slate-400">
                          <span className="text-[10.5px] font-medium block">Single-Sided</span>
                          <span className="text-[9.5px]">No Back Artwork</span>
                        </div>
                      )}
                    </div>
                    <span className="mt-1 text-[11px] sm:text-xs font-medium text-slate-500">
                      Back Side {supplier.cards.backUrl ? '' : '(N/A)'}
                    </span>
                  </div>
                </div>

                {/* Left/Right Floating Navigation Chevrons */}
                <button
                  onClick={() => {
                    const nextSide = activeCardSide === 'front' ? 'back' : 'front';
                    setActiveCardSide(nextSide);
                  }}
                  className="absolute -left-2 top-[38%] -translate-y-1/2 w-6 h-6 rounded-full bg-white/95 border border-slate-200 shadow-xs flex items-center justify-center text-slate-600 hover:text-slate-900"
                  title="Toggle Front/Back Card"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => {
                    const nextSide = activeCardSide === 'front' ? 'back' : 'front';
                    setActiveCardSide(nextSide);
                  }}
                  className="absolute -right-2 top-[38%] -translate-y-1/2 w-6 h-6 rounded-full bg-white/95 border border-slate-200 shadow-xs flex items-center justify-center text-slate-600 hover:text-slate-900"
                  title="Toggle Front/Back Card"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* QR Code Decoded Banner */}
              {supplier.qrPayload && (
                <div className="p-3 bg-emerald-50/80 border border-emerald-200/90 rounded-xl space-y-1.5 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      Decoded QR Code Link
                    </span>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-700 bg-emerald-100/90 px-2 py-0.5 rounded-full border border-emerald-200">
                      {supplier.qrPayload.includes('wa.me') ? 'WhatsApp' : 'WeChat'}
                    </span>
                  </div>
                  <a
                    href={supplier.qrPayload}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-mono font-medium text-emerald-700 hover:text-emerald-900 break-all underline"
                  >
                    <span>{supplier.qrPayload}</span>
                    <ExternalLink className="w-3 h-3 shrink-0" />
                  </a>
                </div>
              )}

              {/* Action Buttons Row (Responsive text to eliminate truncation) */}
              <div className="grid grid-cols-3 gap-1.5 sm:gap-2 pt-0.5 text-xs">
                <button
                  onClick={() => onOpenCardViewer(activeCardSide)}
                  className="inline-flex items-center justify-center gap-1 sm:gap-1.5 py-1.5 px-1.5 sm:px-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-700 shadow-xs transition-colors"
                  title="View Full Size"
                >
                  <Maximize2 className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <span className="truncate">
                    <span className="hidden sm:inline">View </span>Full Size
                  </span>
                </button>
                <button
                  onClick={() => handleDownloadCard(activeCardSide)}
                  className="inline-flex items-center justify-center gap-1 sm:gap-1.5 py-1.5 px-1.5 sm:px-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-700 shadow-xs transition-colors"
                  title="Download Card"
                >
                  <Download className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <span>Download</span>
                </button>
                <button
                  onClick={() => handleOpenInNewTab(activeCardSide)}
                  className="inline-flex items-center justify-center gap-1 sm:gap-1.5 py-1.5 px-1.5 sm:px-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-700 shadow-xs transition-colors"
                  title="Open in New Tab"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <span className="truncate">
                    <span className="hidden sm:inline">Open in </span>New Tab
                  </span>
                </button>
              </div>
            </div>

            {/* Contact Information Section */}
            <div className="pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-sm sm:text-[15px] text-slate-900">
                  Contact Information
                </h3>
                <button
                  onClick={() => onEditSupplier(supplier)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors shadow-xs"
                >
                  <Edit className="w-3.5 h-3.5 text-slate-500" />
                  <span>Edit</span>
                </button>
              </div>

              {/* Aligned Key-Value Details (Responsive vertical stack on mobile, grid on sm+) */}
              <div className="space-y-2 sm:space-y-3 text-xs">
                {/* Company Name */}
                <div className="flex flex-col sm:grid sm:grid-cols-12 gap-0.5 sm:gap-2">
                  <span className="sm:col-span-4 text-[11px] sm:text-xs text-slate-500 font-medium">Company Name</span>
                  <div className="sm:col-span-8 font-medium text-slate-900 break-words">
                    {supplier.companyName}
                    {supplier.chineseName && (
                      <span className="block text-slate-500 font-normal">
                        {supplier.chineseName}
                      </span>
                    )}
                  </div>
                </div>

                {/* Contact Person */}
                <div className="flex flex-col sm:grid sm:grid-cols-12 gap-0.5 sm:gap-2">
                  <span className="sm:col-span-4 text-[11px] sm:text-xs text-slate-500 font-medium">Contact Person</span>
                  <span className="sm:col-span-8 font-medium text-slate-900 break-words">
                    {supplier.contactPerson}
                  </span>
                </div>

                {/* Position */}
                {supplier.position && (
                  <div className="flex flex-col sm:grid sm:grid-cols-12 gap-0.5 sm:gap-2">
                    <span className="sm:col-span-4 text-[11px] sm:text-xs text-slate-500 font-medium">Position</span>
                    <span className="sm:col-span-8 text-slate-800 break-words">
                      {supplier.position}
                    </span>
                  </div>
                )}

                {/* Phone / WhatsApp */}
                <div className="flex flex-col sm:grid sm:grid-cols-12 gap-0.5 sm:gap-2 sm:items-center">
                  <span className="sm:col-span-4 text-[11px] sm:text-xs text-slate-500 font-medium">Phone / WhatsApp</span>
                  <div className="sm:col-span-8 flex items-center gap-2 flex-wrap">
                    <a
                      href={`tel:${supplier.phone}`}
                      className="font-medium text-slate-900 hover:text-blue-600 break-all"
                    >
                      {supplier.phone}
                    </a>
                    {supplier.hasWhatsApp && (
                      <a
                        href={`https://wa.me/${supplier.phone.replace(/[^0-9]/g, '')}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors"
                      >
                        <MessageCircle className="w-3 h-3 fill-emerald-600 text-emerald-600" />
                        <span>WhatsApp</span>
                      </a>
                    )}
                    <button
                      onClick={() => handleCopy(supplier.phone, 'phone')}
                      className="p-1 text-slate-400 hover:text-slate-600"
                      title="Copy phone"
                    >
                      {copiedField === 'phone' ? (
                        <Check className="w-3 h-3 text-emerald-600" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Email (Conditional) */}
                {supplier.email && (
                  <div className="flex flex-col sm:grid sm:grid-cols-12 gap-0.5 sm:gap-2 sm:items-center">
                    <span className="sm:col-span-4 text-[11px] sm:text-xs text-slate-500 font-medium">Email</span>
                    <div className="sm:col-span-8 flex items-center gap-2 min-w-0">
                      <a
                        href={`mailto:${supplier.email}`}
                        title={supplier.email}
                        className="font-medium text-blue-600 hover:underline truncate"
                      >
                        {supplier.email}
                      </a>
                      <button
                        onClick={() => handleCopy(supplier.email, 'email')}
                        className="p-1 text-slate-400 hover:text-slate-600 shrink-0"
                        title="Copy email"
                      >
                        {copiedField === 'email' ? (
                          <Check className="w-3 h-3 text-emerald-600" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {/* Website (Conditional) */}
                {supplier.website && (
                  <div className="flex flex-col sm:grid sm:grid-cols-12 gap-0.5 sm:gap-2 sm:items-center">
                    <span className="sm:col-span-4 text-[11px] sm:text-xs text-slate-500 font-medium">Website</span>
                    <div className="sm:col-span-8 flex items-center gap-2 min-w-0">
                      <a
                        href={supplier.website.startsWith('http') ? supplier.website : `https://${supplier.website}`}
                        target="_blank"
                        rel="noreferrer"
                        title={supplier.website}
                        className="font-medium text-blue-600 hover:underline truncate"
                      >
                        {supplier.website}
                      </a>
                      <ExternalLink className="w-3 h-3 text-slate-400 shrink-0" />
                    </div>
                  </div>
                )}

                {/* QQ / Messaging ID (Conditional) */}
                {supplier.qqMessaging && (
                  <div className="flex flex-col sm:grid sm:grid-cols-12 gap-0.5 sm:gap-2 sm:items-center">
                    <span className="sm:col-span-4 text-[11px] sm:text-xs text-slate-500 font-medium">QQ / Messaging</span>
                    <div className="sm:col-span-8 flex items-center gap-2">
                      <span className="font-mono text-slate-800 text-xs font-medium">
                        {supplier.qqMessaging}
                      </span>
                      <button
                        onClick={() => handleCopy(supplier.qqMessaging!, 'qq')}
                        className="p-1 text-slate-400 hover:text-slate-600"
                        title="Copy QQ ID"
                      >
                        {copiedField === 'qq' ? (
                          <Check className="w-3 h-3 text-emerald-600" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {/* Address */}
                <div className="flex flex-col sm:grid sm:grid-cols-12 gap-0.5 sm:gap-2">
                  <span className="sm:col-span-4 text-[11px] sm:text-xs text-slate-500 font-medium">Address</span>
                  <span className="sm:col-span-8 text-slate-700 leading-relaxed break-words">
                    {supplier.address}
                  </span>
                </div>

                {/* City / Province */}
                <div className="flex flex-col sm:grid sm:grid-cols-12 gap-0.5 sm:gap-2">
                  <span className="sm:col-span-4 text-[11px] sm:text-xs text-slate-500 font-medium">City / Province</span>
                  <span className="sm:col-span-8 text-slate-800">
                    {supplier.city}, {supplier.province}
                  </span>
                </div>

                {/* Category with Dynamic Synchronized Styling */}
                <div className="flex flex-col sm:grid sm:grid-cols-12 gap-0.5 sm:gap-2 sm:items-center">
                  <span className="sm:col-span-4 text-[11px] sm:text-xs text-slate-500 font-medium">Category</span>
                  <div className="sm:col-span-8 flex items-center gap-2 flex-wrap">
                    <span
                      className={`inline-flex px-2.5 py-0.5 rounded-full text-[11px] sm:text-xs font-medium border ${getCategoryBadgeStyle(
                        supplier.category
                      )}`}
                    >
                      {supplier.category}
                    </span>
                    {supplier.rawCategory && supplier.rawCategory !== supplier.category && (
                      <span className="text-[10.5px] text-slate-400">
                        ({supplier.rawCategory})
                      </span>
                    )}
                  </div>
                </div>

                {/* Product Range */}
                <div className="flex flex-col sm:grid sm:grid-cols-12 gap-1 sm:gap-2 sm:items-start pt-0.5">
                  <span className="sm:col-span-4 text-[11px] sm:text-xs text-slate-500 font-medium pt-0.5">Product Range</span>
                  <div className="sm:col-span-8 flex flex-wrap gap-1.5">
                    {supplier.productRange.map((product, idx) => (
                      <span
                        key={idx}
                        className="inline-flex px-2 py-0.5 rounded-md text-[11px] sm:text-[11.5px] bg-slate-100 text-slate-700 font-normal"
                      >
                        {product}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Notes */}
                <div className="flex flex-col sm:grid sm:grid-cols-12 gap-1 sm:gap-2 pt-0.5">
                  <span className="sm:col-span-4 text-[11px] sm:text-xs text-slate-500 font-medium">Notes</span>
                  <p className="sm:col-span-8 text-slate-700 leading-relaxed bg-slate-50 p-2 sm:p-2.5 rounded-lg border border-slate-100 break-words text-[11.5px] sm:text-xs">
                    {supplier.notes}
                  </p>
                </div>
              </div>
            </div>
          </>
        )}

        {/* TAB 2: BUSINESS CARD EXPANDED */}
        {activeTab === 'card' && (
          <div className="space-y-4">
            <div>
              <h4 className="text-[11px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                Front Side
              </h4>
              <div
                onClick={() => onOpenCardViewer('front')}
                className="w-full aspect-[5/3] rounded-xl border border-slate-200 overflow-hidden shadow-xs cursor-pointer hover:border-blue-500 transition-all bg-slate-50 flex items-center justify-center p-1 sm:p-2"
              >
                <img
                  src={supplier.cards.frontUrl}
                  alt={`${supplier.companyName} Front Card`}
                  className="w-full h-full object-contain"
                />
              </div>
            </div>

            <div>
              <h4 className="text-[11px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                Back Side {supplier.cards.backUrl ? '' : '(Not Available)'}
              </h4>
              <div
                onClick={() => {
                  if (supplier.cards.backUrl) onOpenCardViewer('back');
                }}
                className={`w-full aspect-[5/3] rounded-xl border border-slate-200 overflow-hidden shadow-xs bg-slate-50 flex items-center justify-center p-1 sm:p-2 ${
                  supplier.cards.backUrl ? 'cursor-pointer hover:border-blue-500' : 'cursor-default'
                }`}
              >
                {supplier.cards.backUrl ? (
                  <img
                    src={supplier.cards.backUrl}
                    alt={`${supplier.companyName} Back Card`}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="text-center p-4 text-slate-400">
                    <p className="text-xs font-medium">Single-Sided Business Card</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">No back side artwork submitted</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: NOTES */}
        {activeTab === 'notes' && (
          <div className="space-y-3">
            <h4 className="text-[11px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Supplier Notes & Requirements
            </h4>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-700 leading-relaxed break-words">
              {supplier.notes || 'No notes added for this supplier.'}
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};
