import type { ISODateString, UUID } from "./common.types";

export type Role = "admin" | "seller" | "customer";

export type UserStatus = "active" | "suspended" | "pending";

export interface User {
  id: UUID;
  firstName: string;
  lastName: string;
  email: string;
  avatarUrl?: string;
  role: Role;
  status: UserStatus;
  createdAt: ISODateString;
  lastActiveAt?: ISODateString;
}

export interface Address {
  id: UUID;
  label: string;
  fullName: string;
  line1: string;
  line2?: string;
  city: string;
  state?: string;
  postalCode: string;
  country: string;
  phone: string;
  isDefault: boolean;
}

export interface AuthSession {
  user: User;
  accessToken: string;
  expiresAt: ISODateString;
}
