-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create sequence
CREATE SEQUENCE IF NOT EXISTS patient_id_seq START 1;

-- Create function
CREATE OR REPLACE FUNCTION generate_patient_id() RETURNS VARCHAR(20) AS $$
DECLARE
    next_id INTEGER;
    custom_id VARCHAR(20);
BEGIN
    SELECT nextval('patient_id_seq') INTO next_id;
    custom_id := 'THRC' || LPAD(next_id::TEXT, 6, '0');
    RETURN custom_id;
END;
$$ LANGUAGE plpgsql;

-- Optional: Auto-assign IDs via trigger
CREATE OR REPLACE FUNCTION set_custom_patient_id()
RETURNS trigger AS $$
BEGIN
  IF NEW.patient_id IS NULL THEN
    NEW.patient_id := generate_patient_id();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER patient_id_trigger
BEFORE INSERT ON patients
FOR EACH ROW
EXECUTE FUNCTION set_custom_patient_id();
