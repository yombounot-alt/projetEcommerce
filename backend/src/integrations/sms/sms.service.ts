import { env } from "../../config/env";
import { OtpCode, type OtpPurpose } from "../../models/OtpCode";
import { BadRequestError, TooManyRequestsError } from "../../utils/AppError";
import { generateOtp, hashToken } from "../../utils/generateCode";
import type { SmsProvider } from "./sms.interface";
import { ConsoleSmsProvider } from "./providers/console.provider";
import { HttpSmsProvider } from "./providers/http.provider";

const OTP_TTL_MINUTES = 10;
const OTP_LENGTH = 6;

function resolveSmsProvider(): SmsProvider {
  return env.SMS_API_URL ? new HttpSmsProvider() : new ConsoleSmsProvider();
}

const provider = resolveSmsProvider();

export async function sendSms(to: string, message: string) {
  return provider.send({ to, message });
}

export async function sendOtp(
  destination: string,
  purpose: OtpPurpose,
  userId?: string,
): Promise<void> {
  const code = generateOtp(OTP_LENGTH);
  await OtpCode.create({
    user: userId,
    destination,
    purpose,
    codeHash: hashToken(code),
    expiresAt: new Date(Date.now() + OTP_TTL_MINUTES * 60_000),
  });

  await provider.send({
    to: destination,
    message: `${env.SMS_SENDER}: your verification code is ${code}. It expires in ${OTP_TTL_MINUTES} minutes.`,
  });
}

export async function verifyOtp(
  destination: string,
  purpose: OtpPurpose,
  code: string,
): Promise<boolean> {
  const otp = await OtpCode.findOne({ destination, purpose, consumed: false }).sort({
    createdAt: -1,
  });

  if (!otp || otp.expiresAt < new Date()) {
    throw new BadRequestError("Le code OTP est invalide ou a expiré", "OTP_EXPIRED");
  }

  if (otp.attempts >= otp.maxAttempts) {
    throw new TooManyRequestsError(
      "Maximum verification attempts exceeded",
      "OTP_ATTEMPTS_EXCEEDED",
    );
  }

  const matches = otp.codeHash === hashToken(code);
  otp.attempts += 1;

  if (!matches) {
    await otp.save();
    throw new BadRequestError("Le code OTP est incorrect", "OTP_INVALID");
  }

  otp.consumed = true;
  await otp.save();
  return true;
}
