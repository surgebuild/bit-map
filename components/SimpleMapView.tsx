"use client";

import { useEffect, useState } from "react";
import { SimulationMode } from "../types";

interface SimpleMapViewProps {
  simulationMode: SimulationMode;
  onStatsUpdate: (stats: { totalNodes: number; consensusHeight: number; timestamp: number }) => void;
  showLabels: boolean;
}

export default function SimpleMapView({ simulationMode, onStatsUpdate, showLabels }: SimpleMapViewProps) {
  const [bitNodesData, setBitNodesData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Load Bitcoin nodes data
  useEffect(() => {
    fetch("/bitnodes.json")
      .then((res) => res.json())
      .then((data) => {
        setBitNodesData(data);
        onStatsUpdate({
          totalNodes: Object.keys(data.nodes).length,
          consensusHeight: data.latest_height,
          timestamp: data.timestamp,
        });
      })
      .catch((err) => {
        setError(`Failed to load data: ${err.message || err.toString()}`);
      });
  }, []);

  // Convert lat/lon to SVG coordinates
  const projectToSVG = (lat: number, lon: number) => {
    const x = ((lon + 180) / 360) * 1000;
    const y = ((90 - lat) / 180) * 500;
    return { x, y };
  };

  if (error) {
    return (
      <div className="w-full h-full bg-gray-900 flex items-center justify-center">
        <div className="text-red-400 text-xl">Error: {error}</div>
      </div>
    );
  }

  if (!bitNodesData) {
    return (
      <div className="w-full h-full bg-black flex items-center justify-center">
        <div className="text-cyan-400 text-xl">Loading Bitcoin nodes...</div>
      </div>
    );
  }

  // Get valid nodes
  const nodes = Object.entries(bitNodesData.nodes);
  const validNodes = nodes
    .filter(([_, data]: [string, any]) => 
      data[8] != null && data[9] != null && 
      data[8] !== 0 && data[9] !== 0
    )
    .slice(0, 200);

  return (
    <div className="w-full h-full bg-black relative overflow-hidden">
      <svg
        viewBox="0 0 1000 500"
        className="w-full h-full"
        style={{ backgroundColor: "#000000" }}
      >
        {/* World map outline - more accurate continents */}
        <g fill="none" stroke="#444444" strokeWidth="1.5">
          {/* North America */}
          <path d="M 100 120 L 120 100 L 160 90 L 200 95 L 240 100 L 280 110 L 300 130 L 310 150 L 300 170 L 280 180 L 260 190 L 240 200 L 220 210 L 200 220 L 180 215 L 160 210 L 140 200 L 120 180 L 110 160 L 100 140 Z" />
          
          {/* South America */}
          <path d="M 220 240 L 240 235 L 250 250 L 255 270 L 260 290 L 255 310 L 250 330 L 245 350 L 240 370 L 235 385 L 230 390 L 225 385 L 220 370 L 215 350 L 210 330 L 205 310 L 200 290 L 205 270 L 210 250 L 215 240 Z" />
          
          {/* Europe */}
          <path d="M 480 110 L 500 105 L 520 110 L 530 120 L 525 130 L 520 140 L 510 150 L 500 155 L 490 150 L 485 140 L 480 130 L 475 120 Z" />
          
          {/* Africa */}
          <path d="M 490 170 L 510 165 L 520 180 L 525 200 L 530 220 L 535 240 L 540 260 L 535 280 L 530 300 L 525 315 L 520 325 L 515 330 L 510 325 L 505 315 L 500 300 L 495 280 L 490 260 L 485 240 L 480 220 L 485 200 L 490 180 Z" />
          
          {/* Asia */}
          <path d="M 550 90 L 600 85 L 650 90 L 700 95 L 750 105 L 780 120 L 790 140 L 785 160 L 770 175 L 750 185 L 720 190 L 680 195 L 640 190 L 600 185 L 570 180 L 550 170 L 540 150 L 545 130 L 550 110 Z" />
          
          {/* Australia */}
          <path d="M 720 320 L 760 315 L 790 325 L 800 340 L 795 355 L 780 365 L 760 370 L 740 365 L 725 355 L 720 340 Z" />
          
          {/* Greenland */}
          <path d="M 350 80 L 380 75 L 400 85 L 410 100 L 405 115 L 390 125 L 370 120 L 355 110 L 350 95 Z" />
          
          {/* Antarctica outline */}
          <path d="M 50 450 L 950 450 L 950 480 L 50 480 Z" />
        </g>
        
        {/* Bitcoin nodes */}
        {validNodes.map(([ip, data]: [string, any], index) => {
          const coords = projectToSVG(data[8], data[9]);
          return (
            <circle
              key={index}
              cx={coords.x}
              cy={coords.y}
              r="3"
              fill="#00ccf3"
              stroke="#ffffff"
              strokeWidth="0.5"
              opacity="0.9"
            />
          );
        })}
      </svg>
    </div>
  );
}