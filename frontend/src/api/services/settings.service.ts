import { httpClient } from "@/api/client/axios";
import { env } from "@/app/config/env";
import { APP_NAME } from "@/constants/app.constants";
import { mockDelay } from "@/lib/mock-delay";

export interface PlatformSettings {
  storeName: string;
  supportEmail: string;
}

let mockSettings: PlatformSettings = {
  storeName: APP_NAME,
  supportEmail: "support@lumera.example",
};

export const settingsService = {
  async get(): Promise<PlatformSettings> {
    if (env.useMocks) {
      return mockDelay(mockSettings, 200);
    }
    const { data } = await httpClient.get<PlatformSettings>("/admin/settings");
    return data;
  },

  async update(changes: Partial<PlatformSettings>): Promise<PlatformSettings> {
    if (env.useMocks) {
      mockSettings = { ...mockSettings, ...changes };
      return mockDelay(mockSettings, 300);
    }
    const { data } = await httpClient.patch<PlatformSettings>("/admin/settings", changes);
    return data;
  },
};
