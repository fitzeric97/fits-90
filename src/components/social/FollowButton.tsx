import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { UserPlus, UserMinus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/auth/AuthProvider";
import { useToast } from "@/hooks/use-toast";

interface FollowButtonProps {
  targetUserId: string;
  targetUsername?: string;
  size?: "sm" | "default" | "lg";
  onFollowChange?: (isFollowing: boolean) => void;
}

export function FollowButton({ 
  targetUserId, 
  targetUsername,
  size = "sm",
  onFollowChange 
}: FollowButtonProps) {
  const { user } = useAuth();
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (user && targetUserId && user.id !== targetUserId) {
      checkFollowStatus();
    }
  }, [user, targetUserId]);

  const checkFollowStatus = async () => {
    const { data } = await supabase
      .from('user_connections')
      .select('*')
      .eq('user_id', user?.id)
      .eq('connected_user_id', targetUserId)
      .eq('status', 'accepted')
      .maybeSingle();
    
    setIsFollowing(!!data);
  };

  const handleFollow = async () => {
    if (!user) {
      toast({
        title: "Please sign in",
        description: "You need to be signed in to follow users",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    
    try {
      if (isFollowing) {
        // Disconnect
        const { error } = await supabase
          .from('user_connections')
          .delete()
          .eq('user_id', user.id)
          .eq('connected_user_id', targetUserId);

        if (error) throw error;
        
        setIsFollowing(false);
        onFollowChange?.(false);
        
        toast({
          title: "Disconnected",
          description: `You disconnected from ${targetUsername || 'this user'}`,
        });
      } else {
        // Connect
        const { error } = await supabase
          .from('user_connections')
          .insert({
            user_id: user.id,
            connected_user_id: targetUserId,
            requested_by: user.id,
            status: 'accepted'
          });

        if (error) throw error;
        
        setIsFollowing(true);
        onFollowChange?.(true);
        
        toast({
          title: "Connected!",
          description: `You're now connected to ${targetUsername || 'this user'}`,
        });
      }
    } catch (error) {
      console.error('Follow error:', error);
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Don't show button if user is viewing their own profile
  if (user?.id === targetUserId) return null;

  return (
    <Button
      onClick={handleFollow}
      disabled={loading}
      variant={isFollowing ? "outline" : "default"}
      size={size}
      className={isFollowing ? "border-fits-blue text-fits-blue hover:bg-fits-blue hover:text-white" : "bg-fits-blue hover:bg-fits-blue/90 text-white border-fits-blue"}
    >
      {isFollowing ? (
        <>
          <UserMinus className="h-4 w-4 mr-1" />
          {loading ? "..." : "Following"}
        </>
      ) : (
        <>
          <UserPlus className="h-4 w-4 mr-1" />
          {loading ? "..." : "Follow"}
        </>
      )}
    </Button>
  );
}