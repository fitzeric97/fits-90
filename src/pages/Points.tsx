import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Gift, Zap, Star } from "lucide-react";

export default function Points() {
  const userPoints = 1250; // This would come from the database

  const rewards = [
    {
      id: 1,
      title: "Premium Features",
      description: "Unlock advanced styling tools",
      points: 500,
      icon: <Zap className="h-5 w-5" />,
      available: true
    },
    {
      id: 2,
      title: "Style Consultation",
      description: "Personal style advice session",
      points: 1000,
      icon: <Star className="h-5 w-5" />,
      available: true
    },
    {
      id: 3,
      title: "Brand Partnership",
      description: "Get featured by top brands",
      points: 2000,
      icon: <Trophy className="h-5 w-5" />,
      available: false
    }
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Points & Rewards</h1>
          <p className="text-muted-foreground">Earn points by sharing fits and engaging with the community</p>
        </div>

        {/* Current Points */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5" />
              Your Points
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <div className="text-4xl font-bold text-primary mb-2">{userPoints}</div>
              <p className="text-muted-foreground">Total Points Earned</p>
            </div>
          </CardContent>
        </Card>

        {/* How to Earn Points */}
        <Card>
          <CardHeader>
            <CardTitle>How to Earn Points</CardTitle>
            <CardDescription>Complete these actions to earn more points</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span>Share a new fit</span>
                <Badge variant="secondary">+100 points</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span>Add item to closet</span>
                <Badge variant="secondary">+50 points</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span>Like an item</span>
                <Badge variant="secondary">+10 points</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span>Invite a friend</span>
                <Badge variant="secondary">+100 points</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Available Rewards */}
        <Card>
          <CardHeader>
            <CardTitle>Available Rewards</CardTitle>
            <CardDescription>Redeem your points for these exclusive rewards</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              {rewards.map((reward) => (
                <div 
                  key={reward.id} 
                  className={`p-4 border rounded-lg flex items-center justify-between ${
                    reward.available ? 'border-border' : 'border-muted bg-muted/50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full ${
                      reward.available ? 'bg-primary text-primary-foreground' : 'bg-muted-foreground/20'
                    }`}>
                      {reward.icon}
                    </div>
                    <div>
                      <h4 className="font-medium">{reward.title}</h4>
                      <p className="text-sm text-muted-foreground">{reward.description}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">{reward.points} points</div>
                    {!reward.available && (
                      <Badge variant="outline" className="mt-1">Coming Soon</Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}