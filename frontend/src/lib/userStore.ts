import { Role } from '@/types';

export interface StoredUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: Role;
  isActive: boolean;
  phone?: string;
  createdAt: string;
}

const KEY = 'btw_users';

const isBrowser = () => typeof window !== 'undefined';

export function getUsers(): StoredUser[] {
  if (!isBrowser()) return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '[]');
  } catch {
    return [];
  }
}

function persist(users: StoredUser[]) {
  if (!isBrowser()) return;
  localStorage.setItem(KEY, JSON.stringify(users));
}

export function importUsers(
  incoming: Omit<StoredUser, 'id' | 'isActive' | 'createdAt'>[],
): { imported: number; skipped: number } {
  const existing = getUsers();
  const seenEmails = new Set(existing.map((u) => u.email.toLowerCase()));
  const toAdd: StoredUser[] = [];
  let skipped = 0;

  for (const u of incoming) {
    if (seenEmails.has(u.email.toLowerCase())) { skipped++; continue; }
    toAdd.push({
      ...u,
      id: `u_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      isActive: true,
      createdAt: new Date().toISOString(),
    });
    seenEmails.add(u.email.toLowerCase());
  }

  persist([...existing, ...toAdd]);
  return { imported: toAdd.length, skipped };
}

export function addUser(
  data: Omit<StoredUser, 'id' | 'isActive' | 'createdAt'>,
): StoredUser | null {
  const existing = getUsers();
  if (existing.some((u) => u.email.toLowerCase() === data.email.toLowerCase())) {
    return null;
  }
  const newUser: StoredUser = {
    ...data,
    id: `u_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    isActive: true,
    createdAt: new Date().toISOString(),
  };
  persist([...existing, newUser]);
  return newUser;
}

export function updateUser(id: string, updates: Partial<StoredUser>) {
  persist(getUsers().map((u) => (u.id === id ? { ...u, ...updates } : u)));
}

export function removeUser(id: string) {
  persist(getUsers().filter((u) => u.id !== id));
}

export function clearAllUsers() {
  if (!isBrowser()) return;
  localStorage.removeItem(KEY);
}
