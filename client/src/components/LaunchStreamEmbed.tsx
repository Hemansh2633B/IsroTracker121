import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { LL2Launch, LL2UpcomingLaunchesResponse } from '@/lib/smartAlertTypes'; // Re-use types

interface VidURL {
  priority: number;
  title: string;
  description: string;
  feature_image: string | null;
  url: string; // This is the one we're interested in
}

interface LaunchWithVidURLs extends LL2Launch {
  vidURLs?: VidURL[]; // Launch Library 2 often uses vidURLs
  webcast_live?: boolean;
}

interface UpcomingLaunchesWithVidURLsResponse extends LL2UpcomingLaunchesResponse {
  results: LaunchWithVidURLs[];
}

const getYouTubeVideoId = (url: string): string | null => {
  if (!url) return null;
  let videoId: string | null = null;
  try {
    const urlObj = new URL(url);
    if (urlObj.hostname === 'www.youtube.com' || urlObj.hostname === 'youtube.com') {
      videoId = urlObj.searchParams.get('v');
    } else if (urlObj.hostname === 'youtu.be') {
      videoId = urlObj.pathname.substring(1);
    }
  } catch (e) {
    console.error("Error parsing YouTube URL:", e);
    return null;
  }
  return videoId;
};

const LaunchStreamEmbed: React.FC = () => {
  const { t } = useTranslation();
  const [liveLaunch, setLiveLaunch] = useState<LaunchWithVidURLs | null>(null);
  const [youTubeVideoId, setYouTubeVideoId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLiveLaunch = async () => {
      setLoading(true);
      setError(null);
      setLiveLaunch(null);
      setYouTubeVideoId(null);

      try {
        // Fetch a few upcoming launches to find one that might be live or streaming soon
        // Sort by NET, status Go or TBC
        const response = await fetch("https://ll.thespacedevs.com/2.2.0/launch/upcoming/?limit=5&ordering=net&status=1,8&hide_recent_previous=true");
        if (!response.ok) {
          throw new Error(`Failed to fetch upcoming launches: ${response.statusText}`);
        }
        const data: UpcomingLaunchesWithVidURLsResponse = await response.json();

        let foundLaunch: LaunchWithVidURLs | null = null;
        let videoId: string | null = null;

        for (const launch of data.results) {
          // Prioritize launches marked as webcast_live by the API
          if (launch.webcast_live && launch.vidURLs && launch.vidURLs.length > 0) {
            for (const vid of launch.vidURLs) {
              videoId = getYouTubeVideoId(vid.url);
              if (videoId) {
                foundLaunch = launch;
                break;
              }
            }
          }
          if (foundLaunch) break;

          // If not webcast_live, check if launch is very soon (e.g., within next hour or already started)
          const launchTime = new Date(launch.net);
          const now = new Date();
          const timeDiffMinutes = (launchTime.getTime() - now.getTime()) / (1000 * 60);

          if (timeDiffMinutes < 60 && timeDiffMinutes > -120) { // Within 1 hr before or 2 hrs after NET
             if (launch.vidURLs && launch.vidURLs.length > 0) {
                for (const vid of launch.vidURLs) {
                    videoId = getYouTubeVideoId(vid.url);
                    if (videoId) {
                        foundLaunch = launch;
                        break;
                    }
                }
            }
          }
          if (foundLaunch) break;
        }

        if (foundLaunch && videoId) {
          setLiveLaunch(foundLaunch);
          setYouTubeVideoId(videoId);
        }

      } catch (e: any) {
        setError(e.message || "An unknown error occurred fetching launch streams.");
        console.error(e);
      } finally {
        setLoading(false);
      }
    };

    fetchLiveLaunch();
    // Optionally, poll for new live streams periodically
    const intervalId = setInterval(fetchLiveLaunch, 5 * 60 * 1000); // Check every 5 minutes
    return () => clearInterval(intervalId);

  }, []);

  if (loading) {
    return <div className="p-4 text-center">{t('launchStream.loading', "Checking for live launch streams...")}</div>;
  }

  if (error) {
    return <div className="p-4 text-red-600 text-center">{t('launchStream.error', "Error checking for streams.")} ({error})</div>;
  }

  if (liveLaunch && youTubeVideoId) {
    return (
      <div className="rounded-lg shadow-lg bg-background dark:bg-card overflow-hidden">
        <h3 className="text-xl font-semibold p-4 text-primary dark:text-primary-foreground border-b dark:border-border">
          {t('launchStream.liveTitle', "Live Launch Stream")}: {liveLaunch.name}
        </h3>
        <div className="aspect-video"> {/* Responsive iframe container */}
          <iframe
            width="100%"
            height="100%"
            src={`https://www.youtube.com/embed/${youTubeVideoId}?autoplay=1&mute=1`} // Autoplay muted often works
            title="YouTube video player"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          ></iframe>
        </div>
        <p className="p-2 text-xs text-muted-foreground dark:text-gray-400 text-center">
            {t('launchStream.status', "Status")}: {liveLaunch.status.name}
            {liveLaunch.webcast_live && <span className="text-red-500 font-bold ml-2"> LIVE NOW</span>}
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 text-center rounded-lg shadow-lg bg-gray-100 dark:bg-gray-800">
      <h3 className="text-xl font-semibold mb-2 text-foreground dark:text-gray-200">
        {t('launchStream.noStreamTitle', "Launch Streams")}
      </h3>
      <p className="text-muted-foreground dark:text-gray-400">{t('launchStream.noStreamAvailable', "No live launch streams currently detected or starting very soon.")}</p>
      <p className="text-xs text-muted-foreground dark:text-gray-500 mt-2">{t('launchStream.checkLater', "Check official ISRO channels for scheduled webcasts.")}</p>
    </div>
  );
};

export default LaunchStreamEmbed;
