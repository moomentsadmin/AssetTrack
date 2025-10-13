import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  LayoutDashboard,
  Package,
  Users,
  History,
  Settings,
  Building2,
  FileUp,
  ChevronDown,
  LogOut,
  Wrench,
  UserCog,
  User as UserIcon,
} from "lucide-react";

export function AppSidebar() {
  const { user, logoutMutation } = useAuth();
  const [location, setLocation] = useLocation();

  const menuItems = [
    {
      title: "Dashboard",
      icon: LayoutDashboard,
      url: "/",
      testId: "nav-dashboard",
    },
    {
      title: "Assets",
      icon: Package,
      url: "/assets",
      testId: "nav-assets",
    },
    {
      title: "Employees",
      icon: Users,
      url: "/employees",
      testId: "nav-employees",
    },
    {
      title: "Departments",
      icon: Building2,
      url: "/departments",
      testId: "nav-departments",
    },
    {
      title: "Audit Trail",
      icon: History,
      url: "/audit",
      testId: "nav-audit",
    },
  ];

  const adminItems = [
    {
      title: "User Management",
      icon: UserCog,
      url: "/users",
      testId: "nav-users",
      adminOnly: true,
    },
    {
      title: "Custom Fields",
      icon: Wrench,
      url: "/custom-fields",
      testId: "nav-custom-fields",
    },
    {
      title: "Import Data",
      icon: FileUp,
      url: "/import",
      testId: "nav-import",
    },
    {
      title: "Settings",
      icon: Settings,
      url: "/settings",
      testId: "nav-settings",
    },
  ];

  const canAccessAdmin = user?.role === "admin" || user?.role === "manager";

  return (
    <Sidebar>
      <SidebarHeader className="border-b p-4">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Package className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="font-semibold text-sm">Asset Management</h2>
            <p className="text-xs text-muted-foreground">IT System</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Main Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    onClick={() => setLocation(item.url)}
                    isActive={location === item.url}
                    data-testid={item.testId}
                  >
                    <item.icon className="h-4 w-4" />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {canAccessAdmin && (
          <SidebarGroup>
            <SidebarGroupLabel>Administration</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {adminItems
                  .filter((item) => !item.adminOnly || user?.role === "admin")
                  .map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        onClick={() => setLocation(item.url)}
                        isActive={location === item.url}
                        data-testid={item.testId}
                      >
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="border-t p-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-3 w-full hover-elevate rounded-md p-2" data-testid="button-user-menu">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary/10 text-primary text-xs">
                  {user?.fullName?.split(" ").map(n => n[0]).join("").toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 text-left min-w-0">
                <p className="text-sm font-medium truncate">{user?.fullName}</p>
                <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
              </div>
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium">{user?.fullName}</p>
                <p className="text-xs text-muted-foreground">{user?.email}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="font-normal">
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Role:</span>
                <Badge variant="secondary" className="text-xs">
                  {user?.role}
                </Badge>
              </div>
            </DropdownMenuLabel>
            {user?.department && (
              <DropdownMenuLabel className="font-normal">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Department:</span>
                  <span className="text-xs">{user.department}</span>
                </div>
              </DropdownMenuLabel>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => setLocation("/profile")}
              data-testid="button-profile"
            >
              <UserIcon className="mr-2 h-4 w-4" />
              <span>My Profile</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => logoutMutation.mutate()}
              className="text-destructive"
              data-testid="button-logout"
            >
              <LogOut className="mr-2 h-4 w-4" />
              <span>Sign Out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
