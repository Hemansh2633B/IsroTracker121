import { Card, CardContent } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { Cloud, Droplets, Database, Brain, TrendingUp, TrendingDown } from "lucide-react";
import { formatNumber, formatPercentage } from "@/lib/utils";
import type { DashboardMetrics } from "@/lib/types";

export function MetricsCards() {
  const { data: metrics, isLoading } = useQuery<DashboardMetrics>({
    queryKey: ["/api/dashboard-metrics"],
    refetchInterval: 5000, // Fast auto-refresh every 5 seconds
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-16 bg-gray-200 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const cards = [
    {
      title: "Active Cloud Clusters",
      value: metrics?.activeClusters || 0,
      icon: Cloud,
      iconBg: "bg-primary/10",
      iconColor: "text-primary",
      change: "+12%",
      changeType: "increase" as const,
      description: "vs last hour"
    },
    {
      title: "Precipitation Prob.",
      value: formatPercentage(metrics?.precipitationProbability || 0),
      icon: Droplets,
      iconBg: "bg-blue-100",
      iconColor: "text-blue-600",
      change: "-8%",
      changeType: "decrease" as const,
      description: "vs last hour"
    },
    {
      title: "Data Points",
      value: formatNumber(metrics?.dataPoints || 0),
      icon: Database,
      iconBg: "bg-green-100",
      iconColor: "text-green-600",
      change: "+45K",
      changeType: "increase" as const,
      description: "last 30 min"
    },
    {
      title: "Model Accuracy",
      value: formatPercentage(metrics?.modelAccuracy || 0),
      icon: Brain,
      iconBg: "bg-purple-100",
      iconColor: "text-purple-600",
      change: "+0.3%",
      changeType: "increase" as const,
      description: "vs baseline"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, index) => (
        <Card key={index} className="bg-white shadow-sm border border-gray-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">{card.title}</p>
                <p className="text-2xl font-bold text-gray-900">{card.value}</p>
              </div>
              <div className={`w-12 h-12 ${card.iconBg} rounded-lg flex items-center justify-center`}>
                <card.icon className={`h-6 w-6 ${card.iconColor}`} />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              {card.changeType === "increase" ? (
                <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-600 mr-1" />
              )}
              <span className={card.changeType === "increase" ? "text-green-600" : "text-red-600"}>
                {card.change}
              </span>
              <span className="text-gray-500 ml-2">{card.description}</span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
