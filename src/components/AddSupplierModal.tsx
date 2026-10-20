import React, { useState } from 'react';
import { X, Plus, Sparkles, Upload } from 'lucide-react';
import { Supplier, SupplierCategory, SupplierType } from '../types/supplier';
import { renderCardFrontSVG, renderCardBackSVG } from '../services/cardRenderer';
import { imageStorage } from '../services/imageStorageService';

interface AddSupplierModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (supplier: Omit<Supplier, 'id' | 'createdAt' | 'updatedAt'>) => void;
  defaultCategory?: SupplierCategory;
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

const PROVINCES = [
  'Guangdong',
  'Zhejiang',
  'Jiangsu',
  'Fujian',
  'Shandong',
  'Shanghai',
  'Hebei',
  'Other',
];

export const AddSupplierModal: React.FC<AddSupplierModalProps> = ({
  isOpen,
  onClose,
  onAdd,
  defaultCategory,
}) => {
  const [companyName, setCompanyName] = useState('');
  const [chineseName, setChineseName] = useState('');
  const [category, setCategory] = useState<SupplierCategory>(defaultCategory || 'Bags & Luggage');
  const [supplierType, setSupplierType] = useState<SupplierType>('Manufacturer');
  const [contactPerson, setContactPerson] = useState('');
  const [position, setPosition] = useState('Sales Manager');
  const [phone, setPhone] = useState('+86 ');
  const [hasWhatsApp, setHasWhatsApp] = useState(true);
  const [email, setEmail] = useState('');
  const [website, setWebsite] = useState('');
  const [city, setCity] = useState('');
  const [province, setProvince] = useState('Guangdong');
  const [address, setAddress] = useState('');
  const [productTags, setProductTags] = useState('');
  const [notes, setNotes] = useState('');
  const [themeColor, setThemeColor] = useState('#0a47a3');
  const [customFrontUrl, setCustomFrontUrl] = useState('');
  const [customBackUrl, setCustomBackUrl] = useState('');

  React.useEffect(() => {
    if (isOpen && defaultCategory) {
      setCategory(defaultCategory);
    }
  }, [isOpen, defaultCategory]);

  if (!isOpen) return null;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, side: 'front' | 'back') => {
    const file = e.target.files?.[0];
    if (file) {
      const res = await imageStorage.uploadImage(file, side);
      if (side === 'front') setCustomFrontUrl(res.url);
      else setCustomBackUrl(res.url);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName.trim() || !contactPerson.trim()) return;

    const initials = companyName
      .split(' ')
      .slice(0, 3)
      .map((w) => w[0]?.toUpperCase())
      .join('') || 'SUP';

    const frontUrl =
      customFrontUrl ||
      renderCardFrontSVG({
        companyName,
        chineseName: chineseName || `${companyName.slice(0, 4)}实业有限公司`,
        logoText: initials,
        contactPerson,
        position,
        phone,
        email,
        website,
        address: address || `${city}, ${province}, China`,
        themeColor,
        accentColor: '#38bdf8',
        style: category === 'Electronics' ? 'tech-dark' : category === 'Toys & Gifts' ? 'playful-toys' : 'navy-corporate',
      });

    const backUrl =
      customBackUrl ||
      renderCardBackSVG({
        companyName,
        chineseName: chineseName || `${companyName.slice(0, 4)}实业有限公司`,
        logoText: initials,
        contactPerson,
        phone,
        email,
        website,
        address: address || `${city}, ${province}, China`,
        themeColor,
        accentColor: '#38bdf8',
        style: category === 'Electronics' ? 'tech-dark' : category === 'Toys & Gifts' ? 'playful-toys' : 'navy-corporate',
      });

    const parsedProducts = productTags
      .split(/[,，\n]/)
      .map((p) => p.trim())
      .filter(Boolean);

    onAdd({
      companyName,
      chineseName: chineseName || undefined,
      category,
      supplierType,
      contactPerson,
      position,
      phone,
      hasWhatsApp,
      whatsappNumber: hasWhatsApp ? phone : undefined,
      email,
      website: website.startsWith('http') ? website : `www.${website.replace(/^www\./, '')}`,
      city: city || 'Guangzhou',
      province,
      address: address || `${city}, ${province}, China`,
      productRange: parsedProducts.length > 0 ? parsedProducts : ['OEM/ODM', 'Custom Production'],
      notes: notes || 'Verified supplier record. Ready for quote inquiry.',
      isFavorite: false,
      cards: {
        frontUrl,
        backUrl,
        themeColor,
      },
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in duration-150">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-white">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              +
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900">
                Add New China Supplier
              </h3>
              <p className="text-xs text-slate-500">
                Create verified contact with auto-generated business card graphics
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto text-xs">
          {/* Company Name & Chinese Name */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Company Name (English) *
              </label>
              <input
                type="text"
                required
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="e.g. Xinhaiya Bags Co., Ltd."
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Chinese Company Name
              </label>
              <input
                type="text"
                value={chineseName}
                onChange={(e) => setChineseName(e.target.value)}
                placeholder="e.g. 新海雅皮具有限公司"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Category & Supplier Type */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Category *
              </label>
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
              <label className="block font-semibold text-slate-700 mb-1">
                Supplier Type *
              </label>
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

          {/* Contact Person & Position */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Contact Person *
              </label>
              <input
                type="text"
                required
                value={contactPerson}
                onChange={(e) => setContactPerson(e.target.value)}
                placeholder="e.g. Lily Luo"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Position / Title
              </label>
              <input
                type="text"
                value={position}
                onChange={(e) => setPosition(e.target.value)}
                placeholder="e.g. Sales Manager"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Phone & WhatsApp */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Phone Number *
              </label>
              <input
                type="text"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+86 136 8888 1234"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
            <div className="flex items-center pt-6">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={hasWhatsApp}
                  onChange={(e) => setHasWhatsApp(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                />
                <span className="font-medium text-slate-700">
                  Number is connected to WhatsApp
                </span>
              </label>
            </div>
          </div>

          {/* Email & Website */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Email Address *
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="contact@company.com"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Website *
              </label>
              <input
                type="text"
                required
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="www.company.com"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Location */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                City *
              </label>
              <input
                type="text"
                required
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="e.g. Guangzhou, Shenzhen, Yiwu"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Province *
              </label>
              <select
                value={province}
                onChange={(e) => setProvince(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
              >
                {PROVINCES.map((prov) => (
                  <option key={prov} value={prov}>
                    {prov}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Full Address */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Full Factory / Office Address
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="e.g. No. 168, Bag Industrial Zone, Huadu District, Guangzhou, China"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          {/* Product Range */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Product Range (comma-separated tags)
            </label>
            <input
              type="text"
              value={productTags}
              onChange={(e) => setProductTags(e.target.value)}
              placeholder="Backpacks, Travel Bags, Handbags, Canvas Bags"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          {/* Sourcing Notes */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Sourcing Notes & Minimum Order Quantity (MOQ)
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Good quality, competitive price. Support OEM/ODM. MOQ: 500 pcs."
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          {/* Business Card Customization / Upload */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-blue-600" />
                Business Card Visual Settings
              </span>
              <div className="flex items-center gap-2">
                <label className="text-slate-500 text-[11px]">Brand Theme:</label>
                <input
                  type="color"
                  value={themeColor}
                  onChange={(e) => setThemeColor(e.target.value)}
                  className="w-6 h-6 rounded cursor-pointer border border-slate-300"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">
                  Upload Front Image (Optional)
                </label>
                <label className="flex items-center justify-center gap-1.5 p-2 bg-white border border-dashed border-slate-300 rounded-lg cursor-pointer hover:bg-slate-50 text-[11px] text-slate-600">
                  <Upload className="w-3.5 h-3.5" />
                  <span>{customFrontUrl ? 'Replace Front' : 'Upload Front'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleFileUpload(e, 'front')}
                  />
                </label>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">
                  Upload Back Image (Optional)
                </label>
                <label className="flex items-center justify-center gap-1.5 p-2 bg-white border border-dashed border-slate-300 rounded-lg cursor-pointer hover:bg-slate-50 text-[11px] text-slate-600">
                  <Upload className="w-3.5 h-3.5" />
                  <span>{customBackUrl ? 'Replace Back' : 'Upload Back'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleFileUpload(e, 'back')}
                  />
                </label>
              </div>
            </div>
          </div>

          {/* Footer Submit */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-600 hover:text-slate-800 text-xs font-semibold rounded-lg hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg shadow-sm flex items-center gap-1.5 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Save Supplier</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
