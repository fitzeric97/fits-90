import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/auth/AuthProvider";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { NotificationBell } from "./NotificationBell";

export function DashboardHeader() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [userProfile, setUserProfile] = useState<{
    display_name: string | null;
  }>({
    display_name: null,
  });

  useEffect(() => {
    if (user) {
      fetchUserProfile();
    }
  }, [user]);

  const fetchUserProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('display_name')
        .eq('id', user?.id)
        .single();

      if (error) throw error;
      if (data) {
        setUserProfile(data);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  // Get the first name from display_name
  const getFirstName = () => {
    if (userProfile.display_name) {
      return userProfile.display_name.split(' ')[0];
    }
    return user?.email?.split('@')[0] || 'User';
  };

  // Get the first letter for avatar
  const getInitial = () => {
    const firstName = getFirstName();
    return firstName.charAt(0).toUpperCase();
  };

  const handleProfileClick = () => {
    navigate('/settings');
  };

  const handleNotificationSettingsClick = () => {
    navigate('/notifications');
  };

  return (
    <header className="h-14 border-b bg-background flex items-center justify-between px-4 relative">
      {/* Left side - Menu button */}
      <div className="flex items-center gap-4 sm:flex-1">
        <SidebarTrigger className="h-20 w-20 p-4" />
        <div className="hidden sm:flex items-center gap-2">
          <img 
            src="/lovable-uploads/2a35b810-ade8-43ba-8359-bd9dbb16de88.png" 
            alt="Fits Logo" 
            className="h-8 w-8 object-contain"
          />
          <span className="font-bold text-lg text-foreground">Fits</span>
        </div>
      </div>

      {/* Center - Logo (mobile only) */}
      <div className="absolute left-1/2 transform -translate-x-1/2 sm:hidden">
        <img 
          src="/lovable-uploads/2a35b810-ade8-43ba-8359-bd9dbb16de88.png" 
          alt="Fits Logo" 
          className="h-12 w-12 object-contain"
        />
      </div>
      
      {/* Right side - Notifications and User */}
      <div className="flex items-center gap-2">
        <NotificationBell />
        <Button 
          variant="ghost" 
          className="flex items-center gap-2 h-8 px-2 hover:bg-accent rounded-full"
          onClick={handleProfileClick}
        >
          <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
            <span className="text-sm font-medium text-primary-foreground">{getInitial()}</span>
          </div>
          <span className="text-sm font-medium hidden sm:block">{getFirstName()}</span>
        </Button>
      </div>
    </header>
  );
}