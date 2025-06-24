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

export default function Dashboard() {
  const [showAdmin, setShowAdmin] = useState(false);

  // Check for admin hash in URL
  useEffect(() => {
    if (window.location.hash === '#admin') {
      setShowAdmin(true);
    }
  }, []);

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
            <MetricsCards />
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <SatelliteMap />
              </div>
              <div className="space-y-6">
                <ImageUpload />
                <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                  <div className="p-4 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900">Quick Stats</h3>
                  </div>
                  <div className="p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Tracked Storms</span>
                      <span className="font-semibold text-gray-900">18</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Avg. Movement Speed</span>
                      <span className="font-semibold text-gray-900">12 km/h</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Coverage Area</span>
                      <span className="font-semibold text-gray-900">2.4M km²</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Data Quality</span>
                      <span className="text-green-600 font-semibold">Excellent</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <DetectionResults />
              <ProcessingPipeline />
              <ISTRACMonitor />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <LocationPredictor />
              <SecurityMonitor />
            </div>
            
            <CloudAnalysisEngine />
            
            <PaperGenerator />
            
            <NASADataIntegration />
            
            <DeepLearningPanel />
            
            <ExportPanel />
          </div>
        </main>
        
        <AIChat />
      </div>
    </div>
  );
}
