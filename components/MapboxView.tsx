"use client";

import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import { SimulationMode } from "../types";

interface MapboxViewProps {
  simulationMode: SimulationMode;
  onStatsUpdate: (stats: { totalNodes: number; consensusHeight: number; timestamp: number }) => void;
  showLabels: boolean;
}

export default function MapboxView({ simulationMode, onStatsUpdate, showLabels }: MapboxViewProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
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

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    try {
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: {
          version: 8,
          sources: {
            "simple-tiles": {
              type: "raster",
              tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
              tileSize: 256,
              attribution: "© OpenStreetMap contributors",
            },
          },
          layers: [
            {
              id: "background",
              type: "background",
              paint: { "background-color": "#000000" },
            },
            {
              id: "simple-tiles",
              type: "raster",
              source: "simple-tiles",
              paint: {
                "raster-opacity": 0.3,
                "raster-brightness-min": 0.2,
                "raster-brightness-max": 0.6,
                "raster-saturation": -1.0,
                "raster-contrast": 0.8,
              },
            },
          ],
        },
        center: [0, 20],
        zoom: 2,
        attributionControl: false,
        doubleClickZoom: true,
        scrollZoom: true,
        boxZoom: true,
        dragRotate: false,
        dragPan: true,
        keyboard: true,
        touchZoomRotate: true,
      });

      map.current.on("load", () => {
        console.log("Mapbox map loaded");
      });
    } catch (err) {
      console.error("Map creation failed:", err);
      setError(`Failed to create map: ${err instanceof Error ? err.message : String(err)}`);
    }

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  // Add Bitcoin nodes
  useEffect(() => {
    if (!map.current || !bitNodesData) return;

    const nodes = Object.entries(bitNodesData.nodes);
    const validNodes = nodes.filter(([_, data]: [string, any]) => data[8] != null && data[9] != null && data[8] !== 0 && data[9] !== 0).slice(0, 200);

    // Clean up existing nodes
    try {
      if (map.current.getSource("nodes")) {
        map.current.removeLayer("nodes");
        map.current.removeSource("nodes");
      }
    } catch (e) {}

    // Add nodes source
    map.current.addSource("nodes", {
      type: "geojson",
      data: {
        type: "FeatureCollection",
        features: validNodes.map(([ip, data]: [string, any]) => ({
          type: "Feature",
          properties: { ip },
          geometry: {
            type: "Point",
            coordinates: [data[9], data[8]], // [lon, lat]
          },
        })),
      },
    });

    // Add nodes layer
    map.current.addLayer({
      id: "nodes",
      type: "circle",
      source: "nodes",
      paint: {
        "circle-radius": 4,
        "circle-color": "#00ccf3",
        "circle-stroke-width": 1,
        "circle-stroke-color": "#ffffff",
        "circle-opacity": 0.9,
      },
    });
  }, [bitNodesData]);

  if (error) {
    return (
      <div className="w-full h-full bg-gray-900 flex items-center justify-center">
        <div className="text-red-400 text-xl">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="w-full h-full relative">
      <div ref={mapContainer} className="w-full h-full" style={{ backgroundColor: "#000000" }} />
    </div>
  );
}
