import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { FileText, Download, BookOpen, Users, BarChart3, Brain, Zap } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface PaperTemplate {
  id: string;
  title: string;
  template: string;
  journal: string;
  citation_style: string;
  sections: string[];
}

interface GeneratedPaper {
  id: string;
  title: string;
  abstract: string;
  authors: string[];
  keywords: string[];
  sections: {
    introduction: string;
    methodology: string;
    results: string;
    discussion: string;
    conclusion: string;
    references: string[];
  };
  figures: {
    id: string;
    caption: string;
    data_source: string;
  }[];
  tables: {
    id: string;
    caption: string;
    data: any[];
  }[];
  status: 'generating' | 'complete' | 'review';
  generated_at: string;
  word_count: number;
}

export function PaperGenerator() {
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [customTitle, setCustomTitle] = useState('');
  const [authors, setAuthors] = useState('Dr. ISRO Research Team, ISTRAC Analysis Division');
  const [keywords, setKeywords] = useState('tropical cloud clusters, INSAT satellite, machine learning, U-Net segmentation, temporal tracking');
  const [generationProgress, setGenerationProgress] = useState(0);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: templates } = useQuery<PaperTemplate[]>({
    queryKey: ["/api/paper-templates"],
    refetchInterval: 30000,
  });

  const { data: generatedPapers } = useQuery<GeneratedPaper[]>({
    queryKey: ["/api/generated-papers"],
    refetchInterval: 5000,
  });

  const { data: analysisData } = useQuery({
    queryKey: ["/api/cloud-analysis"],
    refetchInterval: 5000,
  });

  const generatePaperMutation = useMutation({
    mutationFn: async (params: {
      template_id: string;
      title: string;
      authors: string[];
      keywords: string[];
      analysis_data: any;
    }) => {
      const response = await apiRequest("POST", "/api/generate-paper", params);
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Paper Generation Started",
        description: `Scientific paper "${data.title}" is being generated`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/generated-papers"] });
    },
    onError: () => {
      toast({
        title: "Generation Failed",
        description: "Failed to start paper generation",
        variant: "destructive",
      });
    },
  });

  const downloadPaperMutation = useMutation({
    mutationFn: async ({ paperId, format }: { paperId: string; format: string }) => {
      const response = await apiRequest("POST", "/api/download-paper", { paperId, format });
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Download Ready",
        description: `Paper downloaded in ${data.format} format`,
      });
    },
  });

  const handleGeneratePaper = () => {
    if (!selectedTemplate || !customTitle || !analysisData) {
      toast({
        title: "Missing Information",
        description: "Please select template, enter title, and ensure analysis data is available",
        variant: "destructive",
      });
      return;
    }

    generatePaperMutation.mutate({
      template_id: selectedTemplate,
      title: customTitle,
      authors: authors.split(',').map(a => a.trim()),
      keywords: keywords.split(',').map(k => k.trim()),
      analysis_data: analysisData
    });
  };

  const handleDownload = (paperId: string, format: string) => {
    downloadPaperMutation.mutate({ paperId, format });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'generating': return 'text-yellow-600 bg-yellow-100';
      case 'complete': return 'text-green-600 bg-green-100';
      case 'review': return 'text-blue-600 bg-blue-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <Card className="bg-white shadow-sm border border-gray-200">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <FileText className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold text-gray-900">Scientific Paper Generator</h3>
          </div>
          <Badge variant="secondary">
            AI-Powered Documentation
          </Badge>
        </div>
      </div>
      
      <CardContent className="p-4">
        <Tabs defaultValue="generate" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="generate">Generate Paper</TabsTrigger>
            <TabsTrigger value="papers">Generated Papers</TabsTrigger>
            <TabsTrigger value="templates">Templates</TabsTrigger>
          </TabsList>
          
          <TabsContent value="generate" className="space-y-4">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Paper Title</label>
                <Input
                  placeholder="Enter scientific paper title..."
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Authors</label>
                <Input
                  placeholder="Enter authors separated by commas..."
                  value={authors}
                  onChange={(e) => setAuthors(e.target.value)}
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Keywords</label>
                <Textarea
                  placeholder="Enter keywords separated by commas..."
                  value={keywords}
                  onChange={(e) => setKeywords(e.target.value)}
                  rows={2}
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Template</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {templates?.map((template) => (
                    <div
                      key={template.id}
                      className={`border rounded-lg p-3 cursor-pointer ${
                        selectedTemplate === template.id ? 'border-primary bg-primary/5' : 'border-gray-200'
                      }`}
                      onClick={() => setSelectedTemplate(template.id)}
                    >
                      <div className="font-medium text-sm">{template.title}</div>
                      <div className="text-xs text-gray-600">{template.journal}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        {template.sections.length} sections • {template.citation_style}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border rounded-lg p-4 bg-blue-50">
                <div className="flex items-center space-x-2 mb-2">
                  <BarChart3 className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-800">Analysis Data Preview</span>
                </div>
                {analysisData && analysisData.length > 0 ? (
                  <div className="text-sm text-blue-700">
                    <p>• Cloud clusters detected: {analysisData[0].segmentation_results?.cluster_count || 'N/A'}</p>
                    <p>• Segmentation confidence: {((analysisData[0].segmentation_results?.confidence || 0) * 100).toFixed(1)}%</p>
                    <p>• Tracking speed: {analysisData[0].tracking_data?.speed?.toFixed(1) || 'N/A'} km/h</p>
                    <p>• ERA5 correlation: {((analysisData[0].reanalysis_validation?.era5_correlation || 0) * 100).toFixed(1)}%</p>
                  </div>
                ) : (
                  <p className="text-sm text-blue-700">No analysis data available. Run cloud analysis first.</p>
                )}
              </div>

              <Button
                onClick={handleGeneratePaper}
                disabled={generatePaperMutation.isPending || !selectedTemplate || !customTitle}
                className="w-full bg-primary"
              >
                {generatePaperMutation.isPending ? (
                  <Zap className="h-4 w-4 mr-2 animate-pulse" />
                ) : (
                  <Brain className="h-4 w-4 mr-2" />
                )}
                Generate Scientific Paper
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="papers" className="space-y-4">
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-3">Generated Papers</h4>
              {generatedPapers && generatedPapers.length > 0 ? (
                <div className="space-y-3">
                  {generatedPapers.map((paper) => (
                    <div key={paper.id} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h5 className="font-medium text-gray-900">{paper.title}</h5>
                          <p className="text-sm text-gray-600 mt-1">
                            By: {paper.authors.join(', ')}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {paper.word_count} words • Generated: {new Date(paper.generated_at).toLocaleDateString()}
                          </p>
                        </div>
                        <Badge className={getStatusColor(paper.status)}>
                          {paper.status}
                        </Badge>
                      </div>

                      <div className="text-sm text-gray-700">
                        <strong>Abstract:</strong> {paper.abstract?.substring(0, 200)}...
                      </div>

                      <div className="flex flex-wrap gap-1">
                        {paper.keywords.slice(0, 5).map((keyword, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {keyword}
                          </Badge>
                        ))}
                      </div>

                      {paper.status === 'complete' && (
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDownload(paper.id, 'pdf')}
                          >
                            <Download className="h-3 w-3 mr-1" />
                            PDF
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDownload(paper.id, 'latex')}
                          >
                            <Download className="h-3 w-3 mr-1" />
                            LaTeX
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDownload(paper.id, 'docx')}
                          >
                            <Download className="h-3 w-3 mr-1" />
                            Word
                          </Button>
                        </div>
                      )}

                      {paper.status === 'generating' && (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span>Generation Progress</span>
                            <span>{Math.min(generationProgress + Math.random() * 20, 100).toFixed(0)}%</span>
                          </div>
                          <Progress value={Math.min(generationProgress + Math.random() * 20, 100)} className="h-2" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No papers generated yet</p>
                  <p className="text-sm">Generate your first scientific paper from analysis results</p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="templates" className="space-y-4">
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-3">Available Templates</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {templates?.map((template) => (
                  <div key={template.id} className="border rounded-lg p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <BookOpen className="h-4 w-4 text-primary" />
                      <span className="font-medium">{template.title}</span>
                    </div>
                    <div className="space-y-2 text-sm text-gray-600">
                      <p><strong>Journal:</strong> {template.journal}</p>
                      <p><strong>Citation Style:</strong> {template.citation_style}</p>
                      <p><strong>Sections:</strong></p>
                      <ul className="list-disc list-inside text-xs ml-4">
                        {template.sections.map((section, index) => (
                          <li key={index}>{section}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Statistics */}
        <div className="mt-6 grid grid-cols-3 gap-4 p-3 bg-gray-50 rounded-lg">
          <div className="text-center">
            <div className="text-lg font-semibold text-gray-800">
              {generatedPapers?.filter(p => p.status === 'complete').length || 0}
            </div>
            <div className="text-xs text-gray-600">Papers Complete</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-gray-800">
              {generatedPapers?.filter(p => p.status === 'generating').length || 0}
            </div>
            <div className="text-xs text-gray-600">In Progress</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-gray-800">
              {templates?.length || 0}
            </div>
            <div className="text-xs text-gray-600">Templates</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}