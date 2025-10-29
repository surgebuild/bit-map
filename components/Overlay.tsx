"use client";

import { useState } from "react";
import { SimulationMode } from "../types";

interface OverlayProps {
  totalNodes: number;
  consensusHeight: number;
  timestamp: number;
  onSimulationModeChange: (mode: SimulationMode) => void;
}

export default function Overlay({ totalNodes, consensusHeight, timestamp, onSimulationModeChange }: OverlayProps) {
  const [currentMode, setCurrentMode] = useState<SimulationMode>("live");

  const handleModeChange = (mode: SimulationMode) => {
    setCurrentMode(mode);
    onSimulationModeChange(mode);
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString();
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    } else if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
  };

  return null;
}
