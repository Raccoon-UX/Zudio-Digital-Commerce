import { prisma } from "@/lib/prisma/client";

export interface RecordAuditLogParams {
  userId?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  details?: Record<string, any> | null;
  ipAddress?: string | null;
}

/**
 * Appends an immutable audit log entry.
 * Audit logs cannot be edited or deleted through the application.
 */
export async function recordAuditLog(params: RecordAuditLogParams): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        userId: params.userId || null,
        action: params.action,
        entityType: params.entityType,
        entityId: params.entityId || null,
        details: params.details ? (params.details as any) : undefined,
        ipAddress: params.ipAddress || null,
      },
    });
  } catch (error) {
    // Log error locally but do not break business operation
    console.error("Failed to record audit log:", error);
  }
}
