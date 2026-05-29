import { create } from 'zustand';

type FilterValue = string | number | boolean | null | undefined | Date;

interface FilterState {
  values: Record<string, FilterValue>;
  setFilter: (key: string, value: FilterValue) => void;
  reset: () => void;
}

export const useFilters = create<FilterState>((set) => ({
  values: {},
  setFilter: (key, value) => set((state) => ({ values: { ...state.values, [key]: value } })),
  reset: () => set({ values: {} })
}));
