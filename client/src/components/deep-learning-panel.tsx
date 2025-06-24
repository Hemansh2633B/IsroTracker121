import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Brain, Database, TrendingUp, Zap, Play, Pause } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface ModelMetrics {
  accuracy: number;
  loss: number;
  epochs: number;
  trainingTime: string;
  status: 'training' | 'completed' | 'stopped' | 'pending';
}

interface Dataset {
  name: string;
  type: 'vision' | 'nlp';
  samples: number;
  classes: number;
  description: string;
}

export function DeepLearningPanel() {
  const [activeModel, setActiveModel] = useState<string>('unet');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: modelMetrics } = useQuery<Record<string, ModelMetrics>>({
    queryKey: ["/api/model-metrics"],
    refetchInterval: 5000,
  });

  const { data: datasets } = useQuery<Dataset[]>({
    queryKey: ["/api/datasets"],
  });

  const trainModelMutation = useMutation({
    mutationFn: async ({ modelType, dataset }: { modelType: string; dataset: string }) => {
      const response = await apiRequest("POST", "/api/train-model", { modelType, dataset });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Training Started",
        description: "Deep learning model training has begun",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/model-metrics"] });
    },
    onError: () => {
      toast({
        title: "Training Failed",
        description: "Failed to start model training",
        variant: "destructive",
      });
    },
  });

  const stopTrainingMutation = useMutation({
    mutationFn: async (modelType: string) => {
      const response = await apiRequest("POST", "/api/stop-training", { modelType });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Training Stopped",
        description: "Model training has been stopped",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/model-metrics"] });
    },
  });

  const models = [
    {
      id: 'unet',
      name: 'U-Net Segmentation',
      description: 'Cloud cluster segmentation using U-Net architecture',
      type: 'vision',
      datasets: ['INSAT Imagery', 'Custom Satellite Data']
    },
    {
      id: 'convlstm',
      name: 'ConvLSTM Tracking',
      description: 'Temporal cloud movement prediction',
      type: 'vision',
      datasets: ['Time Series Satellite Data']
    },
    {
      id: 'cnn_classifier',
      name: 'CNN Classifier',
      description: 'Image classification for CIFAR-10, ImageNet',
      type: 'vision',
      datasets: ['CIFAR-10', 'ImageNet', 'MNIST']
    },
    {
      id: 'nlp_sentiment',
      name: 'NLP Sentiment Analysis',
      description: 'Weather report sentiment analysis',
      type: 'nlp',
      datasets: ['IMDB Reviews', 'Yelp Dataset', 'Weather Reports']
    }
  ];

  const availableDatasets: Dataset[] = [
    {
      name: 'MNIST',
      type: 'vision',
      samples: 70000,
      classes: 10,
      description: 'Handwritten digits classification'
    },
    {
      name: 'CIFAR-10',
      type: 'vision',
      samples: 60000,
      classes: 10,
      description: 'Object recognition in 32x32 images'
    },
    {
      name: 'ImageNet',
      type: 'vision',
      samples: 1281167,
      classes: 1000,
      description: 'Large-scale object recognition'
    },
    {
      name: 'IMDB Reviews',
      type: 'nlp',
      samples: 50000,
      classes: 2,
      description: 'Movie review sentiment analysis'
    },
    {
      name: 'Yelp Dataset',
      type: 'nlp',
      samples: 8635403,
      classes: 5,
      description: 'Business review sentiment classification'
    },
    {
      name: 'INSAT Imagery',
      type: 'vision',
      samples: 25000,
      classes: 3,
      description: 'Tropical cloud formations from INSAT satellite'
    }
  ];

  const handleTrainModel = (modelType: string, dataset: string) => {
    trainModelMutation.mutate({ modelType, dataset });
  };

  const handleStopTraining = (modelType: string) => {
    stopTrainingMutation.mutate(modelType);
  };

  return (
    <Card className="bg-white shadow-sm border border-gray-200">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <Brain className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold text-gray-900">Deep Learning Models</h3>
          <Badge variant="secondary" className="ml-auto">
            AI/ML Research Platform
          </Badge>
        </div>
      </div>
      
      <CardContent className="p-4">
        <Tabs defaultValue="models" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="models">Models</TabsTrigger>
            <TabsTrigger value="datasets">Datasets</TabsTrigger>
            <TabsTrigger value="metrics">Performance</TabsTrigger>
          </TabsList>
          
          <TabsContent value="models" className="space-y-4 mt-4">
            {models.map((model) => {
              const metrics = modelMetrics?.[model.id];
              const isTraining = metrics?.status === 'training';
              
              return (
                <div key={model.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-gray-900">{model.name}</h4>
                      <p className="text-sm text-gray-600">{model.description}</p>
                    </div>
                    <Badge className={`${
                      model.type === 'vision' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                    }`}>
                      {model.type === 'vision' ? 'Computer Vision' : 'NLP'}
                    </Badge>
                  </div>
                  
                  {metrics && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span>Training Progress</span>
                        <span>{metrics.epochs} epochs</span>
                      </div>
                      <Progress value={isTraining ? (metrics.epochs / 100) * 100 : 100} />
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">Accuracy:</span>
                          <span className="ml-1 font-medium">{(metrics.accuracy * 100).toFixed(1)}%</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Loss:</span>
                          <span className="ml-1 font-medium">{metrics.loss.toFixed(4)}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Time:</span>
                          <span className="ml-1 font-medium">{metrics.trainingTime}</span>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex items-center space-x-2">
                    {isTraining ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleStopTraining(model.id)}
                        disabled={stopTrainingMutation.isPending}
                      >
                        <Pause className="h-4 w-4 mr-1" />
                        Stop Training
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => handleTrainModel(model.id, model.datasets[0])}
                        disabled={trainModelMutation.isPending}
                        className="bg-primary hover:bg-primary/90"
                      >
                        <Play className="h-4 w-4 mr-1" />
                        Start Training
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </TabsContent>
          
          <TabsContent value="datasets" className="space-y-4 mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {availableDatasets.map((dataset) => (
                <div key={dataset.name} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-900">{dataset.name}</h4>
                    <Badge className={`${
                      dataset.type === 'vision' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                    }`}>
                      {dataset.type}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">{dataset.description}</p>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex items-center space-x-1">
                      <Database className="h-3 w-3 text-gray-400" />
                      <span>{dataset.samples.toLocaleString()} samples</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <TrendingUp className="h-3 w-3 text-gray-400" />
                      <span>{dataset.classes} classes</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="metrics" className="space-y-4 mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(modelMetrics || {}).map(([modelId, metrics]) => (
                <div key={modelId} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-gray-900">
                      {models.find(m => m.id === modelId)?.name || modelId}
                    </h4>
                    <Badge className={
                      metrics.status === 'training' ? 'bg-yellow-100 text-yellow-800' :
                      metrics.status === 'completed' ? 'bg-green-100 text-green-800' :
                      'bg-gray-100 text-gray-800'
                    }>
                      {metrics.status}
                    </Badge>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Model Accuracy</span>
                      <span className="font-medium">{(metrics.accuracy * 100).toFixed(2)}%</span>
                    </div>
                    <Progress value={metrics.accuracy * 100} className="h-2" />
                    
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-gray-600">Loss:</span>
                        <span className="ml-1 font-medium">{metrics.loss.toFixed(4)}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Epochs:</span>
                        <span className="ml-1 font-medium">{metrics.epochs}</span>
                      </div>
                    </div>
                    
                    <div className="text-xs text-gray-500">
                      Training time: {metrics.trainingTime}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}