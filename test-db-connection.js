const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testDatabaseConnection() {
  console.log('🔍 Testing database connection and models...\n');

  try {
    // Test each model by counting records
    const tests = [
      { name: 'Users', query: () => prisma.users.count() },
      { name: 'Patients', query: () => prisma.patients.count() },
      { name: 'Services', query: () => prisma.services.count() },
      { name: 'Therapists', query: () => prisma.therapists.count() },
      { name: 'Appointments', query: () => prisma.appointments.count() },
      { name: 'Therapist Time Slots', query: () => prisma.therapist_time_slots.count() },
      { name: 'Prescriptions', query: () => prisma.prescriptions.count() },
      { name: 'Invoices', query: () => prisma.invoices.count() },
      { name: 'Invoice Items', query: () => prisma.invoice_items.count() },
      { name: 'Transactions', query: () => prisma.transactions.count() },
      { name: 'Therapy Sessions', query: () => prisma.therapy_sessions.count() },
      { name: 'Consultations', query: () => prisma.consultations.count() },
      { name: 'Medical Records', query: () => prisma.medical_records.count() },
      { name: 'SMS Queue', query: () => prisma.sms_queue.count() },
    ];

    let successCount = 0;
    let failCount = 0;

    for (const test of tests) {
      try {
        const count = await test.query();
        console.log(`✅ ${test.name}: ${count} records`);
        successCount++;
      } catch (error) {
        console.log(`❌ ${test.name}: ERROR - ${error.message}`);
        failCount++;
      }
    }

    console.log('\n' + '='.repeat(50));
    console.log(`\n📊 Test Summary:`);
    console.log(`   Total Models Tested: ${tests.length}`);
    console.log(`   ✅ Successful: ${successCount}`);
    console.log(`   ❌ Failed: ${failCount}`);

    if (failCount === 0) {
      console.log('\n🎉 All models are working correctly!');
      console.log('✅ Database connection is fully operational');
    } else {
      console.log('\n⚠️  Some models have issues. Please check the errors above.');
    }

    // Test a simple query with relations
    console.log('\n🔗 Testing relations...');
    const sampleUser = await prisma.users.findFirst({
      include: {
        therapists: true,
      },
    });

    if (sampleUser) {
      console.log(`✅ Relations test passed - Found user: ${sampleUser.name}`);
    } else {
      console.log('ℹ️  No users found in database (this is OK if database is empty)');
    }

  } catch (error) {
    console.error('❌ Database connection error:', error.message);
    console.error('\nFull error:', error);
  } finally {
    await prisma.$disconnect();
    console.log('\n✅ Disconnected from database');
  }
}

testDatabaseConnection()
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
