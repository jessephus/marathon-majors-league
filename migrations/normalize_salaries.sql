-- Normalize women's athlete salaries to match men's salary distribution
-- This ensures equal salary cap challenge for both genders

-- Calculate scaling factor: men's average / women's average = 5390 / 3950 ≈ 1.364557
-- We'll scale women's salaries by this factor to match men's average

-- Update women's salaries with scaling factor
UPDATE athletes
SET salary = ROUND(salary * 1.364557)
WHERE gender = 'women';

-- Verify the new distribution
SELECT 
    gender, 
    COUNT(*) as count, 
    ROUND(AVG(salary)) as avg_salary, 
    MIN(salary) as min_salary, 
    MAX(salary) as max_salary 
FROM athletes 
GROUP BY gender 
ORDER BY gender;
