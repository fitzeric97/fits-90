import { useState, useEffect } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { supabase } from '@/integrations/supabase/client';

interface PointsBreakdown {
  fits: number;
  closetItems: number;
  likes: number;
  total: number;
}

export function useUserPoints() {
  const { user } = useAuth();
  const [points, setPoints] = useState<PointsBreakdown>({
    fits: 0,
    closetItems: 0,
    likes: 0,
    total: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      calculatePoints();
    }
  }, [user]);

  const calculatePoints = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Get fits count
      const { count: fitsCount, error: fitsError } = await supabase
        .from('fits')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      // Get closet items count
      const { count: closetCount, error: closetError } = await supabase
        .from('closet_items')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      // Get likes count
      const { count: likesCount, error: likesError } = await supabase
        .from('user_likes')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      if (fitsError || closetError || likesError) {
        throw new Error('Failed to fetch counts');
      }

      const fits = fitsCount || 0;
      const closetItems = closetCount || 0;
      const likes = likesCount || 0;

      const pointsBreakdown = {
        fits,
        closetItems,
        likes,
        total: (fits * 100) + (closetItems * 50) + (likes * 10)
      };

      setPoints(pointsBreakdown);
    } catch (error) {
      console.error('Error calculating points:', error);
    } finally {
      setLoading(false);
    }
  };

  return { points, loading, refetch: calculatePoints };
}