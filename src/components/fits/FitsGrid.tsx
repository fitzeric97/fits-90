import { useState, useEffect } from "react";
import { FitCard } from "./FitCard";
import { Skeleton } from "@/components/ui/skeleton";

// Simple fetch since types are regenerating
async function fetchFits() {
  const response = await fetch(`https://ijawvesjgyddyiymiahk.supabase.co/rest/v1/fits?select=*&order=created_at.desc`, {
    headers: {
      'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlqYXd2ZXNqZ3lkZHlpeW1pYWhrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0MzQ2MzgsImV4cCI6MjA3MDAxMDYzOH0.ZFG9EoTGU_gar6cGnu4LYAcsfRXtQQ0yLeq7E3g0CE4',
      'Authorization': `Bearer ${localStorage.getItem('supabase.auth.token')}`,
      'Content-Type': 'application/json'
    }
  });
  return response.json();
}

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
    loadFits();
  }, []);

  const loadFits = async () => {
    try {
      const data = await fetchFits();
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
        <FitCard key={fit.id} fit={fit} onUpdate={loadFits} />
      ))}
    </div>
  );
}