import { useState, useMemo } from "react";
import { Link } from "@tanstack/react-router";
import { REGIONS_DATA, REGIONAL_NETWORK_DISCLAIMER, RegionInfo } from "../../data/regions";
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
  mangalore:  { latitude: 12.9141, longitude: 74.856,  code: "IXE", label: "Mangalore" },
  coimbatore: { latitude: 11.0168, longitude: 76.9558, code: "CJB", label: "Coimbatore" },
  trichy:     { latitude: 10.7905, longitude: 78.7047, code: "TRZ", label: "Trichy" },
  madurai:    { latitude:  9.9252, longitude: 78.1198, code: "MDU", label: "Madurai" },
};

// Reference-only cities — shown as geographic context, NOT as GreenNext nodes
const CONTEXT_CITIES = [
  { label: "Bengaluru", latitude: 12.9716, longitude: 77.5946 },
  { label: "Chennai", latitude: 13.0827, longitude: 80.2707 },
  { label: "Salem", latitude: 11.6643, longitude: 78.146 },
];

const STATE_LABELS = [
  { id: "karnataka",     name: "KARNATAKA",     lon: 76.0,  lat: 15.0 },
  { id: "kerala",        name: "KERALA",         lon: 75.5,  lat: 10.4 },
  { id: "tamilnadu",     name: "TAMIL NADU",     lon: 78.6,  lat: 11.5 },
  { id: "andhrapradesh", name: "ANDHRA PRADESH", lon: 80.4,  lat: 15.5 },
  { id: "telangana",     name: "TELANGANA",      lon: 79.0,  lat: 18.2 },
];

const LOCATION_LABEL_OFFSETS: Record<string, { dx: number; dy: number; anchor: "start" | "end" }> = {
  mangalore: { dx: 13, dy: -3, anchor: "start" },
  coimbatore: { dx: 12, dy: -12, anchor: "start" },
  trichy: { dx: 12, dy: -12, anchor: "start" },
  madurai: { dx: 13, dy: 16, anchor: "start" },
};

const CONTEXT_CITY_LABEL_OFFSETS: Record<string, { dx: number; dy: number; anchor: "start" | "middle" }> = {
  Bengaluru: { dx: 5, dy: -6, anchor: "start" },
  Chennai: { dx: 5, dy: -6, anchor: "start" },
  Salem: { dx: 5, dy: -6, anchor: "start" },
};

const OCEAN_LABELS = [
  { text: "ARABIAN SEA",   lon: 73.85, lat: 11.8 },
  { text: "BAY OF BENGAL", lon: 82.5,  lat: 12.0 },
];

// These are conceptual regional relationships, NOT physical infrastructure routes.
const CONCEPTUAL_RELATIONSHIPS: [string, string][] = [
  ["mangalore", "coimbatore"],
  ["mangalore", "trichy"],
  ["mangalore", "madurai"],
  ["coimbatore", "trichy"],
  ["coimbatore", "madurai"],
  ["trichy", "madurai"],
];

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
  const activeRegion: RegionInfo = REGIONS_DATA[selectedRegionId] || REGIONS_DATA.madurai;

  const statePaths = useMemo(
    () =>
      SOUTH_INDIA_STATES.map((state) => ({
        id: state.id,
        name: state.name,
        d: state.rings.map(ringToPath).join(" "),
      })),
    []
  );

  const activeLoc = MAP_LOCATIONS[selectedRegionId];
  const activePoint = activeLoc ? project(activeLoc.longitude, activeLoc.latitude) : undefined;
  const projectedLocations = useMemo(
    () => Object.fromEntries(
      Object.entries(MAP_LOCATIONS).map(([id, location]) => [id, project(location.longitude, location.latitude)])
    ) as Record<string, [number, number]>,
    []
  );
  const conceptualArcs = useMemo(
    () => CONCEPTUAL_RELATIONSHIPS.map(([from, to], index) => ({
      d: conceptualArcPath(projectedLocations[from], projectedLocations[to], index),
      index,
    })),
    [projectedLocations]
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
            Four Conceptual Focus Locations
          </h3>
        </div>
        <div className="flex items-center gap-2 text-xs font-mono text-[#94A3B8] bg-[#0B0F17] px-3 py-1.5 rounded-lg border border-[#1E293B]">
          <Radio size={11} className="text-[#10B981] animate-pulse" />
          <span>4 CONCEPTUAL FOCUS NODES</span>
        </div>
      </div>

      {/* Main Split Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start mb-8">

        {/* ── LEFT: Premium Geographic Map ─────────────────────────────── */}
        <div className="lg:col-span-6 relative rounded-xl border border-[#1E3445] bg-[#07111D] overflow-hidden shadow-2xl">
          <div className="relative w-full" style={{ aspectRatio: "1 / 1" }}>
            <svg
              viewBox={`0 0 ${SVG_W} ${SVG_H}`}
              className="absolute inset-0 h-full w-full"
              role="img"
              aria-label="Geographic map of South India showing four GreenNext conceptual focus locations"
            >
              <defs>
                {/* Glow filters */}
                <filter id="gn-node-idle" x="-120%" y="-120%" width="340%" height="340%">
                  <feGaussianBlur stdDeviation="3.5" result="b" />
                  <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
                </filter>
                <filter id="gn-node-active" x="-150%" y="-150%" width="400%" height="400%">
                  <feGaussianBlur stdDeviation="9" result="b" />
                  <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
                </filter>
                <filter id="gn-halo" x="-200%" y="-200%" width="500%" height="500%">
                  <feGaussianBlur stdDeviation="18" result="b" />
                  <feMerge><feMergeNode in="b" /></feMerge>
                </filter>

                {/* Radial gradient for active node area glow */}
                <radialGradient id="rg-active" cx="50%" cy="50%" r="50%">
                  <stop offset="0%"   stopColor="#10B981" stopOpacity="0.18" />
                  <stop offset="60%"  stopColor="#10B981" stopOpacity="0.06" />
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
                  <path d="M 52 0 L 0 0 0 52" fill="none" stroke="#64748B" strokeWidth="0.3" opacity="0.06" />
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
                    x={x} y={y}
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
                    x={x} y={y}
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
                const labelOffset = CONTEXT_CITY_LABEL_OFFSETS[c.label] ?? { dx: 0, dy: -6, anchor: "middle" as const };
                return (
                <g key={c.label}>
                  <circle cx={x} cy={y} r="1.7" fill="#314A5D" stroke="#7892A5" strokeWidth="0.55" />
                  <text
                    x={x + labelOffset.dx} y={y + labelOffset.dy}
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
                  style={{ animationDelay: (index * 0.55) + "s" }}
                />
              ))}

              {/* ── Active node radial area glow ── */}
              {activeLoc && activePoint && (
                <circle
                  cx={activePoint[0]}
                  cy={activePoint[1]}
                  r="80"
                  fill="url(#rg-active)"
                />
              )}

              {/* ── GreenNext location markers ── */}
              {Object.entries(MAP_LOCATIONS).map(([id, loc]) => {
                const isActive = selectedRegionId === id;
                const [mx, my] = projectedLocations[id];
                const labelOffset = LOCATION_LABEL_OFFSETS[id] ?? { dx: 12, dy: -4, anchor: "start" as const };
                const lx = mx + labelOffset.dx;
                const labelY = my + labelOffset.dy;
                const anchor = labelOffset.anchor;

                return (
                  <g
                    key={id}
                    className="focus:outline-none focus-visible:outline-none"
                    style={{ cursor: "pointer", outline: "none" }}
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
                    {isActive ? (
                      <>
                        {/* Outer animated pulse ring */}
                        <circle
                          cx={mx} cy={my}
                          r="22"
                          fill="none"
                          stroke="#10B981"
                          strokeWidth="1"
                          className="gn-pulse-outer"
                        />
                        {/* Inner animated pulse ring */}
                        <circle
                          cx={mx} cy={my}
                          r="14"
                          fill="none"
                          stroke="#10B981"
                          strokeWidth="1.5"
                          className="gn-pulse-inner"
                        />
                        {/* Solid halo ring */}
                        <circle
                          cx={mx} cy={my}
                          r="9"
                          fill="none"
                          stroke="#10B981"
                          strokeWidth="1.2"
                          opacity="0.5"
                          filter="url(#gn-node-active)"
                        />
                        {/* Core dot — bright filled */}
                        <circle
                          cx={mx} cy={my}
                          r="5.5"
                          fill="#10B981"
                          filter="url(#gn-node-active)"
                        />
                        <circle
                          cx={mx} cy={my}
                          r="2.5"
                          fill="#ECFDF5"
                        />
                        {/* City label — active */}
                        <text
                          x={lx} y={labelY}
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
                          x={lx} y={labelY + 10}
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
                          cx={mx} cy={my}
                          r="8"
                          fill="none"
                          stroke="#10B981"
                          strokeWidth="0.8"
                          opacity="0.2"
                        />
                        {/* Idle marker */}
                        <circle
                          cx={mx} cy={my}
                          r="4"
                          fill="#05080F"
                          stroke="#10B981"
                          strokeWidth="1.5"
                          filter="url(#gn-node-idle)"
                        />
                        <circle
                          cx={mx} cy={my}
                          r="1.5"
                          fill="#10B981"
                        />
                        {/* City label — idle */}
                        <text
                          x={lx} y={labelY}
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
                          x={lx} y={labelY + 10}
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
              <rect width={SVG_W} height={SVG_H} fill="url(#rg-vignette)" style={{ pointerEvents: "none" }} />
            </svg>

            {/* Map caption */}
            <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
              <span className="rounded bg-[#05080F]/85 px-2 py-1 text-[9px] font-mono text-[#3D6B8A] tracking-wider uppercase">
                Conceptual Digital Infrastructure Relationships
              </span>
              <span className="rounded bg-[#05080F]/85 px-2 py-1 text-[9px] font-mono text-[#10B981]/60">
                ILLUSTRATIVE
              </span>
            </div>
          </div>
        </div>

        {/* ── RIGHT: Regional Dossier ───────────────────────────────────── */}
        <div className="lg:col-span-6 flex flex-col justify-between rounded-xl border border-[#1E293B] bg-[#0B0F17] p-6 shadow-lg min-h-[380px] sm:min-h-[440px]">
          <div>
            {/* Region header */}
            <div className="flex items-center justify-between gap-4 pb-5 mb-6 border-b border-[#1E293B]">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#10B981] shadow-[0_0_8px_#10B981]" />
                </div>
                <span className="text-2xl sm:text-3xl font-bold tracking-tight text-white">{activeRegion.name}</span>
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
                  src={REGION_IMAGES[activeRegion.id]?.src ?? REGION_IMAGES.madurai.src}
                  alt={REGION_IMAGES[activeRegion.id]?.alt ?? "Regional infrastructure context in South India"}
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
          </div>

          {/* Actions */}
          <div className="pt-5 mt-6 border-t border-[#1E293B] flex flex-wrap items-center justify-between gap-3">
            <Link
              to={"/regions/" + activeRegion.id}
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
