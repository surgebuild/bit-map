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
            "world": {
              type: "raster",
              tiles: [
                "https://basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}.png"
              ],
              tileSize: 256,
              attribution: "",
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
              id: "world",
              type: "raster",
              source: "world",
              paint: {
                "raster-opacity": 1.0,
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

      // Load Bitcoin icon first
      if (!map.current.hasImage('bitcoin-icon')) {
        const img = new Image(20, 20);
        img.onload = () => {
          if (map.current) {
            map.current.addImage('bitcoin-icon', img);
            
            // Add symbol layer with Bitcoin icon
            map.current.addLayer({
              id: "nodes",
              type: "symbol",
              source: "nodes",
              layout: {
                "icon-image": "bitcoin-icon",
                "icon-size": 0.8,
                "icon-allow-overlap": true,
                "icon-ignore-placement": true,
              },
            });
          }
        };
        img.src = 'data:image/svg+xml;base64,' + btoa(`
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="12" fill="#f7931a"/>
            <path d="M17.154 11.154c0.164-1.1-0.675-1.692-1.823-2.088l0.372-1.492-0.908-0.226-0.363 1.452c-0.238-0.059-0.483-0.115-0.728-0.171l0.366-1.463-0.908-0.226-0.372 1.49c-0.197-0.045-0.39-0.089-0.577-0.135l0.001-0.006-1.253-0.313-0.242 0.97s0.675 0.154 0.661 0.164c0.368 0.092 0.435 0.335 0.424 0.528l-0.424 1.702c0.025 0.006 0.058 0.015 0.094 0.029l-0.096-0.024-0.595 2.388c-0.045 0.112-0.159 0.28-0.416 0.216 0.009 0.013-0.661-0.165-0.661-0.165l-0.453 1.040 1.182 0.295c0.22 0.055 0.435 0.112 0.647 0.167l-0.376 1.508 0.907 0.226 0.372-1.492c0.247 0.067 0.487 0.129 0.722 0.188l-0.371 1.483 0.908 0.226 0.376-1.505c1.55 0.293 2.716 0.175 3.206-1.226 0.395-1.129-0.020-1.781-0.834-2.202 0.593-0.137 1.040-0.528 1.160-1.335zm-2.076 2.911c-0.281 1.128-2.181 0.518-2.796 0.365l0.499-2.002c0.615 0.154 2.589 0.458 2.297 1.637zm0.281-2.926c-0.256 1.026-1.84 0.505-2.351 0.377l0.452-1.813c0.511 0.127 2.164 0.365 1.899 1.436z" fill="white"/>
          </svg>
        `);
      } else {
        // Icon already loaded, just add the layer
        map.current.addLayer({
          id: "nodes",
          type: "symbol",
          source: "nodes",
          layout: {
            "icon-image": "bitcoin-icon",
            "icon-size": 0.8,
            "icon-allow-overlap": true,
            "icon-ignore-placement": true,
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