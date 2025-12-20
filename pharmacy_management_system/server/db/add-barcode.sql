-- Add barcode column to medicines table
ALTER TABLE medicines 
ADD COLUMN IF NOT EXISTS barcode VARCHAR(50) UNIQUE;

-- Create index for faster barcode lookups
CREATE INDEX IF NOT EXISTS idx_medicines_barcode ON medicines(barcode);

-- Generate barcodes for existing medicines (using EAN-13 format starting with 200)
-- Format: 200 + zero-padded ID (10 digits) = 13 digits total
UPDATE medicines 
SET barcode = '200' || LPAD(id::text, 10, '0')
WHERE barcode IS NULL OR barcode = '';

