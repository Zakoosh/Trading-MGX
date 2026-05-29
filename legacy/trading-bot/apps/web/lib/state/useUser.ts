import { create } from 'zustand';

import type { Role } from '../auth/roles';

interface UserState {
  name: string;
  role: Role;
  setRole: (role: Role) => void;
  setName: (name: string) => void;
}

export const useUser = create<UserState>((set) => ({
  name: 'المشرف',
  role: 'owner',
  setRole: (role) => set({ role }),
  setName: (name) => set({ name })
}));
