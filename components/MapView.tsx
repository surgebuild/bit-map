"use client";

import { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import { SimulationMode } from "../types";

interface MapViewProps {
  simulationMode: SimulationMode;
  onStatsUpdate: (stats: { totalNodes: number; consensusHeight: number; timestamp: number }) => void;
  showLabels?: boolean;
}

interface MinerDialogProps {
  minerData: any;
  ip: string;
  onClose: () => void;
}

// Country center coordinates and zoom levels
const countryCoordinates: Record<string, { center: [number, number]; zoom: number }> = {
  IN: { center: [78.9629, 20.5937], zoom: 5 }, // India
  US: { center: [-95.7129, 37.0902], zoom: 4 }, // United States
  CN: { center: [104.1954, 35.8617], zoom: 4 }, // China
  DE: { center: [10.4515, 51.1657], zoom: 6 }, // Germany
  GB: { center: [-3.436, 55.3781], zoom: 6 }, // United Kingdom
  FR: { center: [2.2137, 46.2276], zoom: 6 }, // France
  CA: { center: [-106.3468, 56.1304], zoom: 4 }, // Canada
  AU: { center: [133.7751, -25.2744], zoom: 4 }, // Australia
  NL: { center: [5.2913, 52.1326], zoom: 7 }, // Netherlands
  JP: { center: [138.2529, 36.2048], zoom: 6 }, // Japan
};

// Country flag emojis
const countryFlags: Record<string, string> = {
  IN: "🇮🇳",
  US: "🇺🇸",
  CN: "🇨🇳",
  DE: "🇩🇪",
  GB: "🇬🇧",
  FR: "🇫🇷",
  CA: "🇨🇦",
  AU: "🇦🇺",
  NL: "🇳🇱",
  JP: "🇯🇵",
};

// Miner Dialog Component
function MinerDialog({ minerData, ip, onClose }: MinerDialogProps) {
  const data = minerData as any[];

  // Parse miner data - indices: 0=protocol, 1=version, 2=timestamp, 3=services, 4=height,
  // 5=hostname, 6=city, 7=country, 8=lat, 9=lon, 10=timezone, 11=ASN, 12=ISP
  const protocol = data[0] || "Unknown";
  const version = data[1] || "Unknown";
  const city = data[6] || "Unknown";
  const country = data[7] || "Unknown";
  const latitude = data[8] || 0;
  const longitude = data[9] || 0;
  const timezone = data[10] || "Unknown";
  const asn = data[11] || "Unknown";
  const isp = data[12] || "Unknown";
  const blockHeight = data[4] || 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 p-4" onClick={onClose}>
      <div className="bg-black border border-white md:border-2 p-4 md:p-6 rounded max-w-md w-full max-h-[90vh] overflow-y-auto pixelated" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-start mb-3 md:mb-4">
          <div className="flex items-center gap-2">
            <img src="/main_logo.png" alt="Logo" className="w-8 h-8 md:w-12 md:h-12" />
            <h2 className="text-lg md:text-2xl font-bold text-white">MINER INFO</h2>
          </div>
          <button onClick={onClose} className="text-white hover:text-gray-400 text-2xl md:text-3xl flex-shrink-0">
            ×
          </button>
        </div>

        <div className="space-y-2 md:space-y-3 text-white text-sm md:text-base">
          <div>
            <span className="text-[#f7931a] font-bold text-xs md:text-sm">IP Address:</span>
            <div className="mt-1 break-words break-all text-xs md:text-sm">{ip}</div>
          </div>

          <div>
            <span className="text-[#f7931a] font-bold text-xs md:text-sm">Location:</span>
            <div className="mt-1 text-xs md:text-sm">
              {city}, {country}
            </div>
          </div>

          <div>
            <span className="text-[#f7931a] font-bold text-xs md:text-sm">Coordinates:</span>
            <div className="mt-1 text-xs md:text-sm">
              <span className="font-number">
                {latitude.toFixed(4)}, {longitude.toFixed(4)}
              </span>
            </div>
          </div>

          <div>
            <span className="text-[#f7931a] font-bold text-xs md:text-sm">Bitcoin Version:</span>
            <div className="mt-1 text-xs md:text-sm">{version}</div>
          </div>

          <div>
            <span className="text-[#f7931a] font-bold text-xs md:text-sm">Protocol:</span>
            <div className="mt-1 text-xs md:text-sm">{protocol}</div>
          </div>

          <div>
            <span className="text-[#f7931a] font-bold text-xs md:text-sm">ISP:</span>
            <div className="mt-1 text-xs md:text-sm">{isp}</div>
          </div>

          <div>
            <span className="text-[#f7931a] font-bold text-xs md:text-sm">Timezone:</span>
            <div className="mt-1 text-xs md:text-sm">{timezone}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function MapView({ simulationMode, onStatsUpdate, showLabels = true }: MapViewProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);
  const [bitNodesData, setBitNodesData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedCountry, setSelectedCountry] = useState<string>("");
  const [filteredCount, setFilteredCount] = useState<number>(0);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [selectedMiner, setSelectedMiner] = useState<{ ip: string; data: any } | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Detect user location via IPInfo
  useEffect(() => {
    const detectLocation = async () => {
      try {
        const apiKey = process.env.NEXT_PUBLIC_IPINFO_API_KEY;
        const response = await fetch(`https://ipinfo.io/json?token=${apiKey}`);
        if (response.ok) {
          const data = await response.json();
          console.log("Detected location:", data);
          const country = data.country || "US"; // Default to US if not found
          setSelectedCountry(country);
        } else {
          // Default to US if API fails
          setSelectedCountry("US");
        }
      } catch (err) {
        console.error("Failed to detect location:", err);
        // Default to US if detection fails
        setSelectedCountry("US");
      }
    };
    detectLocation();
  }, []);

  // Zoom to country when selected
  useEffect(() => {
    if (!map.current || !selectedCountry) return;

    const countryInfo = countryCoordinates[selectedCountry];
    if (countryInfo) {
      map.current.flyTo({
        center: countryInfo.center,
        zoom: countryInfo.zoom,
        duration: 1500,
      });
    }
  }, [selectedCountry]);

  // Load data with delay
  useEffect(() => {
    console.log("Starting data load...");

    // Add delay before starting to load
    const loadingDelay = setTimeout(() => {
      fetch("/bitnoderest.json")
        .then((res) => {
          console.log("Fetch response:", res.status, res.ok);
          if (!res.ok) {
            throw new Error(`HTTP ${res.status}: ${res.statusText}`);
          }
          return res.json();
        })
        .then((data: any) => {
          console.log("Data loaded successfully:", Object.keys(data).length, "nodes");
          const totalNodes = Object.keys(data).length;
          setBitNodesData(data);
          setTotalCount(totalNodes);
          setIsLoading(false);
          onStatsUpdate({
            totalNodes: totalNodes,
            consensusHeight: Math.max(...Object.values(data).map((n: any) => n[4])),
            timestamp: Date.now(),
          });
        })
        .catch((err) => {
          console.error("Data load failed:", err);
          setError(`Failed to load data: ${err.message || err.toString()}`);
          setIsLoading(false);
        });
    }, 2000); // 2 second delay

    return () => clearTimeout(loadingDelay);
  }, []);

  // Initialize map
  useEffect(() => {
    if (isLoading || !mapContainer.current || map.current) return;

    console.log("Initializing map...");

    // Calculate responsive zoom level based on screen size
    const getResponsiveZoom = () => {
      try {
        const width = window.innerWidth;
        const height = window.innerHeight;
        const minDimension = Math.min(width, height);

        if (minDimension < 600) return 1; // Mobile
        if (minDimension < 1024) return 1.5; // Tablet
        if (minDimension < 1440) return 2; // Desktop
        return 2.5; // Large screens
      } catch (error) {
        console.error("Error calculating responsive zoom:", error);
        return 2; // Default fallback
      }
    };

    // Handle window resize (only resize, don't change zoom)
    const handleResize = () => {
      if (map.current) {
        map.current.resize();
      }
    };

    try {
      map.current = new maplibregl.Map({
        container: mapContainer.current,
        style: {
          version: 8,
          sources: {
            world: {
              type: "raster",
              tiles: ["https://basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}.png"],
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

      window.addEventListener("resize", handleResize);
    } catch (err) {
      console.error("Map creation failed:", err);
      setError(`Failed to create map: ${err instanceof Error ? err.message : String(err)}`);
    }

    return () => {
      window.removeEventListener("resize", handleResize);
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [isLoading]);

  // Add nodes with country filtering
  useEffect(() => {
    if (!map.current || !bitNodesData) return;

    console.log("Adding nodes...");
    console.log("Filtering by country:", selectedCountry);

    // Clean up existing markers
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

    // Get valid nodes
    const nodes = Object.entries(bitNodesData);
    let validNodes = nodes.filter(([_, data]: [string, any]) => data[8] != null && data[9] != null && data[8] !== 0 && data[9] !== 0);

    // Filter by country if a country is selected
    if (selectedCountry) {
      validNodes = validNodes.filter(([_, data]: [string, any]) => data[7] === selectedCountry);
    }

    setFilteredCount(validNodes.length);
    console.log(`Adding ${validNodes.length} nodes for country: ${selectedCountry || "ALL"}`);

    if (validNodes.length > 0) {
      // Add markers with animated GIF
      validNodes.forEach(([ip, data]: [string, any]) => {
        // Create a custom HTML element for the marker
        const el = document.createElement("div");
        el.className = "bitcoin-node-marker";
        // Make markers responsive - slightly smaller on mobile for better tap targets
        const isMobile = window.innerWidth < 768;
        const markerSize = isMobile ? "24px" : "30px";
        el.style.width = markerSize;
        el.style.height = markerSize;
        el.style.backgroundImage = "url(/sato.gif)";
        el.style.backgroundSize = "contain";
        el.style.backgroundRepeat = "no-repeat";
        el.style.backgroundPosition = "center";
        el.style.cursor = "pointer";
        el.style.touchAction = "manipulation"; // Improve touch responsiveness
        el.style.transition = "opacity 0.2s, filter 0.2s";
        el.style.willChange = "opacity, filter";

        // Add hover effect (using opacity and filter instead of transform to avoid repositioning)
        el.addEventListener("mouseenter", () => {
          el.style.opacity = "0.9";
          el.style.filter = "brightness(1.3) drop-shadow(0 0 8px rgba(247, 147, 26, 0.8))";
        });
        el.addEventListener("mouseleave", () => {
          el.style.opacity = "1";
          el.style.filter = "none";
        });

        // Add click handler
        el.addEventListener("click", () => {
          setSelectedMiner({ ip, data });
        });

        // Create marker
        const marker = new maplibregl.Marker({
          element: el,
          anchor: "center",
        })
          .setLngLat([data[9], data[8]])
          .addTo(map.current!);

        // Store marker reference for cleanup
        markersRef.current.push(marker);
      });

      console.log("Nodes added successfully");
    }
  }, [bitNodesData, selectedCountry]);

  if (error) {
    return (
      <div className="w-full h-full bg-gray-900 flex items-center justify-center">
        <div className="text-red-400 text-xl">Error: {error}</div>
      </div>
    );
  }

  // Loading screen
  if (isLoading) {
    return (
      <div className="w-full h-full relative flex items-center justify-center" style={{ backgroundColor: "#0a0a0a" }}>
        <div className="flex flex-col items-center justify-center gap-6 pixelated">
          <img src="/sato.gif" alt="Loading" className="w-32 h-32 md:w-40 md:h-40" />
          <p className="text-white text-xl md:text-2xl font-bold text-center">Finding your friendly neighborhood Satoshi</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full relative" style={{ backgroundColor: "#0a0a0a" }}>
      <div ref={mapContainer} className="w-full h-full" />

      {/* Title - Top Left */}
      <div className="absolute top-2 left-2 md:top-4 md:left-4 z-10 pixelated flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
        <img src="/main_logo.png" alt="Sato Finder" className="w-10 h-10 md:w-20 md:h-20" />
        <div>
          <h1 className="text-xl md:text-5xl font-bold mb-0 md:mb-1" style={{ color: "#f7931a" }}>
            SATO FINDER
          </h1>
          <p className="text-white text-xs md:text-base hidden md:block">Find your friendly neighborhood satoshi</p>
        </div>
      </div>

      {/* Country Selector - Top Right */}
      <div className="absolute top-2 right-2 md:top-4 md:right-4 z-10 bg-black bg-opacity-80 border border-white md:border-2 p-2 md:p-3 rounded pixelated max-w-[calc(100vw-4rem)] md:max-w-none">
        <label className="text-white text-xs md:text-sm font-bold mb-1 md:mb-2 block">COUNTRY</label>
        <div className="flex items-center gap-2">
          <select value={selectedCountry} onChange={(e) => setSelectedCountry(e.target.value)} className="bg-black text-white border border-white md:border-2 px-2 py-1 md:px-3 md:py-2 rounded cursor-pointer pixelated flex-1 text-xs md:text-sm">
            <option value="">ALL COUNTRIES</option>
            <option value="IN">🇮🇳 INDIA</option>
            <option value="US">🇺🇸 UNITED STATES</option>
            <option value="CN">🇨🇳 CHINA</option>
            <option value="DE">🇩🇪 GERMANY</option>
            <option value="GB">🇬🇧 UNITED KINGDOM</option>
            <option value="FR">🇫🇷 FRANCE</option>
            <option value="CA">🇨🇦 CANADA</option>
            <option value="AU">🇦🇺 AUSTRALIA</option>
            <option value="NL">🇳🇱 NETHERLANDS</option>
            <option value="JP">🇯🇵 JAPAN</option>
          </select>
        </div>
      </div>

      {/* Total Miners Count - Bottom Left */}
      <div className="absolute bottom-2 left-2 md:bottom-4 md:left-4 z-10 bg-black bg-opacity-80 border border-white p-2 md:p-3 rounded pixelated">
        <div className="flex items-end justify-start gap-2">
          <div className="text-left">
            <div className="text-white text-2xl md:text-5xl font-bold leading-none font-number" style={{ textShadow: "2px 2px 0px #0a0a0a" }}>
              {totalCount.toLocaleString()}
            </div>
            <div className="text-white text-xs mt-1 md:mt-1.5 flex items-center gap-1 md:gap-2">
              <img src="/bitcoin_miner.png" alt="Miner" className="w-4 h-4 md:w-6 md:h-6" />
              <span className="text-[10px] md:text-xs">TOTAL MINERS</span>
            </div>
          </div>
        </div>
      </div>

      {/* Miners Count - Bottom Right */}
      <div className="absolute bottom-2 right-2 md:bottom-4 md:right-4 z-10 bg-black bg-opacity-80 border border-white p-2 md:p-3 rounded pixelated">
        <div className="flex items-end justify-end gap-2">
          <div className="text-right">
            <div className="text-white text-2xl md:text-5xl font-bold leading-none font-number" style={{ textShadow: "2px 2px 0px #0a0a0a" }}>
              {filteredCount.toLocaleString()}
            </div>
            <div className="text-white text-xs mt-1 md:mt-1.5 flex items-center justify-end gap-1 md:gap-2">
              <img src="/bitcoin_miner.png" alt="Miner" className="w-4 h-4 md:w-6 md:h-6" />
              <span className="text-[10px] md:text-xs">MINERS</span>
            </div>
          </div>
        </div>
      </div>

      {/* Miner Dialog */}
      {selectedMiner && <MinerDialog minerData={selectedMiner.data} ip={selectedMiner.ip} onClose={() => setSelectedMiner(null)} />}
    </div>
  );
}
