import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import { ProtectedRoute } from "@/lib/protected-route";
import { AppSidebar } from "@/components/app-sidebar";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import DashboardPage from "@/pages/dashboard-page";
import AssetsPage from "@/pages/assets-page";
import EmployeesPage from "@/pages/employees-page";
import DepartmentsPage from "@/pages/departments-page";
import AuditPage from "@/pages/audit-page";
import CustomFieldsPage from "@/pages/custom-fields-page";
import ImportPage from "@/pages/import-page";
import SettingsPage from "@/pages/settings-page";
import UserManagementPage from "@/pages/user-management-page";
import ProfilePage from "@/pages/profile-page";
import LocationsPage from "@/pages/locations-page";
import SystemHealthPage from "@/pages/system-health-page";
import BrandingPage from "@/pages/branding-page";
import PrintLabelPage from "@/pages/print-label-page";

function Router() {
  return (
    <Switch>
      <ProtectedRoute path="/" component={DashboardPage} />
      <ProtectedRoute path="/assets" component={AssetsPage} />
      <ProtectedRoute path="/assets/:id/print-label" component={PrintLabelPage} />
      <ProtectedRoute path="/employees" component={EmployeesPage} />
      <ProtectedRoute path="/departments" component={DepartmentsPage} />
      <ProtectedRoute path="/locations" component={LocationsPage} allowedRoles={["admin", "manager"]} />
      <ProtectedRoute path="/audit" component={AuditPage} />
      <ProtectedRoute path="/custom-fields" component={CustomFieldsPage} />
      <ProtectedRoute path="/import" component={ImportPage} />
      <ProtectedRoute path="/settings" component={SettingsPage} />
      <ProtectedRoute path="/users" component={UserManagementPage} allowedRoles={["admin"]} />
      <ProtectedRoute path="/profile" component={ProfilePage} />
      <ProtectedRoute path="/system-health" component={SystemHealthPage} allowedRoles={["admin"]} />
      <ProtectedRoute path="/branding" component={BrandingPage} allowedRoles={["admin", "manager"]} />
      <Route path="/auth" component={AuthPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function AppLayout() {
  const { user } = useAuth();
  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  if (!user) {
    return <Router />;
  }

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AppSidebar />
        <div className="flex flex-col flex-1">
          <header className="flex items-center justify-between gap-4 p-4 border-b">
            <SidebarTrigger data-testid="button-sidebar-toggle" />
            <ThemeToggle />
          </header>
          <main className="flex-1 overflow-auto p-6">
            <Router />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <AuthProvider>
            <AppLayout />
            <Toaster />
          </AuthProvider>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
