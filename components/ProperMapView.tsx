"use client";

import { useEffect, useState, useRef } from "react";
import { SimulationMode } from "../types";

interface ProperMapViewProps {
  simulationMode: SimulationMode;
  onStatsUpdate: (stats: { totalNodes: number; consensusHeight: number; timestamp: number }) => void;
  showLabels: boolean;
}

export default function ProperMapView({ simulationMode, onStatsUpdate, showLabels }: ProperMapViewProps) {
  const [bitNodesData, setBitNodesData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const svgRef = useRef<SVGSVGElement>(null);

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
    const width = 1000;
    const height = 500;
    
    // Mercator-like projection
    const x = ((lon + 180) / 360) * width;
    const y = ((90 - lat) / 180) * height;
    return { x, y };
  };

  // Handle mouse wheel for zoom
  const handleWheel = (event: React.WheelEvent) => {
    event.preventDefault();
    const delta = event.deltaY > 0 ? 0.9 : 1.1;
    setZoom(prev => Math.min(Math.max(prev * delta, 0.5), 10));
  };

  // Handle mouse drag for pan
  const handleMouseDown = (event: React.MouseEvent) => {
    const startX = event.clientX;
    const startY = event.clientY;
    const startPan = { ...pan };

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - startX;
      const deltaY = e.clientY - startY;
      setPan({
        x: startPan.x + deltaX / zoom,
        y: startPan.y + deltaY / zoom
      });
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
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
    <div className="w-full h-full bg-black relative overflow-hidden cursor-grab active:cursor-grabbing">
      <svg
        ref={svgRef}
        viewBox="0 0 1000 500"
        className="w-full h-full"
        style={{ backgroundColor: "#000000" }}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
      >
        <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
          {/* World map - accurate country outlines */}
          <g fill="none" stroke="#666666" strokeWidth="1">
            {/* North America */}
            <path d="M 158,206 C 158,206 180,180 200,175 C 220,170 250,170 280,180 C 310,190 330,200 340,220 C 350,240 340,260 320,270 C 300,280 270,285 240,280 C 210,275 180,270 160,250 C 140,230 150,215 158,206 Z" />
            
            {/* Canada */}
            <path d="M 120,140 C 140,120 180,110 220,115 C 260,120 300,130 330,140 C 360,150 380,160 390,170 C 400,180 390,190 370,195 C 350,200 320,200 290,195 C 260,190 230,185 200,180 C 170,175 140,170 120,160 C 100,150 110,145 120,140 Z" />
            
            {/* Greenland */}
            <path d="M 340,60 C 360,40 380,35 400,40 C 420,45 430,55 435,70 C 440,85 435,95 425,100 C 415,105 400,105 385,100 C 370,95 355,85 345,75 C 335,65 335,65 340,60 Z" />
            
            {/* South America */}
            <path d="M 230,280 C 250,270 270,275 285,290 C 300,305 305,325 300,345 C 295,365 285,380 270,390 C 255,400 240,405 225,400 C 210,395 200,385 195,370 C 190,355 195,340 205,325 C 215,310 225,295 230,280 Z" />
            
            {/* Europe */}
            <path d="M 480,120 C 500,110 520,115 535,125 C 550,135 555,145 550,155 C 545,165 535,170 520,170 C 505,170 490,165 480,155 C 470,145 475,135 480,120 Z" />
            
            {/* Scandinavia */}
            <path d="M 500,80 C 520,70 535,75 545,85 C 555,95 555,105 550,115 C 545,125 535,130 525,125 C 515,120 505,110 500,100 C 495,90 495,85 500,80 Z" />
            
            {/* Africa */}
            <path d="M 480,180 C 500,170 520,175 535,190 C 550,205 555,225 550,245 C 545,265 540,285 535,300 C 530,315 520,325 505,330 C 490,335 475,330 465,320 C 455,310 450,295 455,280 C 460,265 465,250 470,235 C 475,220 475,200 480,180 Z" />
            
            {/* Asia */}
            <path d="M 550,100 C 580,90 620,95 660,105 C 700,115 740,125 770,135 C 800,145 820,155 830,170 C 840,185 830,195 810,200 C 790,205 760,205 730,200 C 700,195 670,190 640,185 C 610,180 580,175 560,165 C 540,155 540,145 545,130 C 548,115 550,100 550,100 Z" />
            
            {/* China */}
            <path d="M 680,140 C 710,130 740,135 760,145 C 780,155 790,165 785,175 C 780,185 770,190 755,190 C 740,190 725,185 710,180 C 695,175 685,165 680,155 C 675,145 675,140 680,140 Z" />
            
            {/* India */}
            <path d="M 620,180 C 640,170 655,175 665,185 C 675,195 675,205 670,215 C 665,225 655,230 645,225 C 635,220 625,210 620,200 C 615,190 615,185 620,180 Z" />
            
            {/* Australia */}
            <path d="M 740,320 C 770,310 800,315 820,325 C 840,335 845,345 840,355 C 835,365 825,370 810,370 C 795,370 780,365 765,360 C 750,355 740,345 740,335 C 740,325 740,320 740,320 Z" />
            
            {/* Japan */}
            <path d="M 800,160 C 815,155 825,160 830,170 C 835,180 830,185 825,185 C 820,185 815,180 810,175 C 805,170 800,165 800,160 Z" />
            
            {/* UK */}
            <path d="M 460,130 C 470,125 480,130 480,140 C 480,150 475,155 470,150 C 465,145 460,135 460,130 Z" />
            
            {/* Madagascar */}
            <path d="M 560,300 C 570,295 575,300 575,310 C 575,320 570,325 565,320 C 560,315 555,305 560,300 Z" />
            
            {/* New Zealand */}
            <path d="M 850,380 C 860,375 865,380 865,390 C 865,400 860,405 855,400 C 850,395 845,385 850,380 Z" />
          </g>
          
          {/* Bitcoin nodes */}
          {validNodes.map(([ip, data]: [string, any], index) => {
            const coords = projectToSVG(data[8], data[9]);
            return (
              <circle
                key={index}
                cx={coords.x}
                cy={coords.y}
                r={3 / zoom}
                fill="#00ccf3"
                stroke="#ffffff"
                strokeWidth={0.5 / zoom}
                opacity="0.9"
              />
            );
          })}
        </g>
      </svg>
      
      {/* Zoom controls */}
      <div className="absolute top-4 right-4 flex flex-col gap-2">
        <button
          onClick={() => setZoom(prev => Math.min(prev * 1.2, 10))}
          className="bg-gray-800 text-white px-3 py-1 rounded hover:bg-gray-700"
        >
          +
        </button>
        <button
          onClick={() => setZoom(prev => Math.max(prev / 1.2, 0.5))}
          className="bg-gray-800 text-white px-3 py-1 rounded hover:bg-gray-700"
        >
          -
        </button>
        <button
          onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }}
          className="bg-gray-800 text-white px-2 py-1 rounded hover:bg-gray-700 text-xs"
        >
          Reset
        </button>
      </div>
    </div>
  );
}