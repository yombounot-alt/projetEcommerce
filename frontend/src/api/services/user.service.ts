import { httpClient } from "@/api/client/axios";
import { env } from "@/app/config/env";
import { PAGE_SIZE_DEFAULT } from "@/constants/app.constants";
import { mockDelay } from "@/lib/mock-delay";
import { getUserById, mockUsers } from "@/mocks/users";
import type { PaginatedResponse } from "@/types/common.types";
import type { Role, User, UserStatus } from "@/types/user.types";

export interface UserListFilters {
  search?: string;
  role?: Role;
  status?: UserStatus;
  page?: number;
  pageSize?: number;
}

function filterUsers(filters: UserListFilters): User[] {
  let results = [...mockUsers];

  if (filters.search) {
    const query = filters.search.trim().toLowerCase();
    results = results.filter(
      (u) =>
        `${u.firstName} ${u.lastName}`.toLowerCase().includes(query) ||
        u.email.toLowerCase().includes(query),
    );
  }

  if (filters.role) {
    results = results.filter((u) => u.role === filters.role);
  }

  if (filters.status) {
    results = results.filter((u) => u.status === filters.status);
  }

  return results;
}

export const userService = {
  async list(filters: UserListFilters = {}): Promise<PaginatedResponse<User>> {
    if (env.useMocks) {
      const page = filters.page ?? 1;
      const pageSize = filters.pageSize ?? PAGE_SIZE_DEFAULT;
      const filtered = filterUsers(filters);
      const start = (page - 1) * pageSize;

      return mockDelay({
        items: filtered.slice(start, start + pageSize),
        pagination: {
          page,
          pageSize,
          totalItems: filtered.length,
          totalPages: Math.max(1, Math.ceil(filtered.length / pageSize)),
        },
      });
    }
    const { data } = await httpClient.get<PaginatedResponse<User>>("/users", { params: filters });
    return data;
  },

  async getById(id: string): Promise<User | null> {
    if (env.useMocks) {
      return mockDelay(getUserById(id) ?? null, 200);
    }
    const { data } = await httpClient.get<User>(`/users/${id}`);
    return data;
  },

  async updateProfile(id: string, changes: Partial<Pick<User, "firstName" | "lastName" | "email">>): Promise<User> {
    if (env.useMocks) {
      const user = getUserById(id);
      if (!user) throw new Error("Utilisateur introuvable.");
      Object.assign(user, changes);
      return mockDelay(user, 300);
    }
    const { data } = await httpClient.patch<User>(`/users/${id}`, changes);
    return data;
  },

  async updateRole(id: string, role: Role): Promise<User> {
    if (env.useMocks) {
      const user = getUserById(id);
      if (!user) throw new Error("Utilisateur introuvable.");
      user.role = role;
      return mockDelay(user, 300);
    }
    const { data } = await httpClient.patch<User>(`/users/${id}/role`, { role });
    return data;
  },

  async updateStatus(id: string, status: UserStatus): Promise<User> {
    if (env.useMocks) {
      const user = getUserById(id);
      if (!user) throw new Error("Utilisateur introuvable.");
      user.status = status;
      return mockDelay(user, 300);
    }
    const { data } = await httpClient.patch<User>(`/users/${id}/status`, { status });
    return data;
  },
};
