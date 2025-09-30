-- Reload the schema cache after creating the function
NOTIFY pgrst, 'reload schema';
NOTIFY pgrst, 'reload config';

-- Wait a moment, then verify the function exists
SELECT
    'Function verification' as check_type,
    proname as function_name,
    pronargs as num_args,
    proargnames as arg_names
FROM pg_proc
WHERE proname = 'create_order_direct';

SELECT 'Schema reload requested - wait 20 seconds then try order creation' as status;