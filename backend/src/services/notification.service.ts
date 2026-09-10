import { Notification, type NotificationType } from "../models/Notification";
import { NotFoundError } from "../utils/AppError";
import {
  buildPaginatedResult,
  normalizePagination,
  type PaginatedResult,
} from "../utils/pagination";

interface CreateNotificationInput {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  metadata?: Record<string, unknown>;
}

export async function createNotification(input: CreateNotificationInput) {
  return Notification.create({
    user: input.userId,
    type: input.type,
    channel: "IN_APP",
    title: input.title,
    message: input.message,
    metadata: input.metadata ?? {},
  });
}

export async function listNotifications(
  userId: string,
  page?: number,
  pageSize?: number,
): Promise<PaginatedResult<Record<string, unknown>>> {
  const { page: p, pageSize: ps, skip } = normalizePagination(page, pageSize);

  const [items, totalItems] = await Promise.all([
    Notification.find({ user: userId }).sort({ createdAt: -1 }).skip(skip).limit(ps).lean(),
    Notification.countDocuments({ user: userId }),
  ]);

  const mapped = items.map((item) => {
    const { _id, ...rest } = item;
    return { ...rest, id: String(_id) };
  });
  return buildPaginatedResult(mapped, totalItems, p, ps);
}

export async function markNotificationAsRead(userId: string, notificationId: string) {
  const notification = await Notification.findOneAndUpdate(
    { _id: notificationId, user: userId },
    { isRead: true },
    { new: true },
  );
  if (!notification) {
    throw new NotFoundError("Notification introuvable", "NOTIFICATION_NOT_FOUND");
  }
  return notification;
}

export async function markAllNotificationsAsRead(userId: string) {
  await Notification.updateMany({ user: userId, isRead: false }, { isRead: true });
}
