import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useQuery } from "@tanstack/react-query";
import { Check, Clock, AlertCircle, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ProcessingJob } from "@shared/schema";

export function ProcessingPipeline() {
  const { data: jobs, isLoading } = useQuery<ProcessingJob[]>({
    queryKey: ["/api/processing-jobs"],
    refetchInterval: 2000, // Fast auto-refresh every 2 seconds
  });

  if (isLoading) {
    return (
      <Card className="bg-white shadow-sm border border-gray-200">
        <CardContent className="p-4">
          <div className="animate-pulse space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-16 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Complete":
        return <Check className="h-4 w-4 text-white" />;
      case "Running":
        return <Clock className="h-4 w-4 text-white" />;
      case "Failed":
        return <AlertCircle className="h-4 w-4 text-white" />;
      default:
        return <Clock className="h-4 w-4 text-white" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Complete":
        return "bg-green-500";
      case "Running":
        return "bg-yellow-500 status-pulse";
      case "Failed":
        return "bg-red-500";
      default:
        return "bg-gray-300";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "Complete":
        return "text-green-600";
      case "Running":
        return "text-yellow-600";
      case "Failed":
        return "text-red-600";
      default:
        return "text-gray-500";
    }
  };

  const getJobDescription = (jobType: string, status: string) => {
    const descriptions = {
      "DATA_INGESTION": status === "Complete" ? "MOSDAC API sync completed" : "Fetching latest satellite data",
      "AI_PROCESSING": status === "Running" ? "Running detection models..." : "Process satellite imagery with AI",
      "DATA_VALIDATION": "Quality checks and validation",
      "REPORT_GENERATION": "Statistical analysis and export"
    };
    return descriptions[jobType as keyof typeof descriptions] || "Processing...";
  };

  const getJobTitle = (jobType: string) => {
    const titles = {
      "DATA_INGESTION": "Data Ingestion",
      "AI_PROCESSING": "AI Processing", 
      "DATA_VALIDATION": "Data Validation",
      "REPORT_GENERATION": "Report Generation"
    };
    return titles[jobType as keyof typeof titles] || jobType;
  };

  const sortedJobs = jobs?.sort((a, b) => {
    const order = { "DATA_INGESTION": 1, "AI_PROCESSING": 2, "DATA_VALIDATION": 3, "REPORT_GENERATION": 4 };
    return (order[a.jobType as keyof typeof order] || 5) - (order[b.jobType as keyof typeof order] || 5);
  }) || [];

  const runningJob = sortedJobs.find(job => job.status === "Running");
  const nextRunTime = 23; // Mock next run time in minutes

  return (
    <Card className="bg-white shadow-sm border border-gray-200">
      <div className="p-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">Processing Pipeline</h3>
      </div>
      <CardContent className="p-4">
        <div className="space-y-4">
          {sortedJobs.map((job) => (
            <div key={job.id} className="flex items-center space-x-4">
              <div className={cn("w-8 h-8 rounded-full flex items-center justify-center", getStatusColor(job.status))}>
                {getStatusIcon(job.status)}
              </div>
              <div className="flex-1">
                <div className="font-medium text-gray-900">{getJobTitle(job.jobType)}</div>
                <div className="text-sm text-gray-600">{getJobDescription(job.jobType, job.status)}</div>
                {job.status === "Running" && (
                  <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
                    <div 
                      className="bg-yellow-500 h-1.5 rounded-full transition-all duration-300" 
                      style={{ width: `${job.progress}%` }}
                    ></div>
                  </div>
                )}
              </div>
              <div className={cn("text-sm", getStatusText(job.status))}>
                {job.status === "Running" ? `${job.progress}%` : job.status}
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <div className="flex items-center space-x-2">
            <Info className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-primary">Next scheduled run</span>
          </div>
          <p className="text-sm text-gray-600 mt-1">
            Automated processing in <span className="font-medium">{nextRunTime} minutes</span>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
