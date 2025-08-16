import { useState, useEffect } from "react";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { LogOut, Settings, Share2, Trophy } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

export default function MobileProfile() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [stats, setStats] = useState({
    closetItems: 0,
    likes: 0,
    fits: 0
  });

  useEffect(() => {
    if (user) fetchStats();
  }, [user]);

  const fetchStats = async () => {
    const [closetCount, likesCount, fitsCount] = await Promise.all([
      supabase.from('closet_items').select('*', { count: 'exact' }).eq('user_id', user?.id),
      supabase.from('user_likes').select('*', { count: 'exact' }).eq('user_id', user?.id),
      supabase.from('fits').select('*', { count: 'exact' }).eq('user_id', user?.id)
    ]);

    setStats({
      closetItems: closetCount.count || 0,
      likes: likesCount.count || 0,
      fits: fitsCount.count || 0
    });
  };

  const handleShare = () => {
    const shareUrl = `${window.location.origin}/join?ref=${user?.id}`;
    if (navigator.share) {
      navigator.share({
        title: 'Join me on Fits',
        text: 'Check out my fashion style on Fits!',
        url: shareUrl
      });
    } else {
      navigator.clipboard.writeText(shareUrl);
      toast({
        title: "Link copied!",
        description: "Share this link with your friends to invite them to Fits",
      });
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <MobileLayout>
      <div className="p-4 space-y-4">
        {/* Profile Header */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center">
              <Avatar className="h-20 w-20 mb-3">
                <AvatarFallback className="text-lg">
                  {user?.email?.[0].toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <h2 className="font-semibold text-lg">{user?.email?.split('@')[0]}</h2>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 mt-6">
              <div className="text-center">
                <p className="text-2xl font-bold">{stats.closetItems}</p>
                <p className="text-xs text-muted-foreground">Closet</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">{stats.likes}</p>
                <p className="text-xs text-muted-foreground">Likes</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">{stats.fits}</p>
                <p className="text-xs text-muted-foreground">Fits</p>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-2 mt-6">
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={handleShare}
              >
                <Share2 className="h-4 w-4 mr-2" />
                Invite Friends
              </Button>
              
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => navigate('/points')}
              >
                <Trophy className="h-4 w-4 mr-2" />
                Points & Rewards
              </Button>

              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => navigate('/settings')}
              >
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>

              <Button 
                variant="outline" 
                className="w-full justify-start text-destructive"
                onClick={handleSignOut}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </MobileLayout>
  );
}