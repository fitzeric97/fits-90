import Connect from "./Connect";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";

export default function ConnectPage() {
  return (
    <DashboardLayout>
      <div className="p-3 sm:p-4 lg:p-6">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <h1 className="text-2xl font-bold">Connect with Others</h1>
            <p className="text-muted-foreground">Find and connect with other fashion enthusiasts</p>
          </div>
          <Connect />
        </div>
      </div>
    </DashboardLayout>
  );
}