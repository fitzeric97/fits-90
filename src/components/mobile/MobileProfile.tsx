import { useState, useEffect } from "react";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { MobileItemGrid } from "@/components/mobile/MobileItemGrid";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { LogOut, Settings, Share2, Trophy, User, Package, Heart, Camera, Plus } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

import { LucideIcon } from "lucide-react";

interface ProfileSection {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  action: () => void;
  value?: string | number;
  variant?: 'default' | 'stats' | 'action' | 'destructive';
}

export default function MobileProfile() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    closetItems: 0,
    likes: 0,
    fits: 0
  });
  const [profileSections, setProfileSections] = useState<ProfileSection[]>([]);
  const [filteredSections, setFilteredSections] = useState<ProfileSection[]>([]);

  useEffect(() => {
    if (user) {
      fetchStats();
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      const sections: ProfileSection[] = [
        // Stats Section
        {
          id: 'closet-stats',
          title: 'Closet Items',
          description: 'Items in your closet',
          icon: Package,
          action: () => navigate('/closet'),
          value: stats.closetItems,
          variant: 'stats'
        },
        {
          id: 'likes-stats',
          title: 'Liked Items',
          description: 'Items you\'ve liked',
          icon: Heart,
          action: () => navigate('/likes'),
          value: stats.likes,
          variant: 'stats'
        },
        {
          id: 'fits-stats',
          title: 'Fits Shared',
          description: 'Outfits you\'ve posted',
          icon: Camera,
          action: () => navigate('/fits'),
          value: stats.fits,
          variant: 'stats'
        },
        // Account Section
        {
          id: 'profile-info',
          title: 'Profile',
          description: user?.email || 'Manage your profile',
          icon: User,
          action: () => navigate('/settings'),
          variant: 'default'
        },
        {
          id: 'invite-friends',
          title: 'Invite Friends',
          description: 'Share Fits with friends',
          icon: Share2,
          action: handleShare,
          variant: 'action'
        },
        {
          id: 'points-rewards',
          title: 'Points & Rewards',
          description: 'View your rewards',
          icon: Trophy,
          action: () => navigate('/points'),
          variant: 'action'
        },
        // Settings Section
        {
          id: 'settings',
          title: 'Settings',
          description: 'App preferences & account',
          icon: Settings,
          action: () => navigate('/settings'),
          variant: 'default'
        },
        {
          id: 'sign-out',
          title: 'Sign Out',
          description: 'Leave your account',
          icon: LogOut,
          action: handleSignOut,
          variant: 'destructive'
        }
      ];
      
      setProfileSections(sections);
      setFilteredSections(sections);
      setLoading(false);
    }
  }, [user, stats]);

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

  const handleSearch = (query: string) => {
    if (!query.trim()) {
      setFilteredSections(profileSections);
      return;
    }

    const filtered = profileSections.filter(section =>
      section.title.toLowerCase().includes(query.toLowerCase()) ||
      section.description.toLowerCase().includes(query.toLowerCase())
    );
    setFilteredSections(filtered);
  };

  const renderProfileSection = (section: ProfileSection, viewMode: 'grid' | 'list') => {
    const Icon = section.icon;
    
    if (viewMode === 'grid') {
      return (
        <Card 
          key={section.id} 
          className={`overflow-hidden cursor-pointer hover:shadow-md transition-shadow ${
            section.variant === 'destructive' ? 'border-destructive/20' : ''
          }`}
          onClick={section.action}
        >
          <CardContent className="p-4">
            <div className="flex flex-col items-center text-center space-y-3">
              {/* Profile header special case */}
              {section.id === 'profile-info' ? (
                <Avatar className="h-12 w-12">
                  <AvatarFallback>
                    {user?.email?.[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              ) : (
                <div className={`p-3 rounded-full ${
                  section.variant === 'stats' ? 'bg-primary/10' :
                  section.variant === 'action' ? 'bg-secondary/10' :
                  section.variant === 'destructive' ? 'bg-destructive/10' :
                  'bg-muted'
                }`}>
                  <Icon className={`h-6 w-6 ${
                    section.variant === 'stats' ? 'text-primary' :
                    section.variant === 'action' ? 'text-secondary-foreground' :
                    section.variant === 'destructive' ? 'text-destructive' :
                    'text-muted-foreground'
                  }`} />
                </div>
              )}
              
              <div className="space-y-1">
                {section.variant === 'stats' && section.value !== undefined && (
                  <p className="text-2xl font-bold">{section.value}</p>
                )}
                <p className={`font-medium text-sm ${
                  section.variant === 'destructive' ? 'text-destructive' : ''
                }`}>
                  {section.title}
                </p>
                <p className="text-xs text-muted-foreground overflow-hidden">
                  {section.description}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      );
    }

    // List view
    return (
      <Card 
        key={section.id} 
        className={`p-4 cursor-pointer hover:shadow-md transition-shadow ${
          section.variant === 'destructive' ? 'border-destructive/20' : ''
        }`}
        onClick={section.action}
      >
        <div className="flex items-center gap-4">
          {/* Profile header special case */}
          {section.id === 'profile-info' ? (
            <Avatar className="h-10 w-10">
              <AvatarFallback>
                {user?.email?.[0].toUpperCase()}
              </AvatarFallback>
            </Avatar>
          ) : (
            <div className={`p-2 rounded-lg ${
              section.variant === 'stats' ? 'bg-primary/10' :
              section.variant === 'action' ? 'bg-secondary/10' :
              section.variant === 'destructive' ? 'bg-destructive/10' :
              'bg-muted'
            }`}>
              <Icon className={`h-5 w-5 ${
                section.variant === 'stats' ? 'text-primary' :
                section.variant === 'action' ? 'text-secondary-foreground' :
                section.variant === 'destructive' ? 'text-destructive' :
                'text-muted-foreground'
              }`} />
            </div>
          )}
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <p className={`font-medium ${
                section.variant === 'destructive' ? 'text-destructive' : ''
              }`}>
                {section.title}
              </p>
              {section.variant === 'stats' && section.value !== undefined && (
                <span className="text-lg font-bold text-primary">
                  {section.value}
                </span>
              )}
            </div>
            <p className="text-sm text-muted-foreground truncate">
              {section.description}
            </p>
          </div>
        </div>
      </Card>
    );
  };

  if (loading) {
    return (
      <MobileLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout>
      <MobileItemGrid
        items={filteredSections}
        renderItem={renderProfileSection}
        onAddNew={() => handleShare()}
        addButtonText="Invite Friends"
        emptyMessage="No profile sections found"
        onSearch={handleSearch}
        searchPlaceholder="Search profile options..."
      />
      
      {/* Floating Action Button */}
      <div className="fixed bottom-20 right-4 z-50">
        <Button
          size="lg"
          className="h-14 w-14 rounded-full shadow-lg bg-fits-blue hover:bg-fits-blue/90 text-fits-blue-foreground"
          onClick={handleShare}
        >
          <Plus className="h-6 w-6" />
        </Button>
      </div>
    </MobileLayout>
  );
}