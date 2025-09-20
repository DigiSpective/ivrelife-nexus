import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Retailer, Location } from '@/types';

export const useRetailers = () => {
  const [retailers, setRetailers] = useState<Retailer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRetailers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('retailers')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRetailers(data || []);
    } catch (err) {
      console.error('Error fetching retailers:', err);
      setError('Failed to fetch retailers');
    } finally {
      setLoading(false);
    }
  };

  const getRetailerById = async (id: string) => {
    try {
      const { data, error } = await supabase
        .from('retailers')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    } catch (err) {
      console.error('Error fetching retailer:', err);
      throw err;
    }
  };

  const createRetailer = async (retailer: Omit<Retailer, 'id' | 'created_at'>) => {
    try {
      const { data, error } = await supabase
        .from('retailers')
        .insert([retailer])
        .select()
        .single();

      if (error) throw error;
      
      // Refresh the retailers list
      await fetchRetailers();
      
      return data;
    } catch (err) {
      console.error('Error creating retailer:', err);
      throw err;
    }
  };

  const updateRetailer = async (id: string, updates: Partial<Retailer>) => {
    try {
      const { data, error } = await supabase
        .from('retailers')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      // Refresh the retailers list
      await fetchRetailers();
      
      return data;
    } catch (err) {
      console.error('Error updating retailer:', err);
      throw err;
    }
  };

  const deleteRetailer = async (id: string) => {
    try {
      const { error } = await supabase
        .from('retailers')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      // Refresh the retailers list
      await fetchRetailers();
    } catch (err) {
      console.error('Error deleting retailer:', err);
      throw err;
    }
  };

  const getLocationsByRetailer = async (retailerId: string) => {
    try {
      const { data, error } = await supabase
        .from('locations')
        .select('*')
        .eq('retailer_id', retailerId);

      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error('Error fetching locations:', err);
      throw err;
    }
  };

  useEffect(() => {
    fetchRetailers();
  }, []);

  return {
    retailers,
    loading,
    error,
    fetchRetailers,
    getRetailerById,
    createRetailer,
    updateRetailer,
    deleteRetailer,
    getLocationsByRetailer
  };
};