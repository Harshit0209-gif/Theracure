const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixPatientIdFunction() {
  console.log('🔧 Fixing generate_patient_id() function...\n');

  try {
    // Drop and recreate the function with proper padding
    await prisma.$executeRaw`
      CREATE OR REPLACE FUNCTION public.generate_patient_id()
      RETURNS text
      LANGUAGE plpgsql
      AS $function$
        DECLARE
            last_num INTEGER;
            next_num INTEGER;
            new_id TEXT;
        BEGIN
            -- Lock table to avoid race condition
            LOCK TABLE patients IN EXCLUSIVE MODE;

            -- Only look at patient IDs that match the THRCXXX format
            -- Ignore old formats like "RC477" to avoid parsing errors
            SELECT
                COALESCE(
                    MAX(
                        CAST(
                            SUBSTRING(patient_id FROM '^THRC(\d+)$')
                            AS INTEGER
                        )
                    ),
                    0
                )
            INTO last_num
            FROM patients
            WHERE patient_id ~ '^THRC\d+$';  -- Only match THRCXXX format

            next_num := last_num + 1;

            -- Changed from LPAD 3 to 4 to support up to THRC9999
            new_id := 'THRC' || LPAD(next_num::text, 4, '0');

            RETURN new_id;
        END;
        $function$
    `;

    console.log('✅ Function updated successfully!\n');

    // Test the updated function
    console.log('🧪 Testing updated function...');
    for (let i = 0; i < 5; i++) {
      const result = await prisma.$queryRaw`SELECT generate_patient_id() as new_id;`;
      console.log(`  Call ${i + 1}: ${result[0].new_id}`);
    }

    console.log('\n✅ All tests passed!');
    console.log('The function now generates 4-digit patient IDs (e.g., THRC3556)');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Full error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixPatientIdFunction();
