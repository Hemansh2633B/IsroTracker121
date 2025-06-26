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
import LiveOrbitsGlobe from "@/components/LiveOrbitsGlobe";
import SmartAlertsDashboard from "@/components/SmartAlertsDashboard";
import VoiceControl from "@/components/VoiceControl";
import CommunityReportForm from "@/components/CommunityReportForm";
import CommunityReportList from "@/components/CommunityReportList";
import IsroBudgetChart from "@/components/IsroBudgetChart";
import NotificationSettings from "@/components/NotificationSettings";
import ARSkyView from "@/components/ARSkyView";
import LiveLaunchCountdown from "@/components/LiveLaunchCountdown";
import MissionTimelineDisplay from "@/components/MissionTimelineDisplay";
import LaunchStreamEmbed from "@/components/LaunchStreamEmbed";
import MissionControlSimplified from "@/components/MissionControlSimplified"; // Added
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

            {/* Live Launch Countdown */}
            <div className="my-6"> {/* Add some margin for spacing */}
              <LiveLaunchCountdown />
            </div>

            {/* Launch Stream Embed Section */}
            <div className="my-6">
              <LaunchStreamEmbed />
            </div>

            {/* Mission Control Dashboard Section */}
            <div className="my-6">
              <MissionControlSimplified />
            </div>

            {/* Mission Timeline Section */}
            <div className="my-6">
              <MissionTimelineDisplay />
            </div>

            {/* Live 3D Orbits Globe */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Live 3D Satellite Orbits</h3>
              <div style={{ height: "600px", width: "100%" }}> {/* Container for the globe */}
                <LiveOrbitsGlobe />
              </div>
            </div>

            {/* Smart Alerts Dashboard */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Smart Launch Alerts</h3>
              <SmartAlertsDashboard />
            </div>

            {/* Voice Control */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <VoiceControl />
            </div>

            {/* Community Reports Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-0"> {/* p-0 to allow form to have its own padding */}
                <CommunityReportForm />
              </div>
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-0"> {/* p-0 to allow list to have its own padding */}
                <CommunityReportList />
              </div>
            </div>

            {/* ISRO Budget Chart Section */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <IsroBudgetChart />
            </div>

            {/* Notification Settings Section */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <NotificationSettings />
            </div>

            {/* AR Sky View Section */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">AR Sky View (Experimental)</h3>
              <div style={{ height: "70vh", width: "100%", border: "1px solid #ccc" }}> {/* Ensure container has dimensions */}
                <ARSkyView />
              </div>
               <p className="text-xs text-gray-500 mt-2">
                Note: This feature requires a device with camera and orientation sensors, and browser support for WebXR/DeviceOrientation.
                Accuracy may vary. For best results, use on a mobile device and grant necessary permissions.
              </p>
            </div>
            
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
