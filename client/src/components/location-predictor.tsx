import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { MapPin, Navigation, Satellite, Target, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface LocationPrediction {
  latitude: number;
  longitude: number;
  location: string;
  precipitationRisk: number;
  cycloneRisk: number;
  windSpeed: number;
  temperature: number;
  humidity: number;
  timestamp: string;
  confidence: number;
  source: 'GPS' | 'NAVIC' | 'ISTRAC';
}

export function LocationPredictor() {
  const [coordinates, setCoordinates] = useState({ lat: '', lng: '' });
  const [currentLocation, setCurrentLocation] = useState<GeolocationPosition | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const { toast } = useToast();

  const { data: predictions } = useQuery<LocationPrediction[]>({
    queryKey: ["/api/location-predictions"],
    refetchInterval: 5000, // Fast auto-refresh every 5 seconds
  });

  const locationMutation = useMutation({
    mutationFn: async ({ lat, lng }: { lat: number; lng: number }) => {
      const response = await apiRequest("POST", "/api/predict-location", { latitude: lat, longitude: lng });
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Prediction Generated",
        description: `Weather forecast for coordinates generated successfully`,
      });
    },
    onError: () => {
      toast({
        title: "Prediction Failed",
        description: "Failed to generate location-based prediction",
        variant: "destructive",
      });
    },
  });

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCurrentLocation(position);
          setCoordinates({
            lat: position.coords.latitude.toFixed(6),
            lng: position.coords.longitude.toFixed(6)
          });
          locationMutation.mutate({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          toast({
            title: "Location Error",
            description: "Unable to get current location. Please enter coordinates manually.",
            variant: "destructive",
          });
        }
      );
    }
  };

  const startTracking = () => {
    setIsTracking(true);
    if (navigator.geolocation) {
      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          setCurrentLocation(position);
          setCoordinates({
            lat: position.coords.latitude.toFixed(6),
            lng: position.coords.longitude.toFixed(6)
          });
        },
        (error) => {
          console.error("Tracking error:", error);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
      );
      
      // Store watch ID for cleanup
      (window as any).geoWatchId = watchId;
    }
  };

  const stopTracking = () => {
    setIsTracking(false);
    if ((window as any).geoWatchId) {
      navigator.geolocation.clearWatch((window as any).geoWatchId);
    }
  };

  const handleManualPrediction = () => {
    const lat = parseFloat(coordinates.lat);
    const lng = parseFloat(coordinates.lng);
    
    if (isNaN(lat) || isNaN(lng)) {
      toast({
        title: "Invalid Coordinates",
        description: "Please enter valid latitude and longitude values",
        variant: "destructive",
      });
      return;
    }
    
    locationMutation.mutate({ lat, lng });
  };

  const getRiskColor = (risk: number) => {
    if (risk > 0.7) return 'text-red-600 bg-red-100';
    if (risk > 0.4) return 'text-yellow-600 bg-yellow-100';
    return 'text-green-600 bg-green-100';
  };

  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'GPS': return <Navigation className="h-3 w-3" />;
      case 'NAVIC': return <Satellite className="h-3 w-3" />;
      case 'ISTRAC': return <Target className="h-3 w-3" />;
      default: return <MapPin className="h-3 w-3" />;
    }
  };

  return (
    <Card className="bg-white shadow-sm border border-gray-200">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <MapPin className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold text-gray-900">Location-Based Predictions</h3>
          <Badge variant="secondary" className="ml-auto">
            GPS • NAVIC • ISTRAC
          </Badge>
        </div>
      </div>
      
      <CardContent className="p-4 space-y-4">
        {/* Location Input */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Latitude</label>
            <Input
              placeholder="12.9716"
              value={coordinates.lat}
              onChange={(e) => setCoordinates(prev => ({ ...prev, lat: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Longitude</label>
            <Input
              placeholder="77.5946"
              value={coordinates.lng}
              onChange={(e) => setCoordinates(prev => ({ ...prev, lng: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Actions</label>
            <div className="flex space-x-2">
              <Button
                size="sm"
                onClick={getCurrentLocation}
                variant="outline"
                className="flex-1"
              >
                <Navigation className="h-3 w-3 mr-1" />
                Get GPS
              </Button>
              <Button
                size="sm"
                onClick={handleManualPrediction}
                disabled={locationMutation.isPending}
                className="flex-1 bg-primary"
              >
                Predict
              </Button>
            </div>
          </div>
        </div>

        {/* Real-time Tracking */}
        <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
          <div className="flex items-center space-x-2">
            <Satellite className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-gray-700">Real-time NAVIC Tracking</span>
          </div>
          <Button
            size="sm"
            onClick={isTracking ? stopTracking : startTracking}
            className={isTracking ? "bg-red-500 hover:bg-red-600" : "bg-primary"}
          >
            {isTracking ? "Stop Tracking" : "Start Tracking"}
          </Button>
        </div>

        {/* Current Location Info */}
        {currentLocation && (
          <div className="p-3 bg-green-50 rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <Target className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium text-green-800">Current Location</span>
            </div>
            <div className="text-xs text-green-700 space-y-1">
              <p>Lat: {currentLocation.coords.latitude.toFixed(6)}, Lng: {currentLocation.coords.longitude.toFixed(6)}</p>
              <p>Accuracy: ±{currentLocation.coords.accuracy?.toFixed(0)}m</p>
              <p>Updated: {new Date(currentLocation.timestamp).toLocaleTimeString()}</p>
            </div>
          </div>
        )}

        {/* Predictions Grid */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-700">Recent Predictions</h4>
          {predictions && predictions.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {predictions.slice(0, 4).map((prediction, index) => (
                <div key={index} className="border rounded-lg p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-1">
                      {getSourceIcon(prediction.source)}
                      <span className="text-xs font-medium text-gray-700">{prediction.location}</span>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {prediction.source}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Precipitation:</span>
                        <Badge className={getRiskColor(prediction.precipitationRisk)}>
                          {Math.round(prediction.precipitationRisk * 100)}%
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Cyclone Risk:</span>
                        <Badge className={getRiskColor(prediction.cycloneRisk)}>
                          {Math.round(prediction.cycloneRisk * 100)}%
                        </Badge>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Wind:</span>
                        <span className="font-medium">{prediction.windSpeed} km/h</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Temp:</span>
                        <span className="font-medium">{prediction.temperature}°C</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>{new Date(prediction.timestamp).toLocaleTimeString()}</span>
                    <span>Confidence: {Math.round(prediction.confidence * 100)}%</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-gray-500">
              <MapPin className="h-8 w-8 mx-auto mb-2 text-gray-300" />
              <p className="text-sm">No predictions available</p>
              <p className="text-xs">Enter coordinates or get GPS location to start</p>
            </div>
          )}
        </div>

        {/* ISTRAC Connection Status with IST Time */}
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full status-pulse"></div>
            <span className="text-sm text-gray-700">ISTRAC Real-time Data</span>
            <span className="text-xs text-gray-500">
              IST: {new Date().toLocaleTimeString('en-IN', {
                timeZone: 'Asia/Kolkata',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
              })}
            </span>
          </div>
          <Badge variant="outline" className="text-xs">
            Connected
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}