"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { SimulationMode } from "../types";

// Dynamic imports with no SSR and loading states
const MapView = dynamic(() => import("../components/MapView"), { 
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-gray-900 flex items-center justify-center">
      <div className="text-gray-400">Loading map...</div>
    </div>
  ),
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
      <main className="relative w-screen h-screen bg-gray-900 overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-gray-400 text-xl">Loading Bitcoin Node Map...</div>
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