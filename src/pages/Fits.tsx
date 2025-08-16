import { useState } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { FitsGrid } from "@/components/fits/FitsGrid";
import { AddFitDialog } from "@/components/fits/AddFitDialog";
import { useIsMobile } from "@/hooks/use-mobile";
import MobileFits from "@/components/mobile/MobileFits";

export default function Fits() {
  const [refreshKey, setRefreshKey] = useState(0);
  const isMobile = useIsMobile();

  const handleFitAdded = () => {
    setRefreshKey(prev => prev + 1);
  };

  // Use mobile version on mobile devices
  if (isMobile) {
    return <MobileFits />;
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Fits</h1>
          </div>
          <AddFitDialog onFitAdded={handleFitAdded} />
        </div>
        <FitsGrid key={refreshKey} />
      </div>
    </DashboardLayout>
  );
}