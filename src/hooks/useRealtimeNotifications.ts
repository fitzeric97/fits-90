import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export function useRealtimeNotifications() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  useEffect(() => {
    const channel = supabase
      .channel('notifications-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications'
        },
        (payload) => {
          // Update the notifications query with the new notification
          queryClient.setQueryData(['notifications'], (oldData: any) => {
            if (!oldData) return [payload.new];
            return [payload.new, ...oldData];
          });

          // Show a toast for the new notification
          const notification = payload.new as any;
          toast({
            title: notification.title,
            description: notification.description,
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications'
        },
        (payload) => {
          // Update the specific notification in the cache
          queryClient.setQueryData(['notifications'], (oldData: any) => {
            if (!oldData) return [];
            return oldData.map((notification: any) =>
              notification.id === payload.new.id ? payload.new : notification
            );
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'notifications'
        },
        (payload) => {
          // Remove the deleted notification from the cache
          queryClient.setQueryData(['notifications'], (oldData: any) => {
            if (!oldData) return [];
            return oldData.filter((notification: any) => notification.id !== payload.old.id);
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient, toast]);
}