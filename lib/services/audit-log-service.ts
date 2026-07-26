import type { Prisma, PrismaClient } from "@prisma/client";

type Db = PrismaClient | Prisma.TransactionClient;

export interface RecordAuditLogParams {
  entityType: string;
  entityId: string;
  action: string;
  userId?: string | null;
  notes?: string | null;
}

export async function recordAuditLog(
  db: Db,
  { entityType, entityId, action, userId, notes }: RecordAuditLogParams
) {
  await db.auditLog.create({
    data: {
      entityType,
      entityId,
      action,
      userId: userId ?? null,
      notes: notes ?? null,
    },
  });
}
