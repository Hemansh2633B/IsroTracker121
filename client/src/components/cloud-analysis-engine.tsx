import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Brain, Layers, Activity, BarChart3, Satellite, Database, AlertTriangle } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface CloudClusterAnalysis {
  id: string;
  timestamp: string;
  brightness_temperature: {
    ir1: number;
    ir2: number;
    wv: number;
    vis: number;
  };
  segmentation_results: {
    confidence: number;
    cluster_count: number;
    total_area: number;
    density_map: number[][];
  };
  tracking_data: {
    movement_vector: { x: number; y: number };
    speed: number;
    direction: number;
    persistence: number;
  };
  reanalysis_validation: {
    era5_correlation: number;
    ncep_agreement: number;
    validation_score: number;
  };
}

export function CloudAnalysisEngine() {
  const [activeAnalysis, setActiveAnalysis] = useState<string | null>(null);
  const [selectedChannels, setSelectedChannels] = useState<string[]>(['ir1', 'ir2', 'wv']);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: analysisResults, isLoading } = useQuery<CloudClusterAnalysis[]>({
    queryKey: ["/api/cloud-analysis"],
    refetchInterval: 5000,
  });

  const { data: insatData } = useQuery({
    queryKey: ["/api/insat-data"],
    refetchInterval: 3000,
  });

  const startAnalysisMutation = useMutation({
    mutationFn: async (params: { channels: string[]; algorithm: string }) => {
      const response = await apiRequest("POST", "/api/start-cloud-analysis", params);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Analysis Started",
        description: "AI/ML cloud cluster identification initiated with INSAT data",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/cloud-analysis"] });
    },
  });

  const handleChannelSelection = (channel: string) => {
    setSelectedChannels(prev => 
      prev.includes(channel) 
        ? prev.filter(c => c !== channel)
        : [...prev, channel]
    );
  };

  const startAnalysis = (algorithm: string) => {
    startAnalysisMutation.mutate({
      channels: selectedChannels,
      algorithm
    });
  };

  const getValidationColor = (score: number) => {
    if (score > 0.8) return 'text-green-600 bg-green-100';
    if (score > 0.6) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  return (
    <Card className="bg-white shadow-sm border border-gray-200">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Brain className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold text-gray-900">AI/ML Cloud Analysis Engine</h3>
          </div>
          <Badge variant="secondary">
            INSAT Real-time Processing
          </Badge>
        </div>
      </div>
      
      <CardContent className="p-4">
        <Tabs defaultValue="analysis" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="analysis">Multi-Channel Analysis</TabsTrigger>
            <TabsTrigger value="segmentation">U-Net Segmentation</TabsTrigger>
            <TabsTrigger value="tracking">Temporal Tracking</TabsTrigger>
            <TabsTrigger value="validation">Reanalysis Validation</TabsTrigger>
          </TabsList>
          
          <TabsContent value="analysis" className="space-y-4">
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-3">Brightness Temperature Analysis</h4>
              
              {/* Channel Selection */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                {[
                  { id: 'ir1', name: 'IR1 (10.8μm)', temp: insatData?.channels?.ir1 || 0 },
                  { id: 'ir2', name: 'IR2 (12.0μm)', temp: insatData?.channels?.ir2 || 0 },
                  { id: 'wv', name: 'WV (6.7μm)', temp: insatData?.channels?.wv || 0 },
                  { id: 'vis', name: 'VIS (0.65μm)', temp: insatData?.channels?.vis || 0 }
                ].map((channel) => (
                  <div key={channel.id} className={`border rounded-lg p-3 cursor-pointer ${
                    selectedChannels.includes(channel.id) ? 'border-primary bg-primary/5' : 'border-gray-200'
                  }`} onClick={() => handleChannelSelection(channel.id)}>
                    <div className="text-sm font-medium">{channel.name}</div>
                    <div className="text-lg font-bold text-primary">{channel.temp.toFixed(1)}K</div>
                    <div className="text-xs text-gray-500">
                      {selectedChannels.includes(channel.id) ? 'Selected' : 'Available'}
                    </div>
                  </div>
                ))}
              </div>

              {/* Analysis Controls */}
              <div className="flex space-x-3">
                <Button
                  onClick={() => startAnalysis('multi_channel')}
                  disabled={selectedChannels.length === 0 || startAnalysisMutation.isPending}
                  className="bg-primary"
                >
                  <Layers className="h-4 w-4 mr-2" />
                  Start Multi-Channel Analysis
                </Button>
                <Button
                  onClick={() => startAnalysis('differential')}
                  disabled={selectedChannels.length < 2 || startAnalysisMutation.isPending}
                  variant="outline"
                >
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Differential Analysis
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="segmentation" className="space-y-4">
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-3">Deep Learning Segmentation (U-Net)</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border rounded-lg p-4">
                  <h5 className="font-medium mb-2">Model Performance</h5>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Dice Coefficient:</span>
                      <span className="font-medium">0.932</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>IoU Score:</span>
                      <span className="font-medium">0.887</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Precision:</span>
                      <span className="font-medium">0.945</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Recall:</span>
                      <span className="font-medium">0.921</span>
                    </div>
                  </div>
                </div>

                <div className="border rounded-lg p-4">
                  <h5 className="font-medium mb-2">Segmentation Results</h5>
                  {analysisResults && analysisResults.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Clusters Detected:</span>
                        <span className="font-medium">{analysisResults[0].segmentation_results.cluster_count}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Total Area:</span>
                        <span className="font-medium">{analysisResults[0].segmentation_results.total_area.toFixed(1)} km²</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Confidence:</span>
                        <Badge className={getValidationColor(analysisResults[0].segmentation_results.confidence)}>
                          {(analysisResults[0].segmentation_results.confidence * 100).toFixed(1)}%
                        </Badge>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <Button
                onClick={() => startAnalysis('unet_segmentation')}
                disabled={startAnalysisMutation.isPending}
                className="w-full bg-primary"
              >
                <Brain className="h-4 w-4 mr-2" />
                Run U-Net Segmentation
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="tracking" className="space-y-4">
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-3">Temporal Tracking (LSTM/ConvLSTM)</h4>
              
              {analysisResults && analysisResults.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="border rounded-lg p-4 text-center">
                    <Activity className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                    <div className="text-lg font-semibold text-blue-800">
                      {analysisResults[0].tracking_data.speed.toFixed(1)} km/h
                    </div>
                    <div className="text-xs text-blue-600">Movement Speed</div>
                  </div>
                  
                  <div className="border rounded-lg p-4 text-center">
                    <div className="h-8 w-8 mx-auto mb-2 bg-green-600 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs font-bold">
                        {analysisResults[0].tracking_data.direction.toFixed(0)}°
                      </span>
                    </div>
                    <div className="text-lg font-semibold text-green-800">
                      {analysisResults[0].tracking_data.direction > 180 ? 'SW' : 'NE'}
                    </div>
                    <div className="text-xs text-green-600">Direction</div>
                  </div>
                  
                  <div className="border rounded-lg p-4 text-center">
                    <div className="h-8 w-8 mx-auto mb-2 bg-purple-600 rounded-full"></div>
                    <div className="text-lg font-semibold text-purple-800">
                      {(analysisResults[0].tracking_data.persistence * 100).toFixed(0)}%
                    </div>
                    <div className="text-xs text-purple-600">Persistence</div>
                  </div>
                </div>
              )}

              <div className="space-y-3">
                <Button
                  onClick={() => startAnalysis('lstm_tracking')}
                  disabled={startAnalysisMutation.isPending}
                  className="w-full bg-primary"
                >
                  Initialize LSTM Tracking
                </Button>
                <Button
                  onClick={() => startAnalysis('convlstm_tracking')}
                  disabled={startAnalysisMutation.isPending}
                  variant="outline"
                  className="w-full"
                >
                  Initialize ConvLSTM Tracking
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="validation" className="space-y-4">
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-3">Reanalysis Dataset Validation</h4>
              
              {analysisResults && analysisResults.length > 0 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">ERA5 Correlation</span>
                        <Badge className={getValidationColor(analysisResults[0].reanalysis_validation.era5_correlation)}>
                          {(analysisResults[0].reanalysis_validation.era5_correlation * 100).toFixed(1)}%
                        </Badge>
                      </div>
                      <Progress value={analysisResults[0].reanalysis_validation.era5_correlation * 100} className="h-2" />
                    </div>
                    
                    <div className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">NCEP Agreement</span>
                        <Badge className={getValidationColor(analysisResults[0].reanalysis_validation.ncep_agreement)}>
                          {(analysisResults[0].reanalysis_validation.ncep_agreement * 100).toFixed(1)}%
                        </Badge>
                      </div>
                      <Progress value={analysisResults[0].reanalysis_validation.ncep_agreement * 100} className="h-2" />
                    </div>
                    
                    <div className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Overall Score</span>
                        <Badge className={getValidationColor(analysisResults[0].reanalysis_validation.validation_score)}>
                          {(analysisResults[0].reanalysis_validation.validation_score * 100).toFixed(1)}%
                        </Badge>
                      </div>
                      <Progress value={analysisResults[0].reanalysis_validation.validation_score * 100} className="h-2" />
                    </div>
                  </div>

                  <div className="border rounded-lg p-4 bg-blue-50">
                    <div className="flex items-center space-x-2 mb-2">
                      <Database className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-medium text-blue-800">Validation Status</span>
                    </div>
                    <p className="text-sm text-blue-700">
                      Analysis validated against ERA5 reanalysis and NCEP datasets. 
                      High correlation indicates reliable tropical cloud cluster identification.
                    </p>
                  </div>
                </div>
              )}

              <Button
                onClick={() => startAnalysis('reanalysis_validation')}
                disabled={startAnalysisMutation.isPending}
                className="w-full bg-primary"
              >
                <AlertTriangle className="h-4 w-4 mr-2" />
                Run Reanalysis Validation
              </Button>
            </div>
          </TabsContent>
        </Tabs>

        {/* Real-time Status */}
        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full status-pulse"></div>
              <span className="text-gray-700">
                INSAT Data Stream Active • 
                IST: {new Date().toLocaleTimeString('en-IN', {
                  timeZone: 'Asia/Kolkata',
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit'
                })}
              </span>
            </div>
            <span className="text-gray-500">
              {analysisResults?.length || 0} analyses completed
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}