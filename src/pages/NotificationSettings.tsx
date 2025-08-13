import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { NotificationSettings } from "@/components/settings/NotificationSettings";

export default function NotificationSettingsPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Notification Settings</h1>
          <p className="text-muted-foreground mt-2">
            Customize how and when you receive notifications
          </p>
        </div>
        
        <NotificationSettings />
      </div>
    </DashboardLayout>
  );
}