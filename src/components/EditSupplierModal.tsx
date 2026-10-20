import React, { useState, useEffect } from 'react';
import { X, Save, Upload } from 'lucide-react';
import { Supplier, SupplierCategory, SupplierType } from '../types/supplier';
import { imageStorage } from '../services/imageStorageService';

interface EditSupplierModalProps {
  supplier: Supplier | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (id: string, updates: Partial<Supplier>) => void;
}

const CATEGORIES: SupplierCategory[] = [
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
];

export const EditSupplierModal: React.FC<EditSupplierModalProps> = ({
  supplier,
  isOpen,
  onClose,
  onSave,
}) => {
  const [companyName, setCompanyName] = useState('');
  const [chineseName, setChineseName] = useState('');
  const [category, setCategory] = useState<SupplierCategory>('Bags & Luggage');
  const [supplierType, setSupplierType] = useState<SupplierType>('Manufacturer');
  const [contactPerson, setContactPerson] = useState('');
  const [position, setPosition] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [website, setWebsite] = useState('');
  const [city, setCity] = useState('');
  const [province, setProvince] = useState('');
  const [address, setAddress] = useState('');
  const [productTags, setProductTags] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (supplier) {
      setCompanyName(supplier.companyName);
      setChineseName(supplier.chineseName || '');
      setCategory(supplier.category);
      setSupplierType(supplier.supplierType);
      setContactPerson(supplier.contactPerson);
      setPosition(supplier.position || '');
      setPhone(supplier.phone);
      setEmail(supplier.email);
      setWebsite(supplier.website);
      setCity(supplier.city);
      setProvince(supplier.province);
      setAddress(supplier.address);
      setProductTags(supplier.productRange.join(', '));
      setNotes(supplier.notes);
    }
  }, [supplier]);

  if (!isOpen || !supplier) return null;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, side: 'front' | 'back') => {
    const file = e.target.files?.[0];
    if (file) {
      const res = await imageStorage.uploadImage(file, side);
      const updatedCards = {
        ...supplier.cards,
        [side === 'front' ? 'frontUrl' : 'backUrl']: res.url,
      };
      onSave(supplier.id, { cards: updatedCards });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedProducts = productTags
      .split(/[,，\n]/)
      .map((p) => p.trim())
      .filter(Boolean);

    onSave(supplier.id, {
      companyName,
      chineseName: chineseName || undefined,
      category,
      supplierType,
      contactPerson,
      position,
      phone,
      email,
      website,
      city,
      province,
      address,
      productRange: parsedProducts,
      notes,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in duration-150">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-white">
          <h3 className="font-bold text-base text-slate-900">
            Edit Supplier: {supplier.companyName}
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Company Name</label>
              <input
                type="text"
                required
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Chinese Name</label>
              <input
                type="text"
                value={chineseName}
                onChange={(e) => setChineseName(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as SupplierCategory)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Supplier Type</label>
              <select
                value={supplierType}
                onChange={(e) => setSupplierType(e.target.value as SupplierType)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
              >
                <option value="Manufacturer">Manufacturer</option>
                <option value="Supplier">Supplier</option>
                <option value="Trading Company">Trading Company</option>
                <option value="Factory">Factory</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Contact Person</label>
              <input
                type="text"
                required
                value={contactPerson}
                onChange={(e) => setContactPerson(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Position</label>
              <input
                type="text"
                value={position}
                onChange={(e) => setPosition(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Phone</label>
              <input
                type="text"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Website</label>
              <input
                type="text"
                required
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">City</label>
              <input
                type="text"
                required
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Province</label>
              <input
                type="text"
                required
                value={province}
                onChange={(e) => setProvince(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Full Address</label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Product Range (comma-separated)</label>
            <input
              type="text"
              value={productTags}
              onChange={(e) => setProductTags(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Notes</label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
            <span className="font-semibold text-slate-800 block mb-2">Update Card Images</span>
            <div className="grid grid-cols-2 gap-3">
              <label className="flex items-center justify-center gap-1.5 p-2 bg-white border border-dashed border-slate-300 rounded-lg cursor-pointer hover:bg-slate-50 text-[11px] text-slate-600">
                <Upload className="w-3.5 h-3.5" />
                <span>Replace Front Card</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleFileUpload(e, 'front')}
                />
              </label>
              <label className="flex items-center justify-center gap-1.5 p-2 bg-white border border-dashed border-slate-300 rounded-lg cursor-pointer hover:bg-slate-50 text-[11px] text-slate-600">
                <Upload className="w-3.5 h-3.5" />
                <span>Replace Back Card</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleFileUpload(e, 'back')}
                />
              </label>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-600 hover:text-slate-800 text-xs font-semibold rounded-lg hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm flex items-center gap-1.5"
            >
              <Save className="w-4 h-4" />
              <span>Update Supplier</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
