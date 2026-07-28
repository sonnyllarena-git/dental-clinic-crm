export type InventoryItemType = 'supply' | 'equipment' | 'medication';

export interface InventorySupplier {
  id: string;
  clinicId: string;
  name: string;
  contactName: string | null;
  email: string | null;
  phone: string | null;
  terms: string | null;
  isActive: boolean;
}

export interface InventoryItem {
  id: string;
  clinicId: string;
  /** Simplified to a plain label rather than a joined category table — only used for grouping/display. */
  category: string;
  supplierId: string;
  name: string;
  sku: string;
  description: string | null;
  itemType: InventoryItemType;
  unitCost: number;
  sellingPrice: number | null;
  currentQuantity: number;
  reorderLevel: number;
  reorderQuantity: number;
  expirationDate: string | null;
  storageLocation: string | null;
  isActive: boolean;
}
