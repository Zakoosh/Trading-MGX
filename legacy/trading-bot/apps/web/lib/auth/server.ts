import { cookies } from 'next/headers';
import type { Role } from './roles';

export async function getCurrentRole(): Promise<Role> {
  const cookieRole = cookies().get('bot-role')?.value;
  const allowed = ['owner', 'admin', 'dev', 'analyst', 'support'];
  if (cookieRole && allowed.includes(cookieRole)) {
    return cookieRole as Role;
  }
  return 'owner';
}
