import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Bell } from "lucide-react";

export function DashboardHeader() {
  return (
    <header className="h-14 border-b bg-background flex items-center justify-between px-4">
      <div className="flex items-center gap-4">
        <SidebarTrigger className="h-10 w-10 p-2" />
        <div className="flex items-center gap-2">
          <img 
            src="/lovable-uploads/e4a1b3bc-c73c-496e-b3a5-5f401fc40604.png" 
            alt="Fits Logo" 
            className="h-8 w-8 object-contain"
          />
          <span className="font-bold text-lg text-foreground hidden sm:block">Fits</span>
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon">
          <Bell className="h-4 w-4" />
        </Button>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
            <span className="text-sm font-medium">J</span>
          </div>
          <span className="text-sm font-medium">Jamie</span>
        </div>
      </div>
    </header>
  );
}