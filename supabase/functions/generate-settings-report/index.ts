// Import necessary modules from Deno standard library and Supabase
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

// Get environment variables
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

// Create a Supabase client with service role key for full access
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Function to generate system settings report
async function generateSystemSettingsReport() {
  try {
    // Fetch all system settings
    const { data: systemSettings, error: settingsError } = await supabase
      .from('system_settings')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (settingsError) {
      throw settingsError;
    }
    
    // Fetch audit logs for settings
    const { data: auditLogs, error: auditError } = await supabase
      .from('audit_logs')
      .select('*, users(email, role)')
      .eq('entity', 'system_settings')
      .order('created_at', { ascending: false })
      .limit(100);
    
    if (auditError) {
      throw auditError;
    }
    
    // Generate report data
    const report = {
      generated_at: new Date().toISOString(),
      system_settings: systemSettings,
      recent_audit_logs: auditLogs,
      summary: {
        total_settings: systemSettings.length,
        total_audit_logs: auditLogs.length,
        last_updated: systemSettings.length > 0 ? systemSettings[0].created_at : null
      }
    };
    
    return report;
  } catch (error) {
    console.error('Error generating system settings report:', error);
    throw error;
  }
}

// Function to generate user settings report
async function generateUserSettingsReport(userId: string) {
  try {
    // Fetch user profile
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('id, email, name, role, created_at')
      .eq('id', userId)
      .single();
    
    if (profileError) {
      throw profileError;
    }
    
    // Fetch user features
    const { data: userFeatures, error: featuresError } = await supabase
      .from('user_features')
      .select('*')
      .eq('user_id', userId);
    
    if (featuresError) {
      throw featuresError;
    }
    
    // Fetch user notifications
    const { data: userNotifications, error: notificationsError } = await supabase
      .from('user_notifications')
      .select('*')
      .eq('user_id', userId);
    
    if (notificationsError) {
      throw notificationsError;
    }
    
    // Fetch audit logs for user
    const { data: auditLogs, error: auditError } = await supabase
      .from('audit_logs')
      .select('*, users(email, role)')
      .eq('entity', 'users')
      .eq('entity_id', userId)
      .order('created_at', { ascending: false })
      .limit(50);
    
    if (auditError) {
      throw auditError;
    }
    
    // Generate report data
    const report = {
      generated_at: new Date().toISOString(),
      user_profile: userProfile,
      user_features: userFeatures,
      user_notifications: userNotifications,
      recent_audit_logs: auditLogs,
      summary: {
        total_features: userFeatures.length,
        enabled_features: userFeatures.filter(f => f.enabled).length,
        total_notifications: userNotifications.length,
        enabled_notifications: userNotifications.filter(n => n.enabled).length,
        total_audit_logs: auditLogs.length
      }
    };
    
    return report;
  } catch (error) {
    console.error('Error generating user settings report:', error);
    throw error;
  }
}

// Main function to handle incoming requests
async function main(req: Request) {
  try {
    // Parse the request body
    const { type, user_id } = await req.json();
    
    let report;
    
    // Handle different types of reports
    switch (type) {
      case 'system_settings':
        report = await generateSystemSettingsReport();
        break;
      case 'user_settings':
        if (!user_id) {
          return new Response(
            JSON.stringify({ success: false, error: 'user_id is required for user_settings report' }),
            { status: 400, headers: { 'Content-Type': 'application/json' } }
          );
        }
        report = await generateUserSettingsReport(user_id);
        break;
      default:
        return new Response(
          JSON.stringify({ success: false, error: 'Unknown report type' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
    }
    
    // In a real implementation, you might want to:
    // 1. Generate a PDF report
    // 2. Upload it to storage
    // 3. Send it via email
    // 4. Return a download link
    
    // For now, we'll just return the JSON report
    return new Response(
      JSON.stringify({ success: true, report }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in main function:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

// Serve the function
serve(main);