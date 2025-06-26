import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { LL2Launch, LL2UpcomingLaunchesResponse } from '@/lib/smartAlertTypes'; // Re-use types

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

const calculateTimeLeft = (targetTime: string | Date): TimeLeft | null => {
  const difference = +new Date(targetTime) - +new Date();
  if (difference <= 0) {
    return null; // Time is up or has passed
  }

  return {
    days: Math.floor(difference / (1000 * 60 * 60 * 24)),
    hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((difference / 1000 / 60) % 60),
    seconds: Math.floor((difference / 1000) % 60),
  };
};

const LiveLaunchCountdown: React.FC = () => {
  const { t } = useTranslation();
  const [nextLaunch, setNextLaunch] = useState<LL2Launch | null>(null);
  const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchNextLaunch = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch("https://ll.thespacedevs.com/2.2.0/launch/upcoming/?limit=1&ordering=net&status=1,8&hide_recent_previous=true");
        if (!response.ok) {
          throw new Error(`Failed to fetch next launch: ${response.statusText}`);
        }
        const data: LL2UpcomingLaunchesResponse = await response.json();
        if (data.results && data.results.length > 0) {
          setNextLaunch(data.results[0]);
        } else {
          setNextLaunch(null); // No upcoming launches
        }
      } catch (e: any) {
        setError(e.message || "An unknown error occurred fetching launch data.");
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchNextLaunch();
  }, []);

  useEffect(() => {
    if (!nextLaunch || !nextLaunch.net) {
      setTimeLeft(null);
      return;
    }

    const initialTimeLeft = calculateTimeLeft(nextLaunch.net);
    setTimeLeft(initialTimeLeft);

    if (initialTimeLeft) { // Only set interval if time has not passed
      const timer = setInterval(() => {
        setTimeLeft(calculateTimeLeft(nextLaunch.net));
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [nextLaunch]);

  if (loading) {
    return <div className="p-4 text-center">{t('liveLaunchCountdown.loading', "Loading next launch...")}</div>;
  }

  if (error) {
    return <div className="p-4 text-red-600 text-center">{t('liveLaunchCountdown.error', "Error loading launch data.")} ({error})</div>;
  }

  if (!nextLaunch) {
    return <div className="p-4 text-center">{t('liveLaunchCountdown.noLaunch', "No upcoming launches scheduled or TBC.")}</div>;
  }

  const launchNetDate = new Date(nextLaunch.net);

  return (
    <div className="p-6 rounded-lg shadow-lg bg-gradient-to-br from-primary/80 via-primary to-purple-700 text-primary-foreground dark:from-primary/70 dark:via-primary/90 dark:to-purple-800">
      <h3 className="text-2xl font-bold text-center mb-2">{t('liveLaunchCountdown.title', "Next Launch Countdown")}</h3>
      <div className="text-center mb-4">
        <p className="text-xl font-semibold">{nextLaunch.name}</p>
        <p className="text-sm opacity-90">{t('liveLaunchCountdown.lsp', "LSP")}: {nextLaunch.launch_service_provider.name}</p>
        <p className="text-sm opacity-90">
          {t('liveLaunchCountdown.targetTime', "Target")}: {launchNetDate.toLocaleString(i18n.language, { dateStyle: 'medium', timeStyle: 'long', timeZone: nextLaunch.pad.location.timezone_name })}
          ({nextLaunch.pad.location.timezone_name})
        </p>
      </div>

      {timeLeft ? (
        <div className="grid grid-cols-4 gap-2 text-center mb-4">
          <div>
            <span className="text-4xl font-mono font-bold">{String(timeLeft.days).padStart(2, '0')}</span>
            <span className="block text-xs opacity-80">{t('liveLaunchCountdown.days', "Days")}</span>
          </div>
          <div>
            <span className="text-4xl font-mono font-bold">{String(timeLeft.hours).padStart(2, '0')}</span>
            <span className="block text-xs opacity-80">{t('liveLaunchCountdown.hours', "Hours")}</span>
          </div>
          <div>
            <span className="text-4xl font-mono font-bold">{String(timeLeft.minutes).padStart(2, '0')}</span>
            <span className="block text-xs opacity-80">{t('liveLaunchCountdown.minutes', "Minutes")}</span>
          </div>
          <div>
            <span className="text-4xl font-mono font-bold">{String(timeLeft.seconds).padStart(2, '0')}</span>
            <span className="block text-xs opacity-80">{t('liveLaunchCountdown.seconds', "Seconds")}</span>
          </div>
        </div>
      ) : (
        <div className="text-center text-2xl font-bold py-6">
          {+new Date(nextLaunch.net) < +new Date() ?
            t('liveLaunchCountdown.launched', "Launched! Awaiting status update.") :
            t('liveLaunchCountdown.calculating', "Calculating countdown...")
          }
        </div>
      )}
      <p className="text-xs text-center opacity-70">
        {t('liveLaunchCountdown.status', "Status")}: <span className="font-semibold">{nextLaunch.status.name}</span>
        {nextLaunch.probability && ` (${nextLaunch.probability}% ${t('liveLaunchCountdown.probability', "probability")})`}
      </p>
    </div>
  );
};

export default LiveLaunchCountdown;
