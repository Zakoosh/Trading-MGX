import { create } from 'zustand';

export type Accent = 'cyan' | 'emerald' | 'violet';

interface ThemeState {
  accent: Accent;
  setAccent: (accent: Accent) => void;
}

export const useThemeAccent = create<ThemeState>((set) => ({
  accent: 'cyan',
  setAccent: (accent) => set({ accent })
}));
