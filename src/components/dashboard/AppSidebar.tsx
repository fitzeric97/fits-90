import { Home, ShirtIcon, Bell, Settings, LogOut, Heart, Camera, Globe } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
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
  { title: "Feed", url: "/dashboard", icon: Home },
  { title: "My Closet", url: "/closet", icon: ShirtIcon },
  { title: "Fits", url: "/fits", icon: Camera },
  { title: "Likes", url: "/likes", icon: Heart },
  { title: "Promotions", url: "/promotions", icon: Globe },
  { title: "All Brands", url: "/brands", icon: Globe },
  { title: "Notifications", url: "/notifications", icon: Bell },
  { title: "Settings", url: "/settings", icon: Settings },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const { signOut } = useAuth();
  const currentPath = location.pathname;
  const collapsed = state === "collapsed";

  const isActive = (path: string) => currentPath === path;
  const getNavCls = ({ isActive }: { isActive: boolean }) =>
    isActive ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium" : "text-sidebar-foreground hover:bg-sidebar-accent/50";

  const handleLogout = async () => {
    await signOut();
  };

  return (
    <Sidebar className={collapsed ? "w-14" : "w-60"} collapsible="icon">
      <SidebarContent>
        <div className="p-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">F</span>
            </div>
            {!collapsed && <span className="font-bold text-lg text-sidebar-foreground">Fits</span>}
          </div>
        </div>

        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems.map((item) => (
                 <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild size="lg" className="lg:h-10 h-12">
                    <NavLink to={item.url} className={getNavCls}>
                      <item.icon className="lg:h-4 lg:w-4 h-5 w-5" />
                      {!collapsed && <span className="lg:text-sm text-base">{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <div className="mt-auto p-4">
          <Button
            variant="ghost"
            className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent/50 lg:h-10 h-12 lg:text-sm text-base"
            onClick={handleLogout}
          >
            <LogOut className="lg:h-4 lg:w-4 h-5 w-5" />
            {!collapsed && <span>Logout</span>}
          </Button>
        </div>
      </SidebarContent>
    </Sidebar>
  );
}