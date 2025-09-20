// Import necessary modules from Deno standard library and Supabase
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

// Get environment variables
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

// Create a Supabase client with service role key for full access
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Function to send setting update notification
async function sendSettingUpdateNotification(event: any) {
  try {
    const { setting_key, updated_by, old_value, new_value } = event;
    
    // Get users who should receive notifications
    // For system settings, notify all admins
    const { data: adminUsers, error: usersError } = await supabase
      .from('users')
      .select('id, email')
      .in('role', ['owner', 'backoffice']);
    
    if (usersError) {
      console.error('Error fetching admin users:', usersError);
      return;
    }
    
    // Send notifications to each admin user
    for (const user of adminUsers) {
      // In a real implementation, you would integrate with an email service like Resend
      // or SMS service like Twilio based on user preferences
      
      console.log(`Sending notification to ${user.email} about ${setting_key} update`);
      
      // Log the notification event
      await supabase.from('outbox').insert({
        event_type: 'setting_update_notification',
        entity: 'system_settings',
        entity_id: setting_key,
        payload: {
          recipient_id: user.id,
          setting_key,
          updated_by,
          old_value,
          new_value,
          timestamp: new Date().toISOString()
        }
      });
    }
    
    return { success: true, message: 'Notifications sent successfully' };
  } catch (error) {
    console.error('Error sending setting update notification:', error);
    return { success: false, error: error.message };
  }
}

// Function to send user profile update notification
async function sendProfileUpdateNotification(event: any) {
  try {
    const { user_id, updated_fields, updated_by } = event;
    
    // Get the user who owns the profile
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('email')
      .eq('id', user_id)
      .single();
    
    if (userError) {
      console.error('Error fetching user:', userError);
      return;
    }
    
    // Get user notification preferences
    const { data: notifications, error: notificationsError } = await supabase
      .from('user_notifications')
      .select('type, enabled')
      .eq('user_id', user_id);
    
    if (notificationsError) {
      console.error('Error fetching user notifications:', notificationsError);
      return;
    }
    
    // Send notifications based on user preferences
    for (const notification of notifications) {
      if (notification.enabled) {
        // In a real implementation, you would integrate with the appropriate service
        console.log(`Sending ${notification.type} notification to ${user.email} about profile update`);
        
        // Log the notification event
        await supabase.from('outbox').insert({
          event_type: 'profile_update_notification',
          entity: 'users',
          entity_id: user_id,
          payload: {
            recipient_id: user_id,
            notification_type: notification.type,
            updated_fields,
            updated_by,
            timestamp: new Date().toISOString()
          }
        });
      }
    }
    
    return { success: true, message: 'Profile update notifications sent successfully' };
  } catch (error) {
    console.error('Error sending profile update notification:', error);
    return { success: false, error: error.message };
  }
}

// Main function to handle incoming requests
async function main(req: Request) {
  try {
    // Parse the request body
    const { type, payload } = await req.json();
    
    let result;
    
    // Handle different types of notifications
    switch (type) {
      case 'setting_update':
        result = await sendSettingUpdateNotification(payload);
        break;
      case 'profile_update':
        result = await sendProfileUpdateNotification(payload);
        break;
      default:
        return new Response(
          JSON.stringify({ success: false, error: 'Unknown notification type' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
    }
    
    return new Response(
      JSON.stringify(result),
      { status: 200, headers: { 'Content-Type': 'application/json' }
    });
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