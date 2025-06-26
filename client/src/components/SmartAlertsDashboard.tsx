import React, { useEffect, useState } from "react";
import { LL2Launch, LL2UpcomingLaunchesResponse, LaunchAlertInfo, OpenMeteoResponse } from "@/lib/smartAlertTypes";
import { fetchWeatherForecast, analyzeWeatherForLaunch } from "@/lib/weatherService";
import { DialogTrigger } from "@/components/ui/dialog";
import LearningModeModal from "./LearningModeModal";
import { InfoIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

const SmartAlertsDashboard: React.FC = () => {
  const [launchAlerts, setLaunchAlerts] = useState<LaunchAlertInfo[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [learningModalOpen, setLearningModalOpen] = useState(false);
  const [currentLearningTopic, setCurrentLearningTopic] = useState<string | null>(null);

  const openLearningModal = (topicId: string) => {
    setCurrentLearningTopic(topicId);
    setLearningModalOpen(true);
  };

  useEffect(() => {
    const fetchLaunches = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch("https://ll.thespacedevs.com/2.2.0/launch/upcoming/?limit=10&status=1,8"); // status 1 (Go), 8 (TBC)
        if (!response.ok) {
          throw new Error(`Failed to fetch launches: ${response.statusText}`);
        }
        const data: LL2UpcomingLaunchesResponse = await response.json();

        const processedAlerts: LaunchAlertInfo[] = await Promise.all(
          data.results.map(async (launch) => {
            let weatherRiskAssessment = null;
            const launchDate = new Date(launch.net);
            const today = new Date();
            const threeDaysFromNow = new Date();
            threeDaysFromNow.setDate(today.getDate() + 3);

            // Only fetch weather for launches within the next 3 days and not already with a weather_concern
            if (launchDate >= today && launchDate <= threeDaysFromNow && !launch.weather_concerns) {
              const startDate = launchDate.toISOString().substring(0, 10);
              // Fetch for a small window, e.g., launch day itself
              // Open-Meteo needs YYYY-MM-DD for start_date and end_date

              const weatherData = await fetchWeatherForecast(
                launch.pad.latitude,
                launch.pad.longitude,
                startDate, // Launch date
                startDate, // Launch date (forecast for this day)
                launch.pad.location.timezone_name
              );

              if (weatherData) {
                weatherRiskAssessment = analyzeWeatherForLaunch(weatherData, launch.net);
              }
            } else if (launch.weather_concerns) {
              // Use existing weather concerns from Launch Library
              weatherRiskAssessment = {
                level: "Info", // Or determine level based on keywords in launch.weather_concerns
                message: launch.weather_concerns,
              };
            }

            return {
              launch,
              weatherRisk: weatherRiskAssessment || undefined, // Ensure it's undefined if null
            };
          })
        );
        setLaunchAlerts(processedAlerts);
      } catch (e: any) {
        setError(e.message || "An unknown error occurred");
        console.error(e);
      } finally {
        setLoading(false);
      }
    };

    fetchLaunches();
  }, []);

  if (loading) {
    return <div className="p-4">Loading upcoming launches...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-600">Error: {error}</div>;
  }

  if (launchAlerts.length === 0) {
    return <div className="p-4">No upcoming launches found matching criteria.</div>;
  }

  return (
    <>
      <div className="space-y-4">
        {launchAlerts.map(({ launch, weatherRisk }) => (
          <div key={launch.id} className="bg-gray-100 p-4 rounded-lg shadow">
            <div className="flex justify-between items-start">
              <h4 className="text-lg font-semibold text-primary">{launch.name}</h4>
              {/* Example: Info about TLEs if a smart alert is present, or just generally for launches */}
              <DialogTrigger asChild>
                <Button variant="ghost" size="sm" onClick={() => openLearningModal('tle')} className="ml-2">
                  <InfoIcon className="h-4 w-4 text-blue-500" />
                </Button>
              </DialogTrigger>
            </div>
            <p className="text-sm text-gray-700">
              LSP: {launch.launch_service_provider.name}
            </p>
            <p className="text-sm text-gray-700">
              Status: <span className={`font-medium ${launch.status.name === 'Go for Launch' ? 'text-green-600' : 'text-yellow-600'}`}>{launch.status.name}</span>
            </p>
            <p className="text-sm text-gray-700">
              NET: {new Date(launch.net).toLocaleString()} ({launch.pad.location.timezone_name})
            </p>
            <p className="text-sm text-gray-700">
              Pad: {launch.pad.name}, {launch.pad.location.name}
            </p>
            {launch.weather_concerns && (
              <div className="mt-2 p-2 bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700">
                <p className="font-semibold">Weather Concern (from source):</p>
                <p>{launch.weather_concerns}</p>
              </div>
            )}
            {weatherRisk && (
               <div className={`mt-2 p-2 border-l-4 ${
                  weatherRisk.level === "High" ? "bg-red-100 border-red-500 text-red-700" :
                  weatherRisk.level === "Medium" ? "bg-orange-100 border-orange-500 text-orange-700" :
                  weatherRisk.level === "Low" ? "bg-green-100 border-green-500 text-green-700" :
                  "bg-blue-100 border-blue-500 text-blue-700" // Info for direct weather_concerns
               }`}>
                <p className="font-semibold">Smart Alert ({weatherRisk.level} Risk):</p>
                <p>{weatherRisk.message}</p>
              </div>
            )}
          </div>
        ))}
      </div>
      <LearningModeModal
        topicId={currentLearningTopic}
        isOpen={learningModalOpen}
        onClose={() => setLearningModalOpen(false)}
      />
    </>
  );
};

export default SmartAlertsDashboard;
