import { Supplier, SupplierCategory, SupplierType } from '../types/supplier';
import { ISupplierRepository } from './supplierRepository';
import { supabase } from './supabaseClient';
import { INITIAL_SUPPLIERS } from '../data/initialSuppliers';
import { authService } from './authService';

interface CsdSupplierRow {
  id: string;
  supplier_code?: string | null;
  company_name: string;
  company_name_cn?: string | null;
  brand?: string | null;
  category_id?: string | null;
  raw_category?: string | null;
  supplier_type: string;
  contact_person: string;
  position?: string | null;
  phone: string;
  has_whatsapp: boolean;
  email?: string | null;
  website?: string | null;
  qq_messaging?: string | null;
  address?: string | null;
  city?: string | null;
  province?: string | null;
  product_range?: string[] | null;
  products_services?: string | null;
  notes?: string | null;
  qr_status?: string | null;
  qr_payload?: string | null;
  verification_status?: string | null;
  business_card_front?: string | null;
  business_card_back?: string | null;
  is_favorite: boolean;
  is_demo?: boolean;
  created_at: string;
  updated_at: string;
}

const CATEGORY_MAP: Record<string, SupplierCategory> = {
  'cat-bags': 'Bags & Luggage',
  'cat-garments': 'Garments & Textiles',
  'cat-toys': 'Toys & Gifts',
  'cat-electronics': 'Electronics',
  'cat-packaging': 'Packaging',
  'cat-home': 'Home & Living',
  'cat-stationery': 'Stationery',
  'cat-machinery': 'Machinery',
  'cat-cosmetics': 'Cosmetics',
  'cat-accessories': 'Accessories',
  'cat-other': 'Other',
};

const REVERSE_CATEGORY_MAP: Record<string, string> = {
  'Bags & Luggage': 'cat-bags',
  'Garments & Textiles': 'cat-garments',
  'Toys & Gifts': 'cat-toys',
  'Electronics': 'cat-electronics',
  'Packaging': 'cat-packaging',
  'Home & Living': 'cat-home',
  'Stationery': 'cat-stationery',
  'Machinery': 'cat-machinery',
  'Cosmetics': 'cat-cosmetics',
  'Accessories': 'cat-accessories',
  'Other': 'cat-other',
};

function rowToSupplier(row: CsdSupplierRow): Supplier {
  const categoryName = (row.category_id && CATEGORY_MAP[row.category_id]) || 'Other';
  return {
    id: row.id,
    supplierCode: row.supplier_code || row.id,
    companyName: row.company_name,
    chineseName: row.company_name_cn || undefined,
    brand: row.brand || undefined,
    category: categoryName,
    rawCategory: row.raw_category || undefined,
    supplierType: (row.supplier_type as SupplierType) || 'Supplier',
    city: row.city || '',
    province: row.province || '',
    contactPerson: row.contact_person,
    position: row.position || undefined,
    phone: row.phone,
    hasWhatsApp: row.has_whatsapp,
    whatsappNumber: row.has_whatsapp ? row.phone : undefined,
    email: row.email || '',
    website: row.website || '',
    qqMessaging: row.qq_messaging || undefined,
    address: row.address || '',
    productRange: row.product_range || [],
    productsServices: row.products_services || undefined,
    notes: row.notes || '',
    qrStatus: row.qr_status || undefined,
    qrPayload: row.qr_payload || undefined,
    verificationStatus: row.verification_status || undefined,
    isFavorite: !!row.is_favorite,
    cards: {
      frontUrl: row.business_card_front || '',
      backUrl: row.business_card_back || '',
    },
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function supplierToRow(supplier: Partial<Supplier> & { id: string }): Partial<CsdSupplierRow> {
  const categoryId = supplier.category ? REVERSE_CATEGORY_MAP[supplier.category] || 'cat-other' : undefined;
  
  const row: Partial<CsdSupplierRow> = {
    id: supplier.id,
  };

  if (supplier.companyName !== undefined) row.company_name = supplier.companyName;
  if (supplier.chineseName !== undefined) row.company_name_cn = supplier.chineseName;
  if (categoryId !== undefined) row.category_id = categoryId;
  if (supplier.supplierType !== undefined) row.supplier_type = supplier.supplierType;
  if (supplier.contactPerson !== undefined) row.contact_person = supplier.contactPerson;
  if (supplier.position !== undefined) row.position = supplier.position;
  if (supplier.phone !== undefined) row.phone = supplier.phone;
  if (supplier.hasWhatsApp !== undefined) row.has_whatsapp = supplier.hasWhatsApp;
  if (supplier.email !== undefined) row.email = supplier.email;
  if (supplier.website !== undefined) row.website = supplier.website;
  if (supplier.address !== undefined) row.address = supplier.address;
  if (supplier.city !== undefined) row.city = supplier.city;
  if (supplier.province !== undefined) row.province = supplier.province;
  if (supplier.productRange !== undefined) row.product_range = supplier.productRange;
  if (supplier.notes !== undefined) row.notes = supplier.notes;
  if (supplier.isFavorite !== undefined) row.is_favorite = supplier.isFavorite;
  if (supplier.supplierCode !== undefined) row.supplier_code = supplier.supplierCode;
  if (supplier.brand !== undefined) row.brand = supplier.brand;
  if (supplier.qqMessaging !== undefined) row.qq_messaging = supplier.qqMessaging;
  if (supplier.rawCategory !== undefined) row.raw_category = supplier.rawCategory;
  if (supplier.productsServices !== undefined) row.products_services = supplier.productsServices;
  if (supplier.qrStatus !== undefined) row.qr_status = supplier.qrStatus;
  if (supplier.qrPayload !== undefined) row.qr_payload = supplier.qrPayload;
  if (supplier.verificationStatus !== undefined) row.verification_status = supplier.verificationStatus;
  if (supplier.cards?.frontUrl !== undefined) row.business_card_front = supplier.cards.frontUrl;
  if (supplier.cards?.backUrl !== undefined) row.business_card_back = supplier.cards.backUrl;

  return row;
}

export class SupabaseSupplierRepository implements ISupplierRepository {
  private isInitialized = false;

  private async ensureInitialized(): Promise<void> {
    if (this.isInitialized) return;
    try {
      // Check if csd_suppliers has data
      const { data, error } = await supabase
        .from('csd_suppliers')
        .select('id')
        .limit(1);

      if (error) {
        console.warn('Supabase check error:', error);
        return;
      }

      // If database table is empty, seed with INITIAL_SUPPLIERS
      if (!data || data.length === 0) {
        console.log('Seeding initial suppliers to Supabase csd_suppliers...');
        const rows = INITIAL_SUPPLIERS.map((s) => ({
          id: s.id,
          company_name: s.companyName,
          company_name_cn: s.chineseName || null,
          category_id: REVERSE_CATEGORY_MAP[s.category] || 'cat-other',
          supplier_type: s.supplierType,
          contact_person: s.contactPerson,
          position: s.position || null,
          phone: s.phone,
          has_whatsapp: !!s.hasWhatsApp,
          email: s.email,
          website: s.website,
          address: s.address,
          city: s.city,
          province: s.province,
          product_range: s.productRange,
          notes: s.notes,
          business_card_front: s.cards.frontUrl,
          business_card_back: s.cards.backUrl,
          is_favorite: s.isFavorite,
          is_demo: true,
          created_at: s.createdAt,
          updated_at: s.updatedAt,
        }));

        const { error: insertError } = await supabase
          .from('csd_suppliers')
          .upsert(rows, { onConflict: 'id' });

        if (insertError) {
          console.error('Failed to seed csd_suppliers:', insertError);
        } else {
          console.log('Successfully seeded csd_suppliers.');
        }
      }
      this.isInitialized = true;
    } catch (e) {
      console.warn('Initialization failed:', e);
    }
  }

  async getAll(): Promise<Supplier[]> {
    await this.ensureInitialized();
    try {
      const { data, error } = await supabase
        .from('csd_suppliers')
        .select('*')
        .order('created_at', { ascending: false });

      if (error || !data) {
        console.warn('Supabase fetch failed, falling back to LocalStorage:', error);
        return this.fallbackGetAll();
      }

      return data.map(rowToSupplier);
    } catch {
      return this.fallbackGetAll();
    }
  }

  async getById(id: string): Promise<Supplier | null> {
    await this.ensureInitialized();
    try {
      const { data, error } = await supabase
        .from('csd_suppliers')
        .select('*')
        .eq('id', id)
        .single();

      if (error || !data) return null;
      return rowToSupplier(data);
    } catch {
      return null;
    }
  }

  async create(newSupplierData: Omit<Supplier, 'id' | 'createdAt' | 'updatedAt'>): Promise<Supplier> {
    await this.ensureInitialized();
    const now = new Date().toISOString();
    const id = `sup-${Date.now()}`;
    const newSupplier: Supplier = {
      ...newSupplierData,
      id,
      createdAt: now,
      updatedAt: now,
    };

    const row = {
      id,
      company_name: newSupplier.companyName,
      company_name_cn: newSupplier.chineseName || null,
      category_id: REVERSE_CATEGORY_MAP[newSupplier.category] || 'cat-other',
      supplier_type: newSupplier.supplierType,
      contact_person: newSupplier.contactPerson,
      position: newSupplier.position || null,
      phone: newSupplier.phone,
      has_whatsapp: !!newSupplier.hasWhatsApp,
      email: newSupplier.email,
      website: newSupplier.website,
      address: newSupplier.address,
      city: newSupplier.city,
      province: newSupplier.province,
      product_range: newSupplier.productRange,
      notes: newSupplier.notes,
      business_card_front: newSupplier.cards?.frontUrl || null,
      business_card_back: newSupplier.cards?.backUrl || null,
      is_favorite: !!newSupplier.isFavorite,
      is_demo: false,
      created_at: now,
      updated_at: now,
    };

    const { error } = await supabase.from('csd_suppliers').insert(row);
    if (error) {
      console.error('Failed to create supplier in Supabase:', error);
      throw error;
    }

    return newSupplier;
  }

  async update(id: string, updates: Partial<Supplier>): Promise<Supplier> {
    await this.ensureInitialized();
    const now = new Date().toISOString();
    const rowUpdates = supplierToRow({ ...updates, id });
    rowUpdates.updated_at = now;

    const { data, error } = await supabase
      .from('csd_suppliers')
      .update(rowUpdates)
      .eq('id', id)
      .select()
      .single();

    if (error || !data) {
      console.error('Failed to update supplier in Supabase:', error);
      throw error || new Error('Update failed');
    }

    return rowToSupplier(data);
  }

  async delete(id: string): Promise<boolean> {
    await this.ensureInitialized();
    const { error } = await supabase.from('csd_suppliers').delete().eq('id', id);
    if (error) {
      console.error('Failed to delete supplier from Supabase:', error);
      return false;
    }
    return true;
  }

  async toggleFavorite(id: string): Promise<boolean> {
    await this.ensureInitialized();
    const current = await this.getById(id);
    if (!current) return false;
    const newStatus = !current.isFavorite;

    const { error } = await supabase
      .from('csd_suppliers')
      .update({ is_favorite: newStatus, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      console.error('Failed to toggle favorite:', error);
      return false;
    }

    // Also sync to csd_favorites table
    if (newStatus) {
      await supabase.from('csd_favorites').upsert({ supplier_id: id });
    } else {
      await supabase.from('csd_favorites').delete().eq('supplier_id', id);
    }

    return newStatus;
  }

  async mergeDuplicates(primaryId: string, duplicateId: string): Promise<Supplier> {
    await this.ensureInitialized();
    const primary = await this.getById(primaryId);
    const duplicate = await this.getById(duplicateId);

    if (!primary || !duplicate) throw new Error('Suppliers not found');

    const merged = await this.update(primaryId, {
      notes: `${primary.notes}\n[Merged info]: ${duplicate.notes}`.trim(),
    });

    await this.delete(duplicateId);
    return merged;
  }

  async dismissDuplicate(_duplicateId: string): Promise<boolean> {
    return true;
  }

  async replaceCardImage(supplierId: string, side: 'front' | 'back', file: File): Promise<Supplier> {
    await this.ensureInitialized();

    // 1. Convert File to base64
    const base64Data = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

    // 2. Obtain auth headers
    const authHeaders = authService.getAuthHeaders();

    // 3. Call server replacement endpoint
    const response = await fetch('/api/supplier/replace-card', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders,
      },
      body: JSON.stringify({
        supplierId,
        side,
        base64Data,
        filename: file.name,
      }),
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      const errorMsg = data?.error || `Card replacement failed with status ${response.status}`;
      console.error('[API ERROR] Failed to replace card image:', errorMsg);
      throw new Error(errorMsg);
    }

    if (!data?.success || !data?.row) {
      throw new Error('Invalid response received from card replacement endpoint');
    }

    const updatedSupplier = rowToSupplier(data.row);

    // Update in fallback localStorage if present
    try {
      const local = localStorage.getItem('china_supplier_directory_v2');
      if (local) {
        const list: Supplier[] = JSON.parse(local);
        const idx = list.findIndex((s) => s.id === supplierId);
        if (idx !== -1) {
          list[idx] = updatedSupplier;
          localStorage.setItem('china_supplier_directory_v2', JSON.stringify(list));
        }
      }
    } catch (e) {
      console.warn('Could not update localStorage fallback cache:', e);
    }

    return updatedSupplier;
  }

  private fallbackGetAll(): Supplier[] {
    try {
      const data = localStorage.getItem('china_supplier_directory_v2');
      if (data) return JSON.parse(data);
    } catch {}
    return INITIAL_SUPPLIERS;
  }
}
