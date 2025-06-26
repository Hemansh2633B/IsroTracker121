import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input"; // For Date input
import { Label } from "@/components/ui/label"; // For labeling inputs
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { useState, useEffect, useRef } from "react";
import { formatDate } from "@/lib/utils";
import type { DetectionMarker } from "@/lib/types";

import { MapContainer, TileLayer, Marker, Popup, ImageOverlay, GeoJSON } from 'react-leaflet'; // Added ImageOverlay, GeoJSON
import L, { LatLngExpression, LatLngBoundsExpression } from 'leaflet';
import 'leaflet/dist/leaflet.css';

import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({
  iconRetinaUrl,
  iconUrl,
  shadowUrl,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  tooltipAnchor: [16, -28],
  shadowSize: [41, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

// Define a type for prediction overlays (example: GeoJSON FeatureCollection)
interface PredictionOverlay {
  id: string;
  type: "geojson"; // Could also be "image_mask", etc.
  data: GeoJSON.FeatureCollection; // Using GeoJSON for polygon masks
  style?: L.PathOptions;
}

export function SatelliteMap() {
  const [isLive, setIsLive] = useState(true);
  const [showClusters, setShowClusters] = useState(true); // This will now toggle actual prediction overlays
  const [showPrecipitation, setShowPrecipitation] = useState(true);
  const [updateInterval, setUpdateInterval] = useState("300"); // Default to 5 mins (300 seconds for query)
  const [lastUpdate, setLastUpdate] = useState(new Date());

  const [detectionMarkers, setDetectionMarkers] = useState<Array<DetectionMarker & { lat: number; lon: number }>>([]);
  const [predictionOverlays, setPredictionOverlays] = useState<PredictionOverlay[]>([]); // For actual model output

  // State for data selection
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]); // Default to today
  const [selectedSource, setSelectedSource] = useState<string>("simulated_goes"); // Default source

  const defaultCenter: LatLngExpression = [0, 0];
  const defaultZoom = 3;
  const mapRef = useRef<L.Map | null>(null);

  // --- DATA FETCHING (Simulated for now) ---
  // This query would ideally fetch metadata about available satellite images based on selectedDate and selectedSource
  // For now, it continues to simulate cluster data for markers.
  const { data: apiClustersData, refetch: refetchClusters } = useQuery({
    queryKey: ["/api/satelliteData", selectedDate, selectedSource],
    queryFn: async () => {
      console.log(`Simulating fetch to /api/satelliteData for date: ${selectedDate}, source: ${selectedSource}`);
      // In a real app, this API would return available image metadata, paths, or actual image data.
      // And potentially pre-computed clusters if not running live analysis.
      await new Promise(resolve => setTimeout(resolve, 500));
      // For demonstration, let's return slightly different marker data based on date/source
      const dateSeed = new Date(selectedDate).getDate();
      const sourceSeed = selectedSource === "simulated_modis" ? 5 : 0;
      return [
        { id: "clusterA", name: `Cluster Alpha-${selectedSource.slice(0,3)}`, confidence: 0.9, precipitationProbability: 0.85, lat: 5.5 + dateSeed % 3, lon: -20.0 + sourceSeed, type: 'high-risk' },
        { id: "clusterB", name: "Cluster Beta", confidence: 0.75, precipitationProbability: 0.6, lat: -2.0 - dateSeed % 2, lon: 15.0 - sourceSeed, type: 'moderate' },
      ];
    },
    refetchInterval: isLive ? Math.min(parseInt(updateInterval) * 1000, 15000) : false, // seconds for react-query
    enabled: true,
  });

  useEffect(() => {
    if (apiClustersData && Array.isArray(apiClustersData)) {
      const markers = apiClustersData.map(cluster => ({
        ...cluster,
        id: cluster.id.toString(),
        lat: cluster.lat ?? (Math.random() * 30 - 15),
        lon: cluster.lon ?? (Math.random() * 60 - 30),
        type: cluster.precipitationProbability > 0.8 ? 'high-risk' : 
              cluster.precipitationProbability > 0.5 ? 'moderate' : 'low',
      }));
      setDetectionMarkers(markers);
      // Clear old prediction overlays when new data/clusters are fetched
      // In a real scenario, predictions would be linked to the specific image being analyzed.
      setPredictionOverlays([]);
      setLastUpdate(new Date());
    }
  }, [apiClustersData]);

  const toggleLive = () => setIsLive(!isLive);

  const handleAnalyzeData = async () => {
    console.log(`Triggering analysis for Date: ${selectedDate}, Source: ${selectedSource}, Map Bounds: ${mapRef.current?.getBounds().toBBoxString()}`);
    alert(`Analysis triggered (placeholder) for Date: ${selectedDate}, Source: ${selectedSource}. Backend not yet connected.`);

    // TODO: Call backend API (to be implemented in Step 6)
    // const response = await fetch('/api/predict', {
    //   method: 'POST',
    //   headers: {'Content-Type': 'application/json'},
    //   body: JSON.stringify({ date: selectedDate, source: selectedSource, bounds: mapRef.current?.getBounds().toBBoxString() })
    // });
    // const predictionResult = await response.json();

    // --- SIMULATE receiving a prediction overlay (e.g., GeoJSON) ---
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API delay
    const simulatedGeoJson: GeoJSON.FeatureCollection = {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          properties: { name: "Predicted Cloud Cluster 1", confidence: 0.88 },
          geometry: {
            type: "Polygon",
            coordinates: [ // Example polygon coordinates (triangle)
              [[-10, 0], [-11, 5], [-9, 2], [-10, 0]]
            ]
          }
        }
      ]
    };
    setPredictionOverlays([{ id: "pred1", type: "geojson", data: simulatedGeoJson, style: { color: "cyan", weight: 2, opacity: 0.7, fillOpacity: 0.2 } }]);
    // --- End Simulation ---
    setShowClusters(true); // Automatically show new predictions
  };

  // Placeholder for displaying an actual satellite image once data loading is implemented
  // const currentSatelliteImage = { url: "/placeholder_satellite_image.png", bounds: [[-30, -60], [30, 60]] as LatLngBoundsExpression };

  return (
    <Card className="bg-white shadow-sm border border-gray-200 flex flex-col h-full">
      {/* Controls Section */}
      <div className="p-4 border-b border-gray-200 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-semibold text-gray-900">Satellite Analysis Map</h2>
          <div className="flex items-center space-x-2">
            <Button size="sm" onClick={toggleLive} className={isLive ? "bg-primary text-primary-foreground" : ""}>
              {isLive ? "Status: Live API Poll" : "Status: API Poll Paused"}
            </Button>
          </div>
        </div>

        {/* Data Selection Row */}
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <Label htmlFor="date-select" className="text-xs">Select Date</Label>
            <Input
              type="date"
              id="date-select"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="max-w-xs"
            />
          </div>
          <div>
            <Label htmlFor="source-select" className="text-xs">Data Source</Label>
            <Select value={selectedSource} onValueChange={setSelectedSource}>
              <SelectTrigger className="w-48" id="source-select">
                <SelectValue placeholder="Select source" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="simulated_goes">Simulated GOES</SelectItem>
                <SelectItem value="simulated_modis">Simulated MODIS</SelectItem>
                <SelectItem value="simulated_insat">Simulated INSAT</SelectItem>
                {/* Add actual sources once download/processing is real */}
              </SelectContent>
            </Select>
          </div>
          <Button size="sm" variant="outline" onClick={handleAnalyzeData} className="self-end">
            Analyze Selected Data
          </Button>
        </div>
      </div>
      
      <CardContent className="p-0 flex-grow relative">
        <MapContainer
            center={defaultCenter}
            zoom={defaultZoom}
            style={{ height: "100%", width: "100%" }}
            whenCreated={instance => { mapRef.current = instance; }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          />
          
          {/* Placeholder for actual satellite imagery layer */}
          {/* Example: if (currentSatelliteImage.url) { */}
          {/*   <ImageOverlay url={currentSatelliteImage.url} bounds={currentSatelliteImage.bounds} opacity={0.7} zIndex={10} /> */}
          {/* } */}
          <div className="absolute top-2 right-2 bg-white/80 p-1 rounded text-xs z-[1000]">Map Center: {defaultCenter.toString()} Zoom: {defaultZoom}</div>


          {/* Display Simulated Markers (e.g., from a general monitoring API) */}
          {detectionMarkers.map((marker) => (
            <Marker key={`sim-${marker.id}`} position={[marker.lat, marker.lon]}>
              <Popup>
                <b>{marker.name}</b> (Simulated)<br />
                Confidence: {marker.confidence ? (marker.confidence * 100).toFixed(0) + "%" : "N/A"}<br />
                Type: {marker.type}
              </Popup>
            </Marker>
          ))}

          {/* Display Actual Prediction Overlays (e.g., GeoJSON from model) */}
          {showClusters && predictionOverlays.map((overlay) => {
            if (overlay.type === "geojson") {
              return <GeoJSON key={overlay.id} data={overlay.data} style={overlay.style || { color: 'magenta', weight: 2 }} />;
            }
            // Add other overlay types here if needed (e.g., image masks)
            return null;
          })}
        </MapContainer>

        <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-lg z-[1000]">
          <div className="text-xs font-medium text-gray-700 mb-2">Legend</div>
          <div className="space-y-1">
            <div className="flex items-center space-x-2"><div className="w-3 h-3 bg-red-500 rounded-full"></div><span className="text-xs">High Risk</span></div>
            <div className="flex items-center space-x-2"><div className="w-3 h-3 bg-yellow-400 rounded-full"></div><span className="text-xs">Moderate Risk</span></div>
            <div className="flex items-center space-x-2"><div className="w-3 h-3 bg-sky-500 rounded-full"></div><span className="text-xs">Low Risk / Info</span></div>
            <div className="flex items-center space-x-2"><div className="w-3 h-3 border-2 border-cyan-500 bg-cyan-500/30"></div><span className="text-xs">Predicted Cluster</span></div>
          </div>
        </div>
        
        <div className="absolute bottom-10 right-4 bg-white/90 backdrop-blur-sm rounded-lg p-2 text-xs text-gray-600 z-[1000]">
          Data as of: {formatDate(lastUpdate)}
        </div>
      </CardContent>

      <div className="p-4 border-t border-gray-200">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="show-predictions-toggle"
                checked={showClusters}
                onCheckedChange={(checkedState) => setShowClusters(Boolean(checkedState))}
              />
              <label htmlFor="show-predictions-toggle" className="text-sm text-gray-700">
                Show Predictions
              </label>
            </div>
            {/* Precipitation checkbox can be enabled when functionality is added */}
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">API Poll Interval:</span>
            <Select value={updateInterval} onValueChange={(val) => setUpdateInterval(val)}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Select interval" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="15">15 sec (demo)</SelectItem>
                <SelectItem value="300">5 minutes</SelectItem>
                <SelectItem value="600">10 minutes</SelectItem>
                <SelectItem value="1800">30 minutes</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        {/* TODO: Animation controls (play/pause, time slider) */}
        {/* TODO: Layer controls for different satellite imagery products */}
      </div>
    </Card>
  );
}
