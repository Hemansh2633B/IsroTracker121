import { TwitterApi } from 'twitter-api-v2';
import { LL2Launch, LL2UpcomingLaunchesResponse } from '../shared/smartAlertTypes'; // Assuming types can be shared or redefined

// In-memory store for posted launch IDs to avoid duplicates during a server session
const postedLaunchIdsThisSession = new Set<string>();

// Initialize Twitter client
// Ensure your environment variables are set:
// TWITTER_APP_KEY, TWITTER_APP_SECRET, TWITTER_ACCESS_TOKEN, TWITTER_ACCESS_SECRET
const twitterClient = process.env.TWITTER_APP_KEY ? new TwitterApi({
  appKey: process.env.TWITTER_APP_KEY!,
  appSecret: process.env.TWITTER_APP_SECRET!,
  accessToken: process.env.TWITTER_ACCESS_TOKEN!,
  accessSecret: process.env.TWITTER_ACCESS_SECRET!,
}) : null;

const readWriteClient = twitterClient ? twitterClient.readWrite : null;

interface PostResult {
  success: boolean;
  message: string;
  tweetUrl?: string;
  launchName?: string;
}

export const postUpcomingLaunchUpdate = async (): Promise<PostResult> => {
  if (!readWriteClient) {
    return { success: false, message: "Twitter client not initialized. Check API keys." };
  }

  try {
    // Fetch upcoming launches (status: Go or TBC, limit to next few)
    const response = await fetch("https://ll.thespacedevs.com/2.2.0/launch/upcoming/?limit=5&status=1,8&hide_recent_previous=true&ordering=net");
    if (!response.ok) {
      throw new Error(`Failed to fetch launches: ${response.statusText}`);
    }
    const launchData: LL2UpcomingLaunchesResponse = await response.json();

    if (!launchData.results || launchData.results.length === 0) {
      return { success: false, message: "No suitable upcoming launches found to post about." };
    }

    let launchToPost: LL2Launch | null = null;

    // Find the soonest launch not yet posted this session
    for (const launch of launchData.results) {
      if (!postedLaunchIdsThisSession.has(launch.id)) {
        // Check if launch is within a reasonable window (e.g., next 48 hours)
        const launchNet = new Date(launch.net);
        const now = new Date();
        const hoursUntilLaunch = (launchNet.getTime() - now.getTime()) / (1000 * 60 * 60);

        if (hoursUntilLaunch > 0 && hoursUntilLaunch <= 48) { // Post if within next 48 hours
          launchToPost = launch;
          break;
        }
      }
    }

    if (!launchToPost) {
      return { success: false, message: "No new upcoming launches within the posting window found." };
    }

    // Compose tweet
    const launchName = launchToPost.name;
    const launchTime = new Date(launchToPost.net).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short', timeZone: launchToPost.pad.location.timezone_name });
    const lsp = launchToPost.launch_service_provider.name;
    // Add a relevant hashtag, maybe based on LSP or mission type
    let hashtag = "#SpaceLaunch";
    if (lsp.toLowerCase().includes("spacex")) hashtag = "#SpaceX";
    else if (lsp.toLowerCase().includes("isro")) hashtag = "#ISRO";
    // ... more specific hashtags could be added

    const tweetText = `🚀 Upcoming Launch Alert!
Name: ${launchName}
LSP: ${lsp}
Scheduled: ${launchTime} (${launchToPost.pad.location.timezone_name})
Pad: ${launchToPost.pad.name}, ${launchToPost.pad.location.name}
${hashtag} #RocketLaunch`;

    // Post tweet
    const { data: createdTweet } = await readWriteClient.v2.tweet(tweetText.substring(0, 280)); // Ensure tweet is not too long

    postedLaunchIdsThisSession.add(launchToPost.id); // Mark as posted for this session

    return {
      success: true,
      message: `Tweet posted successfully for ${launchName}!`,
      tweetUrl: `https://twitter.com/user/status/${createdTweet.id}`, // Replace 'user' with actual username if known, or just use ID
      launchName: launchName
    };

  } catch (error: any) {
    console.error("Error posting to Twitter:", error);
    let errorMessage = "Failed to post to Twitter.";
    if (error.data && error.data.detail) {
      errorMessage += ` Details: ${error.data.detail}`;
    } else if (error.message) {
      errorMessage += ` Details: ${error.message}`;
    }
    return { success: false, message: errorMessage };
  }
};

// This service is designed for a server environment.
// A cron job or scheduler would call postUpcomingLaunchUpdate periodically.
// For now, we'll expose it via an API endpoint.
// Note: The in-memory 'postedLaunchIdsThisSession' will reset if the server restarts.
// A persistent store (DB) is needed for robust duplicate prevention.
console.log("SocialService loaded. Twitter client initialized if keys are present.");
// A simple log to confirm module load and client status (won't show API keys).
if(!readWriteClient) {
  console.warn("Twitter ReadWrite client in SocialService is NOT initialised. API keys might be missing.");
}

// Re-export types if they are specific to this service or extend shared ones.
// For now, using shared types from smartAlertTypes.ts
export type { LL2Launch, LL2UpcomingLaunchesResponse };
