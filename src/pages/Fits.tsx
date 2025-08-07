import { useState } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { FitsGrid } from "@/components/fits/FitsGrid";
import { AddFitDialog } from "@/components/fits/AddFitDialog";

export default function Fits() {
  const [refreshKey, setRefreshKey] = useState(0);

  const handleFitAdded = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">My Fits</h1>
            <p className="text-muted-foreground">Share your outfits and tag your closet items</p>
          </div>
          <AddFitDialog onFitAdded={handleFitAdded} />
        </div>
        <FitsGrid key={refreshKey} />
      </div>
    </DashboardLayout>
  );
}