import { repository } from '@/data';
import { useRepositoryQuery } from './useRepositoryQuery';
import type { InventoryFilters } from '@/data/repository';
import type { InventoryItem, InventorySupplier } from '@/data/types';

export function useInventory(filters: InventoryFilters = {}) {
  return useRepositoryQuery<InventoryItem[]>(
    () => repository.listInventoryItems(filters),
    [filters.category ?? '', filters.belowReorderOnly ?? false],
    [],
  );
}

export function useInventorySuppliers() {
  return useRepositoryQuery<InventorySupplier[]>(() => repository.listInventorySuppliers(), [], []);
}
