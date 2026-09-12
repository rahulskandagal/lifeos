"use client";

import useSWR from "swr";
import { fetcher } from "@/lib/apiClient";
import { Cloud, CloudRain, Sun, CloudSnow, CloudLightning, Wind } from "lucide-react";

const ICONS: Record<string, any> = {
  Clear: Sun,
  Clouds: Cloud,
  Rain: CloudRain,
  Drizzle: CloudRain,
  Thunderstorm: CloudLightning,
  Snow: CloudSnow,
};

export function WeatherWidget() {
  const { data } = useSWR<any>("/api/weather", fetcher);

  if (!data) return null;

  if (!data.configured) {
    return (
      <div className="flex items-center gap-2 text-xs text-muted">
        <Wind className="h-4 w-4" />
        <span>Weather not connected</span>
      </div>
    );
  }
  if (data.error) return null;

  const Icon = ICONS[data.condition] ?? Cloud;
  return (
    <div className="flex items-center gap-2 text-sm">
      <Icon className="h-5 w-5 text-accent" />
      <span className="font-medium">{data.tempC}°C</span>
      <span className="text-muted capitalize hidden sm:inline">{data.description}</span>
    </div>
  );
}
