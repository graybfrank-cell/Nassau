/**
 * Open-Meteo weather integration (no API key required).
 * Fetches daily forecast and maps WMO weather codes to display data.
 */

export interface WeatherForecast {
  date: string;
  tempHigh: number;
  tempLow: number;
  weatherCode: number;
  weatherLabel: string;
  weatherIcon: string;
  windSpeedMax: number;
  precipitationProbability: number;
}

/** Map WMO weather codes to human-readable labels + icons */
function mapWeatherCode(code: number): { label: string; icon: string } {
  if (code === 0) return { label: "Clear sky", icon: "sun" };
  if (code <= 3) return { label: "Partly cloudy", icon: "cloud-sun" };
  if (code === 45 || code === 48) return { label: "Foggy", icon: "cloud-fog" };
  if (code >= 51 && code <= 57) return { label: "Drizzle", icon: "cloud-drizzle" };
  if (code >= 61 && code <= 67) return { label: "Rain", icon: "cloud-rain" };
  if (code >= 71 && code <= 77) return { label: "Snow", icon: "snowflake" };
  if (code >= 80 && code <= 82) return { label: "Rain showers", icon: "cloud-rain" };
  if (code >= 85 && code <= 86) return { label: "Snow showers", icon: "snowflake" };
  if (code >= 95) return { label: "Thunderstorm", icon: "cloud-lightning" };
  return { label: "Unknown", icon: "cloud" };
}

/**
 * Fetch weather forecast from Open-Meteo for a given date and location.
 */
export async function fetchWeather(
  lat: number,
  lng: number,
  date: string // YYYY-MM-DD
): Promise<WeatherForecast | null> {
  try {
    const url = new URL("https://api.open-meteo.com/v1/forecast");
    url.searchParams.set("latitude", String(lat));
    url.searchParams.set("longitude", String(lng));
    url.searchParams.set(
      "daily",
      "temperature_2m_max,temperature_2m_min,precipitation_probability_max,wind_speed_10m_max,weathercode"
    );
    url.searchParams.set("temperature_unit", "fahrenheit");
    url.searchParams.set("wind_speed_unit", "mph");
    url.searchParams.set("timezone", "auto");
    url.searchParams.set("start_date", date);
    url.searchParams.set("end_date", date);

    const res = await fetch(url.toString(), { next: { revalidate: 3600 } });
    if (!res.ok) return null;

    const data = await res.json();
    const daily = data.daily;
    if (!daily || !daily.time || daily.time.length === 0) return null;

    const code = daily.weathercode[0];
    const { label, icon } = mapWeatherCode(code);

    return {
      date: daily.time[0],
      tempHigh: Math.round(daily.temperature_2m_max[0]),
      tempLow: Math.round(daily.temperature_2m_min[0]),
      weatherCode: code,
      weatherLabel: label,
      weatherIcon: icon,
      windSpeedMax: Math.round(daily.wind_speed_10m_max[0]),
      precipitationProbability: daily.precipitation_probability_max[0],
    };
  } catch (err) {
    console.error("[weather] Fetch failed:", err);
    return null;
  }
}

/**
 * Check if cached weather data is stale (older than 6 hours).
 */
export function isWeatherStale(weatherData: { fetchedAt?: string } | null): boolean {
  if (!weatherData?.fetchedAt) return true;
  const sixHoursAgo = Date.now() - 6 * 60 * 60 * 1000;
  return new Date(weatherData.fetchedAt).getTime() < sixHoursAgo;
}
