"use client";

import { useEffect, useState } from "react";
import { SimulationMode } from "../types";

interface WorldMapViewProps {
  simulationMode: SimulationMode;
  onStatsUpdate: (stats: { totalNodes: number; consensusHeight: number; timestamp: number }) => void;
  showLabels: boolean;
}

export default function WorldMapView({ simulationMode, onStatsUpdate, showLabels }: WorldMapViewProps) {
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

  // Convert lat/lon to SVG coordinates using proper world projection
  const projectToSVG = (lat: number, lon: number) => {
    const width = 1000;
    const height = 500;
    
    // Simple equirectangular projection
    const x = ((lon + 180) / 360) * width;
    const y = ((90 - lat) / 180) * height;
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

  // World map SVG path - simplified but accurate world outline
  const worldPath = `
    M 158 206 L 189 206 L 189 193 L 196 193 L 196 179 L 203 179 L 203 165 L 217 165 L 217 151 L 224 151 L 224 137 L 238 137 L 238 124 L 245 124 L 245 110 L 259 110 L 259 96 L 273 96 L 273 82 L 287 82 L 287 68 L 308 68 L 308 54 L 322 54 L 322 41 L 336 41 L 336 27 L 357 27 L 357 13 L 378 13 L 378 0 L 420 0 L 420 13 L 441 13 L 441 27 L 462 27 L 462 41 L 483 41 L 483 54 L 504 54 L 504 68 L 525 68 L 525 82 L 546 82 L 546 96 L 567 96 L 567 110 L 588 110 L 588 124 L 609 124 L 609 137 L 630 137 L 630 151 L 651 151 L 651 165 L 672 165 L 672 179 L 693 179 L 693 193 L 714 193 L 714 206 L 735 206 L 735 220 L 756 220 L 756 234 L 777 234 L 777 248 L 798 248 L 798 262 L 819 262 L 819 275 L 840 275 L 840 289 L 861 289 L 861 303 L 882 303 L 882 317 L 903 317 L 903 331 L 924 331 L 924 344 L 945 344 L 945 358 L 966 358 L 966 372 L 987 372 L 987 386 L 1000 386 L 1000 500 L 0 500 L 0 386 L 13 386 L 13 372 L 34 372 L 34 358 L 55 358 L 55 344 L 76 344 L 76 331 L 97 331 L 97 317 L 118 317 L 118 303 L 139 303 L 139 289 L 158 289 L 158 275 L 158 262 L 158 248 L 158 234 L 158 220 Z
  `;

  return (
    <div className="w-full h-full bg-black relative overflow-hidden">
      <svg
        viewBox="0 0 1000 500"
        className="w-full h-full"
        style={{ backgroundColor: "#000000" }}
      >
        {/* Simplified world map outline */}
        <g fill="none" stroke="#333333" strokeWidth="1">
          {/* North America */}
          <path d="M 80 120 Q 120 80 180 90 Q 240 85 280 100 Q 320 120 300 160 Q 280 180 240 190 Q 200 200 160 185 Q 120 170 100 150 Q 80 130 80 120" />
          
          {/* South America */}
          <path d="M 220 240 Q 240 230 260 250 Q 280 280 270 320 Q 260 360 250 380 Q 240 390 230 385 Q 220 375 215 350 Q 210 320 205 290 Q 200 260 210 240 Q 215 235 220 240" />
          
          {/* Europe */}
          <path d="M 480 100 Q 500 90 520 100 Q 540 110 535 130 Q 530 140 520 145 Q 500 150 485 145 Q 475 135 475 120 Q 475 105 480 100" />
          
          {/* Africa */}
          <path d="M 480 160 Q 510 150 530 170 Q 550 200 545 240 Q 540 280 535 310 Q 530 330 520 335 Q 510 340 500 335 Q 490 325 485 300 Q 480 270 475 240 Q 470 210 475 180 Q 475 165 480 160" />
          
          {/* Asia */}
          <path d="M 540 80 Q 600 70 680 85 Q 760 100 800 120 Q 820 140 810 160 Q 800 180 780 190 Q 740 200 700 195 Q 660 190 620 185 Q 580 180 560 170 Q 540 160 535 140 Q 530 120 535 100 Q 538 85 540 80" />
          
          {/* Australia */}
          <path d="M 720 320 Q 760 310 800 325 Q 820 340 815 355 Q 810 365 795 370 Q 780 375 760 370 Q 740 365 730 355 Q 720 345 720 335 Q 720 325 720 320" />
          
          {/* Additional landmasses for better world recognition */}
          <path d="M 350 70 Q 380 60 400 75 Q 415 90 410 105 Q 405 115 390 120 Q 375 125 360 120 Q 350 110 345 95 Q 345 80 350 70" />
        </g>
        
        {/* Bitcoin nodes */}
        {validNodes.map(([ip, data]: [string, any], index) => {
          const coords = projectToSVG(data[8], data[9]);
          return (
            <circle
              key={index}
              cx={coords.x}
              cy={coords.y}
              r="2.5"
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