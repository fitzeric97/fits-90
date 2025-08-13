import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Bell, Mail, Smartphone } from "lucide-react";

type NotificationPreference = {
  id: string;
  user_id: string;
  notification_type: string;
  enabled: boolean;
  email_enabled: boolean;
  push_enabled: boolean;
  created_at: string;
  updated_at: string;
};

const notificationTypes = [
  {
    type: 'closet',
    label: 'Closet Items',
    description: 'New items added to your closet'
  },
  {
    type: 'fits',
    label: 'Fits',
    description: 'New fits and outfit posts'
  },
  {
    type: 'likes',
    label: 'Likes',
    description: 'Items you liked or saved'
  },
  {
    type: 'promotion',
    label: 'Promotions',
    description: 'Brand promotions and deals'
  },
  {
    type: 'general',
    label: 'General',
    description: 'System updates and announcements'
  }
];

export function NotificationSettings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch notification preferences
  const { data: preferences = [], isLoading } = useQuery({
    queryKey: ['notificationPreferences'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notification_preferences')
        .select('*')
        .order('notification_type');
      
      if (error) throw error;
      return data as NotificationPreference[];
    },
  });

  // Update preference mutation
  const updatePreferenceMutation = useMutation({
    mutationFn: async ({ 
      id, 
      updates 
    }: { 
      id: string; 
      updates: Partial<Pick<NotificationPreference, 'enabled' | 'email_enabled' | 'push_enabled'>> 
    }) => {
      const { error } = await supabase
        .from('notification_preferences')
        .update(updates)
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notificationPreferences'] });
      toast({
        title: "Preferences updated",
        description: "Your notification preferences have been saved",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update notification preferences",
        variant: "destructive",
      });
    },
  });

  const handleToggle = (
    preference: NotificationPreference, 
    field: 'enabled' | 'email_enabled' | 'push_enabled',
    value: boolean
  ) => {
    updatePreferenceMutation.mutate({
      id: preference.id,
      updates: { [field]: value }
    });
  };

  const getPreferenceByType = (type: string) => {
    return preferences.find(p => p.notification_type === type);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Notification Settings</CardTitle>
          <CardDescription>Loading your preferences...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Notification Settings
        </CardTitle>
        <CardDescription>
          Customize how and when you receive notifications
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-6">
          {notificationTypes.map((type) => {
            const preference = getPreferenceByType(type.type);
            if (!preference) return null;

            return (
              <div key={type.type} className="space-y-3">
                <div>
                  <h4 className="font-medium">{type.label}</h4>
                  <p className="text-sm text-muted-foreground">{type.description}</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pl-4 border-l-2 border-muted">
                  {/* In-app notifications */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Bell className="h-4 w-4 text-muted-foreground" />
                      <Label htmlFor={`${type.type}-app`} className="text-sm">
                        In-app
                      </Label>
                    </div>
                    <Switch
                      id={`${type.type}-app`}
                      checked={preference.enabled}
                      onCheckedChange={(checked) => 
                        handleToggle(preference, 'enabled', checked)
                      }
                      disabled={updatePreferenceMutation.isPending}
                    />
                  </div>

                  {/* Email notifications */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <Label htmlFor={`${type.type}-email`} className="text-sm">
                        Email
                      </Label>
                    </div>
                    <Switch
                      id={`${type.type}-email`}
                      checked={preference.email_enabled}
                      onCheckedChange={(checked) => 
                        handleToggle(preference, 'email_enabled', checked)
                      }
                      disabled={updatePreferenceMutation.isPending}
                    />
                  </div>

                  {/* Push notifications */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Smartphone className="h-4 w-4 text-muted-foreground" />
                      <Label htmlFor={`${type.type}-push`} className="text-sm">
                        Push
                      </Label>
                    </div>
                    <Switch
                      id={`${type.type}-push`}
                      checked={preference.push_enabled}
                      onCheckedChange={(checked) => 
                        handleToggle(preference, 'push_enabled', checked)
                      }
                      disabled={updatePreferenceMutation.isPending}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="pt-4 border-t">
          <Button
            variant="outline"
            onClick={() => {
              // Reset all to defaults
              preferences.forEach(preference => {
                updatePreferenceMutation.mutate({
                  id: preference.id,
                  updates: {
                    enabled: true,
                    email_enabled: false,
                    push_enabled: true
                  }
                });
              });
            }}
            disabled={updatePreferenceMutation.isPending}
          >
            Reset to Defaults
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}