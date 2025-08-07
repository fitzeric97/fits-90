import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { FitCard } from "./FitCard";
import { Skeleton } from "@/components/ui/skeleton";

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

  useEffect(() => {
    fetchFits();
  }, []);

  const fetchFits = async () => {
    try {
      const { data, error } = await supabase
        .from('fits')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setFits(data || []);
    } catch (error) {
      console.error('Error fetching fits:', error);
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
        <FitCard key={fit.id} fit={fit} onUpdate={fetchFits} />
      ))}
    </div>
  );
}