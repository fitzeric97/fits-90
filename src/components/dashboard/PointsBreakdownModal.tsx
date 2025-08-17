import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X, Trophy, ShirtIcon, Heart, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface PointsBreakdownModalProps {
  isOpen: boolean;
  onClose: () => void;
  points: {
    fits: number;
    closetItems: number;
    likes: number;
    total: number;
  };
}

export function PointsBreakdownModal({ isOpen, onClose, points }: PointsBreakdownModalProps) {
  const breakdownItems = [
    {
      icon: <Zap className="h-6 w-6" />,
      label: "Fits Shared",
      count: points.fits,
      pointsEach: 100,
      total: points.fits * 100,
      color: "text-purple-500",
      bgColor: "bg-purple-500/10"
    },
    {
      icon: <ShirtIcon className="h-6 w-6" />,
      label: "Items Added",
      count: points.closetItems,
      pointsEach: 50,
      total: points.closetItems * 50,
      color: "text-green-500",
      bgColor: "bg-green-500/10"
    },
    {
      icon: <Heart className="h-6 w-6" />,
      label: "Items Liked",
      count: points.likes,
      pointsEach: 10,
      total: points.likes * 10,
      color: "text-red-500",
      bgColor: "bg-red-500/10"
    }
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Trophy className="h-6 w-6 text-fits-blue" />
            <h2 className="text-xl font-bold">Points Breakdown</h2>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-4">
          {/* Total Score Display */}
          <div className="text-center p-6 bg-gradient-to-r from-fits-blue/10 to-purple-500/10 rounded-lg border-2 border-fits-blue/20">
            <div className="text-4xl font-bold text-fits-blue mb-2 font-mono">
              {points.total.toLocaleString()}
            </div>
            <div className="text-sm text-muted-foreground font-semibold">TOTAL POINTS</div>
          </div>

          {/* Breakdown Items */}
          <div className="space-y-3">
            {breakdownItems.map((item, index) => (
              <div key={index} className="flex items-center justify-between p-4 rounded-lg border bg-card">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-full ${item.bgColor}`}>
                    <div className={item.color}>
                      {item.icon}
                    </div>
                  </div>
                  <div>
                    <div className="font-semibold">{item.label}</div>
                    <div className="text-sm text-muted-foreground">
                      {item.count} × {item.pointsEach} points
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <Badge variant="secondary" className="font-mono text-lg">
                    {item.total}
                  </Badge>
                </div>
              </div>
            ))}
          </div>

          {/* Motivational Message */}
          <div className="text-center p-4 bg-gradient-to-r from-yellow-500/10 to-orange-500/10 rounded-lg border border-yellow-500/20">
            <div className="text-sm font-semibold text-yellow-700 dark:text-yellow-400">
              🎯 Keep sharing fits and engaging to earn more points!
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}