-- Delete claims with invalid status (like '400')
DELETE FROM public.claims 
WHERE status NOT IN ('submitted', 'in_review', 'approved', 'rejected', 'resolved');

-- Show remaining claims
SELECT 
    id,
    status,
    reason,
    created_at
FROM public.claims
ORDER BY created_at DESC;
