"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { SimulationMode } from "../types";

// Dynamic imports with no SSR
const MapView = dynamic(() => import("../components/MapView"), { 
  ssr: false,
});


export default function Page() {
  const [simulationMode, setSimulationMode] = useState<SimulationMode>("live");
  const [stats, setStats] = useState({
    totalNodes: 0,
    consensusHeight: 0,
    timestamp: 0,
  });
  const [showLabels, setShowLabels] = useState(true);
  const [mounted, setMounted] = useState(false);

  // Ensure client-side only rendering
  useEffect(() => {
    setMounted(true);
  }, []);


  const handleStatsUpdate = (newStats: typeof stats) => {
    setStats(newStats);
  };

  // Show loading state on server/before mount
  if (!mounted) {
    return (
      <main className="relative w-screen h-screen overflow-hidden" style={{ backgroundColor: "#0a0a0a" }}>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex flex-col items-center justify-center gap-6 pixelated">
            <img src="/sato.gif" alt="Loading" className="w-32 h-32 md:w-40 md:h-40" />
            <p className="text-white text-xl md:text-2xl font-bold text-center">
              Finding your friendly neighborhood Satoshi
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="w-screen h-screen bg-black overflow-hidden">
      <MapView 
        simulationMode={simulationMode} 
        onStatsUpdate={handleStatsUpdate} 
        showLabels={showLabels} 
      />
    </main>
  );
}