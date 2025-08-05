import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { PromotionsTable } from "@/components/promotions/PromotionsTable";
import { BrandFilterSidebar } from "@/components/brands/BrandFilterSidebar";

export default function Dashboard() {
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