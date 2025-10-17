import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useBranding } from "@/hooks/use-branding";
import { Redirect } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, Shield, Users, TrendingUp, Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

const setupSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  email: z.string().email("Invalid email address"),
  fullName: z.string().min(1, "Full name is required"),
});

export default function AuthPage() {
  const { user, loginMutation } = useAuth();
  const { companyName, companyLogo, headerText, footerText } = useBranding();
  const [setupRequired, setSetupRequired] = useState<boolean | null>(null);
  const [isCheckingSetup, setIsCheckingSetup] = useState(true);
  const { toast } = useToast();

  const loginForm = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: "", password: "" },
  });

  const setupForm = useForm({
    resolver: zodResolver(setupSchema),
    defaultValues: { username: "", password: "", email: "", fullName: "" },
  });

  // Check if setup is required
  useEffect(() => {
    const checkSetup = async () => {
      try {
        const res = await fetch("/api/setup/status");
        const data = await res.json();
        setSetupRequired(!data.setupCompleted);
      } catch (error) {
        setSetupRequired(false);
      } finally {
        setIsCheckingSetup(false);
      }
    };
    checkSetup();
  }, []);

  // Setup mutation
  const setupMutation = useMutation({
    mutationFn: async (data: z.infer<typeof setupSchema>) => {
      const res = await apiRequest("POST", "/api/setup", data);
      return await res.json();
    },
    onSuccess: (user) => {
      queryClient.setQueryData(["/api/user"], user);
      toast({
        title: "Setup Complete",
        description: "Admin account created successfully!",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Setup Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  if (user) {
    return <Redirect to="/" />;
  }

  if (isCheckingSetup) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const onLogin = (data: z.infer<typeof loginSchema>) => {
    loginMutation.mutate(data);
  };

  const onSetup = (data: z.infer<typeof setupSchema>) => {
    setupMutation.mutate(data);
  };

  // Show setup screen if setup is required
  if (setupRequired) {
    return (
      <div className="min-h-screen flex flex-col">
        {headerText && (
          <div className="bg-primary/5 border-b py-3 px-6">
            <p className="text-sm text-center text-muted-foreground" data-testid="text-header">{headerText}</p>
          </div>
        )}
        <div className="flex-1 grid lg:grid-cols-2">
          <div className="flex items-center justify-center p-8">
          <Card className="w-full max-w-md">
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                {companyLogo ? (
                  <img src={companyLogo} alt={companyName} className="h-10 w-10 object-contain" />
                ) : (
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Package className="h-6 w-6 text-primary" />
                  </div>
                )}
                <CardTitle className="text-2xl">Welcome to {companyName}</CardTitle>
              </div>
              <CardDescription>
                First-time setup required
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...setupForm}>
                <form onSubmit={setupForm.handleSubmit(onSetup)} className="space-y-4">
                  <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg">
                    <p className="text-sm font-medium text-primary">Create Admin Account</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Set up your administrator credentials to secure this system
                    </p>
                  </div>

                  <FormField
                    control={setupForm.control}
                    name="fullName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="John Doe" data-testid="input-setup-fullname" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={setupForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input {...field} type="email" placeholder="admin@company.com" data-testid="input-setup-email" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={setupForm.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Username</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="admin" data-testid="input-setup-username" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={setupForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <Input {...field} type="password" placeholder="Min. 8 characters" data-testid="input-setup-password" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={setupMutation.isPending}
                    data-testid="button-setup"
                  >
                    {setupMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Create Admin Account
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
          </div>

          <div className="hidden lg:flex items-center justify-center bg-muted p-12">
          <div className="max-w-lg space-y-8">
            <div>
              <h1 className="text-4xl font-bold tracking-tight mb-4">
                Manage Your IT Assets with Confidence
              </h1>
              <p className="text-lg text-muted-foreground">
                Complete asset lifecycle management for hardware, software, licenses, and equipment.
                Track assignments, manage depreciation, and maintain comprehensive audit trails.
              </p>
            </div>
            <div className="grid gap-6">
              <div className="flex gap-4">
                <div className="p-3 bg-primary/10 rounded-lg h-fit">
                  <Shield className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Role-Based Access</h3>
                  <p className="text-sm text-muted-foreground">
                    Granular permissions for admins, managers, and employees
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="p-3 bg-primary/10 rounded-lg h-fit">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Complete Tracking</h3>
                  <p className="text-sm text-muted-foreground">
                    Track assignments, warranty expiry, and asset history
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="p-3 bg-primary/10 rounded-lg h-fit">
                  <TrendingUp className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Depreciation Calculator</h3>
                  <p className="text-sm text-muted-foreground">
                    Automatic asset value tracking with multiple depreciation methods
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
        </div>
        {footerText && (
          <div className="bg-muted border-t py-3 px-6">
            <p className="text-xs text-center text-muted-foreground" data-testid="text-footer">{footerText}</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      {headerText && (
        <div className="bg-primary/5 border-b py-3 px-6">
          <p className="text-sm text-center text-muted-foreground" data-testid="text-header">{headerText}</p>
        </div>
      )}
      <div className="flex-1 grid lg:grid-cols-2">
        <div className="flex items-center justify-center p-8">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="flex items-center gap-3 mb-2">
              {companyLogo ? (
                <img src={companyLogo} alt={companyName} className="h-10 w-10 object-contain" data-testid="img-company-logo" />
              ) : (
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Package className="h-6 w-6 text-primary" />
                </div>
              )}
              <CardTitle className="text-2xl">{companyName}</CardTitle>
            </div>
            <CardDescription>
              Sign in to your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...loginForm}>
              <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-4">
                <FormField
                  control={loginForm.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Username</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-username" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={loginForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input type="password" {...field} data-testid="input-password" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={loginMutation.isPending}
                  data-testid="button-login"
                >
                  {loginMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Sign In
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
        </div>

        <div className="hidden lg:flex items-center justify-center bg-muted p-12">
        <div className="max-w-lg space-y-8">
          <div>
            <h1 className="text-4xl font-bold tracking-tight mb-4">
              Manage Your IT Assets with Confidence
            </h1>
            <p className="text-lg text-muted-foreground">
              Complete asset lifecycle management for hardware, software, licenses, and equipment.
              Track assignments, manage depreciation, and maintain comprehensive audit trails.
            </p>
          </div>

          <div className="grid gap-6">
            <div className="flex gap-4">
              <div className="p-3 bg-primary/10 rounded-lg h-fit">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Role-Based Access</h3>
                <p className="text-sm text-muted-foreground">
                  Granular permissions for admins, managers, and employees
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="p-3 bg-primary/10 rounded-lg h-fit">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Complete Tracking</h3>
                <p className="text-sm text-muted-foreground">
                  Track assignments, warranty expiry, and asset history
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="p-3 bg-primary/10 rounded-lg h-fit">
                <TrendingUp className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Depreciation Calculator</h3>
                <p className="text-sm text-muted-foreground">
                  Automatic asset value tracking with multiple depreciation methods
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      </div>
      {footerText && (
        <div className="bg-muted border-t py-3 px-6">
          <p className="text-xs text-center text-muted-foreground" data-testid="text-footer">{footerText}</p>
        </div>
      )}
    </div>
  );
}
