import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { FitCard } from "./FitCard";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/components/auth/AuthProvider";

interface Fit {
  id: string;
  user_id: string;
  image_url: string;
  caption?: string;
  is_instagram_url: boolean;
  created_at: string;
}

export function FitsGrid() {
  const [fits, setFits] = useState<Fit[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    loadFits();
  }, [user]);

  const loadFits = async () => {
    console.log('[FitsGrid] Starting loadFits...');
    console.log('[FitsGrid] Supabase client connected');
    
    try {
      let query = supabase.from('fits').select('*');
      
      if (user?.id) {
        query = query.eq('user_id', user.id);
        console.log('[FitsGrid] Filtering by user_id:', user.id);
      } else {
        console.log('[FitsGrid] No user - loading all fits');
      }
      
      console.log('[FitsGrid] Executing fits query...');
      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) {
        console.error('[FitsGrid] Database error:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        setFits([]);
      } else {
        console.log('[FitsGrid] Query successful. Fits found:', data?.length || 0);
        console.log('[FitsGrid] Sample fits data:', data?.slice(0, 2));
        setFits(data || []);
      }
    } catch (error) {
      console.error('[FitsGrid] Fetch error:', {
        error,
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
      setFits([]);
    } finally {
      setLoading(false);
      console.log('[FitsGrid] loadFits completed');
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="aspect-square rounded-lg" />
        ))}
      </div>
    );
  }

  if (fits.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No fits yet. Share your first outfit!</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {fits.map((fit) => (
        <FitCard key={fit.id} fit={fit} onUpdate={loadFits} />
      ))}
    </div>
  );
}