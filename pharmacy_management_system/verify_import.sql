-- Verification queries for imported data

-- 1. Total count
SELECT COUNT(*) as total_medicines FROM medicines;

-- 2. Sample records
SELECT 
    medicine_name, 
    manufacturer, 
    excellent_review_percent,
    average_review_percent,
    poor_review_percent
FROM medicines 
LIMIT 10;

-- 3. Check for nulls
SELECT 
    COUNT(*) as total,
    COUNT(medicine_name) as has_name,
    COUNT(manufacturer) as has_manufacturer,
    COUNT(composition) as has_composition
FROM medicines;

-- 4. Unique manufacturers count
SELECT COUNT(DISTINCT manufacturer) as unique_manufacturers FROM medicines;

-- 5. Top 10 manufacturers
SELECT manufacturer, COUNT(*) as medicine_count 
FROM medicines 
WHERE manufacturer IS NOT NULL
GROUP BY manufacturer 
ORDER BY medicine_count DESC 
LIMIT 10;


