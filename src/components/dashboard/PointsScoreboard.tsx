import { useState } from 'react';
import { useUserPoints } from '@/hooks/useUserPoints';
import { PointsBreakdownModal } from './PointsBreakdownModal';
import { Trophy } from 'lucide-react';

export function PointsScoreboard() {
  const { points, loading } = useUserPoints();
  const [showBreakdown, setShowBreakdown] = useState(false);

  if (loading) {
    return (
      <div className="bg-cream-muted text-fits-blue px-3 py-1.5 rounded-lg flex items-center gap-2 cursor-pointer hover:bg-cream-text/20 transition-colors border-2 border-cream-text/30 shadow-lg">
        <Trophy className="h-4 w-4" />
        <span className="font-mono font-bold text-lg">---</span>
      </div>
    );
  }

  return (
    <>
      <button
        onClick={() => setShowBreakdown(true)}
        className="bg-cream-muted text-fits-blue px-3 py-1.5 rounded-lg flex items-center gap-2 hover:bg-cream-text/20 transition-colors border-2 border-cream-text/30 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
      >
        <Trophy className="h-4 w-4" />
        <span className="font-mono font-bold text-lg tabular-nums">
          {points.total.toLocaleString()}
        </span>
      </button>

      <PointsBreakdownModal
        isOpen={showBreakdown}
        onClose={() => setShowBreakdown(false)}
        points={points}
      />
    </>
  );
}