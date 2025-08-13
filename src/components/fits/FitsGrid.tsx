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
    try {
      let query = supabase.from('fits').select('*');
      
      if (user?.id) {
        query = query.eq('user_id', user.id);
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) {
        setFits([]);
      } else {
        setFits(data || []);
      }
    } catch (error) {
      setFits([]);
    } finally {
      setLoading(false);
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