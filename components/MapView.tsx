"use client";

import { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import { BitNodesData, SimulationMode } from "../types";

interface MapViewProps {
  simulationMode: SimulationMode;
  onStatsUpdate: (stats: { totalNodes: number; consensusHeight: number; timestamp: number }) => void;
  showLabels?: boolean;
}

export default function MapView({ simulationMode, onStatsUpdate, showLabels = true }: MapViewProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const [bitNodesData, setBitNodesData] = useState<BitNodesData | null>(null);
  const [error, setError] = useState<string | null>(null);
  // Load data
  useEffect(() => {
    console.log("Starting data load...");
    
    fetch("/bitnodes.json")
      .then(res => {
        console.log("Fetch response:", res.status, res.ok);
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        }
        return res.json();
      })
      .then((data: BitNodesData) => {
        console.log("Data loaded successfully:", data.total_nodes, "nodes");
        setBitNodesData(data);
        onStatsUpdate({
          totalNodes: data.total_nodes,
          consensusHeight: Math.max(...Object.values(data.nodes).map(n => n[4])),
          timestamp: data.timestamp,
        });
      })
      .catch(err => {
        console.error("Data load failed:", err);
        setError(`Failed to load data: ${err.message || err.toString()}`);
      });
  }, []);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    console.log("Initializing map...");
    
    // Calculate responsive zoom level based on screen size
    const getResponsiveZoom = () => {
      try {
        const width = window.innerWidth;
        const height = window.innerHeight;
        const minDimension = Math.min(width, height);
        
        if (minDimension < 600) return 1;      // Mobile
        if (minDimension < 1024) return 1.5;   // Tablet
        if (minDimension < 1440) return 2;     // Desktop
        return 2.5;                            // Large screens
      } catch (error) {
        console.error("Error calculating responsive zoom:", error);
        return 2; // Default fallback
      }
    };
    
    // Handle window resize with debouncing
    let resizeTimeout: NodeJS.Timeout;
    const handleResize = () => {
      if (map.current) {
        map.current.resize();
        
        // Debounce zoom adjustment
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
          if (map.current) {
            const newZoom = getResponsiveZoom();
            map.current.easeTo({ zoom: newZoom, duration: 500 });
          }
        }, 300);
      }
    };
    
    try {
      map.current = new maplibregl.Map({
        container: mapContainer.current,
        style: {
          version: 8,
          sources: {
            "osm": {
              type: "raster",
              tiles: [
                "https://a.tile.openstreetmap.org/{z}/{x}/{y}.png",
                "https://b.tile.openstreetmap.org/{z}/{x}/{y}.png",
                "https://c.tile.openstreetmap.org/{z}/{x}/{y}.png"
              ],
              tileSize: 256,
              attribution: "© OpenStreetMap contributors",
              minzoom: 0,
              maxzoom: 18,
            },
          },
          layers: [
            {
              id: "background",
              type: "background",
              paint: { "background-color": "#0a0a0a" },
            },
            {
              id: "osm",
              type: "raster",
              source: "osm",
              paint: {
                "raster-opacity": 0.6,
                "raster-brightness-min": 0,
                "raster-brightness-max": 0.6,
                "raster-saturation": -0.9,
                "raster-contrast": 0.8,
              },
            },
          ],
        },
        center: [0, 20],
        zoom: getResponsiveZoom(),
        minZoom: 1,
        maxZoom: 18,
        renderWorldCopies: false,
        attributionControl: false,
        interactive: true,
        doubleClickZoom: true,
        scrollZoom: true,
        boxZoom: true,
        dragRotate: false,
        dragPan: true,
        keyboard: true,
        touchZoomRotate: true,
      });

      map.current.on("load", () => {
        console.log("Map loaded!");
        // Force resize to ensure proper rendering
        setTimeout(() => {
          if (map.current) {
            map.current.resize();
          }
        }, 100);
      });

      map.current.on("sourcedata", (e) => {
        if (e.sourceId === "osm" && e.isSourceLoaded) {
          console.log("OSM tiles loaded");
        }
      });

      map.current.on("error", (e) => {
        console.error("Map error:", e);
        setError("Map failed to load");
      });

      window.addEventListener('resize', handleResize);

    } catch (err) {
      console.error("Map creation failed:", err);
      setError(`Failed to create map: ${err instanceof Error ? err.message : String(err)}`);
    }

    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(resizeTimeout);
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  // Add nodes
  useEffect(() => {
    if (!map.current || !bitNodesData) return;

    console.log("Adding nodes...");

    // Clean up
    try {
      if (map.current.getSource("nodes")) {
        if (map.current.getLayer("node-labels")) {
          map.current.removeLayer("node-labels");
        }
        map.current.removeLayer("nodes");
        map.current.removeSource("nodes");
      }
    } catch (e) {}

    // Get valid nodes
    const nodes = Object.entries(bitNodesData.nodes);
    const validNodes = nodes
      .filter(([_, data]) => 
        data[8] != null && data[9] != null && 
        data[8] !== 0 && data[9] !== 0
      )
      .slice(0, 200);

    console.log(`Adding ${validNodes.length} nodes`);

    if (validNodes.length > 0) {
      map.current.addSource("nodes", {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: validNodes.map(([ip, data]) => ({
            type: "Feature",
            properties: { ip, city: data[6], country: data[7] },
            geometry: {
              type: "Point",
              coordinates: [data[9], data[8]],
            },
          })),
        },
      });

      map.current.addLayer({
        id: "nodes",
        type: "circle",
        source: "nodes",
        paint: {
          "circle-radius": 4,
          "circle-color": "#ff6431",
          "circle-stroke-width": 1,
          "circle-stroke-color": "#ffffff",
        },
      });

      // Add labels
      if (showLabels) {
        map.current.addLayer({
          id: "node-labels",
          type: "symbol",
          source: "nodes",
          layout: {
            "text-field": ["concat", ["get", "ip"], "\n", ["get", "city"], ", ", ["get", "country"]],
            "text-font": ["Open Sans Regular"],
            "text-size": 10,
            "text-offset": [0, 1.5],
            "text-anchor": "top",
            "text-allow-overlap": false,
            "text-ignore-placement": false,
          },
          paint: {
            "text-color": "#ff6431",
            "text-halo-color": "#000000",
            "text-halo-width": 1,
          },
        });
      }

      console.log("Nodes added successfully");
    }
  }, [bitNodesData]);

  if (error) {
    return (
      <div className="w-full h-full bg-gray-900 flex items-center justify-center">
        <div className="text-red-400 text-xl">Error: {error}</div>
      </div>
    );
  }

  return (
    <div
      ref={mapContainer}
      className="w-full h-full"
      style={{ backgroundColor: "#0a0a0a" }}
    />
  );
}