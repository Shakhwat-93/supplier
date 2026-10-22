import React from 'react';
import { X, AlertTriangle, GitMerge, CheckCircle, ShieldCheck } from 'lucide-react';
import { Supplier } from '../types/supplier';

interface DuplicateReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  duplicates: Supplier[];
  allSuppliers: Supplier[];
  onMerge: (primaryId: string, duplicateId: string) => void;
  onDismiss: (duplicateId: string) => void;
}

export const DuplicateReviewModal: React.FC<DuplicateReviewModalProps> = ({
  isOpen,
  onClose,
  duplicates,
  allSuppliers,
  onMerge,
  onDismiss,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/70 backdrop-blur-xs p-0 sm:p-4 overflow-y-auto animate-in fade-in duration-150">
      <div
        className="fixed inset-0 bg-transparent"
        onClick={onClose}
      />
      <div className="relative w-full sm:max-w-4xl bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl border border-slate-200 overflow-hidden max-h-[92vh] flex flex-col sm:my-8 z-10 animate-in slide-in-from-bottom duration-200">
        {/* Mobile Drag Indicator */}
        <div className="sm:hidden w-full pt-2.5 pb-1 flex justify-center bg-white cursor-pointer select-none" onClick={onClose}>
          <div className="w-12 h-1.5 rounded-full bg-slate-300" />
        </div>

        {/* Header */}
        <div className="px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-200 flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold shrink-0">
              <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-sm sm:text-base text-slate-900 leading-snug truncate">
                Duplicate Review Center ({duplicates.length})
              </h3>
              <p className="text-[11px] sm:text-xs text-slate-500 truncate">
                Resolve suspected duplicate contacts to maintain directory integrity
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 min-w-[36px] min-h-[36px] flex items-center justify-center shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1">
          {duplicates.length === 0 ? (
            <div className="text-center py-10 sm:py-12 space-y-3">
              <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-slate-800 text-sm">No Duplicates Found</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                All supplier records are clean, unique, and verified.
              </p>
            </div>
          ) : (
            duplicates.map((dup) => {
              const primary = allSuppliers.find(
                (s) => !s.isDuplicate && (s.phone === dup.phone || s.website === dup.website || s.companyName.includes(dup.companyName.slice(0, 6)))
              ) || allSuppliers[0];

              return (
                <div
                  key={dup.id}
                  className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 sm:p-4 space-y-3"
                >
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] sm:text-xs font-semibold bg-amber-100 text-amber-800">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      Suspected Match: Same Phone / Domain
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono">
                      ID: {dup.id}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 pt-1">
                    {/* Primary Supplier */}
                    <div className="bg-white p-3 sm:p-3.5 rounded-lg border border-slate-200 shadow-2xs">
                      <span className="text-[10px] sm:text-[11px] font-bold text-blue-600 uppercase tracking-wider block mb-1">
                        Primary Active Record
                      </span>
                      <h4 className="font-bold text-xs sm:text-sm text-slate-900 truncate">
                        {primary.companyName}
                      </h4>
                      <div className="text-xs text-slate-600 mt-1 space-y-0.5">
                        <div>Contact: <span className="font-medium text-slate-800">{primary.contactPerson}</span></div>
                        <div>Phone: <span>{primary.phone}</span></div>
                        {primary.email && <div>Email: <span>{primary.email}</span></div>}
                        <div>Category: <span className="text-blue-600 font-medium">{primary.category}</span></div>
                      </div>
                    </div>

                    {/* Suspected Duplicate */}
                    <div className="bg-white p-3 sm:p-3.5 rounded-lg border border-amber-200 shadow-2xs">
                      <span className="text-[10px] sm:text-[11px] font-bold text-amber-700 uppercase tracking-wider block mb-1">
                        Duplicate Candidate
                      </span>
                      <h4 className="font-bold text-xs sm:text-sm text-slate-900 truncate">
                        {dup.companyName}
                      </h4>
                      <div className="text-xs text-slate-600 mt-1 space-y-0.5">
                        <div>Contact: <span className="font-medium text-slate-800">{dup.contactPerson}</span></div>
                        <div>Phone: <span>{dup.phone}</span></div>
                        {dup.email && <div>Email: <span>{dup.email}</span></div>}
                        <div>Notes: <span className="text-slate-500 italic">{dup.notes}</span></div>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200/60 flex-wrap">
                    <button
                      onClick={() => onDismiss(dup.id)}
                      className="px-3 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 flex items-center gap-1.5 min-h-[38px] active:scale-97"
                    >
                      <CheckCircle className="w-3.5 h-3.5 text-slate-400" />
                      <span>Dismiss Match</span>
                    </button>
                    <button
                      onClick={() => onMerge(primary.id, dup.id)}
                      className="px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs flex items-center gap-1.5 min-h-[38px] active:scale-97"
                    >
                      <GitMerge className="w-3.5 h-3.5" />
                      <span>Merge Into Primary</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-4 sm:px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-end pb-safe">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold hover:bg-slate-800 min-h-[38px] active:scale-97"
          >
            Done Reviewing
          </button>
        </div>
      </div>
    </div>
  );
};
