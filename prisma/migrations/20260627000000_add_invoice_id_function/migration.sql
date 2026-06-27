
CREATE OR REPLACE FUNCTION generate_invoice_id()
RETURNS TEXT AS $$
DECLARE
    prefix TEXT;
    last_num INTEGER;
    next_num INTEGER;
    new_id TEXT;
BEGIN
    prefix := 'TC' || TO_CHAR(NOW() AT TIME ZONE 'Asia/Kolkata', 'YYYYMM');

    LOCK TABLE invoices IN EXCLUSIVE MODE;

    SELECT COALESCE(
        MAX(
            CAST(
                SUBSTRING(invoice_id FROM (LENGTH(prefix) + 1))
                AS INTEGER
            )
        ),
        0
    )
    INTO last_num
    FROM invoices
    WHERE invoice_id LIKE prefix || '%'
      AND invoice_id ~ ('^' || prefix || '\d+$');

    next_num := last_num + 1;
    new_id := prefix || next_num::TEXT;

    RETURN new_id;
END;
$$ LANGUAGE plpgsql;

ALTER TABLE invoices ALTER COLUMN invoice_id SET DEFAULT generate_invoice_id();
