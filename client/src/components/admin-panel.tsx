import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Shield, Settings, Brain, Database, Users, Lock, Play, Square, BarChart3 } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface TrainingJob {
  id: string;
  model_name: string;
  dataset: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number;
  epochs_completed: number;
  total_epochs: number;
  loss: number;
  accuracy: number;
  started_at: string;
  estimated_completion: string;
}

export function AdminPanel() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [selectedModel, setSelectedModel] = useState('');
  const [selectedDataset, setSelectedDataset] = useState('');
  const [epochs, setEpochs] = useState('50');
  const [learningRate, setLearningRate] = useState('0.001');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: trainingJobs } = useQuery<TrainingJob[]>({
    queryKey: ["/api/admin/training-jobs"],
    enabled: isAuthenticated,
    refetchInterval: 3000,
  });

  const { data: systemMetrics } = useQuery({
    queryKey: ["/api/admin/system-metrics"],
    enabled: isAuthenticated,
    refetchInterval: 5000,
  });

  const authenticateMutation = useMutation({
    mutationFn: async (pwd: string) => {
      const response = await apiRequest("POST", "/api/admin/authenticate", { password: pwd });
      return response.json();
    },
    onSuccess: (data) => {
      if (data.success) {
        setIsAuthenticated(true);
        toast({
          title: "Admin Access Granted",
          description: "Welcome to MIPID Admin Panel",
        });
      } else {
        toast({
          title: "Access Denied",
          description: "Invalid admin password",
          variant: "destructive",
        });
      }
    },
  });

  const startTrainingMutation = useMutation({
    mutationFn: async (params: {
      model_name: string;
      dataset: string;
      epochs: number;
      learning_rate: number;
    }) => {
      const response = await apiRequest("POST", "/api/admin/start-training", params);
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Training Started",
        description: `${data.model_name} training initiated on ${data.dataset}`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/training-jobs"] });
    },
  });

  const stopTrainingMutation = useMutation({
    mutationFn: async (jobId: string) => {
      const response = await apiRequest("POST", "/api/admin/stop-training", { jobId });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Training Stopped",
        description: "Training job has been terminated",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/training-jobs"] });
    },
  });

  const handleLogin = () => {
    authenticateMutation.mutate(password);
  };

  const handleStartTraining = () => {
    if (!selectedModel || !selectedDataset) {
      toast({
        title: "Missing Parameters",
        description: "Please select model and dataset",
        variant: "destructive",
      });
      return;
    }

    startTrainingMutation.mutate({
      model_name: selectedModel,
      dataset: selectedDataset,
      epochs: parseInt(epochs),
      learning_rate: parseFloat(learningRate)
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running': return 'text-blue-600 bg-blue-100';
      case 'completed': return 'text-green-600 bg-green-100';
      case 'failed': return 'text-red-600 bg-red-100';
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  if (!isAuthenticated) {
    return (
      <Card className="bg-white shadow-sm border border-gray-200 max-w-md mx-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <Shield className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold text-gray-900">Admin Access</h3>
          </div>
        </div>
        
        <CardContent className="p-6 space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">Admin Password</label>
            <Input
              type="password"
              placeholder="Enter admin password..."
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
            />
          </div>
          
          <Button
            onClick={handleLogin}
            disabled={authenticateMutation.isPending || !password}
            className="w-full bg-primary"
          >
            <Lock className="h-4 w-4 mr-2" />
            Authenticate
          </Button>
          
          <div className="text-xs text-gray-500 text-center">
            Authorized personnel only. All access attempts are logged.
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
            <Settings className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold text-gray-900">MIPID Admin Panel</h3>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant="secondary" className="bg-green-100 text-green-800">
              <Shield className="h-3 w-3 mr-1" />
              Authenticated
            </Badge>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsAuthenticated(false)}
            >
              Logout
            </Button>
          </div>
        </div>
      </div>
      
      <CardContent className="p-4">
        <Tabs defaultValue="training" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="training">AI Training</TabsTrigger>
            <TabsTrigger value="models">Model Management</TabsTrigger>
            <TabsTrigger value="system">System Metrics</TabsTrigger>
            <TabsTrigger value="users">User Management</TabsTrigger>
          </TabsList>
          
          <TabsContent value="training" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Training Configuration */}
              <div className="space-y-4">
                <h4 className="text-sm font-medium text-gray-700">New Training Job</h4>
                
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Model Architecture</label>
                  <div className="grid grid-cols-2 gap-2">
                    {['U-Net', 'ConvLSTM', 'ResNet50', 'Transformer'].map((model) => (
                      <div
                        key={model}
                        className={`border rounded-lg p-3 cursor-pointer text-center ${
                          selectedModel === model ? 'border-primary bg-primary/5' : 'border-gray-200'
                        }`}
                        onClick={() => setSelectedModel(model)}
                      >
                        <div className="text-sm font-medium">{model}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Dataset</label>
                  <div className="grid grid-cols-2 gap-2">
                    {['INSAT-3D', 'MODIS', 'ERA5', 'Custom'].map((dataset) => (
                      <div
                        key={dataset}
                        className={`border rounded-lg p-3 cursor-pointer text-center ${
                          selectedDataset === dataset ? 'border-primary bg-primary/5' : 'border-gray-200'
                        }`}
                        onClick={() => setSelectedDataset(dataset)}
                      >
                        <div className="text-sm font-medium">{dataset}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">Epochs</label>
                    <Input
                      value={epochs}
                      onChange={(e) => setEpochs(e.target.value)}
                      placeholder="50"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">Learning Rate</label>
                    <Input
                      value={learningRate}
                      onChange={(e) => setLearningRate(e.target.value)}
                      placeholder="0.001"
                    />
                  </div>
                </div>

                <Button
                  onClick={handleStartTraining}
                  disabled={startTrainingMutation.isPending}
                  className="w-full bg-primary"
                >
                  <Play className="h-4 w-4 mr-2" />
                  Start Training
                </Button>
              </div>

              {/* Active Training Jobs */}
              <div className="space-y-4">
                <h4 className="text-sm font-medium text-gray-700">Active Training Jobs</h4>
                
                {trainingJobs && trainingJobs.length > 0 ? (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {trainingJobs.map((job) => (
                      <div key={job.id} className="border rounded-lg p-3 space-y-2">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium text-sm">{job.model_name}</div>
                            <div className="text-xs text-gray-600">{job.dataset} dataset</div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge className={getStatusColor(job.status)}>
                              {job.status}
                            </Badge>
                            {job.status === 'running' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => stopTrainingMutation.mutate(job.id)}
                              >
                                <Square className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        </div>

                        {job.status === 'running' && (
                          <div className="space-y-1">
                            <div className="flex justify-between text-xs">
                              <span>Progress: {job.epochs_completed}/{job.total_epochs} epochs</span>
                              <span>{job.progress.toFixed(1)}%</span>
                            </div>
                            <Progress value={job.progress} className="h-2" />
                            <div className="flex justify-between text-xs text-gray-600">
                              <span>Loss: {job.loss.toFixed(4)}</span>
                              <span>Accuracy: {(job.accuracy * 100).toFixed(1)}%</span>
                            </div>
                          </div>
                        )}

                        <div className="text-xs text-gray-500">
                          Started: {new Date(job.started_at).toLocaleString()}
                          {job.status === 'running' && (
                            <span> • ETA: {job.estimated_completion}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Brain className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>No active training jobs</p>
                    <p className="text-sm">Start a new training session</p>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="models" className="space-y-4">
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-3">Deployed Models</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  { name: 'U-Net Segmentation', version: 'v2.1', accuracy: 93.2, status: 'active' },
                  { name: 'ConvLSTM Tracker', version: 'v1.8', accuracy: 88.7, status: 'active' },
                  { name: 'Rainfall Predictor', version: 'v1.5', accuracy: 91.4, status: 'inactive' },
                  { name: 'Cyclone Classifier', version: 'v1.2', accuracy: 89.1, status: 'active' }
                ].map((model, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">{model.name}</span>
                      <Badge className={model.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                        {model.status}
                      </Badge>
                    </div>
                    <div className="space-y-1 text-sm text-gray-600">
                      <p>Version: {model.version}</p>
                      <p>Accuracy: {model.accuracy}%</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="system" className="space-y-4">
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-3">System Performance</h4>
              
              {systemMetrics && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="border rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-blue-600">{systemMetrics.cpu_usage}%</div>
                    <div className="text-sm text-gray-600">CPU Usage</div>
                  </div>
                  <div className="border rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-green-600">{systemMetrics.memory_usage}%</div>
                    <div className="text-sm text-gray-600">Memory Usage</div>
                  </div>
                  <div className="border rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-purple-600">{systemMetrics.gpu_usage}%</div>
                    <div className="text-sm text-gray-600">GPU Usage</div>
                  </div>
                  <div className="border rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-orange-600">{systemMetrics.disk_usage}%</div>
                    <div className="text-sm text-gray-600">Disk Usage</div>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="users" className="space-y-4">
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-3">User Activity</h4>
              <div className="space-y-3">
                {[
                  { user: 'admin@isro.gov.in', role: 'Administrator', last_access: '2 minutes ago', status: 'online' },
                  { user: 'analyst@istrac.gov.in', role: 'Data Analyst', last_access: '15 minutes ago', status: 'away' },
                  { user: 'researcher@mosdac.gov.in', role: 'Researcher', last_access: '1 hour ago', status: 'offline' }
                ].map((user, index) => (
                  <div key={index} className="border rounded-lg p-4 flex items-center justify-between">
                    <div>
                      <div className="font-medium">{user.user}</div>
                      <div className="text-sm text-gray-600">{user.role} • {user.last_access}</div>
                    </div>
                    <Badge className={
                      user.status === 'online' ? 'bg-green-100 text-green-800' :
                      user.status === 'away' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }>
                      {user.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}