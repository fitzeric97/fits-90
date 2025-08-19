import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Copy, Check, User, Instagram, Mail, Bell, Trash2 } from "lucide-react";
import { useState, useEffect } from "react";
import { ConnectedMailboxes } from "@/components/settings/ConnectedMailboxes";
import { InstagramConnector } from "@/components/settings/InstagramConnector";
import { useAuth } from "@/components/auth/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";

export default function Settings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [emailCopied, setEmailCopied] = useState(false);
  const [notifications, setNotifications] = useState({
    daily: true,
    weekly: false,
  });
  const [userProfile, setUserProfile] = useState<{
    display_name: string | null;
    gmail_address: string | null;
    myfits_email: string | null;
  }>({
    display_name: null,
    gmail_address: null,
    myfits_email: null,
  });
  const [profileForm, setProfileForm] = useState({
    firstName: '',
    lastName: '',
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
        .select('display_name, gmail_address, myfits_email')
        .eq('id', user?.id)
        .single();

      if (error) throw error;
      if (data) {
        setUserProfile(data);
        // Parse display name if it exists
        if (data.display_name) {
          const nameParts = data.display_name.split(' ');
          setProfileForm({
            firstName: nameParts[0] || '',
            lastName: nameParts.slice(1).join(' ') || '',
          });
        }
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const updateProfile = async () => {
    try {
      // Ensure we have valid form data
      if (!profileForm.firstName.trim() && !profileForm.lastName.trim()) {
        toast({
          title: "Validation Error",
          description: "Please enter at least your first name.",
          variant: "destructive",
        });
        return;
      }

      const displayName = `${profileForm.firstName.trim()} ${profileForm.lastName.trim()}`.trim();
      
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user?.id,
          display_name: displayName || null,
        }, {
          onConflict: 'id'
        });

      if (error) {
        console.error('Profile update error:', error);
        throw error;
      }
      
      toast({
        title: "Profile Updated",
        description: "Your profile information has been saved successfully.",
      });
      
      // Refresh the profile data
      await fetchUserProfile();
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    }
  };

  const copyToClipboard = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setEmailCopied(true);
    setTimeout(() => setEmailCopied(false), 2000);
  };

  const SettingsContent = () => (
    <div className={`space-y-6 ${isMobile ? 'px-4 py-6' : 'max-w-4xl'}`}>
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground mt-2">
          Manage your account preferences and settings
        </p>
      </div>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full grid-cols-4 mb-6">
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            {!isMobile && "Profile"}
          </TabsTrigger>
          <TabsTrigger value="instagram" className="flex items-center gap-2">
            <Instagram className="h-4 w-4" />
            {!isMobile && "Instagram"}
          </TabsTrigger>
          <TabsTrigger value="email" className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            {!isMobile && "Email"}
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            {!isMobile && "Notifications"}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>
                Your name to help others find you
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className={`grid gap-4 ${isMobile ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'}`}>
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    value={profileForm.firstName}
                    onChange={(e) => setProfileForm({...profileForm, firstName: e.target.value})}
                    placeholder="Enter your first name"
                    className="bg-card text-card-foreground border-border focus:bg-card focus:text-card-foreground"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    value={profileForm.lastName}
                    onChange={(e) => setProfileForm({...profileForm, lastName: e.target.value})}
                    placeholder="Enter your last name"
                    className="bg-card text-card-foreground border-border focus:bg-card focus:text-card-foreground"
                  />
                </div>
              </div>
              <Button onClick={updateProfile} className="w-full md:w-auto">
                Save Profile
              </Button>
            </CardContent>
          </Card>

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
              <CardTitle>Data Management</CardTitle>
              <CardDescription>
                Control your data and account settings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" className="flex items-center gap-2">
                    <Trash2 className="h-4 w-4" />
                    Delete My Data
                  </Button>
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
        </TabsContent>

        <TabsContent value="instagram" className="space-y-6">
          <InstagramConnector />
        </TabsContent>

        <TabsContent value="email" className="space-y-6">
          <ConnectedMailboxes />
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
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
                  <SelectTrigger className="w-48 bg-background">
                    <SelectValue placeholder="Choose time" />
                  </SelectTrigger>
                  <SelectContent className="bg-background border shadow-lg z-50">
                    <SelectItem value="morning">Morning (8:00 AM)</SelectItem>
                    <SelectItem value="afternoon">Afternoon (2:00 PM)</SelectItem>
                    <SelectItem value="evening">Evening (6:00 PM)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );

  if (isMobile) {
    return (
      <MobileLayout>
        <SettingsContent />
      </MobileLayout>
    );
  }

  return (
    <DashboardLayout>
      <SettingsContent />
    </DashboardLayout>
  );
}