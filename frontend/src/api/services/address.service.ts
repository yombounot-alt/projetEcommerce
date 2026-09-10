import { httpClient } from "@/api/client/axios";
import { env } from "@/app/config/env";
import { mockDelay } from "@/lib/mock-delay";
import type { Address } from "@/types/user.types";

export type AddressInput = Omit<Address, "id">;

let mockAddresses: Address[] = [];

export const addressService = {
  async list(): Promise<Address[]> {
    if (env.useMocks) {
      return mockDelay(mockAddresses, 200);
    }
    const { data } = await httpClient.get<Address[]>("/auth/addresses");
    return data;
  },

  async add(input: AddressInput): Promise<Address> {
    if (env.useMocks) {
      const address: Address = { id: `addr-${Date.now()}`, ...input };
      if (input.isDefault) {
        mockAddresses = mockAddresses.map((a) => ({ ...a, isDefault: false }));
      }
      mockAddresses = [...mockAddresses, address];
      return mockDelay(address, 300);
    }
    const { data } = await httpClient.post<Address>("/auth/addresses", input);
    return data;
  },

  async update(id: string, changes: Partial<AddressInput>): Promise<Address> {
    if (env.useMocks) {
      if (changes.isDefault) {
        mockAddresses = mockAddresses.map((a) => ({ ...a, isDefault: false }));
      }
      const address = mockAddresses.find((a) => a.id === id);
      if (!address) throw new Error("Adresse introuvable.");
      Object.assign(address, changes);
      return mockDelay(address, 300);
    }
    const { data } = await httpClient.patch<Address>(`/auth/addresses/${id}`, changes);
    return data;
  },

  async remove(id: string): Promise<void> {
    if (env.useMocks) {
      mockAddresses = mockAddresses.filter((a) => a.id !== id);
      await mockDelay(undefined, 200);
      return;
    }
    await httpClient.delete(`/auth/addresses/${id}`);
  },
};
