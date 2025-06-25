import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"; // Added CardHeader, CardTitle
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient"; // Assuming this is a utility for API calls
import { Brain, Layers, Activity, BarChart3, Satellite, Database, AlertTriangle, PlayCircle } from "lucide-react"; // Added PlayCircle
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

// Types from dashboard (or move to lib/types.ts)
interface PredictionOverlayData {
  id: string;
  type: "geojson";
  data: GeoJSON.FeatureCollection;
  style?: L.PathOptions;
}
interface AnalysisParams {
  date: string;
  source: string;
  bounds?: string; // Optional map bounds
}

// Existing interface from the file
interface CloudClusterAnalysis {
  id: string;
  timestamp: string;
  brightness_temperature: {
    ir1: number; ir2: number; wv: number; vis: number;
  };
  segmentation_results: {
    confidence: number; cluster_count: number; total_area: number; density_map: number[][];
  };
  tracking_data: {
    movement_vector: { x: number; y: number }; speed: number; direction: number; persistence: number;
  };
  reanalysis_validation: {
    era5_correlation: number; ncep_agreement: number; validation_score: number;
  };
}

interface CloudAnalysisEngineProps {
  analysisParams: AnalysisParams | null; // Received from Dashboard
  onAnalysisComplete: (overlays: PredictionOverlayData[]) => void; // Callback to Dashboard
}

export function CloudAnalysisEngine({ analysisParams, onAnalysisComplete }: CloudAnalysisEngineProps) {
  // Removed local activeAnalysis state, as analysis is now triggered by analysisParams prop
  const [selectedChannels, setSelectedChannels] = useState<string[]>(['ir1', 'ir2', 'wv']);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // This query might be for fetching historical analysis results or status
  const { data: historicalAnalyses, isLoading: isLoadingHistorical } = useQuery<CloudClusterAnalysis[]>({
    queryKey: ["/api/cloud-analysis-history"], // Changed key to avoid conflict if /api/cloud-analysis is for triggering
    // refetchInterval: 5000, // Maybe not needed if this is just history
  });

  // This query fetches current INSAT (or other source) data for display in the UI
  const { data: currentSourceData } = useQuery({
    queryKey: ["/api/current-source-data", analysisParams?.source], // Keyed by selected source
    queryFn: async () => {
      if (!analysisParams?.source) return null; // Don't fetch if no source
      console.log(`CAE: Fetching current data for source: ${analysisParams.source}`);
      // Simulate fetching data for the selected source.
      // Replace with actual API call: await apiRequest("GET", `/api/source-data?source=${analysisParams.source}`);
      await new Promise(resolve => setTimeout(resolve, 300));
      if (analysisParams.source === 'simulated_insat') {
        return { channels: { ir1: 270, ir2: 265, wv: 230, vis: 80 }};
      }
      return { channels: { ir1: 275, ir2: 270, wv: 235, vis: 85 }}; // Default for other simulated
    },
    enabled: !!analysisParams?.source, // Only run if a source is selected
  });

  const runAnalysisMutation = useMutation({
    mutationFn: async (params: { date: string; source: string; bounds?: string; algorithm: string; channels: string[] }) => {
      toast({ title: "Analysis Initiated", description: `Algorithm: ${params.algorithm}, Source: ${params.source}, Date: ${params.date}` });
      console.log("CAE: Starting analysis mutation with params:", params);
      // const response = await apiRequest("POST", "/api/start-cloud-analysis", params);
      // return response.json(); // This should return data compatible with PredictionOverlayData[]

      // --- SIMULATE API call and receiving GeoJSON prediction ---
      await new Promise(resolve => setTimeout(resolve, 2000 + Math.random()*1000)); // Simulate variable delay
      const randomId = `pred_${Date.now()}`;
      const randomLat = (Math.random() * 40 - 20).toFixed(2); // -20 to +20
      const randomLon = (Math.random() * 80 - 40).toFixed(2); // -40 to +40
      const simulatedGeoJson: GeoJSON.FeatureCollection = {
        type: "FeatureCollection",
        features: [
          {
            type: "Feature",
            properties: {
              name: `Predicted ${params.algorithm} ${randomId.slice(-4)}`,
              confidence: Math.random() * 0.3 + 0.65, // 0.65 - 0.95
              algorithm: params.algorithm,
              source: params.source,
              date: params.date,
            },
            geometry: { type: "Polygon", coordinates: [ // Example polygon
                [[parseFloat(randomLon)-1, parseFloat(randomLat)-1], [parseFloat(randomLon)+1, parseFloat(randomLat)-1], [parseFloat(randomLon), parseFloat(randomLat)+1], [parseFloat(randomLon)-1, parseFloat(randomLat)-1]]
            ]}
          }
        ]
      };
      return [{ id: randomId, type: "geojson", data: simulatedGeoJson, style: { color: "orange", weight: 2, fillOpacity: 0.25 } }] as PredictionOverlayData[];
      // --- End Simulation ---
    },
    onSuccess: (data: PredictionOverlayData[]) => {
      toast({ title: "Analysis Complete", description: "Prediction overlays generated." });
      onAnalysisComplete(data); // Pass results to Dashboard
      queryClient.invalidateQueries({ queryKey: ["/api/cloud-analysis-history"] }); // Refresh history if needed
    },
    onError: (error: Error) => {
      toast({ title: "Analysis Failed", description: error.message || "Unknown error", variant: "destructive" });
    }
  });

  // Effect to trigger analysis when analysisParams prop changes from Dashboard
  useEffect(() => {
    if (analysisParams) {
      // Default to U-Net if params are set this way, or could add a UI element in CAE to pick algorithm.
      // For now, let's assume if `analysisParams` is set, we run a default analysis (e.g., U-Net).
      // The "Analyze Selected Data" button in SatelliteMap triggers this.
      // The buttons within CAE can trigger specific algorithms.
      console.log("CAE: analysisParams changed, triggering default U-Net analysis", analysisParams);
      handleAlgorithmRun('unet_segmentation'); // Default trigger from map
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [analysisParams]); // Dependency on analysisParams to auto-trigger


  const handleChannelSelection = (channel: string) => {
    setSelectedChannels(prev => 
      prev.includes(channel) ? prev.filter(c => c !== channel) : [...prev, channel]
    );
  };

  const handleAlgorithmRun = (algorithm: string) => {
    if (!analysisParams && algorithm !== 'reanalysis_validation' && algorithm !== 'multi_channel_local_data_only') {
        // Some analyses might not need date/source from map if they use fixed/latest data
        toast({ title: "Selection Required", description: "Please select date and source on the map first, then click 'Analyze Selected Data'.", variant: "default"});
        // Or, if CloudAnalysisEngine has its own date/source pickers, use those.
        // For now, we assume analysisParams must be set by the map's "Analyze Selected Data" button.
        // This button now exists in SatelliteMap and calls `onInitiateAnalysis` which sets `analysisParams` in Dashboard.
        // So, if `analysisParams` is null, it means user hasn't clicked that button.
        // The specific buttons below in CAE can now use the `analysisParams` if available.
        if(!analysisParams) {
            alert("Please use the 'Analyze Selected Data' button on the map to set context first, then choose a specific algorithm here.");
            return;
        }
    }

    const paramsForMutation = {
        date: analysisParams?.date || new Date().toISOString().split("T")[0], // Fallback to today
        source: analysisParams?.source || "simulated_goes", // Fallback
        bounds: analysisParams?.bounds,
        algorithm,
        channels: selectedChannels,
    };
    runAnalysisMutation.mutate(paramsForMutation);
  };


  const getValidationColor = (score: number = 0) => { // Default score to 0 if undefined
    if (score > 0.8) return 'text-green-600 bg-green-100';
    if (score > 0.6) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const latestHistoricalAnalysis = historicalAnalyses?.[0]; // Example: show latest from history

  return (
    <Card className="bg-white shadow-sm border border-gray-200">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Brain className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg font-semibold text-gray-900">AI/ML Cloud Analysis Engine</CardTitle>
          </div>
          <Badge variant="secondary">
            {analysisParams ? `${analysisParams.source} @ ${analysisParams.date}` : "Awaiting Data Selection"}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="p-4">
        {runAnalysisMutation.isPending && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-700 text-sm flex items-center">
            <Activity className="animate-spin h-4 w-4 mr-2" />
            Analysis in progress for: {runAnalysisMutation.variables?.algorithm}... Please wait.
          </div>
        )}

        <Tabs defaultValue="segmentation" className="w-full"> {/* Default to segmentation */}
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="analysis">Multi-Channel</TabsTrigger>
            <TabsTrigger value="segmentation">U-Net Segmentation</TabsTrigger>
            <TabsTrigger value="tracking">Temporal Tracking</TabsTrigger>
            <TabsTrigger value="validation">Validation</TabsTrigger>
          </TabsList>
          
          <TabsContent value="analysis" className="space-y-4 mt-4">
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-3">Brightness Temperature Analysis (Selected Source Data)</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                {[
                  { id: 'ir1', name: 'IR1 (10.8μm)', temp: currentSourceData?.channels?.ir1 || 0 },
                  { id: 'ir2', name: 'IR2 (12.0μm)', temp: currentSourceData?.channels?.ir2 || 0 },
                  { id: 'wv', name: 'WV (6.7μm)', temp: currentSourceData?.channels?.wv || 0 },
                  { id: 'vis', name: 'VIS (0.65μm)', temp: currentSourceData?.channels?.vis || 0 }
                ].map((channel) => (
                  <div key={channel.id} className={`border rounded-lg p-3 cursor-pointer ${selectedChannels.includes(channel.id) ? 'border-primary bg-primary/5' : 'border-gray-200'}`} onClick={() => handleChannelSelection(channel.id)}>
                    <div className="text-sm font-medium">{channel.name}</div>
                    <div className="text-lg font-bold text-primary">{channel.temp.toFixed(1)}K</div>
                    <div className="text-xs text-gray-500">{selectedChannels.includes(channel.id) ? 'Selected' : 'Available'}</div>
                  </div>
                ))}
              </div>
              <div className="flex space-x-3">
                <Button onClick={() => handleAlgorithmRun('multi_channel')} disabled={selectedChannels.length === 0 || runAnalysisMutation.isPending || !analysisParams} className="bg-primary">
                  <Layers className="h-4 w-4 mr-2" /> Start Multi-Channel
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="segmentation" className="space-y-4 mt-4">
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-3">Deep Learning Segmentation (U-Net)</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="border rounded-lg p-4">
                  <h5 className="font-medium mb-1 text-xs text-gray-500">Reference Model Performance</h5>
                  <div className="space-y-1"> {/* Reduced spacing */}
                    <div className="flex justify-between text-xs"><span>Dice Coeff:</span><span className="font-medium">0.932 (sample)</span></div>
                    <div className="flex justify-between text-xs"><span>IoU Score:</span><span className="font-medium">0.887 (sample)</span></div>
                  </div>
                </div>
                <div className="border rounded-lg p-4">
                  <h5 className="font-medium mb-1 text-xs text-gray-500">Latest Segmentation Run</h5>
                  {latestHistoricalAnalysis?.segmentation_results ? (
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs"><span>Clusters:</span><span className="font-medium">{latestHistoricalAnalysis.segmentation_results.cluster_count}</span></div>
                      <div className="flex justify-between text-xs"><span>Confidence:</span><Badge className={`${getValidationColor(latestHistoricalAnalysis.segmentation_results.confidence)} text-xs px-1 py-0.5`}>{(latestHistoricalAnalysis.segmentation_results.confidence * 100).toFixed(1)}%</Badge></div>
                    </div>
                  ) : <p className="text-xs text-gray-500">No segmentation run details available.</p>}
                </div>
              </div>
              <Button onClick={() => handleAlgorithmRun('unet_segmentation')} disabled={runAnalysisMutation.isPending || !analysisParams} className="w-full bg-primary">
                <PlayCircle className="h-4 w-4 mr-2" /> Run U-Net Segmentation on Selected Data
              </Button>
            </div>
          </TabsContent>
          {/* Other Tabs (Tracking, Validation) would follow similar structure */}
           <TabsContent value="tracking" className="mt-4"><p className="text-sm text-gray-500">Temporal tracking features coming soon.</p></TabsContent>
           <TabsContent value="validation" className="mt-4"><p className="text-sm text-gray-500">Reanalysis validation features coming soon.</p></TabsContent>
        </Tabs>

        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
          {/* Status line can be simplified or made more dynamic */}
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${currentSourceData ? 'bg-green-500 status-pulse' : 'bg-gray-400'}`}></div>
              <span className="text-gray-700">Source Data Status: {currentSourceData ? 'Loaded' : 'Pending selection'}</span>
            </div>
            <span className="text-gray-500">{historicalAnalyses?.length || 0} historical analyses available</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}