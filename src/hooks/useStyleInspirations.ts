import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/AuthProvider';

export interface StyleInspiration {
  id: string;
  title: string;
  description: string;
  image_url: string;
  category: string;
  season: string;
  tags: string[];
  source_url?: string;
  view_count: number;
  created_at: string;
  admin_user_id: string;
  is_active: boolean;
  like_count?: number;
  save_count?: number;
  user_liked?: boolean;
  user_saved?: boolean;
  products?: InspirationProduct[];
}

export interface InspirationProduct {
  id: string;
  inspiration_id: string;
  product_name: string;
  brand?: string;
  product_url: string;
  price?: string;
  product_type?: string;
  image_url?: string;
  affiliate_link?: string;
  position_x?: number;
  position_y?: number;
}

export interface InspirationInteraction {
  id: string;
  user_id: string;
  inspiration_id: string;
  interaction_type: 'like' | 'save' | 'click' | 'share';
  created_at: string;
}

export function useStyleInspirations(filters?: {
  category?: string;
  season?: string;
  limit?: number;
}) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['style-inspirations', filters],
    queryFn: async () => {
      let query = supabase
        .from('style_inspirations')
        .select(`
          *,
          inspiration_products (*)
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (filters?.category) {
        query = query.eq('category', filters.category);
      }

      if (filters?.season) {
        query = query.eq('season', filters.season);
      }

      if (filters?.limit) {
        query = query.limit(filters.limit);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Get interaction counts and user's interactions if logged in
      const inspirationsWithStats = await Promise.all(
        (data || []).map(async (inspiration) => {
          // Get like and save counts
          const { data: interactions } = await supabase
            .from('inspiration_interactions')
            .select('interaction_type')
            .eq('inspiration_id', inspiration.id);

          const like_count = interactions?.filter(i => i.interaction_type === 'like').length || 0;
          const save_count = interactions?.filter(i => i.interaction_type === 'save').length || 0;

          let user_liked = false;
          let user_saved = false;

          if (user) {
            const { data: userInteractions } = await supabase
              .from('inspiration_interactions')
              .select('interaction_type')
              .eq('inspiration_id', inspiration.id)
              .eq('user_id', user.id);

            user_liked = userInteractions?.some(i => i.interaction_type === 'like') || false;
            user_saved = userInteractions?.some(i => i.interaction_type === 'save') || false;
          }

          return {
            ...inspiration,
            like_count,
            save_count,
            user_liked,
            user_saved,
            products: inspiration.inspiration_products || []
          };
        })
      );

      return inspirationsWithStats;
    },
    enabled: !!supabase
  });
}

export function useStyleInspiration(id: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['style-inspiration', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('style_inspirations')
        .select(`
          *,
          inspiration_products (*)
        `)
        .eq('id', id)
        .eq('is_active', true)
        .single();

      if (error) throw error;

      // Increment view count
      await supabase
        .from('style_inspirations')
        .update({ view_count: (data.view_count || 0) + 1 })
        .eq('id', id);

      // Get interaction stats
      const { data: interactions } = await supabase
        .from('inspiration_interactions')
        .select('interaction_type, user_id')
        .eq('inspiration_id', id);

      const like_count = interactions?.filter(i => i.interaction_type === 'like').length || 0;
      const save_count = interactions?.filter(i => i.interaction_type === 'save').length || 0;
      const user_liked = user ? interactions?.some(i => i.interaction_type === 'like' && i.user_id === user.id) || false : false;
      const user_saved = user ? interactions?.some(i => i.interaction_type === 'save' && i.user_id === user.id) || false : false;

      return {
        ...data,
        like_count,
        save_count,
        user_liked,
        user_saved,
        products: data.inspiration_products || []
      };
    },
    enabled: !!id
  });
}

export function useInspirationInteraction() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      inspirationId, 
      interactionType 
    }: { 
      inspirationId: string; 
      interactionType: 'like' | 'save' | 'click' | 'share' 
    }) => {
      if (!user) throw new Error('User must be logged in');

      // Check if interaction already exists
      const { data: existing } = await supabase
        .from('inspiration_interactions')
        .select('id')
        .eq('user_id', user.id)
        .eq('inspiration_id', inspirationId)
        .eq('interaction_type', interactionType)
        .single();

      if (existing) {
        // Remove interaction (unlike/unsave)
        const { error } = await supabase
          .from('inspiration_interactions')
          .delete()
          .eq('user_id', user.id)
          .eq('inspiration_id', inspirationId)
          .eq('interaction_type', interactionType);

        if (error) throw error;
        return { action: 'removed', interactionType };
      } else {
        // Add interaction
        const { error } = await supabase
          .from('inspiration_interactions')
          .insert({
            user_id: user.id,
            inspiration_id: inspirationId,
            interaction_type: interactionType
          });

        if (error) throw error;
        return { action: 'added', interactionType };
      }
    },
    onSuccess: () => {
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['style-inspirations'] });
      queryClient.invalidateQueries({ queryKey: ['style-inspiration'] });
    }
  });
}

export function useAdminInspirations() {
  return useQuery({
    queryKey: ['admin-style-inspirations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('style_inspirations')
        .select(`
          *,
          inspiration_products (*)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    }
  });
}

export function useCreateInspiration() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (inspirationData: {
      title: string;
      description?: string;
      image_url: string;
      category?: string;
      season?: string;
      tags?: string[];
      source_url?: string;
      products?: Omit<InspirationProduct, 'id' | 'inspiration_id'>[];
    }) => {
      // Create inspiration
      const { data: inspiration, error: inspirationError } = await supabase
        .from('style_inspirations')
        .insert(inspirationData)
        .select()
        .single();

      if (inspirationError) throw inspirationError;

      // Add products if provided
      if (inspirationData.products && inspirationData.products.length > 0) {
        const productsWithId = inspirationData.products.map(product => ({
          ...product,
          inspiration_id: inspiration.id
        }));

        const { error: productsError } = await supabase
          .from('inspiration_products')
          .insert(productsWithId);

        if (productsError) throw productsError;
      }

      return inspiration;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-style-inspirations'] });
      queryClient.invalidateQueries({ queryKey: ['style-inspirations'] });
    }
  });
}

export function useUpdateInspiration() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      id, 
      ...updateData 
    }: { 
      id: string 
    } & Partial<StyleInspiration> & {
      products?: Omit<InspirationProduct, 'id' | 'inspiration_id'>[];
    }) => {
      const { products, ...inspirationUpdate } = updateData;

      // Update inspiration
      const { data, error } = await supabase
        .from('style_inspirations')
        .update(inspirationUpdate)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      // Update products if provided
      if (products !== undefined) {
        // Delete existing products
        await supabase
          .from('inspiration_products')
          .delete()
          .eq('inspiration_id', id);

        // Insert new products
        if (products.length > 0) {
          const productsWithId = products.map(product => ({
            ...product,
            inspiration_id: id
          }));

          const { error: productsError } = await supabase
            .from('inspiration_products')
            .insert(productsWithId);

          if (productsError) throw productsError;
        }
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-style-inspirations'] });
      queryClient.invalidateQueries({ queryKey: ['style-inspirations'] });
    }
  });
}

export function useDeleteInspiration() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      // Soft delete by setting is_active to false
      const { error } = await supabase
        .from('style_inspirations')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-style-inspirations'] });
      queryClient.invalidateQueries({ queryKey: ['style-inspirations'] });
    }
  });
}