import { httpClient } from "@/api/client/axios";
import { env } from "@/app/config/env";
import { mockDelay } from "@/lib/mock-delay";
import { getDashboardOverview } from "@/mocks/dashboard";
import type { DashboardOverview } from "@/types/dashboard.types";

export const dashboardService = {
  async getOverview(): Promise<DashboardOverview> {
    if (env.useMocks) {
      return mockDelay(getDashboardOverview(), 400);
    }
    const { data } = await httpClient.get<DashboardOverview>("/dashboard/overview");
    return data;
  },
};
