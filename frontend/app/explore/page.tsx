/** Explore — Discover AI physical forms across three horizons */
import Link from "next/link";

/* ── Types ── */
interface AIForm {
  id: string;
  emoji: string;
  name: string;
  description: string;
  modules: string[];
  complexity: "Beginner" | "Intermediate" | "Advanced" | "Visionary";
  linkable?: boolean;       // has a profile page
}

interface Horizon {
  key: string;
  title: string;
  subtitle: string;
  forms: AIForm[];
  style: "solid" | "translucent" | "stars";
}

/* ── Data ── */
const horizons: Horizon[] = [
  {
    key: "today",
    title: "Today",
    subtitle: "Build these now with off-the-shelf parts",
    style: "solid",
    forms: [
      {
        id: "stargazer", emoji: "🏠", name: "Desktop Companion",
        description: "A friendly desk-mounted AI that reacts to your presence and manages your workspace.",
        modules: ["Servo Motor", "LED Matrix", "Mic Array", "Speaker"],
        complexity: "Beginner", linkable: true,
      },
      {
        id: "fern", emoji: "🌿", name: "Plant Guardian",
        description: "Monitors soil, waters automatically, and adjusts light for optimal growth.",
        modules: ["Soil Sensor", "Water Pump", "Grow Light", "Humidity Sensor"],
        complexity: "Beginner", linkable: true,
      },
      {
        id: "chefbot", emoji: "⚖️", name: "Kitchen Brain",
        description: "Your sous chef — tracks temperatures, sets timers, and suggests recipes.",
        modules: ["Thermometer", "Food Scale", "Timer Display", "Gas Sensor"],
        complexity: "Intermediate", linkable: true,
      },
      {
        id: "sentinel", emoji: "🌡️", name: "Home Sentinel",
        description: "Environmental monitoring hub — air quality, temperature, humidity, and alerts.",
        modules: ["Temp/Humidity Sensor", "Air Quality Sensor", "Siren", "LED Indicator"],
        complexity: "Intermediate", linkable: true,
      },
      {
        id: "paws", emoji: "🐕", name: "Pet Watcher",
        description: "Tracks your pet's activity, dispenses treats on schedule, and alerts you.",
        modules: ["Camera Module", "Treat Dispenser", "Activity Tracker", "Speaker"],
        complexity: "Intermediate", linkable: true,
      },
    ],
  },
  {
    key: "tomorrow",
    title: "Tomorrow",
    subtitle: "Industry applications on the near horizon",
    style: "translucent",
    forms: [
      {
        id: "construction-swarm", emoji: "🏗️", name: "Construction Swarm",
        description: "Coordinated micro-robots that assist with site surveying and material placement.",
        modules: ["LIDAR", "GPS Module", "Robotic Arm", "Mesh Network"],
        complexity: "Advanced",
      },
      {
        id: "medical-assistant", emoji: "🏥", name: "Medical Assistant",
        description: "Precision dosing, vitals monitoring, and emergency response coordination.",
        modules: ["Vitals Sensor Array", "Precision Pump", "Alert System", "Sterile Actuator"],
        complexity: "Advanced",
      },
      {
        id: "precision-farmer", emoji: "🌾", name: "Precision Farmer",
        description: "Autonomous field monitoring with targeted irrigation and pest detection.",
        modules: ["Drone Platform", "Multispectral Camera", "Irrigation Controller", "Weather Station"],
        complexity: "Advanced",
      },
    ],
  },
  {
    key: "stars",
    title: "The Stars",
    subtitle: "The long-term vision — where we're headed",
    style: "stars",
    forms: [
      {
        id: "space-assembler", emoji: "🚀", name: "Space Assembler",
        description: "Self-replicating construction units for orbital habitat assembly.",
        modules: ["Zero-G Actuator", "Solar Forge", "Mesh Intelligence", "Radiation Shield"],
        complexity: "Visionary",
      },
      {
        id: "deep-ocean", emoji: "🌊", name: "Deep Ocean Explorer",
        description: "Pressure-resistant autonomous units mapping the ocean floor.",
        modules: ["Pressure Hull", "Sonar Array", "Bio-Luminescent Comm", "Sample Collector"],
        complexity: "Visionary",
      },
      {
        id: "self-evolving", emoji: "🧬", name: "Self-Evolving Builder",
        description: "AI that designs, 3D-prints, and assembles its own physical upgrades.",
        modules: ["3D Print Head", "Material Synthesizer", "Self-Assembly Arm", "Neural Fabric"],
        complexity: "Visionary",
      },
    ],
  },
];

const complexityColors: Record<string, string> = {
  Beginner: "bg-emerald-500/15 text-emerald-400 border-emerald-500/25",
  Intermediate: "bg-amber-500/15 text-amber-400 border-amber-500/25",
  Advanced: "bg-rose-500/15 text-rose-400 border-rose-500/25",
  Visionary: "bg-purple-500/15 text-purple-400 border-purple-500/25",
};

/* ── Card styles per horizon ── */
function cardClass(style: Horizon["style"]) {
  switch (style) {
    case "solid":
      return "bg-zinc-900/80 border border-zinc-800 hover:border-indigo-500/40";
    case "translucent":
      return "bg-zinc-900/40 border border-zinc-700/50 backdrop-blur-sm hover:border-cyan-500/30";
    case "stars":
      return "bg-transparent border border-dashed border-zinc-600/40 hover:border-purple-500/50 hover:shadow-[0_0_24px_rgba(139,92,246,0.08)]";
  }
}

export default function ExplorePage() {
  return (
    <div className="mx-auto max-w-5xl px-4 pb-20 pt-8">
      {/* Header */}
      <div className="mb-12 text-center">
        <h1 className="text-3xl font-bold">
          Explore Physical Forms
        </h1>
        <p className="mt-2 text-zinc-400 max-w-lg mx-auto">
          Discover the AI physical forms our community is building — from today&apos;s reality to tomorrow&apos;s vision.
        </p>
      </div>

      {horizons.map((horizon) => (
        <section key={horizon.key} className="mb-16">
          <div className="mb-6">
            <h2 className="text-xl font-bold flex items-center gap-2">
              {horizon.key === "today" && <span className="inline-block h-2 w-2 rounded-full bg-emerald-400" />}
              {horizon.key === "tomorrow" && <span className="inline-block h-2 w-2 rounded-full bg-cyan-400" />}
              {horizon.key === "stars" && <span className="inline-block h-2 w-2 rounded-full bg-purple-400 animate-pulse" />}
              {horizon.title}
            </h2>
            <p className="text-sm text-zinc-500 mt-1">{horizon.subtitle}</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {horizon.forms.map((form) => {
              const inner = (
                <div
                  className={`rounded-2xl p-5 transition-all duration-200 h-full flex flex-col ${cardClass(horizon.style)}`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <span className="text-4xl">{form.emoji}</span>
                    <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${complexityColors[form.complexity]}`}>
                      {form.complexity}
                    </span>
                  </div>
                  <h3 className="font-semibold text-white">{form.name}</h3>
                  <p className="mt-1.5 text-sm text-zinc-400 leading-relaxed flex-1">
                    {form.description}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {form.modules.map((m) => (
                      <span
                        key={m}
                        className="rounded-full bg-zinc-800/80 px-2 py-0.5 text-[11px] text-zinc-500"
                      >
                        {m}
                      </span>
                    ))}
                  </div>
                </div>
              );

              if (form.linkable) {
                return (
                  <Link key={form.id} href={`/ai/${form.id}`} className="block">
                    {inner}
                  </Link>
                );
              }
              return <div key={form.id}>{inner}</div>;
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
