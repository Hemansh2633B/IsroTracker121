import { Header } from "@/components/header";
import { Sidebar } from "@/components/sidebar";
import { MetricsCards } from "@/components/metrics-cards";
import { SatelliteMap } from "@/components/satellite-map";
import { ImageUpload } from "@/components/image-upload";
import { DetectionResults } from "@/components/detection-results";
import { ProcessingPipeline } from "@/components/processing-pipeline";
import { ExportPanel } from "@/components/export-panel";
import { AIChat } from "@/components/ai-chat";
import { DeepLearningPanel } from "@/components/deep-learning-panel";
import { LocationPredictor } from "@/components/location-predictor";
import { ISTRACMonitor } from "@/components/istrac-monitor";
import { NASADataIntegration } from "@/components/nasa-data-integration";
import { SecurityMonitor } from "@/components/security-monitor";
import { CloudAnalysisEngine } from "@/components/cloud-analysis-engine";
import { PaperGenerator } from "@/components/paper-generator";
import { AdminPanel } from "@/components/admin-panel";
import { useState, useEffect } from "react";
import * as React from "react";

// Define types for shared state (can be moved to lib/types.ts later)
interface PredictionOverlayData { // Matches structure in SatelliteMap
  id: string;
  type: "geojson";
  data: GeoJSON.FeatureCollection;
  style?: L.PathOptions;
}

interface SelectedPredictionDetail { // Example, expand as needed
  id?: string;
  name?: string;
  confidence?: number;
  area?: number; // Example metric
  properties?: any;
}

export default function Dashboard() {
  const [showAdmin, setShowAdmin] = useState(false);

  // Shared state for analysis results and selected details
  const [predictionOverlays, setPredictionOverlays] = useState<PredictionOverlayData[]>([]);
  const [selectedPrediction, setSelectedPrediction] = useState<SelectedPredictionDetail | null>(null);
  const [analysisParams, setAnalysisParams] = useState<{date: string; source: string} | null>(null);


  useEffect(() => {
    if (window.location.hash === '#admin') {
      setShowAdmin(true);
    }
  }, []);

  const handleStartAnalysis = (params: {date: string; source: string}) => {
    console.log("Dashboard: Analysis triggered with params", params);
    setAnalysisParams(params); // CloudAnalysisEngine can watch this
    // For now, CloudAnalysisEngine will fetch and then call setPredictionOverlays
    // In a more advanced setup, this function might directly call a method on CloudAnalysisEngine
    // or CloudAnalysisEngine would use a mutation that updates a shared query cache.
  };

  if (showAdmin) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto p-6">
          <div className="mb-6">
            <button
              onClick={() => setShowAdmin(false)}
              className="text-primary hover:underline mb-4"
            >
              ← Back to Dashboard
            </button>
            <AdminPanel />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 font-[Inter,system-ui,sans-serif]">
      <Header />
      <div className="flex h-[calc(100vh-64px)]">
        <Sidebar />
        <main className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-6">
            {/* MetricsCards might also need access to some high-level summary from analysis */}
            <MetricsCards />
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <SatelliteMap
                  predictionOverlays={predictionOverlays}
                  onSelectPrediction={setSelectedPrediction} // Pass setter to map
                  onInitiateAnalysis={handleStartAnalysis} // Pass analysis trigger
                />
              </div>
              <div className="space-y-6">
                <ImageUpload /> {/* This might feed into available data for analysis */}
                {/* Original Quick Stats - could be replaced or enhanced by DetectionResults */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                  <div className="p-4 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900">Selection Details</h3>
                  </div>
                  {/* DetectionResults will now show selectedPrediction */}
                  <DetectionResults selectedPrediction={selectedPrediction} />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* DetectionResults moved above, this could be other components or a log */}
              <div>{/* Placeholder for other content if DetectionResults is moved */}</div>
              <ProcessingPipeline /> {/* This might show status of backend processing */}
              <ISTRACMonitor />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <LocationPredictor />
              <SecurityMonitor />
            </div>
            
            {/* CloudAnalysisEngine will use analysisParams and call setPredictionOverlays */}
            <CloudAnalysisEngine
                analysisParams={analysisParams}
                onAnalysisComplete={setPredictionOverlays} // Engine calls this with new overlays
            />
            
            <PaperGenerator />
            <NASADataIntegration />
            <DeepLearningPanel /> {/* This might interact with training scripts/results */}
            <ExportPanel />
          </div>
        </main>
        
        <AIChat />
      </div>
    </div>
  );
}
