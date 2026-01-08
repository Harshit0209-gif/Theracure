-- CreateFunction: generate_patient_id
-- This function generates a unique patient ID in the format: THRCXXX
-- Where XXX is a 3-digit sequential number (e.g., THRC001, THRC002, etc.)
-- Handles existing patient IDs with different formats

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

    new_id := 'THRC' || LPAD(next_num::text, 3, '0');

    RETURN new_id;
END;
$function$;

-- Set the function as DEFAULT value for patient_id column
ALTER TABLE patients ALTER COLUMN patient_id SET DEFAULT generate_patient_id();
