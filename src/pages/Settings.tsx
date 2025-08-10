import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Copy, Check } from "lucide-react";
import { useState, useEffect } from "react";
import { ConnectedMailboxes } from "@/components/settings/ConnectedMailboxes";
import { InstagramConnector } from "@/components/settings/InstagramConnector";
import { useAuth } from "@/components/auth/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export default function Settings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [emailCopied, setEmailCopied] = useState(false);
  const [notifications, setNotifications] = useState({
    daily: true,
    weekly: false,
  });
  const [userProfile, setUserProfile] = useState<{
    gmail_address: string | null;
    myfits_email: string | null;
  }>({
    gmail_address: null,
    myfits_email: null,
  });

  useEffect(() => {
    if (user) {
      fetchUserProfile();
    }
    
    // Check for Gmail connection success
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('gmail_connected') === 'true') {
      toast({
        title: "Gmail Connected!",
        description: "Your additional Gmail account has been connected successfully.",
      });
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [user, toast]);

  const fetchUserProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('gmail_address, myfits_email')
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

  const copyToClipboard = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setEmailCopied(true);
    setTimeout(() => setEmailCopied(false), 2000);
  };

  return (
    <DashboardLayout>
      <div className="max-w-2xl space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground mt-2">
            Manage your account preferences and email settings
          </p>
        </div>

        <ConnectedMailboxes />
        
        <InstagramConnector />

        {userProfile.gmail_address && userProfile.myfits_email && (
          <Card>
            <CardHeader>
              <CardTitle>Email Configuration</CardTitle>
              <CardDescription>
                Your primary email and Fits forwarding address
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Your Primary Email</Label>
                <div className="p-3 bg-muted rounded-md">
                  <span className="text-sm">{userProfile.gmail_address}</span>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Your Fits Email</Label>
                <div className="flex items-center gap-2">
                  <div className="flex-1 p-3 bg-muted rounded-md">
                    <span className="text-sm font-mono">{userProfile.myfits_email}</span>
                  </div>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => copyToClipboard(userProfile.myfits_email || '')}
                  >
                    {emailCopied ? (
                      <Check className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Use this email when signing up for brand newsletters
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Notification Preferences</CardTitle>
            <CardDescription>
              Control how often you receive promotion summaries
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label>Daily Summary</Label>
                <p className="text-sm text-muted-foreground">
                  Get a daily email with new promotions
                </p>
              </div>
              <Switch
                checked={notifications.daily}
                onCheckedChange={(checked) =>
                  setNotifications({ ...notifications, daily: checked })
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label>Weekly Summary</Label>
                <p className="text-sm text-muted-foreground">
                  Get a weekly roundup of all promotions
                </p>
              </div>
              <Switch
                checked={notifications.weekly}
                onCheckedChange={(checked) =>
                  setNotifications({ ...notifications, weekly: checked })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Summary Time</Label>
              <Select defaultValue="morning">
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Choose time" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="morning">Morning (8:00 AM)</SelectItem>
                  <SelectItem value="afternoon">Afternoon (2:00 PM)</SelectItem>
                  <SelectItem value="evening">Evening (6:00 PM)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Data Management</CardTitle>
            <CardDescription>
              Control your data and account settings
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">Delete My Data</Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete your
                    account and remove all your data from our servers.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                    Yes, delete my data
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}