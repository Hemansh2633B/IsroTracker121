import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { formatDate } from "@/lib/utils";
import type { DetectionMarker } from "@/lib/types";

export function SatelliteMap() {
  const [isLive, setIsLive] = useState(true);
  const [showClusters, setShowClusters] = useState(true);
  const [showPrecipitation, setShowPrecipitation] = useState(true);
  const [updateInterval, setUpdateInterval] = useState("30");
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [detectionMarkers, setDetectionMarkers] = useState<DetectionMarker[]>([]);

  const { data: clusters } = useQuery({
    queryKey: ["/api/cloud-clusters"],
    refetchInterval: isLive ? Math.min(parseInt(updateInterval) * 60 * 1000, 5000) : false, // Fast auto-refresh, max 5 seconds
  });

  useEffect(() => {
    if (clusters && Array.isArray(clusters)) {
      const markers: DetectionMarker[] = clusters.map((cluster, index) => ({
        id: cluster.id.toString(),
        x: 30 + (index * 15) % 60, // Simulate distribution
        y: 25 + (index * 20) % 50,
        type: cluster.precipitationProbability > 0.8 ? 'high-risk' : 
              cluster.precipitationProbability > 0.5 ? 'moderate' : 'low',
        name: cluster.name,
        confidence: cluster.confidence
      }));
      setDetectionMarkers(markers);
    }
  }, [clusters]);

  useEffect(() => {
    if (isLive) {
      const interval = setInterval(() => {
        setLastUpdate(new Date());
      }, parseInt(updateInterval) * 60 * 1000);
      
      return () => clearInterval(interval);
    }
  }, [isLive, updateInterval]);

  const toggleLive = () => {
    setIsLive(!isLive);
  };

  return (
    <Card className="bg-white shadow-sm border border-gray-200">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Real-time Satellite View</h2>
          <div className="flex items-center space-x-2">
            <Button
              size="sm"
              onClick={toggleLive}
              className={isLive ? "bg-primary text-white" : "bg-gray-200 text-gray-700"}
            >
              {isLive ? "Live" : "Paused"}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={toggleLive}
            >
              {isLive ? "Pause" : "Resume"}
            </Button>
          </div>
        </div>
      </div>
      
      <CardContent className="p-4">
        <div className="map-container rounded-lg border border-gray-300 relative h-96">
          <img 
            src="https://images.unsplash.com/photo-1446776653964-20c1d3a81b06?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&h=400" 
            alt="Satellite view of tropical cloud formations over ocean" 
            className="w-full h-full object-cover rounded-lg opacity-80" 
          />
          
          {/* Legend */}
          <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-sm">
            <div className="text-xs font-medium text-gray-700 mb-2">Legend</div>
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <span className="text-xs text-gray-600">High Precipitation</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <span className="text-xs text-gray-600">Moderate Precipitation</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span className="text-xs text-gray-600">Cloud Clusters</span>
              </div>
            </div>
          </div>
          
          {/* Detection markers */}
          {showClusters && detectionMarkers.map((marker) => (
            <div
              key={marker.id}
              className={`detection-marker ${marker.type}`}
              style={{
                left: `${marker.x}%`,
                top: `${marker.y}%`
              }}
              title={`${marker.name} - Confidence: ${Math.round(marker.confidence * 100)}%`}
            />
          ))}
          
          {/* Last updated timestamp */}
          <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-sm rounded-lg p-2 text-xs text-gray-600">
            Last updated: {formatDate(lastUpdate)}
          </div>
        </div>
        
        {/* Map controls */}
        <div className="flex items-center justify-between mt-4">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="show-clusters"
                checked={showClusters}
                onCheckedChange={setShowClusters}
              />
              <label htmlFor="show-clusters" className="text-sm text-gray-700">
                Show Cloud Clusters
              </label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="show-precipitation"
                checked={showPrecipitation}
                onCheckedChange={setShowPrecipitation}
              />
              <label htmlFor="show-precipitation" className="text-sm text-gray-700">
                Precipitation Overlay
              </label>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">Update Interval:</span>
            <Select value={updateInterval} onValueChange={setUpdateInterval}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="30">30 minutes</SelectItem>
                <SelectItem value="60">1 hour</SelectItem>
                <SelectItem value="180">3 hours</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
