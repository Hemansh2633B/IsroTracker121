import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { Satellite, AlertTriangle, Activity, Thermometer, Wind, Clock } from "lucide-react";
import { useState, useEffect } from "react";

export function ISTRACMonitor() {
  const [istracTime, setIstracTime] = useState(new Date());

  const { data: istracData } = useQuery({
    queryKey: ["/api/istrac-data"],
    refetchInterval: 3000, // Fast auto-refresh every 3 seconds
  });

  // Update ISTRAC time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setIstracTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatISTRACTime = (date: Date) => {
    return date.toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
  };

  const formatISTRACDate = (date: Date) => {
    return date.toLocaleDateString('en-IN', {
      timeZone: 'Asia/Kolkata',
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  if (!istracData) {
    return (
      <Card className="bg-white shadow-sm border border-gray-200">
        <CardContent className="p-4">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-gray-200 rounded w-1/3"></div>
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-4 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white shadow-sm border border-gray-200">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Satellite className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold text-gray-900">ISTRAC Real-time Monitor</h3>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 px-3 py-1 bg-primary/10 rounded-lg">
              <Clock className="h-4 w-4 text-primary" />
              <div className="text-sm">
                <div className="font-medium text-primary">{formatISTRACTime(istracTime)} IST</div>
                <div className="text-xs text-gray-600">{formatISTRACDate(istracTime)}</div>
              </div>
            </div>
            <Badge variant="secondary">
              Live Data
            </Badge>
          </div>
        </div>
      </div>
      
      <CardContent className="p-4 space-y-4">
        {/* Satellite Status */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-3">Active Satellites</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {istracData.satellites.map((satellite: any, index: number) => (
              <div key={index} className="border rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-sm">{satellite.name}</span>
                  <Badge className={
                    satellite.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }>
                    {satellite.status}
                  </Badge>
                </div>
                <div className="space-y-1 text-xs text-gray-600">
                  <p>Quality: {satellite.dataQuality}</p>
                  <p>Coverage: {satellite.coverageArea}</p>
                  <p>Updated: {new Date(satellite.lastUpdate).toLocaleTimeString()}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Weather Parameters */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-3">Current Parameters</h4>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <Thermometer className="h-4 w-4 mx-auto mb-1 text-blue-600" />
              <div className="text-xs text-gray-600">SST</div>
              <div className="text-sm font-medium">{istracData.weatherParameters.seaSurfaceTemperature}°C</div>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <Activity className="h-4 w-4 mx-auto mb-1 text-green-600" />
              <div className="text-xs text-gray-600">Pressure</div>
              <div className="text-sm font-medium">{istracData.weatherParameters.atmosphericPressure} hPa</div>
            </div>
            <div className="text-center p-3 bg-yellow-50 rounded-lg">
              <Wind className="h-4 w-4 mx-auto mb-1 text-yellow-600" />
              <div className="text-xs text-gray-600">Wind Shear</div>
              <div className="text-sm font-medium">{istracData.weatherParameters.windShear} m/s</div>
            </div>
            <div className="text-center p-3 bg-purple-50 rounded-lg">
              <div className="h-4 w-4 mx-auto mb-1 bg-purple-600 rounded-full"></div>
              <div className="text-xs text-gray-600">Humidity</div>
              <div className="text-sm font-medium">{istracData.weatherParameters.moistureContent}%</div>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="h-4 w-4 mx-auto mb-1 bg-gray-600 rounded-full"></div>
              <div className="text-xs text-gray-600">Cloud Top</div>
              <div className="text-sm font-medium">{istracData.weatherParameters.cloudTopHeight}m</div>
            </div>
          </div>
        </div>

        {/* Alerts */}
        {istracData.alerts && istracData.alerts.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3">Active Alerts</h4>
            <div className="space-y-2">
              {istracData.alerts.map((alert: any, index: number) => (
                <div key={index} className="flex items-center space-x-3 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                  <AlertTriangle className="h-4 w-4 text-orange-600" />
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-orange-800">{alert.type}</span>
                      <Badge className="bg-orange-100 text-orange-800 text-xs">
                        {alert.severity}
                      </Badge>
                    </div>
                    <div className="text-xs text-orange-700">
                      {alert.region} • {new Date(alert.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Data Timestamp */}
        <div className="text-xs text-gray-500 text-center pt-2 border-t">
          Last updated: {new Date(istracData.timestamp).toLocaleString()}
        </div>
      </CardContent>
    </Card>
  );
}