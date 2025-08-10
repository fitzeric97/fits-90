import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Bell } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export function DashboardHeader() {
  const { user } = useAuth();
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

  return (
    <header className="h-14 border-b bg-background flex items-center justify-between px-4">
      <div className="flex items-center gap-4">
        <SidebarTrigger className="h-10 w-10 p-2" />
        <div className="flex items-center gap-2">
          <img 
            src="/lovable-uploads/2a35b810-ade8-43ba-8359-bd9dbb16de88.png" 
            alt="Fits Logo" 
            className="h-8 w-8 object-contain"
          />
          <span className="font-bold text-lg text-foreground hidden sm:block">Fits</span>
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon">
          <Bell className="h-4 w-4" />
        </Button>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
            <span className="text-sm font-medium text-primary-foreground">{getInitial()}</span>
          </div>
          <span className="text-sm font-medium hidden sm:block">{getFirstName()}</span>
        </div>
      </div>
    </header>
  );
}