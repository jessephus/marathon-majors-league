-- Remove Ruth Chepngetich and Normalize Women's Salaries
-- 
-- Background:
-- Ruth Chepngetich was banned for 3 years for PEDs. Her 2:09:56 time
-- was the women's world record reference in the salary calculation script.
-- 
-- Changes:
-- 1. Removed Ruth Chepngetich from athletes table
-- 2. Updated salary script to use Tigst Assefa's 2:11:53 as women's reference
-- 3. Recalculated all athlete salaries using updated script
-- 4. Applied 1.244918x scaling factor to women's salaries to match men's average
--
-- Result:
-- - Men's average: $5,390 (unchanged)
-- - Women's average: $4,330 → $5,391 (normalized)
-- - Women's range: $1,500-$10,400 → $1,867-$12,947
-- - Top woman: Hawi Feysa at $12,947

-- Step 1: Remove Ruth Chepngetich
DELETE FROM athletes WHERE name = 'Ruth CHEPNGETICH';

-- Step 2: Recalculate salaries (done via migrate-add-salaries.js script)
-- Updated WORLD_RECORDS.women from 2:09:56 to 2:11:53

-- Step 3: Apply scaling factor to normalize women's salaries
UPDATE athletes 
SET salary = ROUND(salary * 1.244918) 
WHERE gender = 'women';

-- Verify results
SELECT 
    gender, 
    COUNT(*) as count, 
    ROUND(AVG(salary)) as avg_salary, 
    MIN(salary) as min_salary, 
    MAX(salary) as max_salary 
FROM athletes 
GROUP BY gender 
ORDER BY gender;
