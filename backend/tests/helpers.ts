import request from "supertest";
import { createApp } from "../src/app";
import { User, type Role } from "../src/models/User";
import { hashPassword } from "../src/utils/password";
import { signAccessToken } from "../src/utils/jwt";

export const app = createApp();

export async function createUser(
  role: Role,
  overrides: Partial<{ email: string; firstName: string }> = {},
) {
  const email =
    overrides.email ??
    `${role}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@lumera.test`;
  const password = await hashPassword("Password1");
  const user = await User.create({
    firstName: overrides.firstName ?? "Test",
    lastName: "User",
    email,
    password,
    role,
    status: "active",
    isVerified: true,
  });

  const accessToken = signAccessToken({
    sub: String(user._id),
    role,
    tokenVersion: user.tokenVersion,
  });
  return { user, accessToken };
}

export function authHeader(token: string) {
  return { Authorization: `Bearer ${token}` };
}

export { request };
