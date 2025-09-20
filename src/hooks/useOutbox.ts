import { supabase } from '@/lib/supabase';
import { OutboxEvent } from '@/types';

export const useOutbox = () => {
  const createOutboxEvent = async (eventType: string, entity: string, entityId: string, payload: any) => {
    try {
      const outboxEvent: Omit<OutboxEvent, 'id' | 'created_at'> = {
        event_type: eventType,
        entity,
        entity_id: entityId,
        payload,
        processed_at: null
      };

      const { data, error } = await supabase
        .from('outbox')
        .insert([outboxEvent])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (err) {
      console.error('Error creating outbox event:', err);
      throw err;
    }
  };

  return { createOutboxEvent };
};