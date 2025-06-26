import { OpenMeteoResponse, OpenMeteoHourlyData } from "./smartAlertTypes";

const RELEVANT_HOURLY_PARAMS = [
  "precipitation_probability",
  "weather_code",
  "wind_speed_10m",
  "wind_gusts_10m",
  "visibility",
  "temperature_2m", // Added for context, though not primary for go/no-go usually
].join(",");

/**
 * Fetches hourly weather forecast from Open-Meteo for a given location and date range.
 * @param latitude
 * @param longitude
 * @param startDate ISO string for start date (e.g., "YYYY-MM-DD")
 * @param endDate ISO string for end date (e.g., "YYYY-MM-DD")
 * @param timezone Launch site timezone from LL2
 * @returns Promise<OpenMeteoResponse | null>
 */
export const fetchWeatherForecast = async (
  latitude: string,
  longitude: string,
  startDate: string,
  endDate: string,
  timezone: string
): Promise<OpenMeteoResponse | null> => {
  const apiUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&hourly=${RELEVANT_HOURLY_PARAMS}&start_date=${startDate}&end_date=${endDate}&timezone=${timezone}`;

  try {
    const response = await fetch(apiUrl);
    if (!response.ok) {
      console.error(`Failed to fetch weather: ${response.statusText} from ${apiUrl}`);
      return null;
    }
    return await response.json() as OpenMeteoResponse;
  } catch (error) {
    console.error("Error fetching weather data:", error);
    return null;
  }
};

// Helper to get WMO weather code description (simplified)
export const getWeatherDescription = (code: number | null | undefined): string => {
  if (code === null || typeof code === "undefined") return "Not available";
  // Based on Open-Meteo docs WMO Weather interpretation codes
  if (code === 0) return "Clear sky";
  if (code === 1) return "Mainly clear";
  if (code === 2) return "Partly cloudy";
  if (code === 3) return "Overcast";
  if (code === 45 || code === 48) return "Fog";
  if (code >= 51 && code <= 55) return "Drizzle";
  if (code === 56 || code === 57) return "Freezing Drizzle";
  if (code >= 61 && code <= 65) return "Rain";
  if (code === 66 || code === 67) return "Freezing Rain";
  if (code >= 71 && code <= 75) return "Snow fall";
  if (code === 77) return "Snow grains";
  if (code >= 80 && code <= 82) return "Rain showers";
  if (code === 85 || code === 86) return "Snow showers";
  if (code === 95) return "Thunderstorm";
  if (code === 96 || code === 99) return "Thunderstorm with hail";
  return `Unknown code (${code})`;
};


/**
 * Analyzes hourly weather data around a specific launch time (NET).
 * Returns a weather risk assessment.
 */
export const analyzeWeatherForLaunch = (
  weatherData: OpenMeteoResponse,
  launchNetISO: string // ISO string of the launch NET
): { level: "Low" | "Medium" | "High"; message: string; details?: any } | null => {
  if (!weatherData.hourly || !weatherData.hourly.time) {
    return null;
  }

  const launchTime = new Date(launchNetISO);
  const launchTimeHours = launchTime.getHours();
  const launchDateStr = launchNetISO.substring(0, 10); // YYYY-MM-DD for matching

  // Find the hourly data index corresponding to the launch NET
  // This needs to be robust, comparing both date and hour.
  let bestIndex = -1;
  for (let i = 0; i < weatherData.hourly.time.length; i++) {
    const forecastTime = new Date(weatherData.hourly.time[i]);
    if (forecastTime.toISOString().substring(0,10) === launchDateStr && forecastTime.getHours() === launchTimeHours) {
      bestIndex = i;
      break;
    }
    // If exact hour not found, take the closest one before or at launch time on the same day
    if (forecastTime.toISOString().substring(0,10) === launchDateStr && forecastTime <= launchTime) {
        bestIndex = i; // Keep updating to get the latest one before or at launch time
    }
  }

  // If no exact match and last attempt was to find closest before, and we found one:
  if (bestIndex === -1 && weatherData.hourly.time.length > 0) {
    // Fallback: if no specific hour found, maybe log or handle, for now, don't assess
     console.warn(`No exact weather forecast time slot found for ${launchNetISO}. Closest available: ${weatherData.hourly.time[weatherData.hourly.time.length -1]}`);
     return null; // Or use the closest available if that's desired
  }
  if (bestIndex === -1) return null;


  const precipProb = weatherData.hourly.precipitation_probability?.[bestIndex];
  const weatherCode = weatherData.hourly.weather_code?.[bestIndex];
  const windSpeed = weatherData.hourly.wind_speed_10m?.[bestIndex];
  const windGusts = weatherData.hourly.wind_gusts_10m?.[bestIndex];

  let riskLevel: "Low" | "Medium" | "High" = "Low";
  let messages: string[] = [];

  const weatherDesc = getWeatherDescription(weatherCode);
  messages.push(`Forecast at launch time (${weatherData.hourly.time[bestIndex]}): ${weatherDesc}.`);

  if (typeof precipProb === 'number') {
    messages.push(`Precipitation Probability: ${precipProb}%.`);
    if (precipProb > 70) {
      riskLevel = "High";
      messages.push("High chance of precipitation.");
    } else if (precipProb > 40) {
      if (riskLevel !== "High") riskLevel = "Medium";
      messages.push("Moderate chance of precipitation.");
    }
  }

  if (typeof windSpeed === 'number') {
    messages.push(`Wind: ${windSpeed.toFixed(1)} km/h.`);
    // Example thresholds (these vary greatly by rocket!)
    if (windSpeed > 40) {
      riskLevel = "High";
      messages.push("High wind speeds.");
    } else if (windSpeed > 25) {
      if (riskLevel !== "High") riskLevel = "Medium";
      messages.push("Moderate wind speeds.");
    }
  }
  if (typeof windGusts === 'number') {
    messages.push(`Gusts up to: ${windGusts.toFixed(1)} km/h.`);
     if (windGusts > 50) {
      riskLevel = "High";
      messages.push("High wind gusts.");
    } else if (windGusts > 35 && riskLevel !== "High") {
      riskLevel = "Medium";
    }
  }

  if (weatherCode !== null && typeof weatherCode !== "undefined") {
    if ((weatherCode >= 80 && weatherCode <= 99) || (weatherCode >= 61 && weatherCode <= 67) || (weatherCode >= 71 && weatherCode <= 77)) { // Thunderstorms, heavy rain/snow, freezing rain
      riskLevel = "High";
      messages.push(`Adverse weather condition: ${weatherDesc}.`);
    } else if (weatherCode === 45 || weatherCode === 48) { // Fog
        if (riskLevel !== "High") riskLevel = "Medium";
        messages.push(`Potential for Fog.`);
    }
  }

  if (riskLevel === "Low" && messages.length <=1) messages.push("Weather conditions appear favorable.");


  return {
    level: riskLevel,
    message: messages.join(" "),
    details: { // Store the specific slice for potential display
        time: weatherData.hourly.time[bestIndex],
        precipitation_probability: precipProb,
        weather_code: weatherCode,
        wind_speed_10m: windSpeed,
        wind_gusts_10m: windGusts,
        description: weatherDesc,
    }
  };
};
