import { useQuery } from "@tanstack/react-query";
import type { SystemSettings } from "@shared/schema";

export function useBranding() {
  const { data: settings, isLoading } = useQuery<SystemSettings>({
    queryKey: ["/api/settings/system"],
  });

  return {
    companyName: settings?.companyName || "Asset Management",
    companyLogo: settings?.companyLogo,
    companyWebsite: settings?.companyWebsite,
    defaultCurrency: settings?.defaultCurrency || "USD",
    headerText: settings?.headerText || "",
    footerText: settings?.footerText || "",
    isLoading,
  };
}
