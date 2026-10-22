import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  UploadCloud,
  Camera,
  Image as ImageIcon,
  AlertCircle,
  CheckCircle2,
  Trash2,
  RefreshCw,
  Loader2,
  ArrowRightLeft,
} from 'lucide-react';
import { Supplier } from '../types/supplier';
import { validateCardImageFile, MAX_IMAGE_FILE_SIZE_BYTES } from '../services/imageValidation';

interface ReplaceCardModalProps {
  supplier: Supplier | null;
  initialSide?: 'front' | 'back';
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updatedSupplier: Supplier) => void;
  onSave: (supplierId: string, side: 'front' | 'back', file: File) => Promise<Supplier>;
}

export const ReplaceCardModal: React.FC<ReplaceCardModalProps> = ({
  supplier,
  initialSide = 'front',
  isOpen,
  onClose,
  onSuccess,
  onSave,
}) => {
  const [side, setSide] = useState<'front' | 'back'>(initialSide);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [imageMeta, setImageMeta] = useState<{ width?: number; height?: number; sizeKb?: number }>({});
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isValidating, setIsValidating] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Sync side with initialSide prop when opening
  useEffect(() => {
    if (isOpen) {
      setSide(initialSide);
      resetState();
    }
  }, [isOpen, initialSide]);

  // Lock background body scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      const originalStyle = window.getComputedStyle(document.body).overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalStyle;
      };
    }
  }, [isOpen]);

  // Keyboard navigation & Escape key handling
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isSaving) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isSaving, onClose]);

  // Clean up object URLs on unmount/change
  useEffect(() => {
    return () => {
      if (previewUrl && previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const resetState = () => {
    setSelectedFile(null);
    if (previewUrl && previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    setImageMeta({});
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsSaving(false);
    setIsValidating(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
  };

  const handleSwitchSide = (newSide: 'front' | 'back') => {
    if (isSaving) return;
    setSide(newSide);
    resetState();
  };

  const processSelectedFile = async (file: File) => {
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsValidating(true);

    try {
      const validation = await validateCardImageFile(file, MAX_IMAGE_FILE_SIZE_BYTES);
      if (!validation.valid) {
        setErrorMsg(validation.error || 'Invalid file format or size.');
        setIsValidating(false);
        return;
      }

      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        setImageMeta({
          width: img.naturalWidth,
          height: img.naturalHeight,
          sizeKb: Math.round(file.size / 1024),
        });
      };
      img.src = url;

      setSelectedFile(file);
      setPreviewUrl(url);
    } catch (err: any) {
      setErrorMsg('Failed to process image: ' + (err.message || 'Unknown error'));
    } finally {
      setIsValidating(false);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processSelectedFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isSaving) setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (isSaving) return;

    const file = e.dataTransfer.files?.[0];
    if (file) {
      processSelectedFile(file);
    }
  };

  const handleRemoveSelection = () => {
    if (isSaving) return;
    resetState();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplier || !selectedFile || isSaving) return;

    setErrorMsg(null);
    setIsSaving(true);

    try {
      const updated = await onSave(supplier.id, side, selectedFile);
      setSuccessMsg(`Successfully replaced ${side} business card!`);
      setTimeout(() => {
        onSuccess(updated);
        onClose();
      }, 700);
    } catch (err: any) {
      console.error('Failed to replace card:', err);
      setErrorMsg(
        err?.message ||
          'Failed to replace card image. Please verify your network and credentials and try again.'
      );
      setIsSaving(false);
    }
  };

  if (!isOpen || !supplier) return null;

  const currentCardUrl = side === 'front' ? supplier.cards.frontUrl : supplier.cards.backUrl;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/80 backdrop-blur-sm p-0 sm:p-4 animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSaving) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="replace-card-title"
    >
      {/* Mobile Bottom Sheet & Desktop Responsive Dialog */}
      <div className="relative w-full sm:max-w-xl bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl flex flex-col max-h-[92vh] sm:max-h-[90vh] overflow-hidden border border-slate-200/90 animate-in slide-in-from-bottom-8 sm:zoom-in-95 duration-200">
        {/* Mobile Drag Indicator Handle */}
        <div className="sm:hidden pt-3 pb-1 flex justify-center select-none">
          <div className="w-12 h-1.5 bg-slate-300 rounded-full" />
        </div>

        {/* Modal Header */}
        <div className="px-4 sm:px-6 py-3.5 border-b border-slate-200 flex items-center justify-between bg-white select-none">
          <div className="min-w-0 flex-1 pr-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 font-mono text-[11px] font-bold tracking-wider border border-blue-100">
                {supplier.supplierCode || supplier.id}
              </span>
              <h2
                id="replace-card-title"
                className="font-bold text-sm sm:text-base text-slate-900 truncate"
              >
                Replace Business Card
              </h2>
            </div>
            <p className="text-xs text-slate-500 truncate mt-0.5 font-medium">
              {supplier.companyName}
              {supplier.chineseName ? ` • ${supplier.chineseName}` : ''}
            </p>
          </div>

          <button
            onClick={onClose}
            disabled={isSaving}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors disabled:opacity-40 min-w-[36px] min-h-[36px] flex items-center justify-center active:scale-95"
            title="Close dialog"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {/* Side Selector (Front / Back Switcher) */}
          <div className="space-y-1.5">
            <label className="text-[11px] sm:text-xs font-semibold text-slate-600 uppercase tracking-wider block">
              Target Card Side
            </label>
            <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-xl border border-slate-200 select-none">
              <button
                type="button"
                onClick={() => handleSwitchSide('front')}
                disabled={isSaving}
                className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition-all ${
                  side === 'front'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-blue-500" />
                <span>Front Card</span>
              </button>
              <button
                type="button"
                onClick={() => handleSwitchSide('back')}
                disabled={isSaving}
                className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition-all ${
                  side === 'back'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-purple-500" />
                <span>Back Card</span>
                {!supplier.cards.backUrl && (
                  <span className="text-[10px] text-slate-400 font-normal">(Empty)</span>
                )}
              </button>
            </div>
          </div>

          {/* Error Alert Banner */}
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-rose-800 text-xs animate-in fade-in duration-150">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="flex-1 font-medium leading-relaxed">{errorMsg}</div>
            </div>
          )}

          {/* Success Banner */}
          {successMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-emerald-800 text-xs font-medium animate-in fade-in duration-150">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Main Area: Upload Zone or Live Preview */}
          {!selectedFile ? (
            <div className="space-y-3">
              {/* Existing Card Thumbnail if available */}
              {currentCardUrl ? (
                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <img
                      src={currentCardUrl}
                      alt="Current Card"
                      className="w-14 h-9 object-contain rounded bg-white border border-slate-200 shrink-0"
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-slate-700 truncate">
                        Current {side === 'front' ? 'Front' : 'Back'} Card
                      </p>
                      <p className="text-[11px] text-slate-400">
                        Will be replaced upon upload
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-medium text-slate-500 px-2 py-0.5 bg-white border border-slate-200 rounded-md shrink-0">
                    Active Artwork
                  </span>
                </div>
              ) : (
                <div className="p-2.5 bg-amber-50/70 border border-amber-200 rounded-xl text-[11px] text-amber-800 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>No {side} card currently uploaded. Uploading will add new artwork.</span>
                </div>
              )}

              {/* Large Touch-Friendly Drop Zone */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`relative w-full rounded-2xl border-2 border-dashed p-5 sm:p-7 text-center transition-all flex flex-col items-center justify-center gap-3 ${
                  isDragging
                    ? 'border-blue-500 bg-blue-50/50 scale-[0.99]'
                    : 'border-slate-300 hover:border-blue-400 bg-slate-50/70'
                }`}
              >
                <div className="w-12 h-12 rounded-2xl bg-white shadow-sm border border-slate-200 flex items-center justify-center text-blue-600">
                  <UploadCloud className="w-6 h-6" />
                </div>

                <div className="space-y-1 max-w-sm">
                  <p className="text-xs sm:text-sm font-semibold text-slate-800">
                    Drag and drop your {side} card image here
                  </p>
                  <p className="text-[11px] sm:text-xs text-slate-500">
                    Supports JPEG, PNG, and WebP (up to 8 MB)
                  </p>
                </div>

                {/* Mobile Camera & File Selection Action Buttons */}
                <div className="flex flex-col sm:flex-row items-center gap-2 w-full max-w-xs mt-1">
                  {/* Camera Option (Triggers mobile camera directly) */}
                  <button
                    type="button"
                    onClick={() => cameraInputRef.current?.click()}
                    disabled={isValidating || isSaving}
                    className="w-full sm:flex-1 inline-flex items-center justify-center gap-2 py-2 px-3 bg-white hover:bg-slate-100 text-slate-800 text-xs font-semibold rounded-xl border border-slate-200 shadow-2xs active:scale-97 transition-all min-h-[38px]"
                  >
                    <Camera className="w-4 h-4 text-blue-600" />
                    <span>Take Photo</span>
                  </button>

                  {/* Browse Gallery / Files Option */}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isValidating || isSaving}
                    className="w-full sm:flex-1 inline-flex items-center justify-center gap-2 py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-xs active:scale-97 transition-all min-h-[38px]"
                  >
                    <ImageIcon className="w-4 h-4" />
                    <span>Choose File</span>
                  </button>
                </div>

                {/* Hidden File Inputs */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleFileInputChange}
                  className="hidden"
                />
                <input
                  ref={cameraInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  capture="environment"
                  onChange={handleFileInputChange}
                  className="hidden"
                />
              </div>
            </div>
          ) : (
            /* Selected Image Preview Box (Aspect 5:3 with object-contain) */
            <div className="space-y-3 animate-in fade-in zoom-in-98 duration-150">
              <div className="relative w-full aspect-[5/3] rounded-2xl border border-slate-200 bg-slate-900/5 shadow-xs overflow-hidden flex items-center justify-center p-2">
                {previewUrl && (
                  <img
                    src={previewUrl}
                    alt="New Card Preview"
                    className="w-full h-full object-contain rounded-lg"
                  />
                )}

                {/* Top Side Badge */}
                <div className="absolute top-2.5 left-2.5 px-2.5 py-1 rounded-md bg-slate-900/85 backdrop-blur-xs text-white text-[10.5px] font-bold tracking-wider shadow-xs uppercase">
                  New {side} Preview
                </div>

                {/* Dimension & Size Pill */}
                {imageMeta.width && (
                  <div className="absolute bottom-2.5 right-2.5 px-2 py-1 rounded-md bg-slate-900/80 backdrop-blur-xs text-white text-[10px] font-mono shadow-xs">
                    {imageMeta.width} × {imageMeta.height} px • {imageMeta.sizeKb} KB
                  </div>
                )}
              </div>

              {/* File Info Bar with Replace & Remove Actions */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-2">
                <div className="min-w-0 flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-blue-600 shrink-0" />
                  <span className="text-xs font-medium text-slate-800 truncate">
                    {selectedFile.name}
                  </span>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isSaving}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors shadow-2xs active:scale-95"
                    title="Choose a different image"
                  >
                    <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
                    <span>Change</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleRemoveSelection}
                    disabled={isSaving}
                    className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors active:scale-95"
                    title="Remove selection"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Modal Footer Controls */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2.5 pb-safe">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="py-2.5 px-4 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors active:scale-98 min-h-[42px]"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={!selectedFile || isSaving || isValidating}
              className="inline-flex items-center justify-center gap-2 py-2.5 px-5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 text-white text-xs font-semibold rounded-xl shadow-xs active:scale-98 transition-all min-h-[42px] min-w-[130px]"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving to R2...</span>
                </>
              ) : (
                <>
                  <ArrowRightLeft className="w-4 h-4" />
                  <span>Save & Replace</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
