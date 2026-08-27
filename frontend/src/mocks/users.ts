import type { Role, User, UserStatus } from "@/types/user.types";

const firstNames = [
  "Camille", "Lucas", "Emma", "Nathan", "Chloé", "Louis", "Léa", "Hugo",
  "Manon", "Adam", "Sarah", "Jules", "Inès", "Gabriel", "Zoé", "Raphaël",
  "Alice", "Noah", "Jade", "Arthur",
];
const lastNames = [
  "Martin", "Bernard", "Dubois", "Thomas", "Robert", "Petit", "Durand",
  "Leroy", "Moreau", "Simon", "Laurent", "Lefebvre", "Michel", "Garcia",
  "Roux", "Fontaine", "Girard", "Bonnet", "Vincent", "Rousseau",
];

function createRng(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rng = createRng(7);
const pick = <T>(arr: readonly T[]): T => arr[Math.floor(rng() * arr.length)];
const randInt = (min: number, max: number) => Math.floor(rng() * (max - min + 1)) + min;

function generateUsers(): User[] {
  const users: User[] = [];

  users.push({
    id: "user-admin-1",
    firstName: "Sofia",
    lastName: "Bianchi",
    email: "admin@lumera.example",
    role: "admin",
    status: "active",
    createdAt: new Date(Date.now() - 500 * 86_400_000).toISOString(),
    lastActiveAt: new Date().toISOString(),
    avatarUrl: "https://i.pravatar.cc/150?u=admin-1",
  });

  users.push({
    id: "user-seller-1",
    firstName: "Karim",
    lastName: "Haddad",
    email: "seller@lumera.example",
    role: "seller",
    status: "active",
    createdAt: new Date(Date.now() - 300 * 86_400_000).toISOString(),
    lastActiveAt: new Date(Date.now() - 2 * 86_400_000).toISOString(),
    avatarUrl: "https://i.pravatar.cc/150?u=seller-1",
  });

  users.push({
    id: "user-customer-1",
    firstName: "Marie",
    lastName: "Lefèvre",
    email: "customer@lumera.example",
    role: "customer",
    status: "active",
    createdAt: new Date(Date.now() - 200 * 86_400_000).toISOString(),
    lastActiveAt: new Date(Date.now() - 1 * 86_400_000).toISOString(),
    avatarUrl: "https://i.pravatar.cc/150?u=customer-1",
  });

  const statuses: UserStatus[] = ["active", "active", "active", "pending", "suspended"];
  const roles: Role[] = ["customer", "customer", "customer", "customer", "seller"];

  for (let i = 0; i < 46; i += 1) {
    const firstName = pick(firstNames);
    const lastName = pick(lastNames);
    const id = `user-${(i + 4).toString().padStart(4, "0")}`;
    users.push({
      id,
      firstName,
      lastName,
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}@example.com`,
      role: pick(roles),
      status: pick(statuses),
      createdAt: new Date(Date.now() - randInt(1, 600) * 86_400_000).toISOString(),
      lastActiveAt: new Date(Date.now() - randInt(0, 60) * 86_400_000).toISOString(),
      avatarUrl: `https://i.pravatar.cc/150?u=${id}`,
    });
  }

  return users;
}

export const mockUsers: User[] = generateUsers();

export function getUserById(id: string): User | undefined {
  return mockUsers.find((u) => u.id === id);
}
