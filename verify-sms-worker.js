const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function verifySmsWorker() {
  console.log('🔍 Verifying SMS Worker Status...\n');

  try {
    // Check if there are any SMS jobs in the queue
    const stats = await prisma.smsQueue.groupBy({
      by: ['status'],
      _count: {
        status: true,
      },
    });

    console.log('=== SMS QUEUE STATISTICS ===');
    if (stats.length === 0) {
      console.log('No SMS jobs in queue (empty queue)');
    } else {
      stats.forEach(stat => {
        console.log(`${stat.status}: ${stat._count.status} job(s)`);
      });
    }
    console.log('');

    // Check recent SMS jobs
    const recentJobs = await prisma.smsQueue.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        status: true,
        type: true,
        phone: true,
        attempts: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    console.log('=== RECENT SMS JOBS (last 10) ===');
    if (recentJobs.length === 0) {
      console.log('No SMS jobs found');
    } else {
      recentJobs.forEach((job, i) => {
        const timeDiff = Date.now() - new Date(job.updatedAt).getTime();
        const minutesAgo = Math.floor(timeDiff / 60000);
        console.log(`${i + 1}. [${job.status}] ${job.type} to ${job.phone}`);
        console.log(`   Created: ${job.createdAt.toLocaleString()}`);
        console.log(`   Updated: ${minutesAgo} min ago | Attempts: ${job.attempts}`);
        console.log('');
      });
    }

    // Check for stuck PENDING jobs
    const stuckJobs = await prisma.smsQueue.findMany({
      where: {
        status: 'PENDING',
        createdAt: {
          lt: new Date(Date.now() - 5 * 60 * 1000), // Older than 5 minutes
        },
      },
    });

    console.log('=== WORKER STATUS ANALYSIS ===');
    if (stuckJobs.length > 0) {
      console.log(`⚠️  WARNING: ${stuckJobs.length} PENDING job(s) older than 5 minutes`);
      console.log('   This suggests the SMS worker may NOT be running!');
      console.log('');
      console.log('   Stuck jobs:');
      stuckJobs.forEach((job, i) => {
        const minutesAgo = Math.floor((Date.now() - new Date(job.createdAt).getTime()) / 60000);
        console.log(`   ${i + 1}. ${job.type} to ${job.phone} (${minutesAgo} min ago)`);
      });
    } else {
      const pendingJobs = await prisma.smsQueue.count({
        where: { status: 'PENDING' },
      });

      if (pendingJobs > 0) {
        console.log(`✅ ${pendingJobs} PENDING job(s) are recent (worker likely running)`);
      } else {
        console.log('✅ No pending jobs (worker is either idle or processing successfully)');
      }
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

verifySmsWorker();
