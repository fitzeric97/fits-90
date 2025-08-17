import { ReactNode } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Heart, ShirtIcon, Camera, User, Bell } from "lucide-react";
import { cn } from "@/lib/utils";

interface MobileLayoutProps {
  children: ReactNode;
}

export function MobileLayout({ children }: MobileLayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const currentPath = location.pathname;

  const navItems = [
    { icon: Heart, label: "Likes", path: "/likes" },
    { icon: ShirtIcon, label: "Closet", path: "/closet" },
    { icon: Camera, label: "Fits", path: "/fits" },
    { icon: Bell, label: "Activity", path: "/activity" },
    { icon: User, label: "Profile", path: "/profile" },
  ];

  return (
    <div className="min-h-screen bg-[hsl(var(--mobile-background))] flex flex-col no-bounce">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[hsl(var(--mobile-surface))] border-b safe-top">
        <div className="flex items-center justify-center h-14 px-4">
          <img 
            src="/lovable-uploads/2a35b810-ade8-43ba-8359-bd9dbb16de88.png" 
            alt="Fits" 
            className="h-8 w-8"
          />
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto no-bounce">
        <div className="max-w-lg mx-auto w-full pb-20">
          {children}
        </div>
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-[hsl(var(--mobile-surface))] border-t z-40 safe-bottom">
        <div className="grid grid-cols-5 h-16">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPath === item.path;
            
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 text-xs touch-target",
                  isActive 
                    ? "text-primary" 
                    : "text-muted-foreground"
                )}
              >
                <Icon className={cn(
                  "h-5 w-5",
                  isActive && "scale-110"
                )} />
                <span className="font-medium">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}