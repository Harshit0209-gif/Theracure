-- Add composite index on (patient_id, session_date) for therapy_sessions
-- Speeds up queries like: WHERE patient_id = X AND session_date >= Y
CREATE INDEX IF NOT EXISTS "therapy_sessions_patient_id_session_date_idx"
ON "therapy_sessions"("patient_id", "session_date");
