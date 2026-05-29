export const roles = ['owner', 'admin', 'dev', 'analyst', 'support'] as const;
export type Role = (typeof roles)[number];

export const roleLabels: Record<Role, string> = {
  owner: 'Owner',
  admin: 'Admin',
  dev: 'Developer',
  analyst: 'Analyst',
  support: 'Support'
};
