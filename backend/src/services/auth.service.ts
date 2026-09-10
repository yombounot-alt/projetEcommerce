import { env } from "../config/env";
import { User, type IUser, type IAddress } from "../models/User";
import { RefreshToken } from "../models/RefreshToken";
import { hashPassword, comparePassword } from "../utils/password";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../utils/jwt";
import { generateSecureToken, hashToken } from "../utils/generateCode";
import {
  BadRequestError,
  ConflictError,
  NotFoundError,
  UnauthorizedError,
} from "../utils/AppError";
import { logger } from "../utils/logger";

export const REFRESH_TOKEN_TTL_MS = parseExpiryToMs(env.JWT_REFRESH_EXPIRES_IN);
const RESET_TOKEN_TTL_MS = 60 * 60_000; // 1h
const VERIFY_TOKEN_TTL_MS = 24 * 60 * 60_000; // 24h

function parseExpiryToMs(value: string): number {
  const match = /^(\d+)([smhd])$/.exec(value);
  if (!match) return 30 * 24 * 60 * 60_000;
  const amount = Number(match[1]);
  const unit = match[2];
  const unitMs = { s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 }[unit as "s" | "m" | "h" | "d"];
  return amount * unitMs;
}

interface SessionMeta {
  userAgent?: string;
  ip?: string;
}

interface TokenPair {
  accessToken: string;
  refreshToken: string;
  jti: string;
}

async function issueTokenPair(user: IUser, meta: SessionMeta): Promise<TokenPair> {
  const jti = generateSecureToken(16);
  const accessToken = signAccessToken({
    sub: String(user._id),
    role: user.role,
    tokenVersion: user.tokenVersion,
  });
  const refreshToken = signRefreshToken({
    sub: String(user._id),
    jti,
    tokenVersion: user.tokenVersion,
  });

  await RefreshToken.create({
    user: user._id,
    tokenHash: hashToken(refreshToken),
    jti,
    expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
    userAgent: meta.userAgent,
    ip: meta.ip,
  });

  return { accessToken, refreshToken, jti };
}

export interface RegisterInput {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  password: string;
}

export async function register(input: RegisterInput, meta: SessionMeta) {
  const existing = await User.findOne({ email: input.email.toLowerCase() });
  if (existing) {
    throw new ConflictError("Un compte existe déjà avec cet email", "EMAIL_TAKEN");
  }

  const passwordHash = await hashPassword(input.password);
  const user = await User.create({
    firstName: input.firstName,
    lastName: input.lastName,
    email: input.email.toLowerCase(),
    phone: input.phone,
    password: passwordHash,
    role: "customer",
    status: "active",
  });

  const tokens = await issueTokenPair(user, meta);
  return { user, ...tokens };
}

export async function login(email: string, password: string, meta: SessionMeta) {
  const user = await User.findOne({ email: email.toLowerCase() }).select("+password");
  if (!user) {
    throw new UnauthorizedError("Email ou mot de passe invalide", "INVALID_CREDENTIALS");
  }

  const valid = await comparePassword(password, user.password);
  if (!valid) {
    throw new UnauthorizedError("Email ou mot de passe invalide", "INVALID_CREDENTIALS");
  }

  if (user.status !== "active") {
    throw new UnauthorizedError("Ce compte n'est pas actif", "ACCOUNT_INACTIVE");
  }

  user.lastActiveAt = new Date();
  await user.save();

  const tokens = await issueTokenPair(user, meta);
  return { user, ...tokens };
}

export async function refreshSession(rawRefreshToken: string, meta: SessionMeta) {
  let payload;
  try {
    payload = verifyRefreshToken(rawRefreshToken);
  } catch {
    throw new UnauthorizedError("Jeton de rafraîchissement invalide ou expiré", "INVALID_REFRESH_TOKEN");
  }

  const tokenHash = hashToken(rawRefreshToken);
  const stored = await RefreshToken.findOne({ jti: payload.jti, tokenHash });

  if (!stored || stored.revoked || stored.expiresAt < new Date()) {
    throw new UnauthorizedError(
      "Le jeton de rafraîchissement a été révoqué ou a expiré",
      "REFRESH_TOKEN_REVOKED",
    );
  }

  const user = await User.findById(payload.sub);
  if (!user || user.status !== "active") {
    throw new UnauthorizedError("Cet utilisateur n'est plus actif", "USER_INACTIVE");
  }
  if (user.tokenVersion !== payload.tokenVersion) {
    throw new UnauthorizedError("Cette session a été révoquée", "SESSION_REVOKED");
  }

  // Rotation: the old refresh token is single-use — reusing it after rotation signals theft.
  const tokens = await issueTokenPair(user, meta);
  stored.revoked = true;
  stored.replacedByJti = tokens.jti;
  await stored.save();

  return { user, ...tokens };
}

export async function logout(rawRefreshToken: string | undefined): Promise<void> {
  if (!rawRefreshToken) return;
  const tokenHash = hashToken(rawRefreshToken);
  await RefreshToken.updateOne({ tokenHash }, { revoked: true });
}

export async function logoutAllSessions(userId: string): Promise<void> {
  await Promise.all([
    RefreshToken.updateMany({ user: userId, revoked: false }, { revoked: true }),
    User.updateOne({ _id: userId }, { $inc: { tokenVersion: 1 } }),
  ]);
}

export async function getMe(userId: string) {
  const user = await User.findById(userId);
  if (!user) {
    throw new NotFoundError("Utilisateur introuvable", "USER_NOT_FOUND");
  }
  return user;
}

export interface UpdateProfileInput {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  avatarUrl?: string;
}

export async function updateProfile(userId: string, changes: UpdateProfileInput) {
  if (changes.email) {
    const existing = await User.findOne({
      email: changes.email.toLowerCase(),
      _id: { $ne: userId },
    });
    if (existing) {
      throw new ConflictError("Un compte existe déjà avec cet email", "EMAIL_TAKEN");
    }
    changes.email = changes.email.toLowerCase();
  }

  const user = await User.findByIdAndUpdate(userId, changes, { new: true, runValidators: true });
  if (!user) {
    throw new NotFoundError("Utilisateur introuvable", "USER_NOT_FOUND");
  }
  return user;
}

export async function changePassword(
  userId: string,
  currentPassword: string,
  newPassword: string,
  meta: SessionMeta,
) {
  const user = await User.findById(userId).select("+password");
  if (!user) {
    throw new NotFoundError("Utilisateur introuvable", "USER_NOT_FOUND");
  }

  const valid = await comparePassword(currentPassword, user.password);
  if (!valid) {
    throw new BadRequestError("Le mot de passe actuel est incorrect", "INVALID_CURRENT_PASSWORD");
  }

  user.password = await hashPassword(newPassword);
  user.tokenVersion += 1;
  await user.save();

  await RefreshToken.updateMany({ user: userId, revoked: false }, { revoked: true });
  const tokens = await issueTokenPair(user, meta);
  return { user, ...tokens };
}

export async function forgotPassword(email: string): Promise<void> {
  const user = await User.findOne({ email: email.toLowerCase() });
  // Do not reveal whether the account exists — always resolve successfully.
  if (!user) return;

  const token = generateSecureToken(32);
  user.passwordResetTokenHash = hashToken(token);
  user.passwordResetExpires = new Date(Date.now() + RESET_TOKEN_TTL_MS);
  await user.save();

  // No email provider has been configured/authorized yet (see rule on not inventing
  // external APIs) — log the reset link so the flow is fully testable end-to-end.
  // Replace with a real transactional email integration once its docs are provided.
  logger.info(`[EMAIL:password-reset] to=${user.email} token=${token} (expires in 1h)`);
}

export async function resetPassword(token: string, newPassword: string): Promise<void> {
  const tokenHash = hashToken(token);
  const user = await User.findOne({
    passwordResetTokenHash: tokenHash,
    passwordResetExpires: { $gt: new Date() },
  }).select("+passwordResetTokenHash +passwordResetExpires");

  if (!user) {
    throw new BadRequestError("Le jeton de réinitialisation est invalide ou a expiré", "INVALID_RESET_TOKEN");
  }

  user.password = await hashPassword(newPassword);
  user.tokenVersion += 1;
  user.passwordResetTokenHash = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  await RefreshToken.updateMany({ user: user._id, revoked: false }, { revoked: true });
}

export async function requestEmailVerification(userId: string): Promise<void> {
  const user = await User.findById(userId);
  if (!user) {
    throw new NotFoundError("Utilisateur introuvable", "USER_NOT_FOUND");
  }
  if (user.isVerified) return;

  const token = generateSecureToken(32);
  user.emailVerificationTokenHash = hashToken(token);
  user.emailVerificationExpires = new Date(Date.now() + VERIFY_TOKEN_TTL_MS);
  await user.save();

  logger.info(`[EMAIL:verify-email] to=${user.email} token=${token} (expires in 24h)`);
}

export async function verifyEmail(token: string): Promise<void> {
  const tokenHash = hashToken(token);
  const user = await User.findOne({
    emailVerificationTokenHash: tokenHash,
    emailVerificationExpires: { $gt: new Date() },
  }).select("+emailVerificationTokenHash +emailVerificationExpires");

  if (!user) {
    throw new BadRequestError(
      "Le jeton de vérification est invalide ou a expiré",
      "INVALID_VERIFICATION_TOKEN",
    );
  }

  user.isVerified = true;
  user.emailVerificationTokenHash = undefined;
  user.emailVerificationExpires = undefined;
  await user.save();
}

export interface AddressInput {
  label: string;
  fullName: string;
  line1: string;
  line2?: string;
  city: string;
  state?: string;
  postalCode: string;
  country: string;
  phone: string;
  isDefault?: boolean;
}

export async function listAddresses(userId: string) {
  const user = await User.findById(userId);
  if (!user) throw new NotFoundError("Utilisateur introuvable", "USER_NOT_FOUND");
  return user.addresses;
}

export async function addAddress(userId: string, input: AddressInput) {
  const user = await User.findById(userId);
  if (!user) throw new NotFoundError("Utilisateur introuvable", "USER_NOT_FOUND");

  if (input.isDefault) {
    user.addresses.forEach((address) => {
      address.isDefault = false;
    });
  }
  user.addresses.push(input as unknown as IAddress);
  await user.save();
  return user.addresses[user.addresses.length - 1];
}

export async function updateAddress(
  userId: string,
  addressId: string,
  changes: Partial<AddressInput>,
) {
  const user = await User.findById(userId);
  if (!user) throw new NotFoundError("Utilisateur introuvable", "USER_NOT_FOUND");

  const address = user.addresses.id(addressId);
  if (!address) throw new NotFoundError("Adresse introuvable", "ADDRESS_NOT_FOUND");

  if (changes.isDefault) {
    user.addresses.forEach((a) => {
      a.isDefault = false;
    });
  }
  Object.assign(address, changes);
  await user.save();
  return address;
}

export async function deleteAddress(userId: string, addressId: string) {
  const user = await User.findById(userId);
  if (!user) throw new NotFoundError("Utilisateur introuvable", "USER_NOT_FOUND");

  const address = user.addresses.id(addressId);
  if (!address) throw new NotFoundError("Adresse introuvable", "ADDRESS_NOT_FOUND");

  user.addresses.pull(addressId);
  await user.save();
}
