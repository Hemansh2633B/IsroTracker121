export interface DashboardMetrics {
  activeClusters: number;
  precipitationProbability: number;
  dataPoints: number;
  modelAccuracy: number;
  trackedStorms: number;
  avgMovementSpeed: number;
  coverageArea: string;
  dataQuality: string;
}

export interface ImageAnalysisResult {
  satelliteData: any;
  detectedClusters: any[];
  processingStats: {
    totalPixelsAnalyzed: number;
    processingTimeMs: number;
    confidenceScore: number;
  };
}

export interface DetectionMarker {
  id: string;
  x: number;
  y: number;
  type: 'high-risk' | 'moderate' | 'low';
  name: string;
  confidence: number;
}
