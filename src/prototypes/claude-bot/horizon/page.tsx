"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

type TimeOfDay = "dawn" | "sunrise" | "day" | "sunset" | "dusk" | "night";

const TIME_PRESETS: Record<TimeOfDay, { sky: string; sun: string; label: string }> = {
  dawn: {
    sky: "from-indigo-900 via-purple-800 to-orange-400",
    sun: "bg-orange-300",
    label: "Dawn",
  },
  sunrise: {
    sky: "from-blue-400 via-orange-300 to-yellow-200",
    sun: "bg-yellow-300",
    label: "Sunrise",
  },
  day: {
    sky: "from-blue-500 via-blue-400 to-cyan-300",
    sun: "bg-yellow-200",
    label: "Day",
  },
  sunset: {
    sky: "from-indigo-600 via-pink-500 to-orange-400",
    sun: "bg-orange-400",
    label: "Sunset",
  },
  dusk: {
    sky: "from-slate-900 via-purple-900 to-pink-700",
    sun: "bg-pink-400",
    label: "Dusk",
  },
  night: {
    sky: "from-slate-950 via-slate-900 to-indigo-950",
    sun: "bg-slate-600",
    label: "Night",
  },
};

const TIME_ORDER: TimeOfDay[] = ["dawn", "sunrise", "day", "sunset", "dusk", "night"];

export default function Horizon() {
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>("sunrise");
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);
  const [sunPosition, setSunPosition] = useState(50);

  useEffect(() => {
    const positions: Record<TimeOfDay, number> = {
      dawn: 85,
      sunrise: 70,
      day: 30,
      sunset: 70,
      dusk: 85,
      night: 110,
    };
    setSunPosition(positions[timeOfDay]);
  }, [timeOfDay]);

  useEffect(() => {
    if (!isAutoPlaying) return;

    const interval = setInterval(() => {
      setTimeOfDay((current) => {
        const currentIndex = TIME_ORDER.indexOf(current);
        return TIME_ORDER[(currentIndex + 1) % TIME_ORDER.length];
      });
    }, 3000);

    return () => clearInterval(interval);
  }, [isAutoPlaying]);

  const preset = TIME_PRESETS[timeOfDay];

  return (
    <div className="flex flex-col min-h-screen bg-base-300">
      {/* Horizon Scene */}
      <div
        className={cn(
          "relative flex-1 overflow-hidden transition-all duration-[2000ms] ease-in-out bg-gradient-to-b",
          preset.sky
        )}
      >
        {/* Stars (visible at night/dusk/dawn) */}
        {(timeOfDay === "night" || timeOfDay === "dusk" || timeOfDay === "dawn") && (
          <div className="absolute inset-0 overflow-hidden">
            {[...Array(50)].map((_, i) => (
              <div
                key={i}
                className={cn(
                  "absolute w-1 h-1 bg-white rounded-full transition-opacity duration-[2000ms]",
                  timeOfDay === "night" ? "opacity-80" : "opacity-30"
                )}
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 60}%`,
                  animationDelay: `${Math.random() * 2}s`,
                }}
              />
            ))}
          </div>
        )}

        {/* Sun/Moon */}
        <div
          className={cn(
            "absolute left-1/2 -translate-x-1/2 w-24 h-24 rounded-full transition-all duration-[2000ms] ease-in-out",
            preset.sun,
            timeOfDay === "night" ? "opacity-90 shadow-[0_0_60px_rgba(148,163,184,0.3)]" : "shadow-[0_0_80px_rgba(255,200,100,0.6)]"
          )}
          style={{ top: `${sunPosition}%` }}
        >
          {/* Moon craters for night */}
          {timeOfDay === "night" && (
            <>
              <div className="absolute w-4 h-4 bg-slate-500/30 rounded-full top-4 left-6" />
              <div className="absolute w-3 h-3 bg-slate-500/20 rounded-full top-10 left-3" />
              <div className="absolute w-2 h-2 bg-slate-500/25 rounded-full top-6 left-14" />
            </>
          )}
        </div>

        {/* Clouds */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div
            className={cn(
              "absolute w-32 h-10 bg-white/20 rounded-full blur-md transition-opacity duration-[2000ms]",
              timeOfDay === "night" ? "opacity-10" : "opacity-60"
            )}
            style={{ top: "20%", left: "15%", animation: "float 20s ease-in-out infinite" }}
          />
          <div
            className={cn(
              "absolute w-48 h-14 bg-white/15 rounded-full blur-lg transition-opacity duration-[2000ms]",
              timeOfDay === "night" ? "opacity-5" : "opacity-40"
            )}
            style={{ top: "35%", left: "60%", animation: "float 25s ease-in-out infinite reverse" }}
          />
          <div
            className={cn(
              "absolute w-24 h-8 bg-white/25 rounded-full blur-sm transition-opacity duration-[2000ms]",
              timeOfDay === "night" ? "opacity-10" : "opacity-50"
            )}
            style={{ top: "15%", left: "75%", animation: "float 18s ease-in-out infinite" }}
          />
        </div>

        {/* Horizon line with water reflection */}
        <div className="absolute bottom-0 left-0 right-0 h-1/3">
          {/* Water */}
          <div
            className={cn(
              "absolute inset-0 transition-all duration-[2000ms] bg-gradient-to-b",
              timeOfDay === "night"
                ? "from-slate-800 to-slate-950"
                : timeOfDay === "dusk"
                ? "from-purple-800/80 to-slate-900"
                : timeOfDay === "dawn"
                ? "from-purple-700/60 to-indigo-900"
                : timeOfDay === "sunset"
                ? "from-orange-500/50 to-indigo-800"
                : timeOfDay === "sunrise"
                ? "from-orange-300/40 to-blue-600"
                : "from-cyan-400/50 to-blue-700"
            )}
          />
          {/* Water shimmer */}
          <div className="absolute inset-0 overflow-hidden">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className={cn(
                  "absolute h-px bg-white/20 transition-opacity duration-[2000ms]",
                  timeOfDay === "night" ? "opacity-10" : "opacity-40"
                )}
                style={{
                  top: `${15 + i * 12}%`,
                  left: `${10 + Math.random() * 20}%`,
                  width: `${30 + Math.random() * 40}%`,
                  animation: `shimmer ${2 + Math.random() * 2}s ease-in-out infinite`,
                  animationDelay: `${Math.random() * 2}s`,
                }}
              />
            ))}
          </div>
          {/* Sun reflection */}
          {sunPosition < 100 && (
            <div
              className={cn(
                "absolute left-1/2 -translate-x-1/2 w-16 transition-all duration-[2000ms]",
                timeOfDay === "night" ? "opacity-20" : "opacity-60"
              )}
              style={{ top: "5%" }}
            >
              <div
                className={cn(
                  "w-full h-32 bg-gradient-to-b blur-md",
                  timeOfDay === "night"
                    ? "from-slate-400/30 to-transparent"
                    : "from-yellow-200/60 to-transparent"
                )}
              />
            </div>
          )}
        </div>

        {/* Foreground silhouette */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg
            viewBox="0 0 1200 200"
            className="w-full h-auto"
            preserveAspectRatio="none"
          >
            <path
              d="M0,200 L0,180 Q100,160 200,170 Q300,180 400,165 Q500,150 600,155 Q700,160 800,150 Q900,140 1000,155 Q1100,170 1200,160 L1200,200 Z"
              className={cn(
                "transition-all duration-[2000ms]",
                timeOfDay === "night" || timeOfDay === "dusk"
                  ? "fill-slate-950"
                  : timeOfDay === "dawn"
                  ? "fill-slate-900"
                  : "fill-slate-800"
              )}
            />
          </svg>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-base-100 border-t border-base-300 px-6 py-4">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-base-content">
                {preset.label}
              </h2>
              <p className="text-sm text-base-content/60">
                Experience the beauty of changing light
              </p>
            </div>
            <button
              onClick={() => setIsAutoPlaying(!isAutoPlaying)}
              className={cn(
                "btn btn-sm gap-2",
                isAutoPlaying ? "btn-primary" : "btn-ghost"
              )}
            >
              {isAutoPlaying ? (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                    <rect x="6" y="4" width="4" height="16" rx="1" />
                    <rect x="14" y="4" width="4" height="16" rx="1" />
                  </svg>
                  Pause
                </>
              ) : (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                  Auto Play
                </>
              )}
            </button>
          </div>

          <div className="flex gap-2 flex-wrap">
            {TIME_ORDER.map((time) => (
              <button
                key={time}
                onClick={() => {
                  setTimeOfDay(time);
                  setIsAutoPlaying(false);
                }}
                className={cn(
                  "btn btn-sm transition-all",
                  timeOfDay === time
                    ? "btn-primary"
                    : "btn-ghost hover:btn-ghost"
                )}
              >
                {TIME_PRESETS[time].label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* CSS for animations */}
      <style jsx>{`
        @keyframes float {
          0%, 100% {
            transform: translateX(0) translateY(0);
          }
          50% {
            transform: translateX(20px) translateY(-10px);
          }
        }
        @keyframes shimmer {
          0%, 100% {
            opacity: 0.2;
            transform: scaleX(1);
          }
          50% {
            opacity: 0.5;
            transform: scaleX(1.1);
          }
        }
      `}</style>
    </div>
  );
}
