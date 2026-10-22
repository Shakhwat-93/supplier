import { Supplier } from '../types/supplier';
import { INITIAL_SUPPLIERS } from '../data/initialSuppliers';
import { SupabaseSupplierRepository } from './supabaseSupplierRepository';

export interface ISupplierRepository {
  getAll(): Promise<Supplier[]>;
  getById(id: string): Promise<Supplier | null>;
  create(supplier: Omit<Supplier, 'id' | 'createdAt' | 'updatedAt'>): Promise<Supplier>;
  update(id: string, updates: Partial<Supplier>): Promise<Supplier>;
  delete(id: string): Promise<boolean>;
  toggleFavorite(id: string): Promise<boolean>;
  mergeDuplicates(primaryId: string, duplicateId: string): Promise<Supplier>;
  dismissDuplicate(duplicateId: string): Promise<boolean>;
  replaceCardImage(supplierId: string, side: 'front' | 'back', file: File): Promise<Supplier>;
}

const STORAGE_KEY = 'china_supplier_directory_v2';

export class LocalStorageSupplierRepository implements ISupplierRepository {
  private getStored(): Supplier[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (!data) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_SUPPLIERS));
        return INITIAL_SUPPLIERS;
      }
      return JSON.parse(data);
    } catch {
      return INITIAL_SUPPLIERS;
    }
  }

  private save(suppliers: Supplier[]): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(suppliers));
    } catch (e) {
      console.warn('LocalStorage save failed:', e);
    }
  }

  async getAll(): Promise<Supplier[]> {
    return this.getStored();
  }

  async getById(id: string): Promise<Supplier | null> {
    const list = this.getStored();
    return list.find((s) => s.id === id) || null;
  }

  async create(newSupplierData: Omit<Supplier, 'id' | 'createdAt' | 'updatedAt'>): Promise<Supplier> {
    const list = this.getStored();
    const now = new Date().toISOString();
    const newSupplier: Supplier = {
      ...newSupplierData,
      id: `sup-${Date.now()}`,
      createdAt: now,
      updatedAt: now,
    };
    const updated = [newSupplier, ...list];
    this.save(updated);
    return newSupplier;
  }

  async update(id: string, updates: Partial<Supplier>): Promise<Supplier> {
    const list = this.getStored();
    const index = list.findIndex((s) => s.id === id);
    if (index === -1) {
      throw new Error(`Supplier with id ${id} not found`);
    }
    const updatedRecord: Supplier = {
      ...list[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    list[index] = updatedRecord;
    this.save(list);
    return updatedRecord;
  }

  async delete(id: string): Promise<boolean> {
    const list = this.getStored();
    const filtered = list.filter((s) => s.id !== id);
    if (filtered.length === list.length) return false;
    this.save(filtered);
    return true;
  }

  async toggleFavorite(id: string): Promise<boolean> {
    const list = this.getStored();
    const supplier = list.find((s) => s.id === id);
    if (!supplier) return false;
    supplier.isFavorite = !supplier.isFavorite;
    supplier.updatedAt = new Date().toISOString();
    this.save(list);
    return supplier.isFavorite;
  }

  async mergeDuplicates(primaryId: string, duplicateId: string): Promise<Supplier> {
    const list = this.getStored();
    const primary = list.find((s) => s.id === primaryId);
    const duplicate = list.find((s) => s.id === duplicateId);
    if (!primary || !duplicate) throw new Error('Suppliers not found');

    primary.notes = `${primary.notes}\n[Merged Duplicate]: ${duplicate.notes}`.trim();
    primary.updatedAt = new Date().toISOString();
    const remaining = list.filter((s) => s.id !== duplicateId);
    this.save(remaining);
    return primary;
  }

  async dismissDuplicate(duplicateId: string): Promise<boolean> {
    const list = this.getStored();
    const target = list.find((s) => s.id === duplicateId);
    if (target) {
      target.isDuplicate = false;
      this.save(list);
      return true;
    }
    return false;
  }

  async replaceCardImage(supplierId: string, side: 'front' | 'back', file: File): Promise<Supplier> {
    const list = this.getStored();
    const supplier = list.find((s) => s.id === supplierId);
    if (!supplier) throw new Error(`Supplier ${supplierId} not found`);

    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

    const updatedCards = {
      ...supplier.cards,
      [side === 'front' ? 'frontUrl' : 'backUrl']: dataUrl,
    };
    supplier.cards = updatedCards;
    supplier.updatedAt = new Date().toISOString();
    this.save(list);
    return supplier;
  }
}

// Export Supabase repository as primary with automatic fallback
export const supplierRepository: ISupplierRepository = new SupabaseSupplierRepository();
