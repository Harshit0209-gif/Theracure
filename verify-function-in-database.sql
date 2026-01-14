-- ========================================================
-- HOW TO VERIFY generate_patient_id() FUNCTION IN DATABASE
-- Run these queries in pgAdmin to confirm the function exists
-- ========================================================

-- QUERY 1: Check if function exists
SELECT
    routine_name,
    routine_type,
    routine_definition
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name = 'generate_patient_id';

-- QUERY 2: See the full function code
SELECT
    proname AS function_name,
    pg_get_functiondef(oid) AS function_definition
FROM pg_proc
WHERE proname = 'generate_patient_id';

-- QUERY 3: Check if it's set as DEFAULT on patient_id column
SELECT
    table_name,
    column_name,
    column_default,
    data_type
FROM information_schema.columns
WHERE table_name = 'patients'
  AND column_name = 'patient_id';

-- QUERY 4: Test the function directly
SELECT generate_patient_id() AS test_next_id;

-- QUERY 5: Check existing THRC patient IDs
SELECT
    patient_id,
    patient_name,
    created_at
FROM patients
WHERE patient_id ~ '^THRC\d+$'  -- Only THRC format
ORDER BY patient_id DESC
LIMIT 10;

-- ========================================================
-- EXPECTED RESULTS:
-- Query 1: Should show "generate_patient_id" as a function
-- Query 2: Should show the full function code
-- Query 3: Should show "generate_patient_id()" as the default
-- Query 4: Should return next ID like "THRC355"
-- Query 5: Should list your existing THRC patients
-- ========================================================
