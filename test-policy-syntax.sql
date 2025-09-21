-- Test script to verify policy syntax fixes
-- This script checks for any remaining incorrect INSERT policy syntax

-- Check for any remaining "FOR INSERT USING" patterns (which should be "FOR INSERT WITH CHECK")
SELECT 'FOUND INCORRECT INSERT POLICY SYNTAX' as issue
WHERE EXISTS (
  SELECT 1 FROM pg_policy 
  WHERE polcmd = 'a' AND polqual IS NOT NULL AND polwithcheck IS NULL
);

-- Check for any SELECT policies with WITH CHECK (which is incorrect)
SELECT 'FOUND INCORRECT SELECT POLICY SYNTAX' as issue
WHERE EXISTS (
  SELECT 1 FROM pg_policy 
  WHERE polcmd = 'r' AND polwithcheck IS NOT NULL
);