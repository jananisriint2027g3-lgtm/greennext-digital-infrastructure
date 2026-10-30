import { useRef, useState, useMemo } from "react";
import { InternalLink as Link } from "../common/InternalLink";
import { REGIONS_DATA, REGIONAL_NETWORK_DISCLAIMER, RegionInfo } from "../../data/regions";
import { REGIONAL_PORTFOLIO, RegionalPortfolioLocation } from "../../data/regionalPortfolio";
import { SOUTH_INDIA_STATES, GEO_BOUNDS } from "../../data/southIndiaGeo";
import { Globe2, ArrowRight, ShieldCheck, CheckCircle2, Radio } from "../icons";
import { trackEvent } from "../../lib/analytics";
import maduraiImg from "../../assets/madurai-infrastructure.jpg";
import coimbatoreImg from "../../assets/coimbatore-infrastructure.jpg";
import trichyImg from "../../assets/trichy-infrastructure.jpg";
import mangaloreImg from "../../assets/mangalore-infrastructure.jpg";

const REGION_IMAGES: Record<string, { src: string; alt: string }> = {
  madurai: {
    src: maduraiImg,
    alt: "Madurai regional technology and infrastructure corridor in South India",
  },
  coimbatore: {
    src: coimbatoreImg,
    alt: "Coimbatore industrial technology park in western Tamil Nadu",
  },
  trichy: {
    src: trichyImg,
    alt: "Tiruchirappalli central Tamil Nadu highway and rail connectivity junction",
  },
  mangalore: {
    src: mangaloreImg,
    alt: "Mangalore coastal port infrastructure in coastal Karnataka",
  },
};

const MAP_BOUNDS = GEO_BOUNDS;
const SVG_W = 520;
const SVG_H = 520;
const MAP_MIN_SCALE = 1;
const MAP_MAX_SCALE = 2.5;

function project(lon: number, lat: number): [number, number] {
  const x = ((lon - MAP_BOUNDS.west) / (MAP_BOUNDS.east - MAP_BOUNDS.west)) * SVG_W;
  const y = ((MAP_BOUNDS.north - lat) / (MAP_BOUNDS.north - MAP_BOUNDS.south)) * SVG_H;
  return [x, y];
}
function ringToPath(ring: [number, number][]): string {
  return (
    ring
      .map(([lon, lat], i) => {
        const [x, y] = project(lon, lat);
        return (i === 0 ? "M" : "L") + x.toFixed(1) + "," + y.toFixed(1);
      })
      .join(" ") + " Z"
  );
}

interface LocationDef {
  latitude: number;
  longitude: number;
  code: string;
  label: string;
}

const MAP_LOCATIONS: Record<string, LocationDef> = {
  mangalore: { latitude: 12.9141, longitude: 74.856, code: "IXE", label: "Mangalore" },
  hosur: { latitude: 12.7409, longitude: 77.8253, code: "HSR", label: "Hosur" },
  coimbatore: { latitude: 11.0168, longitude: 76.9558, code: "CJB", label: "Coimbatore" },
  trichy: { latitude: 10.7905, longitude: 78.7047, code: "TRZ", label: "Trichy" },
  madurai: { latitude: 9.9252, longitude: 78.1198, code: "MDU", label: "Madurai" },
  tirunelveli: { latitude: 8.7139, longitude: 77.7567, code: "TNV", label: "Tirunelveli" },
  puducherry: { latitude: 11.9416, longitude: 79.8083, code: "PDY", label: "Puducherry" },
};

// Reference-only cities — shown as geographic context, NOT as GreenNext nodes
const CONTEXT_CITIES = [
  { label: "Bengaluru", latitude: 12.9716, longitude: 77.5946 },
  { label: "Chennai", latitude: 13.0827, longitude: 80.2707 },
  { label: "Salem", latitude: 11.6643, longitude: 78.146 },
];

const STATE_LABELS = [
  { id: "karnataka", name: "KARNATAKA", lon: 76.0, lat: 15.0 },
  { id: "kerala", name: "KERALA", lon: 75.5, lat: 10.4 },
  { id: "tamilnadu", name: "TAMIL NADU", lon: 78.6, lat: 11.5 },
  { id: "andhrapradesh", name: "ANDHRA PRADESH", lon: 80.4, lat: 15.5 },
  { id: "telangana", name: "TELANGANA", lon: 79.0, lat: 18.2 },
];

const LOCATION_LABEL_OFFSETS: Record<string, { dx: number; dy: number; anchor: "start" | "end" }> =
  {
    mangalore: { dx: 13, dy: -3, anchor: "start" },
    hosur: { dx: 13, dy: -3, anchor: "start" },
    coimbatore: { dx: 12, dy: -12, anchor: "start" },
    trichy: { dx: 12, dy: -12, anchor: "start" },
    madurai: { dx: 13, dy: 16, anchor: "start" },
    tirunelveli: { dx: 13, dy: 16, anchor: "start" },
    puducherry: { dx: 13, dy: -3, anchor: "start" },
  };

const CONTEXT_CITY_LABEL_OFFSETS: Record<
  string,
  { dx: number; dy: number; anchor: "start" | "middle" }
> = {
  Bengaluru: { dx: 5, dy: -6, anchor: "start" },
  Chennai: { dx: 5, dy: -6, anchor: "start" },
  Salem: { dx: 5, dy: -6, anchor: "start" },
};

const OCEAN_LABELS = [
  { text: "ARABIAN SEA", lon: 73.85, lat: 11.8 },
  { text: "BAY OF BENGAL", lon: 82.5, lat: 12.0 },
];

// These are conceptual regional relationships, NOT physical infrastructure routes.
const CONCEPTUAL_RELATIONSHIPS: [string, string][] = [
  ["mangalore", "coimbatore"],
  ["mangalore", "hosur"],
  ["mangalore", "trichy"],
  ["mangalore", "madurai"],
  ["hosur", "puducherry"],
  ["coimbatore", "trichy"],
  ["coimbatore", "madurai"],
  ["trichy", "madurai"],
  ["trichy", "puducherry"],
  ["madurai", "tirunelveli"],
];

const PORTFOLIO_REGION_CODES: Record<string, string> = {
  hosur: "HSR",
  tirunelveli: "TNV",
  puducherry: "PDY",
};

function fallbackRegion(portfolio: RegionalPortfolioLocation): RegionInfo {
  const mapLocation = MAP_LOCATIONS[portfolio.id]!;
  return {
    id: portfolio.id,
    name: portfolio.name,
    code: PORTFOLIO_REGION_CODES[portfolio.id] ?? portfolio.id.slice(0, 3).toUpperCase(),
    tagline: portfolio.tagline,
    role: portfolio.facilityType,
    category: "Regional infrastructure planning focus",
    intro: portfolio.overview,
    infrastructureRelevance: portfolio.connectivity.value,
    ecosystem: portfolio.ecosystems.join(" · "),
    connectivity: `${portfolio.connectivity.value}. ${portfolio.travel.value}.`,
    networkRole: `GreenNext's conceptual regional network includes ${portfolio.name} as a ${portfolio.tagline.toLowerCase()}.`,
    regionalIntent: portfolio.focus.join(" · "),
    evidenceStatus: portfolio.status === "Proposed" ? "Proposed" : "Not Confirmed",
    referenceSource: "Internal regional portfolio data",
    relevantOfferings: portfolio.focus,
    referenceClaims: portfolio.conflicts,
    position: {
      left: `${((mapLocation.longitude - MAP_BOUNDS.west) / (MAP_BOUNDS.east - MAP_BOUNDS.west)) * 100}%`,
      top: `${((MAP_BOUNDS.north - mapLocation.latitude) / (MAP_BOUNDS.north - MAP_BOUNDS.south)) * 100}%`,
    },
    transitInfo: [portfolio.travel.value, portfolio.connectivity.value],
    image:
      portfolio.id === "puducherry"
        ? "mangalore"
        : portfolio.id === "tirunelveli"
          ? "trichy"
          : "coimbatore",
  };
}

function conceptualArcPath(from: [number, number], to: [number, number], index: number): string {
  const [x1, y1] = from;
  const [x2, y2] = to;
  const dx = x2 - x1;
  const dy = y2 - y1;
  const length = Math.max(Math.sqrt(dx * dx + dy * dy), 1);
  const bend = (index % 2 === 0 ? 1 : -1) * Math.min(24, length * 0.16);
  const controlX = (x1 + x2) / 2 - (dy / length) * bend;
  const controlY = (y1 + y2) / 2 + (dx / length) * bend;
  return `M${x1.toFixed(1)},${y1.toFixed(1)} Q${controlX.toFixed(1)},${controlY.toFixed(1)} ${x2.toFixed(1)},${y2.toFixed(1)}`;
}

export function RegionalExplorer() {
  const [selectedRegionId, setSelectedRegionId] = useState<string>("madurai");
  const [mapScale, setMapScale] = useState(MAP_MIN_SCALE);
  const [mapOffset, setMapOffset] = useState({ x: 0, y: 0 });
  const dragState = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    originX: number;
    originY: number;
  } | null>(null);

  const clampOffset = (value: number, scale: number, viewportSize: number) => {
    const maxOffset = Math.max((scale - 1) * viewportSize * 0.45, 0);
    return Math.max(-maxOffset, Math.min(maxOffset, value));
  };

  const updateMapScale = (nextScale: number) => {
    const scale = Math.max(MAP_MIN_SCALE, Math.min(MAP_MAX_SCALE, nextScale));
    setMapScale(scale);
    setMapOffset((offset) => ({
      x: clampOffset(offset.x, scale, SVG_W),
      y: clampOffset(offset.y, scale, SVG_H),
    }));
  };

  const resetMapView = () => {
    setMapScale(MAP_MIN_SCALE);
    setMapOffset({ x: 0, y: 0 });
  };
  const activePortfolio =
    REGIONAL_PORTFOLIO.find((location) => location.id === selectedRegionId) ??
    REGIONAL_PORTFOLIO[0]!;
  const activeRegion: RegionInfo =
    REGIONS_DATA[selectedRegionId] ?? fallbackRegion(activePortfolio);
  const snapshotFields = [
    activePortfolio.land,
    activePortfolio.sitePower,
    activePortfolio.itLoad,
    activePortfolio.cooling,
    activePortfolio.connectivity,
  ];

  const statePaths = useMemo(
    () =>
      SOUTH_INDIA_STATES.map((state) => ({
        id: state.id,
        name: state.name,
        d: state.rings.map(ringToPath).join(" "),
      })),
    [],
  );

  const activeLoc = MAP_LOCATIONS[selectedRegionId];
  const activePoint = activeLoc ? project(activeLoc.longitude, activeLoc.latitude) : undefined;
  const projectedLocations = useMemo(
    () =>
      Object.fromEntries(
        Object.entries(MAP_LOCATIONS).map(([id, location]) => [
          id,
          project(location.longitude, location.latitude),
        ]),
      ) as Record<string, [number, number]>,
    [],
  );
  const conceptualArcs = useMemo(
    () =>
      CONCEPTUAL_RELATIONSHIPS.map(([from, to], index) => ({
        d: conceptualArcPath(projectedLocations[from]!, projectedLocations[to]!, index),
        index,
      })),
    [projectedLocations],
  );

  return (
    <div className="rounded-2xl border border-[#1E293B] bg-[#0D1520] p-6 sm:p-8 lg:p-10 shadow-2xl">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 mb-8 border-b border-[#1E293B]">
        <div>
          <span className="text-xs font-mono uppercase tracking-widest text-[#10B981] font-semibold flex items-center gap-1.5">
            <Globe2 size={14} />
            <span>SOUTH INDIA REGIONAL NETWORK</span>
          </span>
          <h3 className="text-xl sm:text-2xl font-bold text-white mt-1">
            Seven Regional Planning Locations
          </h3>
        </div>
        <div className="flex items-center gap-2 text-xs font-mono text-[#94A3B8] bg-[#0B0F17] px-3 py-1.5 rounded-lg border border-[#1E293B]">
          <Radio size={11} className="text-[#10B981] animate-pulse" />
          <span>7 REGIONAL PLANNING NODES</span>
        </div>
      </div>

      {/* Quick Region Selector Pills for mobile / touch accessibility */}
      <div className="flex flex-wrap items-center gap-2 mb-6 lg:hidden">
        {Object.entries(MAP_LOCATIONS).map(([id, loc]) => {
          const isSelected = selectedRegionId === id;
          return (
            <button
              key={id}
              onClick={() => {
                setSelectedRegionId(id);
                trackEvent({
                  tab: "Regions",
                  event: "region_tab_select",
                  value: `${loc.label} (${loc.code})`,
                });
              }}
              className={`px-3.5 py-2 min-h-[40px] rounded-lg text-xs font-mono font-medium transition-colors ${
                isSelected
                  ? "bg-[#10B981] text-[#070A0E] font-bold shadow-md"
                  : "bg-[#0B0F17] text-[#94A3B8] border border-[#1E293B] hover:text-white"
              }`}
            >
              {loc.label} ({loc.code})
            </button>
          );
        })}
      </div>

      {/* Main Split Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start mb-8">
        {/* ── LEFT: Premium Geographic Map ─────────────────────────────── */}
        <div className="lg:col-span-6 relative flex flex-col rounded-xl border border-[#1E3445] bg-[#07111D] overflow-hidden p-3 sm:p-4 shadow-2xl">
          <div
            className="relative w-full aspect-[10/11] lg:aspect-[5/6] overflow-hidden rounded-lg touch-none"
            aria-label="Interactive conceptual South India regional map"
            onWheel={(event) => {
              event.preventDefault();
              updateMapScale(mapScale + (event.deltaY < 0 ? 0.15 : -0.15));
            }}
            onPointerDown={(event) => {
              event.currentTarget.setPointerCapture(event.pointerId);
              dragState.current = {
                pointerId: event.pointerId,
                startX: event.clientX,
                startY: event.clientY,
                originX: mapOffset.x,
                originY: mapOffset.y,
              };
            }}
            onPointerMove={(event) => {
              const drag = dragState.current;
              if (!drag || drag.pointerId !== event.pointerId) return;
              setMapOffset({
                x: clampOffset(drag.originX + event.clientX - drag.startX, mapScale, SVG_W),
                y: clampOffset(drag.originY + event.clientY - drag.startY, mapScale, SVG_H),
              });
            }}
            onPointerUp={(event) => {
              if (dragState.current?.pointerId === event.pointerId) {
                dragState.current = null;
                event.currentTarget.releasePointerCapture(event.pointerId);
              }
            }}
            onPointerCancel={() => {
              dragState.current = null;
            }}
          >
            <div
              className="absolute right-3 top-3 z-10 flex flex-col gap-1 rounded-lg border border-[#334155] bg-[#05080F]/90 p-1 shadow-lg backdrop-blur-sm"
              onPointerDown={(event) => event.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => updateMapScale(mapScale + 0.25)}
                className="flex h-9 w-9 items-center justify-center rounded-md text-lg text-white transition-colors hover:bg-[#1E293B] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#10B981]"
                aria-label="Zoom in on regional map"
                title="Zoom in"
              >
                +
              </button>
              <button
                type="button"
                onClick={() => updateMapScale(mapScale - 0.25)}
                className="flex h-9 w-9 items-center justify-center rounded-md text-lg text-white transition-colors hover:bg-[#1E293B] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#10B981]"
                aria-label="Zoom out of regional map"
                title="Zoom out"
              >
                −
              </button>
              <button
                type="button"
                onClick={resetMapView}
                className="flex h-9 w-9 items-center justify-center rounded-md text-[10px] font-mono uppercase text-[#CBD5E1] transition-colors hover:bg-[#1E293B] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#10B981]"
                aria-label="Reset regional map view"
                title="Reset view"
              >
                {mapScale.toFixed(1)}:1
              </button>
            </div>
            <svg
              viewBox={`0 0 ${SVG_W} ${SVG_H}`}
              className="absolute inset-0 h-full w-full cursor-grab transition-transform duration-150 active:cursor-grabbing"
              style={{
                transform: `translate(${mapOffset.x}px, ${mapOffset.y}px) scale(${mapScale})`,
                transformOrigin: "center",
              }}
              role="img"
              aria-label="Geographic map of South India showing seven GreenNext regional planning locations"
            >
              <defs>
                {/* Glow filters */}
                <filter id="gn-node-idle" x="-120%" y="-120%" width="340%" height="340%">
                  <feGaussianBlur stdDeviation="3.5" result="b" />
                  <feMerge>
                    <feMergeNode in="b" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
                <filter id="gn-node-active" x="-150%" y="-150%" width="400%" height="400%">
                  <feGaussianBlur stdDeviation="9" result="b" />
                  <feMerge>
                    <feMergeNode in="b" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
                <filter id="gn-halo" x="-200%" y="-200%" width="500%" height="500%">
                  <feGaussianBlur stdDeviation="18" result="b" />
                  <feMerge>
                    <feMergeNode in="b" />
                  </feMerge>
                </filter>

                {/* Radial gradient for active node area glow */}
                <radialGradient id="rg-active" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#10B981" stopOpacity="0.18" />
                  <stop offset="60%" stopColor="#10B981" stopOpacity="0.06" />
                  <stop offset="100%" stopColor="#10B981" stopOpacity="0" />
                </radialGradient>

                {/* Land gradient for depth */}
                <linearGradient id="lg-land" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#243447" />
                  <stop offset="52%" stopColor="#1E293B" />
                  <stop offset="100%" stopColor="#1B2637" />
                </linearGradient>

                {/* Ocean depth gradient: navy, visible, and free of a black void. */}
                <radialGradient id="rg-ocean" cx="46%" cy="46%" r="78%">
                  <stop offset="0%" stopColor="#101A2A" />
                  <stop offset="68%" stopColor="#0B0F19" />
                  <stop offset="100%" stopColor="#080C15" />
                </radialGradient>

                {/* Very light edge treatment keeps the map contained without obscuring geography. */}
                <radialGradient id="rg-vignette" cx="50%" cy="50%" r="70%">
                  <stop offset="0%" stopColor="transparent" />
                  <stop offset="100%" stopColor="#0B0F19" stopOpacity="0.035" />
                </radialGradient>

                {/* Subtle cartographic texture, intentionally subordinate to the geography. */}
                <pattern id="map-grid" width="52" height="52" patternUnits="userSpaceOnUse">
                  <path
                    d="M 52 0 L 0 0 0 52"
                    fill="none"
                    stroke="#64748B"
                    strokeWidth="0.3"
                    opacity="0.06"
                  />
                </pattern>

                {/* Pulse animation keyframes */}
                <style>{`
                  @keyframes gn-pulse {
                    0%, 100% { opacity: 0.62; r: 13; }
                    50% { opacity: 0.16; r: 20; }
                  }
                  @keyframes gn-pulse-outer {
                    0%, 100% { opacity: 0.28; r: 20; }
                    50% { opacity: 0.04; r: 30; }
                  }
                  @keyframes gn-arc-flow {
                    0%, 100% { opacity: 0.28; }
                    50% { opacity: 0.10; }
                  }
                  .gn-pulse-inner { animation: gn-pulse 2.4s ease-in-out infinite; }
                  .gn-pulse-outer { animation: gn-pulse-outer 2.4s ease-in-out infinite; }
                  .gn-arc { animation: gn-arc-flow 3.5s ease-in-out infinite; }
                `}</style>
              </defs>

              {/* ── Ocean base ── */}
              <rect width={SVG_W} height={SVG_H} fill="url(#rg-ocean)" />
              <rect width={SVG_W} height={SVG_H} fill="url(#map-grid)" opacity="0.18" />

              {/* ── Land polygons ── */}
              {statePaths.map((sp) => (
                <path
                  key={sp.id}
                  d={sp.d}
                  fill="url(#lg-land)"
                  stroke="#64748B"
                  strokeWidth="1.1"
                  strokeLinejoin="round"
                  opacity="0.72"
                />
              ))}

              {/* ── Coastline highlight (thinner, brighter border on ocean edge) ── */}
              {statePaths.map((sp) => (
                <path
                  key={"coast-" + sp.id}
                  d={sp.d}
                  fill="none"
                  stroke="#718096"
                  strokeWidth="0.7"
                  strokeLinejoin="round"
                  opacity="0.62"
                />
              ))}

              {/* ── State labels ── */}
              {STATE_LABELS.map((sl) => {
                const [x, y] = project(sl.lon, sl.lat);
                return (
                  <text
                    key={sl.id}
                    x={x}
                    y={y}
                    fill="#94A3B8"
                    fontSize="8"
                    fontFamily="ui-monospace,SFMono-Regular,monospace"
                    letterSpacing="1.7"
                    textAnchor="middle"
                    dominantBaseline="middle"
                    opacity="0.7"
                  >
                    {sl.name}
                  </text>
                );
              })}

              {/* ── Ocean labels ── */}
              {OCEAN_LABELS.map((ol) => {
                const [x, y] = project(ol.lon, ol.lat);
                return (
                  <text
                    key={ol.text}
                    x={x}
                    y={y}
                    fill="#718096"
                    fontSize="7.5"
                    fontFamily="ui-monospace,SFMono-Regular,monospace"
                    letterSpacing="2"
                    textAnchor="middle"
                    dominantBaseline="middle"
                    opacity="0.58"
                  >
                    {ol.text}
                  </text>
                );
              })}

              {/* ── Geographic reference cities (NOT GreenNext nodes) ── */}
              {CONTEXT_CITIES.map((c) => {
                const [x, y] = project(c.longitude, c.latitude);
                const labelOffset = CONTEXT_CITY_LABEL_OFFSETS[c.label] ?? {
                  dx: 0,
                  dy: -6,
                  anchor: "middle" as const,
                };
                return (
                  <g key={c.label}>
                    <circle
                      cx={x}
                      cy={y}
                      r="1.7"
                      fill="#314A5D"
                      stroke="#7892A5"
                      strokeWidth="0.55"
                    />
                    <text
                      x={x + labelOffset.dx}
                      y={y + labelOffset.dy}
                      fill="#8AA0AF"
                      fontSize="6.5"
                      fontFamily="ui-monospace,SFMono-Regular,monospace"
                      textAnchor={labelOffset.anchor}
                      dominantBaseline="middle"
                      letterSpacing="0.5"
                    >
                      {c.label}
                    </text>
                  </g>
                );
              })}

              {/* ── Conceptual arcs (relationships, NOT physical routes) ── */}
              {conceptualArcs.map(({ d, index }) => (
                <path
                  key={index}
                  d={d}
                  fill="none"
                  stroke="#06B6D4"
                  strokeWidth="0.85"
                  strokeDasharray="4 6"
                  className="gn-arc"
                  style={{ animationDelay: index * 0.55 + "s" }}
                />
              ))}

              {/* ── Active node radial area glow ── */}
              {activeLoc && activePoint && (
                <circle cx={activePoint[0]} cy={activePoint[1]} r="80" fill="url(#rg-active)" />
              )}

              {/* ── GreenNext location markers ── */}
              {Object.entries(MAP_LOCATIONS).map(([id, loc]) => {
                const isActive = selectedRegionId === id;
                const [mx, my] = projectedLocations[id] ?? projectedLocations["madurai"]!;
                const labelOffset = LOCATION_LABEL_OFFSETS[id] ?? {
                  dx: 12,
                  dy: -4,
                  anchor: "start" as const,
                };
                const lx = mx + labelOffset.dx;
                const labelY = my + labelOffset.dy;
                const anchor = labelOffset.anchor;

                return (
                  <g
                    key={id}
                    data-region-marker={id}
                    className="focus:outline-none focus-visible:outline-none"
                    style={{ cursor: "pointer", outline: "none" }}
                    onPointerDown={(event) => event.stopPropagation()}
                    onClick={() => {
                      setSelectedRegionId(id);
                      trackEvent({
                        tab: "Regions",
                        event: "region_tab_select",
                        value: `${loc.label} (${loc.code})`,
                      });
                    }}
                    role="button"
                    aria-label={"Select " + loc.label}
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        setSelectedRegionId(id);
                        trackEvent({
                          tab: "Regions",
                          event: "region_tab_select",
                          value: `${loc.label} (${loc.code})`,
                        });
                      }
                    }}
                  >
                    {/* Generous touch target for mobile fingertips */}
                    <circle cx={mx} cy={my} r="26" fill="transparent" />
                    {isActive ? (
                      <>
                        {/* Outer animated pulse ring */}
                        <circle
                          cx={mx}
                          cy={my}
                          r="22"
                          fill="none"
                          stroke="#10B981"
                          strokeWidth="1"
                          className="gn-pulse-outer"
                        />
                        {/* Inner animated pulse ring */}
                        <circle
                          cx={mx}
                          cy={my}
                          r="14"
                          fill="none"
                          stroke="#10B981"
                          strokeWidth="1.5"
                          className="gn-pulse-inner"
                        />
                        {/* Solid halo ring */}
                        <circle
                          cx={mx}
                          cy={my}
                          r="9"
                          fill="none"
                          stroke="#10B981"
                          strokeWidth="1.2"
                          opacity="0.5"
                          filter="url(#gn-node-active)"
                        />
                        {/* Core dot — bright filled */}
                        <circle
                          cx={mx}
                          cy={my}
                          r="5.5"
                          fill="#10B981"
                          filter="url(#gn-node-active)"
                        />
                        <circle cx={mx} cy={my} r="2.5" fill="#ECFDF5" />
                        {/* City label — active */}
                        <text
                          x={lx}
                          y={labelY}
                          fill="#10B981"
                          fontSize="8.75"
                          fontFamily="ui-monospace,SFMono-Regular,monospace"
                          fontWeight="700"
                          textAnchor={anchor}
                          dominantBaseline="middle"
                        >
                          {loc.label}
                        </text>
                        <text
                          x={lx}
                          y={labelY + 10}
                          fill="#34D399"
                          fontSize="7"
                          fontFamily="ui-monospace,SFMono-Regular,monospace"
                          fontWeight="600"
                          textAnchor={anchor}
                          dominantBaseline="middle"
                          letterSpacing="1.5"
                        >
                          {loc.code}
                        </text>
                      </>
                    ) : (
                      <>
                        {/* Idle halo */}
                        <circle
                          cx={mx}
                          cy={my}
                          r="8"
                          fill="none"
                          stroke="#10B981"
                          strokeWidth="0.8"
                          opacity="0.2"
                        />
                        {/* Idle marker */}
                        <circle
                          cx={mx}
                          cy={my}
                          r="4"
                          fill="#05080F"
                          stroke="#10B981"
                          strokeWidth="1.5"
                          filter="url(#gn-node-idle)"
                        />
                        <circle cx={mx} cy={my} r="1.5" fill="#10B981" />
                        {/* City label — idle */}
                        <text
                          x={lx}
                          y={labelY}
                          fill="#7DA8B8"
                          fontSize="8"
                          fontFamily="ui-monospace,SFMono-Regular,monospace"
                          fontWeight="500"
                          textAnchor={anchor}
                          dominantBaseline="middle"
                        >
                          {loc.label}
                        </text>
                        <text
                          x={lx}
                          y={labelY + 10}
                          fill="#10B981"
                          fontSize="6.5"
                          fontFamily="ui-monospace,SFMono-Regular,monospace"
                          fontWeight="500"
                          textAnchor={anchor}
                          dominantBaseline="middle"
                          letterSpacing="1.5"
                          opacity="0.7"
                        >
                          {loc.code}
                        </text>
                      </>
                    )}
                  </g>
                );
              })}

              {/* ── Edge vignette for depth ── */}
              <rect
                width={SVG_W}
                height={SVG_H}
                fill="url(#rg-vignette)"
                style={{ pointerEvents: "none" }}
              />
            </svg>
          </div>
          {/* Map caption remains outside the interactive viewport so it cannot obscure geography or labels. */}
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 px-1">
            <span className="rounded bg-[#05080F]/85 px-2 py-1 text-[9px] font-mono uppercase tracking-wider text-[#3D6B8A]">
              Conceptual Digital Infrastructure Relationships
            </span>
            <span className="rounded bg-[#05080F]/85 px-2 py-1 text-[9px] font-mono text-[#10B981]/60">
              ILLUSTRATIVE
            </span>
          </div>

          {/* Compact planning snapshot uses the same selected node as the map and dossier. */}
          <section
            className="mt-5 rounded-lg border border-[#1E293B] bg-[#0B0F17] p-4"
            aria-labelledby="regional-infrastructure-snapshot"
          >
            <div className="flex flex-wrap items-baseline justify-between gap-2 mb-3">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#10B981]">
                  Planning snapshot
                </span>
                <h4
                  id="regional-infrastructure-snapshot"
                  className="text-sm font-semibold text-white"
                >
                  {activeRegion.name} infrastructure profile
                </h4>
              </div>
              <span className="text-[9px] font-mono uppercase tracking-wide text-[#64748B]">
                {activePortfolio.status}
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {snapshotFields.map((field) => (
                <div
                  key={field.label}
                  className="rounded-md border border-[#1E293B] bg-[#121824] p-2.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-[9px] font-mono uppercase tracking-wide text-[#64748B]">
                      {field.label}
                    </span>
                    <span className="text-[9px] uppercase tracking-wide text-[#10B981]">
                      {field.status}
                    </span>
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-[#CBD5E1]">{field.value}</p>
                </div>
              ))}
            </div>
            <p className="mt-3 text-[10px] leading-relaxed text-[#64748B]">
              Planning references only; these fields do not confirm operating facilities, secured
              utility capacity, customer deployments, or measured performance.
            </p>
          </section>

          <section
            className="mt-4 rounded-lg border border-[#1E293B] bg-[#0B0F17] p-4"
            aria-labelledby="regional-network-guide"
          >
            <div className="flex items-center gap-2">
              <Globe2 size={14} className="text-[#10B981]" aria-hidden="true" />
              <h4 id="regional-network-guide" className="text-sm font-semibold text-white">
                Regional Network Guide
              </h4>
            </div>

            <div className="mt-3">
              <span className="text-[9px] font-mono uppercase tracking-wider text-[#64748B]">
                7 regional planning nodes
              </span>
              <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1.5 sm:grid-cols-3">
                {Object.values(MAP_LOCATIONS).map((location) => (
                  <span
                    key={location.code}
                    className="flex items-center gap-1.5 text-[11px] text-[#CBD5E1]"
                  >
                    <CheckCircle2
                      size={11}
                      className="shrink-0 text-[#10B981]"
                      aria-hidden="true"
                    />
                    {location.label}
                  </span>
                ))}
              </div>
            </div>

            <div className="mt-4 grid gap-3 border-t border-[#1E293B] pt-3 sm:grid-cols-2">
              <div>
                <span className="text-[9px] font-mono uppercase tracking-wider text-[#10B981]">
                  Conceptual network
                </span>
                <p className="mt-1 text-[11px] leading-relaxed text-[#94A3B8]">
                  Illustrates GreenNext&apos;s regional digital infrastructure planning
                  relationships; it does not represent verified physical network connections.
                </p>
              </div>
              <div>
                <span className="text-[9px] font-mono uppercase tracking-wider text-[#10B981]">
                  Explore locations
                </span>
                <p className="mt-1 text-[11px] leading-relaxed text-[#94A3B8]">
                  Select a map marker to explore the corresponding regional information.
                </p>
              </div>
            </div>

            <p className="mt-3 border-t border-[#1E293B] pt-3 text-[10px] leading-relaxed text-[#64748B]">
              Planning references only; regional locations do not confirm operational facilities or
              deployed infrastructure.
            </p>
          </section>
        </div>

        {/* ── RIGHT: Regional Dossier ───────────────────────────────────── */}
        <div className="lg:col-span-6 flex flex-col rounded-xl border border-[#1E293B] bg-[#0B0F17] p-5 sm:p-6 shadow-lg">
          <div>
            {/* Region header */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-5 mb-6 border-b border-[#1E293B]">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#10B981] shadow-[0_0_8px_#10B981]" />
                </div>
                <span className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                  {activeRegion.name}
                </span>
                <span className="px-2 py-0.5 rounded bg-[#10B981]/10 text-[#10B981] font-mono text-[10px] font-bold border border-[#10B981]/25">
                  {activeRegion.code}
                </span>
              </div>
              <span className="shrink-0 text-[9px] font-mono uppercase tracking-wide px-2 py-0.5 rounded bg-[#1E293B]/70 text-[#64748B]">
                CONCEPTUAL NODE
              </span>
            </div>

            <p className="text-[10px] font-mono uppercase tracking-[0.16em] text-[#10B981] mb-3">
              {activeRegion.category}
            </p>
            <p className="max-w-[60ch] text-sm sm:text-base text-[#CBD5E1] leading-[1.7] mb-6">
              {activeRegion.intro}
            </p>

            {/* Regional image */}
            <div className="rounded-lg overflow-hidden border border-[#1E293B] bg-[#121824] mb-6 shadow-none group">
              <div className="aspect-[16/8] w-full overflow-hidden bg-[#070A0E]">
                <img
                  key={activeRegion.id}
                  src={REGION_IMAGES[activeRegion.id]?.src ?? REGION_IMAGES["madurai"]!.src}
                  alt={
                    REGION_IMAGES[activeRegion.id]?.alt ??
                    "Regional infrastructure context in South India"
                  }
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              <div className="px-3 py-1.5 bg-[#0B0F17] border-t border-[#1E293B] flex items-center justify-between text-[9px] font-mono uppercase tracking-wide text-[#64748B]">
                <span>REGIONAL CONTEXT // {activeRegion.name.toUpperCase()} (ILLUSTRATIVE)</span>
                <span className="text-[#10B981]">SOUTH INDIA</span>
              </div>
            </div>

            {/* Strategic role */}
            <div className="p-4 rounded-lg border border-[#1E293B] bg-[#111A26] mb-6">
              <span className="text-[10px] font-mono uppercase tracking-[0.14em] text-[#38BDF8] block mb-2">
                Strategic Network Role
              </span>
              <p className="text-sm leading-[1.65] text-[#CBD5E1]">{activeRegion.networkRole}</p>
            </div>

            {/* Transit info */}
            <div className="mb-1">
              <span className="text-[10px] font-mono uppercase tracking-[0.14em] text-[#64748B] block mb-3">
                Connectivity &amp; Logistics Assets
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-2.5">
                {activeRegion.transitInfo.map((item) => (
                  <div
                    key={item}
                    onClick={() =>
                      trackEvent({
                        tab: "Locations",
                        event: "location_corridor_inspect",
                        value: `${activeRegion.name}: ${item}`,
                      })
                    }
                    className="flex items-start gap-2 text-[12px] sm:text-[13px] leading-snug text-[#94A3B8] cursor-pointer hover:text-white transition-colors"
                  >
                    <CheckCircle2 size={13} className="mt-0.5 text-[#10B981] flex-shrink-0" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div
              className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3"
              aria-label={`${activePortfolio.name} infrastructure profile`}
            >
              {[
                activePortfolio.land,
                activePortfolio.buildingArea,
                activePortfolio.sitePower,
                activePortfolio.itLoad,
                activePortfolio.substation,
                activePortfolio.water,
                activePortfolio.cooling,
                activePortfolio.pue,
                activePortfolio.connectivity,
                activePortfolio.travel,
              ].map((field) => (
                <div
                  key={field.label}
                  className="rounded-lg border border-[#1E293B] bg-[#111A26] p-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-[10px] sm:text-[11px] font-mono uppercase tracking-wide text-[#64748B]">
                      {field.label}
                    </span>
                    <span className="text-[10px] uppercase tracking-wide text-[#10B981]">
                      {field.status}
                    </span>
                  </div>
                  <p className="mt-1 text-sm leading-relaxed text-[#CBD5E1]">{field.value}</p>
                </div>
              ))}
            </div>
            {activePortfolio.conflicts.length > 0 && (
              <div className="mt-4 rounded-lg border border-amber-400/20 bg-amber-400/[0.04] px-3 py-2 text-xs leading-relaxed text-[#CBD5E1]">
                <span className="font-semibold text-amber-200">Confirmation required: </span>
                {activePortfolio.conflicts.join(" ")}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="pt-5 mt-6 border-t border-[#1E293B] flex flex-wrap items-center justify-between gap-3">
            <Link
              to={
                REGIONS_DATA[activeRegion.id]
                  ? "/regions/" + activeRegion.id
                  : "/regions#regional-portfolio"
              }
              className="px-4 py-2 rounded-lg bg-[#10B981] text-[#070A0E] text-xs font-semibold hover:bg-[#34D399] transition-all flex items-center gap-1.5"
            >
              <span>Explore {activeRegion.name} Page</span>
              <ArrowRight size={13} />
            </Link>
            <Link
              to="/regions/overview"
              className="text-xs text-[#94A3B8] hover:text-white transition-colors"
            >
              View Regional Overview →
            </Link>
          </div>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="flex items-center gap-2 text-xs text-[#64748B] pt-4 border-t border-[#1E293B]">
        <ShieldCheck size={15} className="text-[#10B981] flex-shrink-0" />
        <span>{REGIONAL_NETWORK_DISCLAIMER}</span>
      </div>
    </div>
  );
}
