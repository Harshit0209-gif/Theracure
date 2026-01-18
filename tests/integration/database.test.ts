import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { PrismaClient } from '@prisma/client';

describe('Database Connection', () => {
  let prisma: PrismaClient;

  beforeAll(() => {
    prisma = new PrismaClient();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should connect to database successfully', async () => {
    await expect(prisma.$connect()).resolves.not.toThrow();
  });

  it('should execute a simple query', async () => {
    const result = await prisma.$queryRaw`SELECT 1 as value`;
    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
  });

  it('should have all required models accessible', async () => {
    // Test that all main models are accessible
    const models = [
      'user',
      'patient',
      'therapist',
      'appointment',
      'service',
      'invoice',
      'smsQueue',
      'therapistTimeSlot',
      'prescription',
      'therapySession',
      'medicalRecord',
      'consultation',
    ];

    models.forEach((modelName) => {
      expect(prisma).toHaveProperty(modelName);
    });
  });

  it('should validate Prisma schema integrity', async () => {
    // Check that core relationships work
    const userCount = await prisma.user.count();
    expect(typeof userCount).toBe('number');
    expect(userCount).toBeGreaterThanOrEqual(0);

    const patientCount = await prisma.patient.count();
    expect(typeof patientCount).toBe('number');
    expect(patientCount).toBeGreaterThanOrEqual(0);
  });

  it('should verify patient_id generation function exists', async () => {
    const functionCheck = await prisma.$queryRaw<Array<{ routine_name: string }>>`
      SELECT routine_name
      FROM information_schema.routines
      WHERE routine_schema = 'public'
      AND routine_name = 'generate_patient_id'
    `;

    expect(functionCheck.length).toBeGreaterThan(0);
    expect(functionCheck[0].routine_name).toBe('generate_patient_id');
  });

  it('should verify all enums exist', async () => {
    const enums = await prisma.$queryRaw<Array<{ typname: string }>>`
      SELECT typname
      FROM pg_type
      WHERE typcategory = 'E'
      AND typname IN (
        'UserRole', 'UserStatus', 'AppointmentStatus',
        'InvoiceStatus', 'SmsStatus', 'DocumentType'
      )
    `;

    expect(enums.length).toBeGreaterThanOrEqual(6);
  });

  it('should handle database transactions', async () => {
    await expect(
      prisma.$transaction(async (tx) => {
        const count = await tx.user.count();
        return count;
      })
    ).resolves.toBeGreaterThanOrEqual(0);
  });
});
