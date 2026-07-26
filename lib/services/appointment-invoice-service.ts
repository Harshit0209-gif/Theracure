import type { Prisma, PrismaClient } from "@prisma/client";
import { InvoiceStatus } from "@prisma/client";
import { recordAuditLog } from "@/lib/services/audit-log-service";

type Db = PrismaClient | Prisma.TransactionClient;

export interface CreateDraftInvoiceParams {
  appointmentId: string;
  patientId: string | null | undefined;
  serviceIds: string[];
  createdById: string;
}

export async function createDraftInvoiceForAppointment(
  db: Db,
  { appointmentId, patientId, serviceIds, createdById }: CreateDraftInvoiceParams
) {
  const services = await db.service.findMany({
    where: { id: { in: serviceIds } },
  });

  const subTotal = parseFloat(
    services.reduce((sum, s) => sum + s.price, 0).toFixed(2)
  );

  const invoice = await db.invoice.create({
    data: {
      patientId: patientId ?? undefined,
      appointmentId,
      subTotal,
      totalAmount: subTotal,
      amountPaid: 0,
      status: InvoiceStatus.DRAFT,
      createdBy: createdById,
      invoiceItems: {
        create: services.map((service) => ({
          serviceId: service.id,
          serviceName: service.name,
          priceAtPurchase: service.price,
          quantity: 1,
          category: service.category,
        })),
      },
    },
  });

  await recordAuditLog(db, {
    entityType: "Invoice",
    entityId: invoice.id,
    action: "INVOICE_AUTO_CREATED",
    userId: createdById,
    notes: `Auto-created for appointment ${appointmentId}`,
  });

  return invoice;
}
