import { User, type Role, type UserStatus } from "../models/User";
import { Order } from "../models/Order";
import { ConflictError, ForbiddenError, NotFoundError } from "../utils/AppError";
import {
  buildPaginatedResult,
  normalizePagination,
  type PaginatedResult,
} from "../utils/pagination";

export interface UserListFilters {
  search?: string;
  role?: Role;
  status?: UserStatus;
  page?: number;
  pageSize?: number;
}

export async function listUsers(
  filters: UserListFilters,
): Promise<PaginatedResult<ReturnType<typeof User.prototype.toJSON>>> {
  const query: Record<string, unknown> = {};
  if (filters.role) query.role = filters.role;
  if (filters.status) query.status = filters.status;
  if (filters.search) {
    query.$or = [
      { firstName: new RegExp(filters.search, "i") },
      { lastName: new RegExp(filters.search, "i") },
      { email: new RegExp(filters.search, "i") },
    ];
  }

  const { page, pageSize, skip } = normalizePagination(filters.page, filters.pageSize);
  const [items, totalItems] = await Promise.all([
    User.find(query).sort({ createdAt: -1 }).skip(skip).limit(pageSize),
    User.countDocuments(query),
  ]);

  return buildPaginatedResult(
    items.map((u) => u.toJSON()),
    totalItems,
    page,
    pageSize,
  );
}

/**
 * Customers who have at least one order containing this seller's items (marketplace
 * isolation: a seller must never see the platform's full customer base, only their own
 * buyers — see SellerCustomersPage.tsx).
 */
export async function listSellerCustomers(
  sellerId: string,
  filters: Pick<UserListFilters, "search" | "page" | "pageSize">,
): Promise<PaginatedResult<ReturnType<typeof User.prototype.toJSON>>> {
  const customerIds = await Order.distinct("customer", { "items.seller": sellerId });

  const query: Record<string, unknown> = { _id: { $in: customerIds } };
  if (filters.search) {
    query.$or = [
      { firstName: new RegExp(filters.search, "i") },
      { lastName: new RegExp(filters.search, "i") },
      { email: new RegExp(filters.search, "i") },
    ];
  }

  const { page, pageSize, skip } = normalizePagination(filters.page, filters.pageSize);
  const [items, totalItems] = await Promise.all([
    User.find(query).sort({ createdAt: -1 }).skip(skip).limit(pageSize),
    User.countDocuments(query),
  ]);

  return buildPaginatedResult(
    items.map((u) => u.toJSON()),
    totalItems,
    page,
    pageSize,
  );
}

export async function getUserById(id: string) {
  const user = await User.findById(id);
  if (!user) throw new NotFoundError("Utilisateur introuvable", "USER_NOT_FOUND");
  return user;
}

export async function updateUserRole(id: string, role: Role, actorId: string) {
  const user = await User.findById(id);
  if (!user) throw new NotFoundError("Utilisateur introuvable", "USER_NOT_FOUND");

  if (user.role === "admin" && role !== "admin") {
    if (id === actorId) {
      throw new ForbiddenError(
        "Vous ne pouvez pas retirer votre propre rôle administrateur",
        "CANNOT_SELF_DEMOTE",
      );
    }
    const otherAdminCount = await User.countDocuments({ role: "admin", _id: { $ne: id } });
    if (otherAdminCount === 0) {
      throw new ConflictError(
        "Impossible de retirer le dernier administrateur de la plateforme",
        "LAST_ADMIN_PROTECTED",
      );
    }
  }

  user.role = role;
  await user.save();
  return user;
}

export async function updateUserStatus(id: string, status: UserStatus) {
  const user = await User.findByIdAndUpdate(id, { status }, { new: true, runValidators: true });
  if (!user) throw new NotFoundError("Utilisateur introuvable", "USER_NOT_FOUND");
  // Suspending an account must kill its active sessions immediately.
  if (status === "suspended") {
    user.tokenVersion += 1;
    await user.save();
  }
  return user;
}
