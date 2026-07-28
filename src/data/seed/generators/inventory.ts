import type { SeededRandom } from '../prng';
import type { InventorySupplier, InventoryItem, InventoryItemType } from '@/data/types';
import { dateAtDayOffset, toIsoDate } from '../referenceDate';

export interface GeneratedInventory {
  suppliers: InventorySupplier[];
  items: InventoryItem[];
}

const SUPPLIER_NAMES = [
  'MedEquip Philippines Inc.',
  'DentSupply Manila',
  'Smile Solutions Trading',
  'Cavite Dental Depot',
  'Prime Dental Supplies Co.',
  'Manila Dental Warehouse',
];

interface ItemDef {
  name: string;
  category: string;
  itemType: InventoryItemType;
  unitCost: number;
  sellingPrice: number | null;
  hasExpiration: boolean;
}

const ITEM_DEFS: ItemDef[] = [
  { name: 'Nitrile Examination Gloves (M)', category: 'PPE & Disposables', itemType: 'supply', unitCost: 3, sellingPrice: null, hasExpiration: true },
  { name: 'Nitrile Examination Gloves (L)', category: 'PPE & Disposables', itemType: 'supply', unitCost: 3, sellingPrice: null, hasExpiration: true },
  { name: 'Surgical Face Masks', category: 'PPE & Disposables', itemType: 'supply', unitCost: 5, sellingPrice: null, hasExpiration: true },
  { name: 'Disposable Patient Bibs', category: 'PPE & Disposables', itemType: 'supply', unitCost: 4, sellingPrice: null, hasExpiration: false },
  { name: 'Cotton Rolls', category: 'PPE & Disposables', itemType: 'supply', unitCost: 1, sellingPrice: null, hasExpiration: false },
  { name: 'Saliva Ejectors', category: 'PPE & Disposables', itemType: 'supply', unitCost: 2, sellingPrice: null, hasExpiration: false },
  { name: 'Disposable Syringes (3mL)', category: 'PPE & Disposables', itemType: 'supply', unitCost: 6, sellingPrice: null, hasExpiration: true },
  { name: 'Face Shields', category: 'PPE & Disposables', itemType: 'supply', unitCost: 45, sellingPrice: null, hasExpiration: false },
  { name: 'Composite Resin (A2 Shade)', category: 'Restorative Materials', itemType: 'supply', unitCost: 850, sellingPrice: null, hasExpiration: true },
  { name: 'Composite Resin (A3 Shade)', category: 'Restorative Materials', itemType: 'supply', unitCost: 850, sellingPrice: null, hasExpiration: true },
  { name: 'Dental Amalgam Capsules', category: 'Restorative Materials', itemType: 'supply', unitCost: 25, sellingPrice: null, hasExpiration: true },
  { name: 'Glass Ionomer Cement', category: 'Restorative Materials', itemType: 'supply', unitCost: 650, sellingPrice: null, hasExpiration: true },
  { name: 'Bonding Agent', category: 'Restorative Materials', itemType: 'supply', unitCost: 1200, sellingPrice: null, hasExpiration: true },
  { name: 'Etching Gel (37% Phosphoric Acid)', category: 'Restorative Materials', itemType: 'supply', unitCost: 380, sellingPrice: null, hasExpiration: true },
  { name: 'Temporary Filling Material', category: 'Restorative Materials', itemType: 'supply', unitCost: 420, sellingPrice: null, hasExpiration: true },
  { name: 'Dental Cement Mixing Pads', category: 'Restorative Materials', itemType: 'supply', unitCost: 90, sellingPrice: null, hasExpiration: false },
  { name: 'Lidocaine 2% Cartridges', category: 'Anesthetics & Medication', itemType: 'medication', unitCost: 35, sellingPrice: null, hasExpiration: true },
  { name: 'Articaine 4% Cartridges', category: 'Anesthetics & Medication', itemType: 'medication', unitCost: 42, sellingPrice: null, hasExpiration: true },
  { name: 'Topical Anesthetic Gel', category: 'Anesthetics & Medication', itemType: 'medication', unitCost: 280, sellingPrice: null, hasExpiration: true },
  { name: 'Amoxicillin 500mg (Prophylaxis)', category: 'Anesthetics & Medication', itemType: 'medication', unitCost: 8, sellingPrice: null, hasExpiration: true },
  { name: 'Mefenamic Acid 500mg', category: 'Anesthetics & Medication', itemType: 'medication', unitCost: 6, sellingPrice: null, hasExpiration: true },
  { name: 'Endodontic Files (Assorted Sizes)', category: 'Endodontic Supplies', itemType: 'supply', unitCost: 180, sellingPrice: null, hasExpiration: false },
  { name: 'Gutta Percha Points', category: 'Endodontic Supplies', itemType: 'supply', unitCost: 320, sellingPrice: null, hasExpiration: true },
  { name: 'Root Canal Sealer', category: 'Endodontic Supplies', itemType: 'supply', unitCost: 950, sellingPrice: null, hasExpiration: true },
  { name: 'Sodium Hypochlorite Irrigation Solution', category: 'Endodontic Supplies', itemType: 'supply', unitCost: 210, sellingPrice: null, hasExpiration: true },
  { name: 'Paper Points', category: 'Endodontic Supplies', itemType: 'supply', unitCost: 150, sellingPrice: null, hasExpiration: false },
  { name: 'Autoclave Sterilization Pouches', category: 'Sterilization & Instruments', itemType: 'supply', unitCost: 4, sellingPrice: null, hasExpiration: true },
  { name: 'Instrument Cassettes', category: 'Sterilization & Instruments', itemType: 'equipment', unitCost: 1500, sellingPrice: null, hasExpiration: false },
  { name: 'Surface Disinfectant Spray', category: 'Sterilization & Instruments', itemType: 'supply', unitCost: 320, sellingPrice: null, hasExpiration: true },
  { name: 'Ultrasonic Cleaning Solution', category: 'Sterilization & Instruments', itemType: 'supply', unitCost: 480, sellingPrice: null, hasExpiration: true },
  { name: 'Extraction Forceps Set', category: 'Sterilization & Instruments', itemType: 'equipment', unitCost: 3200, sellingPrice: null, hasExpiration: false },
  { name: 'Periodontal Probes', category: 'Sterilization & Instruments', itemType: 'equipment', unitCost: 650, sellingPrice: null, hasExpiration: false },
  { name: 'Intraoral Camera', category: 'Equipment', itemType: 'equipment', unitCost: 45000, sellingPrice: null, hasExpiration: false },
  { name: 'Dental Chair Unit', category: 'Equipment', itemType: 'equipment', unitCost: 320000, sellingPrice: null, hasExpiration: false },
  { name: 'Autoclave Sterilizer', category: 'Equipment', itemType: 'equipment', unitCost: 95000, sellingPrice: null, hasExpiration: false },
  { name: 'Digital X-ray Sensor', category: 'Equipment', itemType: 'equipment', unitCost: 180000, sellingPrice: null, hasExpiration: false },
  { name: 'LED Curing Light', category: 'Equipment', itemType: 'equipment', unitCost: 12000, sellingPrice: null, hasExpiration: false },
  { name: 'Ultrasonic Scaler Unit', category: 'Equipment', itemType: 'equipment', unitCost: 38000, sellingPrice: null, hasExpiration: false },
  { name: 'Air Compressor', category: 'Equipment', itemType: 'equipment', unitCost: 28000, sellingPrice: null, hasExpiration: false },
  { name: 'Amalgamator', category: 'Equipment', itemType: 'equipment', unitCost: 22000, sellingPrice: null, hasExpiration: false },
  { name: 'Prophylaxis Paste', category: 'Restorative Materials', itemType: 'supply', unitCost: 220, sellingPrice: null, hasExpiration: true },
  { name: 'Fluoride Varnish', category: 'Anesthetics & Medication', itemType: 'medication', unitCost: 340, sellingPrice: null, hasExpiration: true },
  { name: 'Rubber Dam Sheets', category: 'Restorative Materials', itemType: 'supply', unitCost: 15, sellingPrice: null, hasExpiration: false },
  { name: 'Matrix Bands', category: 'Restorative Materials', itemType: 'supply', unitCost: 8, sellingPrice: null, hasExpiration: false },
  { name: 'Impression Material (Alginate)', category: 'Restorative Materials', itemType: 'supply', unitCost: 480, sellingPrice: null, hasExpiration: true },
];

const STORAGE_LOCATIONS = ['Supply Room A', 'Supply Room B', 'Sterilization Bay', 'Operatory 1 Cabinet', 'Operatory 2 Cabinet', 'Front Desk Storage'];

export function generateInventory(rng: SeededRandom, clinicId: string): GeneratedInventory {
  const suppliers: InventorySupplier[] = SUPPLIER_NAMES.map((name) => ({
    id: rng.id('supplier'),
    clinicId,
    name,
    contactName: `${rng.pick(['Account Manager', 'Sales Representative'])} ${rng.int(1, 99)}`,
    email: `orders@${name.toLowerCase().replace(/[^a-z]/g, '').slice(0, 15)}.ph`,
    phone: `+63 2 8${rng.int(100, 999)} ${rng.int(1000, 9999)}`,
    terms: rng.pick(['NET15', 'NET30', 'NET45', 'COD']),
    isActive: true,
  }));

  const items: InventoryItem[] = ITEM_DEFS.map((def, index) => {
    const supplier = rng.pick(suppliers);
    const reorderLevel = def.itemType === 'equipment' ? 1 : rng.int(10, 40);
    let currentQuantity = def.itemType === 'equipment' ? reorderLevel + rng.int(0, 3) : reorderLevel + rng.int(5, 120);
    let expirationDate: string | null = def.hasExpiration
      ? toIsoDate(dateAtDayOffset(rng.int(60, 700)))
      : null;

    // --- Stock-state coverage overrides, by fixed index --------------
    if (index === 5) {
      // Below reorder level.
      currentQuantity = Math.max(0, reorderLevel - rng.int(1, 5));
    } else if (index === 10) {
      // Exactly at reorder level — the boundary case.
      currentQuantity = reorderLevel;
    } else if (index === 15) {
      // Out of stock.
      currentQuantity = 0;
    } else if (index === 20) {
      // Expiring within 30 days.
      expirationDate = toIsoDate(dateAtDayOffset(rng.int(5, 29)));
    } else if (index === 25) {
      // Already expired.
      expirationDate = toIsoDate(dateAtDayOffset(-rng.int(5, 60)));
    }

    const item: InventoryItem = {
      id: rng.id('item'),
      clinicId,
      category: def.category,
      supplierId: supplier.id,
      name: def.name,
      sku: `SKU-${String(index + 1).padStart(4, '0')}`,
      description: null,
      itemType: def.itemType,
      unitCost: def.unitCost,
      sellingPrice: def.sellingPrice,
      currentQuantity,
      reorderLevel,
      reorderQuantity: reorderLevel * 2,
      expirationDate,
      storageLocation: rng.pick(STORAGE_LOCATIONS),
      isActive: true,
    };
    return item;
  });

  return { suppliers, items };
}
