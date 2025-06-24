import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Download, FileText, Database } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function ExportPanel() {
  const [detectionThreshold, setDetectionThreshold] = useState([85]);
  const [processingRegion, setProcessingRegion] = useState("indian-ocean");
  const [autoValidation, setAutoValidation] = useState(true);
  const [realTimeAlerts, setRealTimeAlerts] = useState(true);
  const [debugLogging, setDebugLogging] = useState(false);
  
  const { toast } = useToast();

  const exportMutation = useMutation({
    mutationFn: async (format: string) => {
      const response = await apiRequest("GET", `/api/export-data?format=${format}`);
      return { response, format };
    },
    onSuccess: async ({ response, format }) => {
      if (format === 'csv') {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = 'mipid-export.csv';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
      } else {
        const data = await response.json();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = 'mipid-export.json';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
      }
      
      toast({
        title: "Export Successful",
        description: `Data exported as ${format.toUpperCase()} file`,
      });
    },
    onError: () => {
      toast({
        title: "Export Failed",
        description: "Failed to export data. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleExport = (format: string) => {
    exportMutation.mutate(format);
  };

  const handleApplySettings = () => {
    toast({
      title: "Settings Applied",
      description: "Configuration has been updated successfully",
    });
  };

  return (
    <Card className="bg-white shadow-sm border border-gray-200">
      <div className="p-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">Export & Configuration</h3>
      </div>
      <CardContent className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Data Export Section */}
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Data Export</h4>
            <div className="space-y-2">
              <Button 
                variant="outline" 
                className="w-full justify-center space-x-2"
                onClick={() => handleExport('csv')}
                disabled={exportMutation.isPending}
              >
                <Download className="h-4 w-4" />
                <span>Export CSV</span>
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-center space-x-2"
                onClick={() => handleExport('json')}
                disabled={exportMutation.isPending}
              >
                <FileText className="h-4 w-4" />
                <span>Generate Report</span>
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-center space-x-2"
                onClick={() => handleExport('json')}
                disabled={exportMutation.isPending}
              >
                <Database className="h-4 w-4" />
                <span>API Export</span>
              </Button>
            </div>
          </div>
          
          {/* Model Settings Section */}
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Model Settings</h4>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-700 mb-2">
                  Detection Threshold
                </label>
                <Slider
                  value={detectionThreshold}
                  onValueChange={setDetectionThreshold}
                  max={95}
                  min={50}
                  step={5}
                  className="w-full"
                />
                <div className="text-xs text-gray-500 mt-1">
                  Current: {detectionThreshold[0]}%
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">
                  Processing Region
                </label>
                <Select value={processingRegion} onValueChange={setProcessingRegion}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="indian-ocean">Indian Ocean</SelectItem>
                    <SelectItem value="bay-of-bengal">Bay of Bengal</SelectItem>
                    <SelectItem value="arabian-sea">Arabian Sea</SelectItem>
                    <SelectItem value="global">Global</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          
          {/* System Configuration Section */}
          <div>
            <h4 className="font-medium text-gray-900 mb-3">System Configuration</h4>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="auto-validation"
                  checked={autoValidation}
                  onCheckedChange={setAutoValidation}
                />
                <label htmlFor="auto-validation" className="text-sm text-gray-700">
                  Auto data validation
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="real-time-alerts"
                  checked={realTimeAlerts}
                  onCheckedChange={setRealTimeAlerts}
                />
                <label htmlFor="real-time-alerts" className="text-sm text-gray-700">
                  Real-time alerts
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="debug-logging"
                  checked={debugLogging}
                  onCheckedChange={setDebugLogging}
                />
                <label htmlFor="debug-logging" className="text-sm text-gray-700">
                  Debug logging
                </label>
              </div>
              <Button 
                className="w-full bg-primary hover:bg-blue-700 text-white"
                onClick={handleApplySettings}
              >
                Apply Settings
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
