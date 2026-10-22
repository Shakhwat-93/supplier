import React, { useState, useEffect } from 'react';
import {
  X,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Download,
  ExternalLink,
  Columns,
  Camera,
} from 'lucide-react';
import { Supplier } from '../types/supplier';

interface CardViewerModalProps {
  supplier: Supplier | null;
  initialSide?: 'front' | 'back';
  isOpen: boolean;
  onClose: () => void;
  onReplaceCard?: (supplier: Supplier, side: 'front' | 'back') => void;
}

export const CardViewerModal: React.FC<CardViewerModalProps> = ({
  supplier,
  initialSide = 'front',
  isOpen,
  onClose,
  onReplaceCard,
}) => {
  const [activeSide, setActiveSide] = useState<'front' | 'back'>(initialSide);
  const [viewLayout, setViewLayout] = useState<'single' | 'both'>('single');
  const [zoom, setZoom] = useState<number>(1);

  useEffect(() => {
    setActiveSide(initialSide);
    setZoom(1);
  }, [initialSide, isOpen]);

  // Keyboard navigation & escape listener
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowLeft') {
        setActiveSide('front');
      } else if (e.key === 'ArrowRight') {
        setActiveSide('back');
      } else if (e.key === '+' || e.key === '=') {
        setZoom((prev) => Math.min(prev + 0.25, 3));
      } else if (e.key === '-') {
        setZoom((prev) => Math.max(prev - 0.25, 0.5));
      } else if (e.key === '0') {
        setZoom(1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !supplier) return null;

  const handleDownload = (side: 'front' | 'back') => {
    const url = side === 'front' ? supplier.cards.frontUrl : supplier.cards.backUrl;
    if (!url) return;
    const a = document.createElement('a');
    a.href = url;
    a.download = `${supplier.companyName.replace(/[^a-zA-Z0-9]/g, '_')}_Card_${side.toUpperCase()}.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleOpenTab = (side: 'front' | 'back') => {
    const url = side === 'front' ? supplier.cards.frontUrl : supplier.cards.backUrl;
    if (url) window.open(url, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-sm p-2 sm:p-4 md:p-6 animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl bg-white rounded-2xl shadow-2xl flex flex-col h-[94vh] sm:h-auto sm:max-h-[92vh] overflow-hidden border border-slate-200">
        {/* Top Header - Mobile Adaptive 2-Row / Desktop 1-Row */}
        <div className="px-3.5 sm:px-5 py-3 border-b border-slate-200 bg-white select-none">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0 flex-1">
              <h3 className="font-bold text-sm sm:text-base text-slate-900 leading-snug truncate">
                {supplier.companyName}
              </h3>
              <p className="text-[11px] sm:text-xs text-slate-500 truncate">
                Card Inspector • {supplier.city}, {supplier.province}
              </p>
            </div>

            {/* Desktop Center Segmented Controls */}
            <div className="hidden sm:inline-flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs font-medium">
              <button
                type="button"
                onClick={() => {
                  setViewLayout('single');
                  setActiveSide('front');
                }}
                className={`px-3 py-1 rounded-md transition-all ${
                  viewLayout === 'single' && activeSide === 'front'
                    ? 'bg-white text-blue-600 shadow-2xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Front Side
              </button>
              <button
                type="button"
                onClick={() => {
                  if (supplier.cards.backUrl) {
                    setViewLayout('single');
                    setActiveSide('back');
                  }
                }}
                disabled={!supplier.cards.backUrl}
                className={`px-3 py-1 rounded-md transition-all ${
                  !supplier.cards.backUrl
                    ? 'text-slate-400 cursor-not-allowed opacity-60'
                    : viewLayout === 'single' && activeSide === 'back'
                    ? 'bg-white text-blue-600 shadow-2xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Back Side
              </button>
              <button
                type="button"
                onClick={() => setViewLayout('both')}
                className={`hidden md:inline-flex items-center gap-1 px-3 py-1 rounded-md transition-all ${
                  viewLayout === 'both'
                    ? 'bg-white text-blue-600 shadow-2xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Columns className="w-3.5 h-3.5" />
                <span>Side by Side</span>
              </button>
            </div>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors min-w-[38px] min-h-[38px] flex items-center justify-center active:scale-95"
              title="Close (Esc)"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Mobile Secondary Row: Segmented Controls on <sm */}
          <div className="sm:hidden mt-2.5 flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs font-medium">
            <button
              type="button"
              onClick={() => {
                setViewLayout('single');
                setActiveSide('front');
              }}
              className={`flex-1 py-1.5 rounded-md text-center transition-all ${
                viewLayout === 'single' && activeSide === 'front'
                  ? 'bg-white text-blue-600 shadow-2xs font-semibold'
                  : 'text-slate-600'
              }`}
            >
              Front Side
            </button>
            <button
              type="button"
              onClick={() => {
                if (supplier.cards.backUrl) {
                  setViewLayout('single');
                  setActiveSide('back');
                }
              }}
              disabled={!supplier.cards.backUrl}
              className={`flex-1 py-1.5 rounded-md text-center transition-all ${
                !supplier.cards.backUrl
                  ? 'text-slate-400 opacity-60'
                  : viewLayout === 'single' && activeSide === 'back'
                  ? 'bg-white text-blue-600 shadow-2xs font-semibold'
                  : 'text-slate-600'
              }`}
            >
              Back Side {supplier.cards.backUrl ? '' : '(N/A)'}
            </button>
          </div>
        </div>

        {/* Card Stage / Viewer Canvas */}
        <div className="relative flex-1 bg-slate-900/5 p-4 sm:p-8 flex items-center justify-center overflow-auto select-none min-h-[300px]">
          {viewLayout === 'single' ? (
            <div
              className="transition-transform duration-200 ease-out origin-center flex items-center justify-center max-w-full"
              style={{ transform: `scale(${zoom})` }}
            >
              <div className="w-[640px] max-w-[90vw] aspect-[5/3] rounded-xl overflow-hidden shadow-2xl border border-slate-300/80 bg-white flex items-center justify-center p-2">
                {activeSide === 'back' && !supplier.cards.backUrl ? (
                  <div className="text-center p-6 text-slate-400">
                    <p className="font-bold text-sm sm:text-base text-slate-600">Single-Sided Business Card</p>
                    <p className="text-xs text-slate-400 mt-1">No back side artwork was submitted for this supplier.</p>
                  </div>
                ) : (
                  <img
                    src={activeSide === 'front' ? supplier.cards.frontUrl : supplier.cards.backUrl}
                    alt={`${supplier.companyName} Card ${activeSide}`}
                    className="w-full h-full object-contain"
                  />
                )}
              </div>
            </div>
          ) : (
            <div
              className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 max-w-full transition-transform duration-200 ease-out origin-center"
              style={{ transform: `scale(${zoom})` }}
            >
              <div className="flex flex-col items-center">
                <div className="w-[460px] max-w-[85vw] md:max-w-[42vw] aspect-[5/3] rounded-xl overflow-hidden shadow-xl border border-slate-300/80 bg-white p-2 flex items-center justify-center">
                  <img
                    src={supplier.cards.frontUrl}
                    alt="Front Card"
                    className="w-full h-full object-contain"
                  />
                </div>
                <span className="mt-2 text-xs font-semibold text-slate-600">Front Side</span>
              </div>

              <div className="flex flex-col items-center">
                <div className="w-[460px] max-w-[85vw] md:max-w-[42vw] aspect-[5/3] rounded-xl overflow-hidden shadow-xl border border-slate-300/80 bg-white p-2 flex items-center justify-center">
                  {supplier.cards.backUrl ? (
                    <img
                      src={supplier.cards.backUrl}
                      alt="Back Card"
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <div className="text-center p-4 text-slate-400">
                      <p className="text-xs font-medium">Single-Sided Card</p>
                    </div>
                  )}
                </div>
                <span className="mt-2 text-xs font-semibold text-slate-600">Back Side</span>
              </div>
            </div>
          )}

          {/* Floating Action Pill at Bottom of Canvas (Thumb-Friendly) */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white/95 backdrop-blur-md border border-slate-200/90 shadow-xl rounded-full px-3 py-1.5 flex items-center gap-1 sm:gap-2 text-xs z-20">
            {/* Zoom controls */}
            <button
              onClick={() => setZoom((z) => Math.max(z - 0.25, 0.5))}
              className="p-1.5 text-slate-600 hover:text-slate-900 active:scale-95 rounded-full hover:bg-slate-100 min-w-[32px] min-h-[32px] flex items-center justify-center"
              title="Zoom Out (-)"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="text-xs font-semibold text-slate-700 px-1 min-w-[42px] text-center select-none">
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={() => setZoom((z) => Math.min(z + 0.25, 3))}
              className="p-1.5 text-slate-600 hover:text-slate-900 active:scale-95 rounded-full hover:bg-slate-100 min-w-[32px] min-h-[32px] flex items-center justify-center"
              title="Zoom In (+)"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              onClick={() => setZoom(1)}
              className="p-1.5 text-slate-400 hover:text-slate-700 active:scale-95 rounded-full hover:bg-slate-100 border-l border-slate-200 pl-2 ml-0.5"
              title="Reset Zoom"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>

            {/* Download & External Tab */}
            <div className="border-l border-slate-200 pl-1.5 sm:pl-2 ml-1 flex items-center gap-1">
              <button
                onClick={() => handleDownload(activeSide)}
                className="p-1.5 text-slate-600 hover:text-slate-900 active:scale-95 rounded-full hover:bg-slate-100 min-w-[32px] min-h-[32px] flex items-center justify-center"
                title="Download Card"
              >
                <Download className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleOpenTab(activeSide)}
                className="p-1.5 text-slate-600 hover:text-slate-900 active:scale-95 rounded-full hover:bg-slate-100 min-w-[32px] min-h-[32px] flex items-center justify-center"
                title="Open in New Tab"
              >
                <ExternalLink className="w-4 h-4" />
              </button>
              {onReplaceCard && (
                <button
                  onClick={() => {
                    onClose();
                    onReplaceCard(supplier, activeSide);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs shadow-xs active:scale-95 ml-1 transition-all"
                  title="Replace Card Image"
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Change Card</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
