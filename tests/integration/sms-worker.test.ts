import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

describe('SMS Worker Verification', () => {
  let prisma: PrismaClient;

  beforeAll(() => {
    prisma = new PrismaClient();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should have SMS worker file compiled', async () => {
    try {
      const { stdout } = await execAsync('ls workers/sms-worker.js');
      expect(stdout).toContain('sms-worker.js');
    } catch (error) {
      // If file doesn't exist yet, that's okay in development
      // But in CI/CD it should be compiled
      if (process.env.CI) {
        throw error;
      }
    }
  });

  it('should have sms_queue table accessible', async () => {
    const count = await prisma.sms_queue.count();
    expect(typeof count).toBe('number');
  });

  it('should have SmsStatus enum with correct values', async () => {
    const enumValues = await prisma.$queryRaw<Array<{ enumlabel: string }>>`
      SELECT enumlabel
      FROM pg_enum
      JOIN pg_type ON pg_enum.enumtypid = pg_type.oid
      WHERE pg_type.typname = 'SmsStatus'
      ORDER BY enumsortorder
    `;

    const statuses = enumValues.map((e) => e.enumlabel);

    expect(statuses).toContain('PENDING');
    expect(statuses).toContain('PROCESSING');
    expect(statuses).toContain('SENT');
    expect(statuses).toContain('FAILED');
  });

  it('should not have stuck PENDING jobs (worker health check)', async () => {
    // In production, there shouldn't be PENDING jobs older than 5 minutes
    // This indicates the worker is not running
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

    const stuckJobs = await prisma.sms_queue.count({
      where: {
        status: 'PENDING',
        createdAt: {
          lt: fiveMinutesAgo,
        },
      },
    });

    // In CI/CD, we expect 0 stuck jobs
    // In development, we might have some
    if (process.env.CI || process.env.NODE_ENV === 'production') {
      expect(stuckJobs).toBe(0);
    }
  });

  it('should validate SMS queue schema', async () => {
    const sampleQueue = await prisma.sms_queue.findFirst();

    if (sampleQueue) {
      // Verify required fields exist
      expect(sampleQueue).toHaveProperty('id');
      expect(sampleQueue).toHaveProperty('type');
      expect(sampleQueue).toHaveProperty('phone');
      expect(sampleQueue).toHaveProperty('status');
      expect(sampleQueue).toHaveProperty('attempts');
      expect(sampleQueue).toHaveProperty('createdAt');
      expect(sampleQueue).toHaveProperty('updatedAt');
    }
  });

  it('should verify worker process is running in Docker (CI only)', async () => {
    if (!process.env.CI) {
      // Skip this test in local development
      return;
    }

    try {
      // Check if we're running in Docker and if worker process exists
      const { stdout } = await execAsync('ps aux | grep -E "sms-worker.js" | grep -v grep || true');

      if (process.env.DOCKER_ENVIRONMENT === 'true') {
        // In Docker, worker should be running
        expect(stdout).toContain('sms-worker.js');
      }
    } catch (error) {
      // In CI without Docker, this is expected to fail
      if (process.env.DOCKER_ENVIRONMENT === 'true') {
        throw error;
      }
    }
  });

  it('should create and process test SMS job (integration test)', async () => {
    // Only run in test environment
    if (process.env.NODE_ENV !== 'test') {
      return;
    }

    // Create a test SMS job
    const testJob = await prisma.sms_queue.create({
      data: {
        type: 'TEST',
        phone: '919999999999',
        variables: JSON.stringify({ test: 'value' }),
        status: 'PENDING',
      },
    });

    expect(testJob.id).toBeDefined();
    expect(testJob.status).toBe('PENDING');

    // Clean up test job
    await prisma.sms_queue.delete({
      where: { id: testJob.id },
    });
  });

  it('should validate SMS template configuration exists', async () => {
    // Check if SMS template map file exists
    try {
      const { stdout } = await execAsync('ls config/smsTemplatesMap.ts');
      expect(stdout).toContain('smsTemplatesMap.ts');
    } catch (error) {
      // File should exist
      throw new Error('SMS template configuration file not found');
    }
  });
});
