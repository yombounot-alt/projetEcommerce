import type { Request } from "express";
import { AuditLog } from "../models/AuditLog";
import { logger } from "../utils/logger";

interface RecordAuditInput {
  actorId?: string;
  action: string;
  resource: string;
  resourceId?: string;
  metadata?: Record<string, unknown>;
  req?: Request;
}

/**
 * Fire-and-forget audit trail write. Never throws into the caller's flow — a logging
 * failure must not block a real business operation (login, order, payment, ...).
 */
export async function recordAudit(input: RecordAuditInput): Promise<void> {
  try {
    await AuditLog.create({
      actor: input.actorId,
      action: input.action,
      resource: input.resource,
      resourceId: input.resourceId,
      metadata: input.metadata ?? {},
      ip: input.req?.ip,
      userAgent: input.req?.headers["user-agent"],
    });
  } catch (error) {
    logger.error("Failed to record audit log", {
      action: input.action,
      resource: input.resource,
      error,
    });
  }
}
