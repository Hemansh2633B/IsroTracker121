import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Cloud } from "lucide-react";
import { formatPercentage, getStatusColor, formatDate } from "@/lib/utils";
import type { CloudCluster } from "@shared/schema";

export function DetectionResults() {
  const { data: clusters, isLoading } = useQuery<CloudCluster[]>({
    queryKey: ["/api/cloud-clusters"],
    refetchInterval: 3000, // Fast auto-refresh every 3 seconds
  });

  if (isLoading) {
    return (
      <Card className="bg-white shadow-sm border border-gray-200">
        <CardContent className="p-4">
          <div className="animate-pulse space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const recentClusters = clusters?.slice(0, 3) || [];

  return (
    <Card className="bg-white shadow-sm border border-gray-200">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Recent Detections</h3>
          <Button variant="link" className="text-primary p-0 h-auto">
            View All
          </Button>
        </div>
      </div>
      <CardContent className="p-4">
        <div className="space-y-4">
          {recentClusters.map((cluster) => (
            <div key={cluster.id} className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg hover:bg-blue-50 hover:border-blue-200 border border-transparent transition-all">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Cloud className="h-6 w-6 text-blue-600" />
              </div>
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <h4 className="font-medium text-gray-900">{cluster.name}</h4>
                  <Badge className={getStatusColor(cluster.status)}>
                    {cluster.status}
                  </Badge>
                </div>
                <p className="text-sm text-gray-600">
                  {cluster.coordinates} • Confidence: <span className="font-medium">{formatPercentage(cluster.confidence)}</span>
                </p>
                {cluster.detectedAt && (
                  <p className="text-xs text-gray-500">
                    Detected {formatDate(cluster.detectedAt)}
                  </p>
                )}
              </div>
              <div className="text-right">
                <div className="text-sm font-medium text-gray-900">
                  {formatPercentage(cluster.precipitationProbability)}
                </div>
                <div className="text-xs text-gray-500">Precip. Prob.</div>
              </div>
            </div>
          ))}
          
          {recentClusters.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <Cloud className="h-12 w-12 mx-auto mb-2 text-gray-300" />
              <p>No cloud clusters detected yet</p>
              <p className="text-sm">Upload satellite imagery to begin analysis</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
