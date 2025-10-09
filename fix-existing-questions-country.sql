-- Fix existing questions to have proper country value
-- This updates all questions that have NULL, empty, or lowercase country values to "Sri Lanka"

-- First, let's see what we have
SELECT "Country", COUNT(*) as count 
FROM "Questions" 
GROUP BY "Country"
ORDER BY count DESC;

-- Update all questions with NULL, empty, or variations of sri lanka to "Sri Lanka"
UPDATE "Questions" 
SET "Country" = 'Sri Lanka'
WHERE "Country" IS NULL 
   OR "Country" = '' 
   OR LOWER("Country") = 'sri lanka'
   OR LOWER("Country") = 'sri_lanka';

-- Verify the update
SELECT "Country", COUNT(*) as count 
FROM "Questions" 
GROUP BY "Country"
ORDER BY count DESC;

-- Show sample of updated questions
SELECT "QuestionId", "Country", "ExamType", "Subject", "CreatedAt"
FROM "Questions"
ORDER BY "CreatedAt" DESC
LIMIT 10;
