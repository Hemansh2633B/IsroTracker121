import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { LL2Launch, LL2UpcomingLaunchesResponse } from '@/lib/smartAlertTypes'; // Re-use types
import { Rocket, Zap, Gauge, ArrowUpCircle } from 'lucide-react'; // Icons

const MissionControlSimplified: React.FC = () => {
  const { t, i18n } = useTranslation();
  const [targetLaunch, setTargetLaunch] = useState<LL2Launch | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Simulated Telemetry State
  const [altitude, setAltitude] = useState(0); // km
  const [speed, setSpeed] = useState(0); // km/h
  const [missionTime, setMissionTime] = useState(0); // seconds since T-0
  const [currentPhase, setCurrentPhase] = useState("Pre-Launch");

  useEffect(() => {
    const fetchLaunchForDisplay = async () => {
      setLoading(true);
      setError(null);
      try {
        // Fetch the most recent launch that was successful OR the very next "Go" launch
        // Try for last successful first
        let response = await fetch("https://ll.thespacedevs.com/2.2.0/launch/previous/?limit=1&ordering=-net&status=3"); // Status 3 = Success
        let data: LL2UpcomingLaunchesResponse = await response.json();

        if (data.results && data.results.length > 0) {
          setTargetLaunch(data.results[0]);
        } else {
          // If no recent successful, try for next "Go" or "TBC"
          response = await fetch("https://ll.thespacedevs.com/2.2.0/launch/upcoming/?limit=1&ordering=net&status=1,8&hide_recent_previous=true");
          data = await response.json();
          if (data.results && data.results.length > 0) {
            setTargetLaunch(data.results[0]);
          } else {
            setTargetLaunch(null);
          }
        }
      } catch (e: any) {
        setError(e.message || "An unknown error occurred fetching launch data for Mission Control.");
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchLaunchForDisplay();
  }, []);

  useEffect(() => {
    if (!targetLaunch || !targetLaunch.net) return;

    const launchNetTime = new Date(targetLaunch.net).getTime();
    let simulationTimer: NodeJS.Timeout | undefined;

    const updateSimulation = () => {
      const now = new Date().getTime();
      const elapsedSeconds = Math.floor((now - launchNetTime) / 1000);
      setMissionTime(elapsedSeconds);

      if (elapsedSeconds < 0) {
        setCurrentPhase(t('missionControl.phasePreLaunch', "Pre-Launch"));
        setAltitude(0);
        setSpeed(0);
      } else if (elapsedSeconds <= 120) { // First 2 minutes (e.g., SRB burn / First stage)
        setCurrentPhase(t('missionControl.phaseAscent1', "Initial Ascent"));
        setAltitude(Math.min(100, parseFloat((0.0035 * elapsedSeconds * elapsedSeconds).toFixed(1)))); // Simplified quadratic ascent to ~50km
        setSpeed(Math.min(7000, parseFloat((60 * elapsedSeconds).toFixed(0)))); // Simplified linear speed increase
      } else if (elapsedSeconds <= 300) { // Up to 5 minutes (e.g., Second stage)
        setCurrentPhase(t('missionControl.phaseAscent2', "Upper Stage Burn"));
        setAltitude(Math.min(200, parseFloat((100 + 0.001 * (elapsedSeconds-120)*(elapsedSeconds-120)).toFixed(1)) )); // Slower accel to ~200km
        setSpeed(Math.min(28000, parseFloat((7000 + 100 * (elapsedSeconds-120)).toFixed(0)) )); // Approaching orbital velocity
      } else if (elapsedSeconds <= 600 && targetLaunch.status.id !== 3) { // Up to 10 mins, if not yet marked successful
        setCurrentPhase(t('missionControl.phaseCoasting', "Coasting to Orbit"));
        // Speed might decrease slightly due to gravity if no thrust, altitude might peak or coast
        setAltitude(parseFloat((200 + 1 * (elapsedSeconds-300)).toFixed(1)) ); // Slight increase or coasting
        setSpeed(parseFloat( (28000 - 5 * (elapsedSeconds-300)).toFixed(0)) ); // Slight decrease
      } else if (targetLaunch.status.id === 3 ) { // Success
        setCurrentPhase(t('missionControl.phaseOrbitAchieved', "Orbit Achieved / Mission Success"));
        // Could set to typical LEO parameters or last known for the mission
        setAltitude(targetLaunch.mission?.orbit?.name?.toLowerCase().includes('low') ? 550 : 35786); // LEO or GEO
        setSpeed(targetLaunch.mission?.orbit?.name?.toLowerCase().includes('low') ? 27500 : 11000);
        clearInterval(simulationTimer);
      } else {
         setCurrentPhase(t('missionControl.phaseMissionEnded', "Awaiting Final Status / Post-Deployment"));
         // Keep last values or reset if appropriate
         clearInterval(simulationTimer);
      }
    };

    // Only run simulation if launch is "Go" or "TBC" and near T-0, or recently successful
    if (targetLaunch.status.id === 1 || targetLaunch.status.id === 8 ||
        (targetLaunch.status.id === 3 && new Date().getTime() - launchNetTime < 15 * 60 * 1000) ) { // Successful in last 15 mins
      updateSimulation(); // Initial call
      simulationTimer = setInterval(updateSimulation, 1000); // Update every second
    } else {
      // For older successful missions, or TBD far in future, just show static "Completed" or "Scheduled"
      if (targetLaunch.status.id === 3) setCurrentPhase(t('missionControl.phaseMissionSuccess', "Mission Successful"));
      else setCurrentPhase(t('missionControl.phaseScheduled', "Scheduled"));
      setAltitude(0); setSpeed(0); setMissionTime(0);
    }

    return () => clearInterval(simulationTimer);
  }, [targetLaunch, t]);


  if (loading) {
    return <div className="p-4 text-center">{t('missionControl.loading', "Loading Mission Control Data...")}</div>;
  }

  if (error) {
    return <div className="p-4 text-red-600 text-center">{t('missionControl.error', "Error loading data.")} ({error})</div>;
  }

  if (!targetLaunch) {
    return <div className="p-4 text-center">{t('missionControl.noLaunch', "No suitable launch found for Mission Control display.")}</div>;
  }

  const formatMissionTime = (seconds: number): string => {
    const sign = seconds < 0 ? "-" : "+";
    const absSeconds = Math.abs(seconds);
    const h = String(Math.floor(absSeconds / 3600)).padStart(2, '0');
    const m = String(Math.floor((absSeconds % 3600) / 60)).padStart(2, '0');
    const s = String(Math.floor(absSeconds % 60)).padStart(2, '0');
    return `T${sign}${h}:${m}:${s}`;
  };

  return (
    <div className="p-6 rounded-lg shadow-xl bg-slate-800 dark:bg-slate-900 text-slate-100">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-2xl font-bold text-primary-foreground dark:text-slate-50 flex items-center">
          <Rocket className="mr-2 h-7 w-7" /> {t('missionControl.title', "Mission Control")}
        </h3>
        <span className="text-sm font-mono bg-slate-700 dark:bg-slate-800 px-2 py-1 rounded">
          {formatMissionTime(missionTime)}
        </span>
      </div>

      <div className="mb-6 p-4 bg-slate-700/50 dark:bg-slate-800/50 rounded-md">
        <p className="text-lg font-semibold">{targetLaunch.name}</p>
        <p className="text-xs opacity-80">
          {t('missionControl.lsp', "LSP")}: {targetLaunch.launch_service_provider.name} | {t('missionControl.launchTime', "Launch")}: {new Date(targetLaunch.net).toLocaleString(i18n.language, { dateStyle: 'medium', timeStyle: 'long', timeZone: targetLaunch.pad.location.timezone_name })}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="p-4 bg-slate-700 dark:bg-slate-800 rounded text-center">
          <ArrowUpCircle className="mx-auto mb-1 h-8 w-8 text-cyan-400" />
          <p className="text-xs uppercase opacity-70">{t('missionControl.altitude', "Altitude")}</p>
          <p className="text-2xl font-bold">{altitude.toLocaleString(i18n.language)} <span className="text-sm opacity-80">km</span></p>
        </div>
        <div className="p-4 bg-slate-700 dark:bg-slate-800 rounded text-center">
          <Gauge className="mx-auto mb-1 h-8 w-8 text-lime-400" />
          <p className="text-xs uppercase opacity-70">{t('missionControl.speed', "Speed")}</p>
          <p className="text-2xl font-bold">{speed.toLocaleString(i18n.language)} <span className="text-sm opacity-80">km/h</span></p>
        </div>
        <div className="p-4 bg-slate-700 dark:bg-slate-800 rounded text-center">
          <Zap className="mx-auto mb-1 h-8 w-8 text-amber-400" />
          <p className="text-xs uppercase opacity-70">{t('missionControl.currentPhase', "Phase")}</p>
          <p className="text-lg font-semibold">{currentPhase}</p>
        </div>
      </div>

      <p className="text-xs text-center opacity-60 mt-4">
        {t('missionControl.simulationNote', "Telemetry data is simulated for demonstration purposes.")}
        {t('missionControl.status', "Official Status")}: <span className="font-semibold">{targetLaunch.status.name}</span>.
      </p>
    </div>
  );
};

export default MissionControlSimplified;
