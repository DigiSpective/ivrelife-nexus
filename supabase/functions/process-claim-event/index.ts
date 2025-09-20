// Edge Function for processing claim events from the outbox
// This would be deployed as a Supabase Edge Function

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// In a real implementation, these would be environment variables
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

serve(async (_req) => {
  try {
    // Create a Supabase client with service role key for full access
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);
    
    // Fetch unprocessed events from the outbox
    const { data: events, error } = await supabase
      .from('outbox')
      .select('*')
      .is('processed_at', null)
      .limit(10);
    
    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        headers: { "Content-Type": "application/json" },
        status: 400,
      });
    }
    
    // Process each event
    for (const event of events) {
      try {
        // Handle different event types
        switch (event.event_type) {
          case 'claim_created':
            // Send notification for new claim
            console.log(`Processing new claim event: ${event.entity_id}`);
            // In a real implementation, this would send emails/SMS via Resend/Twilio
            break;
            
          case 'claim_status_changed':
            // Send notification for claim status update
            console.log(`Processing claim status update event: ${event.entity_id}`);
            // In a real implementation, this would send emails/SMS via Resend/Twilio
            break;
            
          default:
            console.log(`Unknown event type: ${event.event_type}`);
        }
        
        // Mark event as processed
        await supabase
          .from('outbox')
          .update({ processed_at: new Date().toISOString() })
          .eq('id', event.id);
      } catch (eventError) {
        console.error(`Error processing event ${event.id}:`, eventError);
        // In a real implementation, we might want to retry or log failed events
      }
    }
    
    return new Response(JSON.stringify({ 
      success: true, 
      processed_events: events.length 
    }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
    
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { "Content-Type": "application/json" },
      status: 500,
    });
  }
});