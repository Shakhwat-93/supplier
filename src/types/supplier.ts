export type SupplierCategory =
  | 'All Suppliers'
  | 'Bags & Luggage'
  | 'Garments & Textiles'
  | 'Toys & Gifts'
  | 'Electronics'
  | 'Packaging'
  | 'Home & Living'
  | 'Stationery'
  | 'Machinery'
  | 'Cosmetics'
  | 'Accessories'
  | 'Other';

export type SupplierType = 'Manufacturer' | 'Supplier' | 'Trading Company' | 'Factory';

export interface BusinessCard {
  frontUrl: string;
  backUrl: string;
  frontStorageKey?: string;
  backStorageKey?: string;
  themeColor?: string;
  accentColor?: string;
}

export interface Supplier {
  id: string;
  supplierCode?: string;
  companyName: string;
  chineseName?: string;
  brand?: string;
  category: SupplierCategory;
  rawCategory?: string;
  supplierType: SupplierType;
  city: string;
  province: string;
  contactPerson: string;
  position?: string;
  phone: string;
  hasWhatsApp?: boolean;
  whatsappNumber?: string;
  email: string;
  website: string;
  qqMessaging?: string;
  address: string;
  productRange: string[];
  productsServices?: string;
  notes: string;
  qrStatus?: string;
  qrPayload?: string;
  verificationStatus?: string;
  isFavorite: boolean;
  isDuplicate?: boolean;
  duplicateGroup?: string;
  cards: BusinessCard;
  createdAt: string;
  updatedAt: string;
}

export interface CategoryItem {
  id: SupplierCategory | 'Favorites' | 'Duplicate Review';
  name: string;
  iconName: string;
  color: string;
  badgeBg: string;
}

export type ViewMode = 'grid' | 'list';

export type SortField =
  | 'companyName'
  | 'createdAt'
  | 'city'
  | 'category'
  | 'completeness';

export type SortOrder = 'asc' | 'desc';

export interface FilterState {
  searchQuery: string;
  category: SupplierCategory | 'Favorites' | 'Duplicate Review';
  supplierType?: SupplierType | 'All';
  province?: string;
  hasPhone?: boolean;
  hasEmail?: boolean;
  hasWebsite?: boolean;
}

export interface StatsSummary {
  total: number;
  categoriesCount: number;
  withPhone: number;
  withEmail: number;
  withWebsite: number;
}

export const getCategoryBadgeStyle = (category: SupplierCategory): string => {
  switch (category) {
    case 'Bags & Luggage':
      return 'bg-blue-50 text-blue-600 border-blue-100';
    case 'Garments & Textiles':
      return 'bg-pink-50 text-pink-600 border-pink-100';
    case 'Toys & Gifts':
      return 'bg-amber-50 text-amber-600 border-amber-100';
    case 'Electronics':
      return 'bg-blue-50 text-blue-600 border-blue-100';
    case 'Packaging':
      return 'bg-orange-50 text-orange-600 border-orange-100';
    case 'Machinery':
      return 'bg-sky-50 text-sky-700 border-sky-100';
    case 'Cosmetics':
      return 'bg-rose-50 text-rose-600 border-rose-100';
    case 'Home & Living':
      return 'bg-pink-50 text-pink-600 border-pink-100';
    case 'Stationery':
      return 'bg-yellow-50 text-yellow-700 border-yellow-100';
    case 'Accessories':
      return 'bg-indigo-50 text-indigo-600 border-indigo-100';
    default:
      return 'bg-slate-100 text-slate-600 border-slate-200';
  }
};
