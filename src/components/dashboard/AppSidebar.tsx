import { Home, ShirtIcon, Bell, Settings, LogOut, Heart, Camera, Globe, Users } from "lucide-react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/auth/AuthProvider";

const navigationItems = [
  { title: "Home", url: "/dashboard", icon: Home },
  { title: "Connect", url: "/connect", icon: Users },
  { title: "Fits", url: "/fits", icon: Camera },
  { title: "Likes", url: "/likes", icon: Heart },
  { title: "My Closet", url: "/closet", icon: ShirtIcon },
  { title: "All Brands", url: "/brands", icon: Globe },
  { title: "Promotions", url: "/dashboard", icon: Globe },
  { title: "Notifications", url: "/notifications", icon: Bell },
  { title: "Settings", url: "/settings", icon: Settings },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const currentPath = location.pathname;
  const collapsed = state === "collapsed";

  const isActive = (path: string) => currentPath === path;
  const getNavCls = ({ isActive }: { isActive: boolean }) =>
    isActive ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium" : "text-sidebar-foreground hover:bg-sidebar-accent/50";

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <Sidebar className={collapsed ? "w-14" : "w-60 sm:w-64"} collapsible="icon">
      <SidebarContent>
        <div className="p-4 sm:p-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 sm:w-14 sm:h-14 bg-primary rounded-md flex items-center justify-center p-1">
              <img 
                src="/lovable-uploads/2a35b810-ade8-43ba-8359-bd9dbb16de88.png" 
                alt="Fits Logo" 
                className="w-full h-full object-contain"
              />
            </div>
            {!collapsed && <span className="font-bold text-2xl sm:text-3xl text-sidebar-foreground">Fits</span>}
          </div>
        </div>

        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
               {navigationItems.map((item) => (
                 <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild size="lg" className="h-14 sm:h-12 lg:h-11 min-h-[56px]">
                    <NavLink to={item.url} className={getNavCls}>
                      <item.icon className="h-6 w-6 sm:h-5 sm:w-5 flex-shrink-0" />
                      {!collapsed && <span className="text-lg sm:text-base font-medium truncate">{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
               ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <div className="mt-auto p-4 sm:p-6">
          <Button
            variant="ghost"
            className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent/50 h-14 sm:h-12 lg:h-11 min-h-[56px] text-lg sm:text-base font-medium"
            onClick={handleLogout}
          >
            <LogOut className="h-6 w-6 sm:h-5 sm:w-5 flex-shrink-0" />
            {!collapsed && <span className="truncate">Logout</span>}
          </Button>
        </div>
      </SidebarContent>
    </Sidebar>
  );
}