import { ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { Heart, ShirtIcon, Camera, User, Bell, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";

interface PreviewMobileLayoutProps {
  children: ReactNode;
  onSignUpTrigger: () => void;
  currentSection?: 'likes' | 'closet' | 'fits' | 'activity' | 'profile';
}

export function PreviewMobileLayout({ children, onSignUpTrigger, currentSection = 'likes' }: PreviewMobileLayoutProps) {
  const navItems = [
    { icon: Heart, label: "Likes", path: "likes" },
    { icon: ShirtIcon, label: "Closet", path: "closet" },
    { icon: Bell, label: "Activity", path: "activity" },
    { icon: Camera, label: "Fits", path: "fits" },
    { icon: User, label: "Profile", path: "profile" },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header - matches real MobileLayout */}
      <header className="sticky top-0 z-40 bg-cream-header border-b">
        <div className="flex items-center h-14 px-4 relative">
          <div className="flex-shrink-0">
            {/* Preview Points Scoreboard */}
            <button
              onClick={onSignUpTrigger}
              className="bg-cream-header text-fits-blue px-3 py-1.5 rounded-lg flex items-center gap-2 hover:bg-cream-muted transition-colors border-2 border-cream-muted shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
            >
              <Trophy className="h-4 w-4" />
              <span className="font-mono font-bold text-lg tabular-nums">
                1,250
              </span>
            </button>
          </div>
          <div className="absolute left-1/2 transform -translate-x-1/2">
            <img 
              src="/lovable-uploads/2a35b810-ade8-43ba-8359-bd9dbb16de88.png" 
              alt="Fits" 
              className="h-8 w-8"
            />
          </div>
          <div className="flex items-center ml-auto">
            {/* Preview Notification Bell */}
            <button
              onClick={onSignUpTrigger}
              className="relative p-2 text-fits-blue hover:bg-cream-muted rounded-lg transition-colors"
            >
              <Bell className="h-5 w-5" />
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                3
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 pb-16 overflow-y-auto">
        <div className="max-w-lg mx-auto w-full">
          <div onClick={onSignUpTrigger} className="cursor-pointer">
            {children}
          </div>
        </div>
      </main>

      {/* Bottom Navigation - matches real MobileLayout */}
      <nav className="fixed bottom-0 left-0 right-0 bg-cream-header border-t z-40">
        <div className="grid grid-cols-5 h-16">
          {navItems.map((item, index) => {
            const Icon = item.icon;
            const isActive = currentSection === item.path;
            const isCenter = index === 2; // Activity tab is center
            
            return (
              <button
                key={item.path}
                onClick={onSignUpTrigger}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 text-xs relative",
                  isActive 
                    ? "text-fits-blue" 
                    : "text-muted-foreground",
                  isCenter && "relative"
                )}
              >
                {/* Special styling for center Activity button */}
                {isCenter && (
                  <div className={cn(
                    "absolute -top-2 rounded-full p-2",
                    isActive ? "bg-fits-blue" : "bg-muted"
                  )}>
                    <Icon className="h-6 w-6 text-white" strokeWidth={2.5} />
                  </div>
                )}
                
                {!isCenter && (
                  <Icon className={cn(
                    "h-6 w-6",
                    isActive && "scale-110"
                  )} strokeWidth={2.5} />
                )}
                
                <span className={cn(
                  "font-bold text-[11px]",
                  isCenter && "mt-3"
                )}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}