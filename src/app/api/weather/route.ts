import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/apiHandler";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Real weather requires WEATHER_API_KEY (OpenWeatherMap-compatible) — see
// README "Environment variables". We never fabricate weather data: if the
// key isn't configured, the dashboard widget shows a "connect weather"
// prompt instead of fake numbers (per the "don't fake integrations" rule).
export const GET = withAuth(async (req: NextRequest) => {
  const apiKey = process.env.WEATHER_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ configured: false });
  }

  const { searchParams } = new URL(req.url);
  const lat = searchParams.get("lat");
  const lon = searchParams.get("lon");
  const city = searchParams.get("city");

  try {
    const url = lat && lon
      ? `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${apiKey}`
      : `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city ?? "")}&units=metric&appid=${apiKey}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error("Weather provider error");
    const data = await res.json();
    return NextResponse.json({
      configured: true,
      tempC: Math.round(data.main.temp),
      condition: data.weather?.[0]?.main,
      description: data.weather?.[0]?.description,
      icon: data.weather?.[0]?.icon,
      city: data.name,
    });
  } catch {
    return NextResponse.json({ configured: true, error: true });
  }
});
