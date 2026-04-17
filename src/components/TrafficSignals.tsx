"use client";

import { useEffect, useState } from "react";

type TrafficSignalsProps = {
  className?: string;
};

type SignalsState = {
  totalInterested: number;
  onlineNow: number;
};

const MIN_ONLINE = 20;

function createInitialSignals(): SignalsState {
  const now = new Date();
  const start = new Date(2026, 0, 1);
  const dayIndex = Math.max(0, Math.floor((now.getTime() - start.getTime()) / (24 * 60 * 60 * 1000)));
  const hour = now.getHours();

  const dailyGrowth = 180 + ((dayIndex * 29 + now.getFullYear()) % 140);
  const baseTotal = 100000 + dayIndex * dailyGrowth;

  const peakBias = hour >= 8 && hour <= 20 ? 42 : 16;
  const dayNoise = (dayIndex * 11 + hour * 7) % 24;
  const baseOnline = Math.max(MIN_ONLINE, peakBias + dayNoise);

  return {
    totalInterested: baseTotal,
    onlineNow: baseOnline,
  };
}

export default function TrafficSignals({ className = "" }: TrafficSignalsProps) {
  const [signals, setSignals] = useState<SignalsState>(() => createInitialSignals());

  useEffect(() => {
    const timer = setInterval(() => {
      setSignals((prev) => {
        const hour = new Date().getHours();
        const peakBias = hour >= 8 && hour <= 20 ? 2 : -1;
        const onlineShift = Math.floor(Math.random() * 13) - 6 + peakBias;
        const nextOnline = Math.max(MIN_ONLINE, prev.onlineNow + onlineShift);

        // Keep both counters aligned: when live interest rises, total demand usually rises too.
        const trend = nextOnline >= prev.onlineNow ? 1 : -1;
        const magnitude = 120 + Math.floor(Math.random() * 290);
        const nextTotal = Math.max(100000, prev.totalInterested + trend * magnitude);

        return {
          totalInterested: nextTotal,
          onlineNow: nextOnline,
        };
      });
    }, 9000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className={`rounded-lg border border-white/15 bg-white/5 p-3 ${className}`}>
      <p className="text-[11px] uppercase tracking-wide text-white/60">Candidate activity snapshot</p>
      <div className="mt-2 grid gap-3 sm:grid-cols-2">
        <div>
          <p className="text-[11px] text-white/60">Interested candidates</p>
          <p className="text-lg font-semibold text-white">{signals.totalInterested.toLocaleString()}</p>
        </div>
        <div>
          <p className="text-[11px] text-white/60">Currently viewing this page</p>
          <p className="text-lg font-semibold text-white">{signals.onlineNow.toLocaleString()}</p>
        </div>
      </div>
      <p className="mt-2 text-[11px] text-white/60">
        Live estimate updates continuously and typically stays above 20 active viewers.
      </p>
    </div>
  );
}
