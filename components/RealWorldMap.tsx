"use client";

import { useEffect, useState, useRef } from "react";
import { SimulationMode } from "../types";

interface RealWorldMapProps {
  simulationMode: SimulationMode;
  onStatsUpdate: (stats: { totalNodes: number; consensusHeight: number; timestamp: number }) => void;
  showLabels: boolean;
}

export default function RealWorldMap({ simulationMode, onStatsUpdate, showLabels }: RealWorldMapProps) {
  const [bitNodesData, setBitNodesData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

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

  // Draw map and nodes on canvas
  useEffect(() => {
    if (!bitNodesData || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Clear canvas
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, width, height);

    // Convert lat/lon to canvas coordinates
    const projectToCanvas = (lat: number, lon: number) => {
      const x = ((lon + 180) / 360) * width;
      const y = ((90 - lat) / 180) * height;
      return { x, y };
    };

    // Draw simplified world outline using Canvas API
    ctx.strokeStyle = '#444444';
    ctx.lineWidth = 1;
    ctx.beginPath();

    // North America
    ctx.moveTo(150, 200);
    ctx.quadraticCurveTo(200, 150, 280, 160);
    ctx.quadraticCurveTo(320, 170, 340, 200);
    ctx.quadraticCurveTo(330, 240, 300, 260);
    ctx.quadraticCurveTo(250, 280, 200, 270);
    ctx.quadraticCurveTo(160, 250, 150, 200);

    // South America
    ctx.moveTo(230, 280);
    ctx.quadraticCurveTo(250, 270, 270, 300);
    ctx.quadraticCurveTo(280, 350, 270, 400);
    ctx.quadraticCurveTo(250, 420, 230, 410);
    ctx.quadraticCurveTo(210, 380, 200, 340);
    ctx.quadraticCurveTo(205, 300, 230, 280);

    // Europe
    ctx.moveTo(480, 140);
    ctx.quadraticCurveTo(510, 130, 530, 150);
    ctx.quadraticCurveTo(540, 170, 520, 180);
    ctx.quadraticCurveTo(490, 185, 470, 175);
    ctx.quadraticCurveTo(460, 155, 480, 140);

    // Africa
    ctx.moveTo(480, 200);
    ctx.quadraticCurveTo(520, 190, 540, 220);
    ctx.quadraticCurveTo(550, 280, 540, 330);
    ctx.quadraticCurveTo(520, 360, 500, 350);
    ctx.quadraticCurveTo(470, 330, 460, 290);
    ctx.quadraticCurveTo(465, 240, 480, 200);

    // Asia
    ctx.moveTo(550, 120);
    ctx.quadraticCurveTo(650, 100, 750, 120);
    ctx.quadraticCurveTo(800, 140, 820, 170);
    ctx.quadraticCurveTo(810, 200, 780, 210);
    ctx.quadraticCurveTo(700, 220, 620, 200);
    ctx.quadraticCurveTo(570, 180, 550, 150);
    ctx.quadraticCurveTo(540, 130, 550, 120);

    // Australia
    ctx.moveTo(740, 340);
    ctx.quadraticCurveTo(780, 330, 810, 350);
    ctx.quadraticCurveTo(820, 370, 800, 380);
    ctx.quadraticCurveTo(770, 385, 750, 375);
    ctx.quadraticCurveTo(730, 365, 740, 340);

    ctx.stroke();

    // Draw Bitcoin nodes
    const nodes = Object.entries(bitNodesData.nodes);
    const validNodes = nodes
      .filter(([_, data]: [string, any]) => 
        data[8] != null && data[9] != null && 
        data[8] !== 0 && data[9] !== 0
      )
      .slice(0, 200);

    validNodes.forEach(([ip, data]: [string, any]) => {
      const coords = projectToCanvas(data[8], data[9]);
      
      // Draw node circle
      ctx.fillStyle = '#00ccf3';
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(coords.x, coords.y, 3, 0, 2 * Math.PI);
      ctx.fill();
      ctx.stroke();
    });

  }, [bitNodesData]);

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

  return (
    <div className="w-full h-full bg-black relative overflow-hidden">
      <canvas
        ref={canvasRef}
        width={1200}
        height={600}
        className="w-full h-full object-contain"
        style={{ backgroundColor: "#000000" }}
      />
    </div>
  );
}