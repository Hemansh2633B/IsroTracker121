// Types for Launch Library 2 API (subset)
export interface LL2LaunchStatus {
  id: number;
  name: string; // e.g., "Go for Launch", "Launch Successful", "To Be Confirmed"
  abbrev: string;
  description: string;
}

export interface LL2PadLocation {
  id: number;
  name: string; // e.g., "Cape Canaveral SFS, FL, USA"
  country_code: string;
  timezone_name: string;
}

export interface LL2Pad {
  id: number;
  name: string;
  latitude: string;
  longitude: string;
  location: LL2PadLocation;
}

export interface LL2LaunchServiceProvider {
  id: number;
  name: string;
  type: string;
}

export interface LL2Mission {
  id: number;
  name: string;
  description: string | null;
  type: string;
}

export interface LL2Launch {
  id: string;
  name: string;
  status: LL2LaunchStatus;
  net: string; // NET launch time ISO 8601
  window_start: string;
  window_end: string;
  probability: number | null; // Launch probability percentage
  weather_concerns: string | null;
  launch_service_provider: LL2LaunchServiceProvider;
  mission: LL2Mission;
  pad: LL2Pad;
  image: string | null;
}

export interface LL2UpcomingLaunchesResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: LL2Launch[];
}

// Types for Open-Meteo API (subset for hourly forecast)
export interface OpenMeteoHourlyUnits {
  time: string;
  precipitation_probability?: string;
  weather_code?: string;
  wind_speed_10m?: string;
  wind_gusts_10m?: string;
  visibility?: string;
}

export interface OpenMeteoHourlyData {
  time: string[];
  precipitation_probability?: (number | null)[];
  weather_code?: (number | null)[];
  wind_speed_10m?: (number | null)[];
  wind_gusts_10m?: (number | null)[];
  visibility?: (number | null)[];
}

export interface OpenMeteoResponse {
  latitude: number;
  longitude: number;
  generationtime_ms: number;
  utc_offset_seconds: number;
  timezone: string;
  timezone_abbreviation: string;
  hourly_units: OpenMeteoHourlyUnits;
  hourly: OpenMeteoHourlyData;
}

// Combined type for our Smart Alert display
export interface LaunchAlertInfo {
  launch: LL2Launch;
  weatherRisk?: {
    level: "Low" | "Medium" | "High" | "Info"; // Info for direct weather_concerns
    message: string;
    details?: OpenMeteoHourlyData; // Store relevant hourly slice
    relevantTime?: string; // The specific time slice we're looking at
  };
}
