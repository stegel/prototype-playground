"use client";

import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

type LogLevel = "info" | "success" | "warning" | "error";

interface LogEntry {
  id: number;
  timestamp: Date;
  level: LogLevel;
  message: string;
}

function formatTimestamp(date: Date): string {
  return date.toLocaleString(undefined, {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    timeZoneName: "short",
  });
}

const LEVEL_STYLES: Record<LogLevel, string> = {
  info: "text-blue-400",
  success: "text-green-400",
  warning: "text-yellow-400",
  error: "text-red-400",
};

const LEVEL_LABELS: Record<LogLevel, string> = {
  info: "INFO",
  success: "OK  ",
  warning: "WARN",
  error: "ERR ",
};

const POLL_MESSAGES: Array<{ level: LogLevel; message: string }> = [
  { level: "info", message: "Polling /api/status — checking service health..." },
  { level: "success", message: "Response 200 OK — service is healthy." },
  { level: "info", message: "Polling /api/queue — fetching pending jobs..." },
  { level: "success", message: "Queue depth: 3 jobs pending." },
  { level: "info", message: "Polling /api/metrics — collecting performance data..." },
  { level: "warning", message: "Latency spike detected: p99 = 840ms (threshold: 500ms)." },
  { level: "info", message: "Polling /api/status — checking service health..." },
  { level: "success", message: "Response 200 OK — service is healthy." },
  { level: "info", message: "Polling /api/queue — fetching pending jobs..." },
  { level: "error", message: "Connection timeout after 5000ms — retrying in 10s." },
  { level: "warning", message: "Retry attempt 1/3 for /api/queue..." },
  { level: "success", message: "Retry succeeded — queue depth: 1 job pending." },
  { level: "info", message: "Polling /api/metrics — collecting performance data..." },
  { level: "success", message: "Metrics collected. p50=120ms, p95=310ms, p99=490ms." },
  { level: "info", message: "Polling /api/status — checking service health..." },
  { level: "success", message: "Response 200 OK — service is healthy." },
];

let messageIndex = 0;
let nextId = 1;

function nextMessage(): LogEntry {
  const entry = {
    id: nextId++,
    timestamp: new Date(),
    level: POLL_MESSAGES[messageIndex % POLL_MESSAGES.length].level,
    message: POLL_MESSAGES[messageIndex % POLL_MESSAGES.length].message,
  };
  messageIndex++;
  return entry;
}

export default function PollingConsoleMessaging() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isPolling, setIsPolling] = useState(false);
  const [intervalMs, setIntervalMs] = useState(1500);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  useEffect(() => {
    if (isPolling) {
      intervalRef.current = setInterval(() => {
        setLogs((prev) => [...prev.slice(-200), nextMessage()]);
      }, intervalMs);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isPolling, intervalMs]);

  function handleClear() {
    setLogs([]);
  }

  function handleToggle() {
    setIsPolling((p) => !p);
  }

  return (
    <div className="flex flex-col min-h-screen bg-base-200 p-6 gap-4">
      {/* Header */}
      <div className="max-w-4xl w-full mx-auto">
        <h1 className="text-xl font-semibold text-base-content">Polling Console</h1>
        <p className="text-sm text-base-content/60 mt-0.5">
          Timestamps displayed in your local timezone ({Intl.DateTimeFormat().resolvedOptions().timeZone}).
        </p>
      </div>

      {/* Controls */}
      <div className="max-w-4xl w-full mx-auto flex items-center gap-3 flex-wrap">
        <button
          onClick={handleToggle}
          className={cn(
            "btn btn-sm",
            isPolling ? "btn-error" : "btn-success"
          )}
        >
          {isPolling ? "Stop Polling" : "Start Polling"}
        </button>

        <button
          onClick={handleClear}
          className="btn btn-sm btn-ghost"
          disabled={logs.length === 0}
        >
          Clear
        </button>

        <div className="flex items-center gap-2 ml-auto">
          <span className="text-xs text-base-content/40">Interval:</span>
          {[500, 1000, 1500, 3000].map((ms) => (
            <button
              key={ms}
              onClick={() => setIntervalMs(ms)}
              className={cn(
                "btn btn-xs",
                intervalMs === ms ? "btn-primary" : "btn-ghost"
              )}
            >
              {ms < 1000 ? `${ms}ms` : `${ms / 1000}s`}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <span
            className={cn(
              "inline-block w-2 h-2 rounded-full",
              isPolling ? "bg-green-400 animate-pulse" : "bg-base-content/40"
            )}
          />
          <span className="text-xs text-base-content/40">
            {isPolling ? "Polling…" : "Idle"}
          </span>
        </div>
      </div>

      {/* Console */}
      <div className="max-w-4xl w-full mx-auto flex-1 bg-[#0d1117] rounded-xl border border-base-300 overflow-hidden font-mono text-xs shadow-sm">
        <div className="flex items-center gap-1.5 px-4 py-2.5 bg-[#161b22] border-b border-base-300">
          <span className="w-3 h-3 rounded-full bg-red-500/70" />
          <span className="w-3 h-3 rounded-full bg-yellow-500/70" />
          <span className="w-3 h-3 rounded-full bg-green-500/70" />
          <span className="ml-3 text-base-content/40 text-[11px]">polling-console — output</span>
        </div>

        <div className="h-[480px] overflow-y-auto p-4 space-y-1 scrollbar-thin">
          {logs.length === 0 ? (
            <p className="text-base-content/40 italic pt-2">
              Press &quot;Start Polling&quot; to begin…
            </p>
          ) : (
            logs.map((entry) => (
              <div key={entry.id} className="flex gap-3 leading-relaxed">
                <span className="text-base-content/40 shrink-0 select-none">
                  {formatTimestamp(entry.timestamp)}
                </span>
                <span
                  className={cn(
                    "shrink-0 font-bold select-none",
                    LEVEL_STYLES[entry.level]
                  )}
                >
                  [{LEVEL_LABELS[entry.level]}]
                </span>
                <span className="text-gray-200 break-all">{entry.message}</span>
              </div>
            ))
          )}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* Footer stats */}
      <div className="max-w-4xl w-full mx-auto flex gap-4 text-xs text-base-content/40">
        <span>{logs.length} entries</span>
        <span>·</span>
        <span>{logs.filter((l) => l.level === "error").length} errors</span>
        <span>·</span>
        <span>{logs.filter((l) => l.level === "warning").length} warnings</span>
      </div>
    </div>
  );
}
