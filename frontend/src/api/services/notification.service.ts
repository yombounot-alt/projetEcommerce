import { httpClient } from "@/api/client/axios";
import { env } from "@/app/config/env";
import { mockDelay } from "@/lib/mock-delay";
import type { PaginatedResponse } from "@/types/common.types";
import type { AppNotification } from "@/types/notification.types";

let mockNotifications: AppNotification[] = [
  {
    id: "1",
    type: "ORDER",
    title: "Nouvelle commande",
    message: "Nouvelle commande #LUM-100045 reçue",
    isRead: false,
    createdAt: new Date(Date.now() - 15 * 60_000).toISOString(),
  },
  {
    id: "2",
    type: "ACCOUNT",
    title: "Stock faible",
    message: "Le stock de « Casque audio Pro » est faible",
    isRead: false,
    createdAt: new Date(Date.now() - 3 * 3_600_000).toISOString(),
  },
  {
    id: "3",
    type: "ACCOUNT",
    title: "Nouvel avis",
    message: "Un nouvel avis 5★ a été publié",
    isRead: true,
    createdAt: new Date(Date.now() - 26 * 3_600_000).toISOString(),
  },
];

export const notificationService = {
  async list(page = 1, pageSize = 10): Promise<PaginatedResponse<AppNotification>> {
    if (env.useMocks) {
      const start = (page - 1) * pageSize;
      const items = mockNotifications.slice(start, start + pageSize);
      return mockDelay({
        items,
        pagination: {
          page,
          pageSize,
          totalItems: mockNotifications.length,
          totalPages: Math.max(1, Math.ceil(mockNotifications.length / pageSize)),
        },
      });
    }
    const { data } = await httpClient.get<PaginatedResponse<AppNotification>>("/notifications", {
      params: { page, pageSize },
    });
    return data;
  },

  async markAsRead(id: string): Promise<void> {
    if (env.useMocks) {
      const notification = mockNotifications.find((n) => n.id === id);
      if (notification) notification.isRead = true;
      await mockDelay(undefined, 150);
      return;
    }
    await httpClient.patch(`/notifications/${id}/read`);
  },

  async markAllAsRead(): Promise<void> {
    if (env.useMocks) {
      mockNotifications = mockNotifications.map((n) => ({ ...n, isRead: true }));
      await mockDelay(undefined, 150);
      return;
    }
    await httpClient.patch("/notifications/read-all");
  },
};
