import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Satellite, Database, Globe, Download, RefreshCw } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface NASADataset {
  name: string;
  description: string;
  size: string;
  format: string;
  lastUpdated: string;
  downloadProgress?: number;
  status: 'available' | 'downloading' | 'processing' | 'complete';
}

export function NASADataIntegration() {
  const [selectedDatasets, setSelectedDatasets] = useState<string[]>([]);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: nasaDatasets, isLoading } = useQuery<NASADataset[]>({
    queryKey: ["/api/nasa-datasets"],
    refetchInterval: 5000,
  });

  const downloadMutation = useMutation({
    mutationFn: async (datasetName: string) => {
      const response = await apiRequest("POST", "/api/download-nasa-dataset", { dataset: datasetName });
      return response.json();
    },
    onSuccess: (data, datasetName) => {
      toast({
        title: "Download Started",
        description: `NASA dataset ${datasetName} download initiated`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/nasa-datasets"] });
    },
    onError: () => {
      toast({
        title: "Download Failed",
        description: "Failed to start NASA dataset download",
        variant: "destructive",
      });
    },
  });

  const trainModelMutation = useMutation({
    mutationFn: async (datasets: string[]) => {
      const response = await apiRequest("POST", "/api/train-with-nasa", { datasets });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Training Started",
        description: "Model training with NASA datasets initiated",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/model-metrics"] });
    },
  });

  const handleDatasetSelection = (datasetName: string) => {
    setSelectedDatasets(prev => 
      prev.includes(datasetName) 
        ? prev.filter(name => name !== datasetName)
        : [...prev, datasetName]
    );
  };

  const handleDownload = (datasetName: string) => {
    downloadMutation.mutate(datasetName);
  };

  const handleTrainWithSelected = () => {
    if (selectedDatasets.length === 0) {
      toast({
        title: "No Datasets Selected",
        description: "Please select at least one dataset for training",
        variant: "destructive",
      });
      return;
    }
    trainModelMutation.mutate(selectedDatasets);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-blue-100 text-blue-800';
      case 'downloading': return 'bg-yellow-100 text-yellow-800';
      case 'processing': return 'bg-purple-100 text-purple-800';
      case 'complete': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'downloading': return <Download className="h-3 w-3 animate-pulse" />;
      case 'processing': return <RefreshCw className="h-3 w-3 animate-spin" />;
      case 'complete': return <Database className="h-3 w-3" />;
      default: return <Satellite className="h-3 w-3" />;
    }
  };

  if (isLoading) {
    return (
      <Card className="bg-white shadow-sm border border-gray-200">
        <CardContent className="p-4">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-gray-200 rounded w-1/3"></div>
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 bg-gray-200 rounded"></div>
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
            <Globe className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold text-gray-900">NASA Datasets Integration</h3>
          </div>
          <Badge variant="secondary">
            Real-time Training Data
          </Badge>
        </div>
      </div>
      
      <CardContent className="p-4 space-y-4">
        {/* Dataset Selection */}
        <div className="space-y-3">
          {nasaDatasets?.map((dataset) => (
            <div key={dataset.name} className="border rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={selectedDatasets.includes(dataset.name)}
                    onChange={() => handleDatasetSelection(dataset.name)}
                    className="rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <div>
                    <h4 className="font-medium text-gray-900">{dataset.name}</h4>
                    <p className="text-sm text-gray-600">{dataset.description}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {getStatusIcon(dataset.status)}
                  <Badge className={getStatusColor(dataset.status)}>
                    {dataset.status}
                  </Badge>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4 text-sm text-gray-600">
                <div>
                  <span className="font-medium">Size:</span> {dataset.size}
                </div>
                <div>
                  <span className="font-medium">Format:</span> {dataset.format}
                </div>
                <div>
                  <span className="font-medium">Updated:</span> {dataset.lastUpdated}
                </div>
              </div>

              {dataset.downloadProgress !== undefined && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Download Progress</span>
                    <span>{dataset.downloadProgress}%</span>
                  </div>
                  <Progress value={dataset.downloadProgress} className="h-2" />
                </div>
              )}

              <div className="flex justify-end space-x-2">
                {dataset.status === 'available' && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDownload(dataset.name)}
                    disabled={downloadMutation.isPending}
                  >
                    <Download className="h-3 w-3 mr-1" />
                    Download
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Training Controls */}
        <div className="border-t pt-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-900">Model Training</h4>
              <p className="text-sm text-gray-600">
                {selectedDatasets.length} dataset(s) selected for enhanced prediction accuracy
              </p>
            </div>
            <Button
              onClick={handleTrainWithSelected}
              disabled={selectedDatasets.length === 0 || trainModelMutation.isPending}
              className="bg-primary hover:bg-primary/90"
            >
              {trainModelMutation.isPending ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Database className="h-4 w-4 mr-2" />
              )}
              Train Models
            </Button>
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-3 gap-4 p-3 bg-blue-50 rounded-lg">
          <div className="text-center">
            <div className="text-lg font-semibold text-blue-800">
              {nasaDatasets?.filter(d => d.status === 'complete').length || 0}
            </div>
            <div className="text-xs text-blue-600">Ready for Training</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-blue-800">
              {nasaDatasets?.filter(d => d.status === 'downloading').length || 0}
            </div>
            <div className="text-xs text-blue-600">Downloading</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-blue-800">
              {selectedDatasets.length}
            </div>
            <div className="text-xs text-blue-600">Selected</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}