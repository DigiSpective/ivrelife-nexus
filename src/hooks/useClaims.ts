import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  getClaims,
  getClaimById,
  getClaimsByRetailer,
  createClaim,
  updateClaim,
  deleteClaim,
  getAuditLogs,
  createAuditLog,
  createOutboxEvent
} from '@/lib/supabase';
import { Claim, AuditLog, OutboxEvent } from '@/types';

// Claims hooks
export const useClaims = (filters?: {
  retailer_id?: string;
  status?: string;
}) => {
  return useQuery({
    queryKey: ['claims', filters],
    queryFn: async () => {
      const result = await getClaims();
      // Ensure we always return an array
      return Array.isArray(result.data) ? result.data : [];
    },
  });
};

export const useClaim = (id: string) => {
  return useQuery({
    queryKey: ['claim', id],
    queryFn: () => getClaimById(id),
    enabled: !!id,
  });
};

export const useClaimsByRetailer = (retailerId: string) => {
  return useQuery({
    queryKey: ['claims', 'retailer', retailerId],
    queryFn: () => getClaimsByRetailer(retailerId),
    enabled: !!retailerId,
  });
};

export const useCreateClaim = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (claim: Partial<Claim>) => createClaim(claim),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['claims'] });
      // Create audit log for claim creation
      if (data.data?.id) {
        createAuditLog({
          action: 'claim_created',
          entity: 'claim',
          entity_id: data.data.id,
          details: { 
            message: 'New claim created',
            claim_id: data.data.id,
            retailer_id: data.data.retailer_id
          }
        });
        
        // Create outbox event for notifications
        createOutboxEvent({
          event_type: 'claim_created',
          entity: 'claim',
          entity_id: data.data.id,
          payload: { 
            claim_id: data.data.id,
            retailer_id: data.data.retailer_id,
            reason: data.data.reason
          }
        });
      }
    },
  });
};

export const useUpdateClaim = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, claim }: { id: string; claim: Partial<Claim> }) => 
      updateClaim(id, claim),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['claims'] });
      queryClient.invalidateQueries({ queryKey: ['claim', data.data?.id] });
      
      // Create audit log for claim update
      if (data.data?.id) {
        createAuditLog({
          action: 'claim_updated',
          entity: 'claim',
          entity_id: data.data.id,
          details: { 
            message: 'Claim status updated',
            claim_id: data.data.id,
            status: data.data.status
          }
        });
        
        // Create outbox event for notifications
        createOutboxEvent({
          event_type: 'claim_status_changed',
          entity: 'claim',
          entity_id: data.data.id,
          payload: { 
            claim_id: data.data.id,
            status: data.data.status,
            resolution_notes: data.data.resolution_notes
          }
        });
      }
    },
  });
};

export const useDeleteClaim = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => deleteClaim(id),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['claims'] });
      
      // Create audit log for claim deletion
      createAuditLog({
        action: 'claim_deleted',
        entity: 'claim',
        entity_id: variables,
        details: { 
          message: 'Claim deleted',
          claim_id: variables
        }
      });
    },
  });
};

// Audit log hooks
export const useAuditLogs = (entity: string, entityId: string) => {
  return useQuery({
    queryKey: ['auditLogs', entity, entityId],
    queryFn: () => getAuditLogs(entity, entityId),
    enabled: !!entity && !!entityId,
  });
};

export const useCreateAuditLog = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (log: Partial<AuditLog>) => createAuditLog(log),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auditLogs'] });
    },
  });
};

// Outbox event hooks
export const useCreateOutboxEvent = () => {
  return useMutation({
    mutationFn: (event: Partial<OutboxEvent>) => createOutboxEvent(event),
  });
};