import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { CloudUpload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { ImageAnalysisResult } from "@/lib/types";

export function ImageUpload() {
  const [progress, setProgress] = useState(0);
  const [analysisResult, setAnalysisResult] = useState<ImageAnalysisResult | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const analyzeImageMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('image', file);
      
      const response = await apiRequest("POST", "/api/analyze-image", formData);
      return response.json();
    },
    onSuccess: (data: ImageAnalysisResult) => {
      setAnalysisResult(data);
      setProgress(100);
      toast({
        title: "Analysis Complete",
        description: `Detected ${data.detectedClusters.length} cloud clusters with ${Math.round(data.processingStats.confidenceScore * 100)}% confidence`,
      });
      
      // Refresh cloud clusters data
      queryClient.invalidateQueries({ queryKey: ["/api/cloud-clusters"] });
    },
    onError: (error) => {
      setProgress(0);
      toast({
        title: "Analysis Failed",
        description: "Failed to analyze the uploaded image. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      setProgress(0);
      setAnalysisResult(null);
      
      // Simulate progress
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + Math.random() * 10;
        });
      }, 200);
      
      analyzeImageMutation.mutate(file);
    }
  }, [analyzeImageMutation]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.tiff']
    },
    maxFiles: 1,
    maxSize: 50 * 1024 * 1024, // 50MB
  });

  return (
    <Card className="bg-white shadow-sm border border-gray-200">
      <div className="p-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">Image Analysis</h3>
      </div>
      <CardContent className="p-4 space-y-4">
        <div 
          {...getRootProps()} 
          className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer ${
            isDragActive 
              ? "border-primary bg-primary/5" 
              : "border-gray-300 hover:border-primary"
          }`}
        >
          <input {...getInputProps()} />
          <CloudUpload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
          {isDragActive ? (
            <p className="text-sm text-primary">Drop the satellite image here...</p>
          ) : (
            <>
              <p className="text-sm text-gray-600">Drop satellite image here or</p>
              <Button variant="link" className="text-primary p-0 h-auto font-medium">
                browse files
              </Button>
            </>
          )}
        </div>
        
        <Button 
          className="w-full"
          disabled={analyzeImageMutation.isPending || progress === 0}
          onClick={() => {}}
        >
          {analyzeImageMutation.isPending ? "Running AI Detection..." : "Run AI Detection"}
        </Button>
        
        {progress > 0 && (
          <div className="space-y-2">
            <div className="text-sm text-gray-700">Detection Progress</div>
            <Progress value={progress} className="w-full" />
            <div className="text-xs text-gray-500">{Math.round(progress)}% complete</div>
          </div>
        )}

        {analysisResult && (
          <div className="space-y-2 p-3 bg-green-50 rounded-lg border border-green-200">
            <h4 className="text-sm font-medium text-green-800">Analysis Results</h4>
            <div className="text-xs text-green-700 space-y-1">
              <p>• Detected {analysisResult.detectedClusters.length} cloud clusters</p>
              <p>• Processing time: {(analysisResult.processingStats.processingTimeMs / 1000).toFixed(1)}s</p>
              <p>• Confidence: {Math.round(analysisResult.processingStats.confidenceScore * 100)}%</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
