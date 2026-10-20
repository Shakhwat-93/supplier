import React, { useState, useEffect } from 'react';
import {
  X,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Download,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Columns,
} from 'lucide-react';
import { Supplier } from '../types/supplier';

interface CardViewerModalProps {
  supplier: Supplier | null;
  initialSide?: 'front' | 'back';
  isOpen: boolean;
  onClose: () => void;
}

export const CardViewerModal: React.FC<CardViewerModalProps> = ({
  supplier,
  initialSide = 'front',
  isOpen,
  onClose,
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
    const a = document.createElement('a');
    a.href = url;
    a.download = `${supplier.companyName}_Card_${side.toUpperCase()}.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleOpenTab = (side: 'front' | 'back') => {
    const url = side === 'front' ? supplier.cards.frontUrl : supplier.cards.backUrl;
    window.open(url, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-4 sm:p-6 animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl bg-white rounded-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden border border-slate-200">
        {/* Top Control Bar */}
        <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between gap-4 bg-white select-none">
          <div>
            <h3 className="font-bold text-base text-slate-900 leading-tight">
              {supplier.companyName}
            </h3>
            <p className="text-xs text-slate-500">
              High-Definition Business Card Inspector • {supplier.city}, {supplier.province}
            </p>
          </div>

          {/* Center Mode Controls */}
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs font-medium">
            <button
              onClick={() => {
                setViewLayout('single');
                setActiveSide('front');
              }}
              className={`px-3 py-1 rounded-md transition-all ${
                viewLayout === 'single' && activeSide === 'front'
                  ? 'bg-white text-blue-600 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Front Side
            </button>
            <button
              onClick={() => {
                setViewLayout('single');
                setActiveSide('back');
              }}
              className={`px-3 py-1 rounded-md transition-all ${
                viewLayout === 'single' && activeSide === 'back'
                  ? 'bg-white text-blue-600 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Back Side
            </button>
            <button
              onClick={() => setViewLayout('both')}
              className={`hidden md:inline-flex items-center gap-1 px-3 py-1 rounded-md transition-all ${
                viewLayout === 'both'
                  ? 'bg-white text-blue-600 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Columns className="w-3.5 h-3.5" />
              <span>Side by Side</span>
            </button>
          </div>

          {/* Zoom & Action Controls */}
          <div className="flex items-center gap-1.5">
            <div className="hidden sm:flex items-center bg-slate-100 rounded-lg p-0.5 border border-slate-200">
              <button
                onClick={() => setZoom((z) => Math.max(z - 0.25, 0.5))}
                className="p-1.5 text-slate-600 hover:text-slate-900 rounded"
                title="Zoom Out (-)"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <span className="text-xs font-medium text-slate-600 px-2 min-w-[44px] text-center">
                {Math.round(zoom * 100)}%
              </span>
              <button
                onClick={() => setZoom((z) => Math.min(z + 0.25, 3))}
                className="p-1.5 text-slate-600 hover:text-slate-900 rounded"
                title="Zoom In (+)"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button
                onClick={() => setZoom(1)}
                className="p-1.5 text-slate-500 hover:text-slate-800 rounded border-l border-slate-200 ml-1"
                title="Fit to Screen (0)"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>

            <button
              onClick={() => handleDownload(activeSide)}
              className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200"
              title="Download Current Side"
            >
              <Download className="w-4 h-4" />
            </button>

            <button
              onClick={() => handleOpenTab(activeSide)}
              className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200"
              title="Open in New Tab"
            >
              <ExternalLink className="w-4 h-4" />
            </button>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors ml-1"
              title="Close (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Card Stage / Viewer Canvas */}
        <div className="relative flex-1 min-h-[380px] md:min-h-[480px] bg-slate-900/5 p-6 sm:p-10 flex items-center justify-center overflow-auto select-none">
          {viewLayout === 'single' ? (
            <div
              className="transition-transform duration-200 ease-out origin-center"
              style={{ transform: `scale(${zoom})` }}
            >
              <div className="w-[640px] max-w-[85vw] aspect-[16/10] rounded-xl overflow-hidden shadow-2xl border border-slate-300/80 bg-white flex items-center justify-center">
                {activeSide === 'back' && !supplier.cards.backUrl ? (
                  <div className="text-center p-8 text-slate-400">
                    <p className="font-bold text-base text-slate-600">Single-Sided Business Card</p>
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
              className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-full transition-transform duration-200 ease-out origin-center"
              style={{ transform: `scale(${zoom})` }}
            >
              <div className="flex flex-col items-center">
                <div className="w-[460px] max-w-[42vw] aspect-[16/10] rounded-xl overflow-hidden shadow-xl border border-slate-300/80 bg-white">
                  <img
                    src={supplier.cards.frontUrl}
                    alt="Front Card"
                    className="w-full h-full object-contain"
                  />
                </div>
                <span className="mt-2 text-xs font-semibold text-slate-700">
                  Front Side
                </span>
              </div>

              <div className="flex flex-col items-center">
                <div className="w-[460px] max-w-[42vw] aspect-[16/10] rounded-xl overflow-hidden shadow-xl border border-slate-300/80 bg-white flex items-center justify-center">
                  {supplier.cards.backUrl ? (
                    <img
                      src={supplier.cards.backUrl}
                      alt="Back Card"
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <div className="text-center p-4 text-slate-400">
                      <p className="font-semibold text-xs text-slate-600">Single-Sided</p>
                      <p className="text-[10px] text-slate-400">No Back Side</p>
                    </div>
                  )}
                </div>
                <span className="mt-2 text-xs font-semibold text-slate-700">
                  Back Side {supplier.cards.backUrl ? '' : '(N/A)'}
                </span>
              </div>
            </div>
          )}

          {/* Quick Side Switching Arrows (When Single View) */}
          {viewLayout === 'single' && (
            <>
              <button
                onClick={() => setActiveSide(activeSide === 'front' ? 'back' : 'front')}
                className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/95 border border-slate-200 shadow-md flex items-center justify-center text-slate-700 hover:text-blue-600 hover:scale-105 transition-all"
                title="Toggle Side (Arrow Keys)"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={() => setActiveSide(activeSide === 'front' ? 'back' : 'front')}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/95 border border-slate-200 shadow-md flex items-center justify-center text-slate-700 hover:text-blue-600 hover:scale-105 transition-all"
                title="Toggle Side (Arrow Keys)"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </>
          )}
        </div>

        {/* Footer Info */}
        <div className="px-5 py-2.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-4">
            <span>Showing: <strong className="text-slate-800 capitalize">{viewLayout === 'both' ? 'Front & Back Sides' : `${activeSide} Side`}</strong></span>
            <span>Keyboard shortcuts: <kbd className="px-1.5 py-0.5 bg-white border rounded">←</kbd> <kbd className="px-1.5 py-0.5 bg-white border rounded">→</kbd> to flip, <kbd className="px-1.5 py-0.5 bg-white border rounded">Esc</kbd> to close</span>
          </div>
          <div>
            <button
              onClick={() => handleDownload('front')}
              className="text-blue-600 hover:underline font-medium mr-3"
            >
              Export Front SVG
            </button>
            <button
              onClick={() => handleDownload('back')}
              className="text-blue-600 hover:underline font-medium"
            >
              Export Back SVG
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
