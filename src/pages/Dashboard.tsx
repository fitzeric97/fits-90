import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { PromotionsTable } from "@/components/promotions/PromotionsTable";
import { BrandFilterSidebar } from "@/components/brands/BrandFilterSidebar";
import { useIsMobile } from "@/hooks/use-mobile";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";

export default function Dashboard() {
  const isMobile = useIsMobile();
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect mobile users to the closet page (which will show mobile layout)
    if (isMobile === true) {
      navigate('/closet', { replace: true });
    }
  }, [isMobile, navigate]);

  // Handle loading state while mobile detection is happening
  if (isMobile === undefined) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Don't render desktop dashboard if on mobile (will redirect above)
  if (isMobile) {
    return null;
  }

  return (
    <DashboardLayout>
      <div className="flex gap-6">
        <div className="hidden lg:block">
          <BrandFilterSidebar />
        </div>
        <div className="flex-1">
          <PromotionsTable />
        </div>
      </div>
    </DashboardLayout>
  );
}