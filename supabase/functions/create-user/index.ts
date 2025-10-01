import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get request body
    const { email, password, name, role, retailer_id, location_id, phone, department, status, is_active } = await req.json()

    // Create Supabase admin client with service role key
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    console.log('Creating auth user for:', email)

    // Step 1: Create auth user
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: password || `TempPass${Math.random().toString(36).slice(2)}!`,
      email_confirm: true,
      user_metadata: {
        name,
        role,
      }
    })

    if (authError) {
      console.error('Auth error:', authError)
      throw authError
    }

    console.log('Auth user created:', authData.user?.id)

    // Step 2: Create user record in users table
    const userData = {
      id: authData.user!.id,
      email,
      name,
      role: role || 'location',
      status: status || 'active',
      is_active: is_active !== undefined ? is_active : true,
      account_locked: false,
      login_attempts: 0,
      two_factor_enabled: false,
      phone: phone || null,
      department: department || null,
      retailer_id: retailer_id || null,
      location_id: location_id || null,
      avatar: null,
    }

    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .insert(userData)
      .select()
      .single()

    if (userError) {
      console.error('User table error:', userError)
      // Rollback: delete auth user
      await supabaseAdmin.auth.admin.deleteUser(authData.user!.id)
      throw userError
    }

    console.log('User created successfully:', user.id)

    return new Response(
      JSON.stringify({ user }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})
