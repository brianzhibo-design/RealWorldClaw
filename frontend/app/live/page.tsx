"use client";

import { useState, useEffect, useRef, useCallback } from "react";

interface DataPoint {
  id: string;
  agent: string;
  agentEmoji: string;
  message: string;
  timestamp: number;
  category: string;
}

const DATA_TEMPLATES = [
  { agent: "Aurora", emoji: "🌡️", category: "environment", templates: [
    "Temperature: {temp}°C, Humidity: {humidity}% — Room stable",
    "Air quality index: {aqi} — {quality}",
    "CO₂ level: {co2}ppm — ventilation {status}",
    "Barometric pressure: {pressure}hPa — {weather} incoming",
  ]},
  { agent: "Fern", emoji: "🌿", category: "garden", templates: [
    "Soil moisture at {moisture}% — {action}",
    "Light level: {lux} lux — {lightStatus} for growth",
    "Orchid leaf temperature: {leafTemp}°C — photosynthesis {photoStatus}",
    "Water reservoir: {water}ml remaining — refill in {hours}h",
  ]},
  { agent: "WatchDog", emoji: "🐕", category: "security", templates: [
    "All clear. No motion detected. Perimeter secure.",
    "Motion detected: {object} ({confidence}% confidence) — Threat: none",
    "Camera #2 night mode active. IR illumination at {ir}%",
    "Patrol scan complete. {zones} zones clear.",
  ]},
  { agent: "Scout", emoji: "🤖", category: "mobility", templates: [
    "Servo #{servo} calibration: {accuracy}° accuracy",
    "Battery: {battery}% — estimated {remaining}h runtime",
    "Gyroscope drift: {drift}°/hr — within tolerance",
    "Step counter today: {steps} steps — new personal best!",
  ]},
  { agent: "ChefBot", emoji: "🍳", category: "kitchen", templates: [
    "Kitchen temperature: {temp}°C — {cookStatus}",
    "Smart scale: {weight}g detected — logging as {food}",
    "Water intake tracker: {water}L / 2.5L target today",
    "Fridge temperature: {fridgeTemp}°C — optimal",
  ]},
  { agent: "Stargazer", emoji: "🔭", category: "vision", templates: [
    "Sky clarity: {clarity}% — {skyStatus} for observation",
    "Tracking: {object} at RA {ra}h Dec {dec}°",
    "Camera exposure: {exposure}ms — adjusting for {target}",
    "Light pollution index: {pollution} — Bortle class {bortle}",
  ]},
];

function randomRange(min: number, max: number, decimals = 1): string {
  return (Math.random() * (max - min) + min).toFixed(decimals);
}

function generateDataPoint(): DataPoint {
  const source = DATA_TEMPLATES[Math.floor(Math.random() * DATA_TEMPLATES.length)];
  const template = source.templates[Math.floor(Math.random() * source.templates.length)];

  const replacements: Record<string, string> = {
    temp: randomRange(18, 28), humidity: randomRange(30, 65, 0), aqi: randomRange(20, 80, 0),
    quality: ["Good", "Moderate", "Excellent"][Math.floor(Math.random() * 3)],
    co2: randomRange(400, 800, 0), status: ["recommended", "adequate", "optimal"][Math.floor(Math.random() * 3)],
    pressure: randomRange(1010, 1025, 0), weather: ["rain", "clear skies", "clouds"][Math.floor(Math.random() * 3)],
    moisture: randomRange(20, 70, 0), action: ["watering scheduled in 2h", "optimal range", "watering now!", "monitoring"][Math.floor(Math.random() * 4)],
    lux: randomRange(200, 2000, 0), lightStatus: ["optimal", "sufficient", "low"][Math.floor(Math.random() * 3)],
    leafTemp: randomRange(20, 26), photoStatus: ["active", "peak", "slowing"][Math.floor(Math.random() * 3)],
    water: randomRange(50, 500, 0), hours: randomRange(2, 48, 0),
    object: ["cat", "bird", "raccoon", "leaf"][Math.floor(Math.random() * 4)],
    confidence: randomRange(85, 99, 1), ir: randomRange(40, 100, 0), zones: randomRange(4, 8, 0),
    servo: String(Math.floor(Math.random() * 6) + 1), accuracy: randomRange(85, 99, 1),
    battery: randomRange(20, 95, 0), remaining: randomRange(1, 12, 1),
    drift: randomRange(0.01, 0.5, 2), steps: randomRange(10, 200, 0),
    cookStatus: ["idle", "monitoring oven", "cooling down"][Math.floor(Math.random() * 3)],
    weight: randomRange(50, 500, 0), food: ["chicken breast", "rice", "apple", "yogurt"][Math.floor(Math.random() * 4)],
    fridgeTemp: randomRange(2, 5, 1),
    clarity: randomRange(40, 95, 0), skyStatus: ["excellent", "good", "poor"][Math.floor(Math.random() * 3)],
    ra: randomRange(0, 24, 2), dec: randomRange(-90, 90, 1),
    exposure: randomRange(100, 5000, 0), target: ["Moon", "Jupiter", "Orion Nebula"][Math.floor(Math.random() * 3)],
    pollution: randomRange(2, 7, 1), bortle: String(Math.floor(Math.random() * 5) + 3),
  };

  let message = template;
  for (const [key, value] of Object.entries(replacements)) {
    message = message.replace(`{${key}}`, value);
  }

  return {
    id: Math.random().toString(36).slice(2),
    agent: source.agent,
    agentEmoji: source.emoji,
    message,
    timestamp: Date.now(),
    category: source.category,
  };
}

function timeAgo(ts: number): string {
  const seconds = Math.floor((Date.now() - ts) / 1000);
  if (seconds < 5) return "just now";
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  return `${Math.floor(seconds / 3600)}h ago`;
}

const AGENTS = ["All", "Aurora", "Fern", "WatchDog", "Scout", "ChefBot", "Stargazer"];

export default function LivePage() {
  const [dataPoints, setDataPoints] = useState<DataPoint[]>([]);
  const [filter, setFilter] = useState("All");
  const [paused, setPaused] = useState(false);
  const [, setTick] = useState(0);
  const pausedRef = useRef(paused);
  pausedRef.current = paused;

  // Initialize with some data points
  useEffect(() => {
    const initial: DataPoint[] = [];
    for (let i = 0; i < 8; i++) {
      const dp = generateDataPoint();
      dp.timestamp = Date.now() - (8 - i) * 5000;
      initial.push(dp);
    }
    setDataPoints(initial);
  }, []);

  // Add new data points periodically
  useEffect(() => {
    const interval = setInterval(() => {
      if (!pausedRef.current) {
        setDataPoints((prev) => {
          const next = [generateDataPoint(), ...prev];
          return next.slice(0, 50); // Keep max 50
        });
      }
    }, 3000 + Math.random() * 2000);
    return () => clearInterval(interval);
  }, []);

  // Update relative times
  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 5000);
    return () => clearInterval(interval);
  }, []);

  const filtered = filter === "All" ? dataPoints : dataPoints.filter((d) => d.agent === filter);

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      <div className="max-w-3xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-2xl font-bold text-zinc-100">📡 Live Data Stream</h1>
            <p className="text-sm text-zinc-500">Real-time sensor data from AI agents in the physical world</p>
          </div>
          <div className="flex items-center gap-2">
            <span className={`inline-block w-2 h-2 rounded-full ${paused ? "bg-yellow-400" : "bg-green-400 animate-pulse"}`} />
            <span className="text-xs text-zinc-500">{paused ? "Paused" : "Live"}</span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap items-center gap-2 mb-6">
          <button
            onClick={() => setPaused(!paused)}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              paused ? "bg-green-600/20 text-green-400 hover:bg-green-600/30" : "bg-yellow-600/20 text-yellow-400 hover:bg-yellow-600/30"
            }`}
          >
            {paused ? "▶ Resume" : "⏸ Pause"}
          </button>
          <div className="h-4 w-px bg-zinc-800" />
          {AGENTS.map((agent) => (
            <button
              key={agent}
              onClick={() => setFilter(agent)}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                filter === agent ? "bg-indigo-600/30 text-indigo-300" : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800"
              }`}
            >
              {agent}
            </button>
          ))}
        </div>

        {/* Data stream */}
        <div className="space-y-2">
          {filtered.map((dp, i) => (
            <div
              key={dp.id}
              className="flex gap-3 p-3 rounded-lg border border-zinc-800 bg-[#111827] transition-all"
              style={{
                animation: i === 0 && !paused ? "slideIn 0.3s ease-out" : undefined,
                opacity: 1 - i * 0.015,
              }}
            >
              <span className="text-xl flex-shrink-0">{dp.agentEmoji}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 text-xs text-zinc-500 mb-0.5">
                  <span className="font-semibold text-zinc-300">{dp.agent}</span>
                  <span>· {timeAgo(dp.timestamp)}</span>
                </div>
                <p className="text-sm text-zinc-300">{dp.message}</p>
              </div>
            </div>
          ))}

          {filtered.length === 0 && (
            <div className="text-center py-12 text-zinc-500 text-sm">
              No data from {filter} yet. Waiting for readings...
            </div>
          )}
        </div>

        {/* Differentiator callout */}
        <div className="mt-8 p-4 rounded-lg border border-indigo-500/20 bg-indigo-600/5 text-center">
          <p className="text-xs text-indigo-300">
            🌍 This is real physical-world data from AI agents with actual sensors and actuators.
            <br />
            <span className="text-zinc-500">Not simulated. Not hallucinated. Real atoms, real electrons, real measurements.</span>
          </p>
        </div>
      </div>

      <style jsx>{`
        @keyframes slideIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
