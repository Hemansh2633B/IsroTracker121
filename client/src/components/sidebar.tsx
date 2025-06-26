import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { 
  LayoutDashboard, 
  Satellite, 
  Brain, 
  BarChart3, 
  History,
  Settings
} from "lucide-react";
import { useTranslation } from 'react-i18next';

export function Sidebar() {
  const { t } = useTranslation();
  const { data: systemStatus } = useQuery({
    queryKey: ["/api/system-status"],
    refetchInterval: 3000, // Fast auto-refresh every 3 seconds
  });

  // Define navigation items with translation keys
  // Assuming these keys exist in your translation files (e.g., sidebar.dashboard, sidebar.live3DOrbits)
  // For items not yet translated, they will show their keys or you can provide a default.
  const navigationItems = [
    { name: t("sidebar.dashboard", "Dashboard"), icon: LayoutDashboard, href: "#dashboard", active: true }, // Default to "Dashboard" if key not found
    { name: t("sidebar.live3DOrbits", "Live 3D Orbits"), icon: Satellite, href: "#liveOrbits", active: false },
    { name: t("sidebar.smartLaunchAlerts", "Smart Alerts"), icon: BarChart3, href: "#smartAlerts", active: false },
    { name: t("sidebar.voiceControl", "Voice Control"), icon: Brain, href: "#voiceControl", active: false }, // Assuming 'Brain' icon for Voice
    { name: t("sidebar.communityReports", "Community Reports"), icon: History, href: "#community", active: false }, // Assuming 'History' for reports
    { name: t("sidebar.budgetCharts", "Budget Charts"), icon: BarChart3, href: "#budget", active: false },
    { name: t("sidebar.notificationSettings", "Notifications"), icon: Settings, href: "#notifications", active: false },
    { name: t("sidebar.arSkyView", "AR Sky View"), icon: Satellite, href: "#arView", active: false },
    // { name: t("sidebar.adminPanel", "Admin Panel"), icon: Settings, href: "#admin", active: false }, // Example for admin
  ];


  const getStatusInfo = (component: string) => {
    const status = systemStatus?.find((s: any) => s.component === component);
    return {
      status: status?.status || "Unknown",
      isOnline: status?.status === "Online",
      isProcessing: status?.status === "Processing"
    };
  };

  const mosdacStatus = getStatusInfo("MOSDAC_API");
  const aiStatus = getStatusInfo("AI_MODELS");
  const processingStatus = getStatusInfo("DATA_PROCESSING");

  return (
    <aside className="w-64 bg-white shadow-sm border-r border-gray-200">
      <nav className="p-4 space-y-1">
        {navigationItems.map((item) => (
          <a
            key={item.name}
            href={item.href}
            className={cn(
              "flex items-center space-x-3 px-3 py-2 rounded-md font-medium transition-colors",
              item.active
                ? "bg-blue-50 text-primary"
                : "text-gray-700 hover:bg-gray-50"
            )}
          >
            <item.icon className="h-5 w-5" />
            <span>{item.name}</span>
          </a>
        ))}
      </nav>
      
      <div className="px-4 py-4 border-t border-gray-200 mt-4">
        <h3 className="text-sm font-medium text-gray-700 mb-3">{t('sidebar.systemStatusTitle', "System Status")}</h3>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">{t('sidebar.mosdacAPI', "MOSDAC API")}</span>
            <div className="flex items-center space-x-1">
              <span className={cn(
                "w-2 h-2 rounded-full",
                mosdacStatus.isOnline ? "bg-green-500" : "bg-red-500"
              )}></span>
              <span className={cn(
                "text-xs",
                mosdacStatus.isOnline ? "text-green-600" : "text-red-600"
              )}>
                {mosdacStatus.status}
              </span>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">{t('sidebar.aiModels', "AI Models")}</span>
            <div className="flex items-center space-x-1">
              <span className={cn(
                "w-2 h-2 rounded-full",
                aiStatus.isOnline ? "bg-green-500" : "bg-red-500"
              )}></span>
              <span className={cn(
                "text-xs",
                aiStatus.isOnline ? "text-green-600" : "text-red-600"
              )}>
                {aiStatus.status}
              </span>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">{t('sidebar.dataProcessing', "Data Processing")}</span>
            <div className="flex items-center space-x-1">
              <span className={cn(
                "w-2 h-2 rounded-full",
                processingStatus.isProcessing ? "bg-yellow-500 status-pulse" : 
                processingStatus.isOnline ? "bg-green-500" : "bg-red-500"
              )}></span>
              <span className={cn(
                "text-xs",
                processingStatus.isProcessing ? "text-yellow-600" : 
                processingStatus.isOnline ? "text-green-600" : "text-red-600"
              )}>
                {processingStatus.status}
              </span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
