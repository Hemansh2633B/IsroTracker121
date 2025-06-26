import React from 'react';
import { useTranslation } from 'react-i18next';
import { CheckCircle2, RadioTower, Rocket, Satellite, AlertTriangle, ClockIcon } from 'lucide-react';

interface TimelineEvent {
  id: string;
  timeLabel: string; // e.g., "T+0s", "T+2m 30s", "Orbit Achieved"
  eventName: string;
  details?: string;
  status: 'completed' | 'upcoming' | 'anomaly' | 'info'; // For styling and icons
  icon?: React.ElementType; // Lucide icon component
}

interface MissionTimelineData {
  missionName: string;
  launchDateISO: string; // For reference, not directly used in this static example yet
  events: TimelineEvent[];
}

// Sample Data - Manually curated for a hypothetical PSLV launch
const sampleTimelineData: MissionTimelineData = {
  missionName: "PSLV-C5X - DemoSat Launch",
  launchDateISO: new Date().toISOString(), // Placeholder
  events: [
    { id: "e1", timeLabel: "T-60m", eventName: "Launch Rehearsal Complete", status: "completed", icon: CheckCircle2 },
    { id: "e2", timeLabel: "T-10m", eventName: "Final Countdown Started", status: "completed", icon: ClockIcon },
    { id: "e3", timeLabel: "T-0s", eventName: "Liftoff!", details: "PSLV lifts off from Satish Dhawan Space Centre.", status: "completed", icon: Rocket },
    { id: "e4", timeLabel: "T+2m10s", eventName: "PS1 Separation", details: "First stage (PS1) separates.", status: "completed", icon: CheckCircle2 },
    { id: "e5", timeLabel: "T+4m22s", eventName: "PS2 Separation", details: "Second stage (PS2) separates.", status: "completed", icon: CheckCircle2 },
    { id: "e6", timeLabel: "T+8m15s", eventName: "Heat Shield Separation", details: "Payload fairing (heat shield) is jettisoned.", status: "completed", icon: CheckCircle2 },
    { id: "e7", timeLabel: "T+10m30s", eventName: "PS3 Separation", details: "Third stage (PS3) separates.", status: "upcoming", icon: ClockIcon },
    { id: "e8", timeLabel: "T+17m45s", eventName: "DemoSat Satellite Separation", details: "Primary payload DemoSat deployed into target orbit.", status: "upcoming", icon: Satellite },
    { id: "e9", timeLabel: "T+60m", eventName: "Orbit Stabilization Maneuvers", details: "Satellite performs initial health checks and stabilization.", status: "upcoming", icon: RadioTower },
    // Example of an anomaly
    // { id: "eX", timeLabel: "T+5m", eventName: "Telemetry Anomaly", details: "Brief loss of telemetry signal, recovered.", status: "anomaly", icon: AlertTriangle },
  ],
};


const MissionTimelineDisplay: React.FC = () => {
  const { t } = useTranslation();
  const timelineData = sampleTimelineData; // Using sample data for now

  const getStatusColor = (status: TimelineEvent['status']) => {
    switch (status) {
      case 'completed': return 'border-green-500 dark:border-green-400';
      case 'upcoming': return 'border-blue-500 dark:border-blue-400';
      case 'anomaly': return 'border-red-500 dark:border-red-400';
      case 'info': return 'border-gray-400 dark:border-gray-500';
      default: return 'border-gray-300 dark:border-gray-600';
    }
  };

  const getIconColor = (status: TimelineEvent['status']) => {
    switch (status) {
      case 'completed': return 'text-green-600 dark:text-green-500';
      case 'upcoming': return 'text-blue-600 dark:text-blue-500';
      case 'anomaly': return 'text-red-600 dark:text-red-500';
      case 'info': return 'text-gray-600 dark:text-gray-400';
      default: return 'text-gray-500';
    }
  };


  return (
    <div className="p-4 rounded-lg shadow-lg bg-background dark:bg-card">
      <h3 className="text-xl font-semibold mb-6 text-center text-primary dark:text-primary-foreground">
        {t('missionTimeline.title', "Mission Timeline")}: {timelineData.missionName}
      </h3>
      <div className="relative pl-6">
        {/* Vertical line */}
        <div className="absolute left-[calc(1.25rem_+_2px)] top-0 bottom-0 w-0.5 bg-border dark:bg-gray-700 transform -translate-x-1/2"></div>

        {timelineData.events.map((event, index) => {
          const IconComponent = event.icon || ClockIcon;
          return (
            <div key={event.id} className="mb-8 relative">
              <div className={`absolute left-0 top-1.5 w-5 h-5 rounded-full bg-background dark:bg-card border-2 ${getStatusColor(event.status)} transform -translate-x-[calc(50%_-_2px)] flex items-center justify-center`}>
                 <IconComponent size={12} className={getIconColor(event.status)} />
              </div>
              <div className="ml-8 pl-4 py-2 border-l-2 border-transparent"> {/* Invisible border for spacing */}
                <p className={`text-sm font-semibold ${getIconColor(event.status)}`}>{event.timeLabel}</p>
                <h4 className="text-md font-medium text-foreground dark:text-gray-200">{t(`missionEvents.${event.id}.eventName`, event.eventName)}</h4>
                {event.details && <p className="text-xs text-muted-foreground dark:text-gray-400">{t(`missionEvents.${event.id}.details`, event.details)}</p>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MissionTimelineDisplay;
