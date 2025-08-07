import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { FitsGrid } from "@/components/fits/FitsGrid";
import { AddFitDialog } from "@/components/fits/AddFitDialog";

export default function Fits() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">My Fits</h1>
            <p className="text-muted-foreground">Share your outfits and tag your closet items</p>
          </div>
          <AddFitDialog />
        </div>
        <FitsGrid />
      </div>
    </DashboardLayout>
  );
}