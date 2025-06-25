import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"; // Added CardHeader, CardTitle, CardDescription
import { Badge } from "@/components/ui/badge";
import { Cloud, Info, CheckCircle, AlertTriangle } from "lucide-react"; // Added more icons
import { formatPercentage, getStatusColor, formatDate } from "@/lib/utils"; // Assuming these are still relevant
// Removed useQuery as data will come via props
// import type { CloudCluster } from "@shared/schema"; // This type might change or be part of SelectedPredictionDetail

// Type for the prop, should align with what SatelliteMap sends via onSelectPrediction
// and what Dashboard holds in selectedPrediction state.
interface SelectedPredictionDetail {
  id?: string;
  name?: string;
  confidence?: number;
  area?: number; // Example metric
  properties?: any; // To hold arbitrary GeoJSON properties
  // Add other fields you expect from a selected prediction
  detectedAt?: string; // Example
  status?: string; // Example
  precipitationProbability?: number; // Example
  coordinates?: string; // Example, might be derived from GeoJSON geometry
}

interface DetectionResultsProps {
  selectedPrediction: SelectedPredictionDetail | null;
}

export function DetectionResults({ selectedPrediction }: DetectionResultsProps) {
  if (!selectedPrediction) {
    return (
      <Card className="bg-white shadow-sm border border-gray-200 h-full"> {/* Ensure card takes height */}
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900">Detection Details</CardTitle>
          <CardDescription>Click on a predicted cluster on the map to see details here.</CardDescription>
        </CardHeader>
        <CardContent className="p-4 flex flex-col items-center justify-center text-center h-full">
          <Info className="h-12 w-12 mx-auto mb-3 text-gray-400" />
          <p className="text-gray-500">No prediction selected.</p>
        </CardContent>
      </Card>
    );
  }

  // Extract details from selectedPrediction, using properties if available
  const {
    name = "Unnamed Prediction",
    confidence,
    properties,
    detectedAt, // Assuming this might come from properties or top-level
    status,     // Assuming this might come from properties or top-level
    precipitationProbability, // Assuming this might come from properties or top-level
    id
  } = selectedPrediction;

  const displayProps = properties || selectedPrediction; // Use properties if they exist, else top-level

  // Example of trying to get more specific data from properties
  const featureName = displayProps.name || name || "Selected Feature";
  const featureConfidence = displayProps.confidence || confidence;
  const featureTimestamp = displayProps.timestamp || displayProps.time || detectedAt;
  const featureStatus = displayProps.status || status || "Info";
  const featurePrecipProb = displayProps.precipitation_probability || displayProps.precip_prob || precipitationProbability;


  return (
    <Card className="bg-white shadow-sm border border-gray-200 h-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-gray-900">Selected Detection Details</CardTitle>
          {id && <Badge variant="outline" className="text-xs">ID: {id.substring(0,12)}</Badge>}
        </div>
        <CardDescription>Details for the currently selected predicted cluster.</CardDescription>
      </CardHeader>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mt-1">
            {featureConfidence && featureConfidence > 0.75 ?
              <CheckCircle className="h-5 w-5 text-blue-600" /> :
              <Cloud className="h-5 w-5 text-blue-600" />
            }
          </div>
          <div className="flex-1">
            <h4 className="font-medium text-gray-900">{featureName}</h4>
            {featureStatus && (
              <Badge className={getStatusColor ? getStatusColor(featureStatus) : ""}>
                {featureStatus}
              </Badge>
            )}
            {featureTimestamp && (
              <p className="text-xs text-gray-500 mt-0.5">
                Timestamp: {formatDate ? formatDate(featureTimestamp) : featureTimestamp}
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm">
          {featureConfidence !== undefined && (
            <div className="bg-gray-50 p-2 rounded">
              <p className="text-gray-500 text-xs">Confidence</p>
              <p className="font-medium text-gray-800">{formatPercentage ? formatPercentage(featureConfidence) : `${(featureConfidence*100).toFixed(1)}%`}</p>
            </div>
          )}
          {featurePrecipProb !== undefined && (
             <div className="bg-gray-50 p-2 rounded">
              <p className="text-gray-500 text-xs">Precip. Prob.</p>
              <p className="font-medium text-gray-800">{formatPercentage ? formatPercentage(featurePrecipProb) : `${(featurePrecipProb*100).toFixed(1)}%`}</p>
            </div>
          )}
          {displayProps.area && (
            <div className="bg-gray-50 p-2 rounded">
              <p className="text-gray-500 text-xs">Area (approx.)</p>
              <p className="font-medium text-gray-800">{displayProps.area} km²</p>
            </div>
          )}
           {displayProps.max_intensity && (
            <div className="bg-gray-50 p-2 rounded">
              <p className="text-gray-500 text-xs">Max Intensity</p>
              <p className="font-medium text-gray-800">{displayProps.max_intensity}</p>
            </div>
          )}
        </div>

        {Object.keys(displayProps).length > 0 && (
          <div>
            <h5 className="text-xs font-semibold text-gray-700 mt-3 mb-1">All Properties:</h5>
            <pre className="text-xs bg-gray-100 p-2 rounded-md overflow-x-auto max-h-32">
              {JSON.stringify(displayProps, null, 2)}
            </pre>
          </div>
        )}

        {(!featureConfidence && !featurePrecipProb && Object.keys(displayProps).length === 0) && (
           <div className="text-center py-4 text-gray-500">
             <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-gray-400" />
             <p className="text-sm">Detailed properties not available for this selection.</p>
           </div>
        )}

      </CardContent>
    </Card>
  );
}
