const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkFunctionImplementation() {
  console.log('🔍 Checking generate_patient_id() function implementation...\n');

  try {
    // Get the function definition
    const funcDef = await prisma.$queryRaw`
      SELECT pg_get_functiondef(oid) as definition
      FROM pg_proc
      WHERE proname = 'generate_patient_id';
    `;

    console.log('Function definition:');
    console.log(funcDef[0]?.definition || 'Not found');

    // Test multiple calls to see if it generates unique IDs
    console.log('\n🧪 Testing multiple function calls...');
    for (let i = 0; i < 5; i++) {
      const result = await prisma.$queryRaw`SELECT generate_patient_id() as new_id;`;
      console.log(`  Call ${i + 1}: ${result[0].new_id}`);
    }

    // Check the highest patient number
    console.log('\n📊 Analyzing patient ID numbers...');
    const analysis = await prisma.$queryRaw`
      SELECT
        MAX(CAST(SUBSTRING(patient_id FROM 5) AS INTEGER)) as max_number,
        MIN(CAST(SUBSTRING(patient_id FROM 5) AS INTEGER)) as min_number,
        COUNT(*) as total_count
      FROM patients
      WHERE patient_id ~ '^THRC[0-9]+$';
    `;

    console.log('Patient ID Analysis:', analysis[0]);

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Full error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkFunctionImplementation();
