import { useState, useMemo } from "react";
import {
  Server,
  Zap,
  Snowflake,
  Cpu,
  Database,
  AlertCircle,
  Layers,
  CheckCircle2,
} from "lucide-react";
import { calculateCapacityUtilization } from "../../lib/kpi-calculations";

interface ResourceDimension {
  id: string;
  name: string;
  unit: string;
  available: number;
  used: number;
  icon: typeof Server;
  color: string;
}

export function CapacityUtilizationModel() {
  const [powerUsed, setPowerUsed] = useState<number>(850);
  const powerAvailable = 1000;
  const powerContracted = 1250;

  const [rackUsed, setRackUsed] = useState<number>(38);
  const rackAvailable = 60;

  const [coolingUsed, setCoolingUsed] = useState<number>(720);
  const coolingAvailable = 900;

  const [gpuUsed, setGpuUsed] = useState<number>(240);
  const gpuAvailable = 256;

  const [storageUsed, setStorageUsed] = useState<number>(450);
  const storageAvailable = 800;

  const powerMetrics = useMemo(() => {
    return calculateCapacityUtilization(powerUsed, powerAvailable, powerContracted);
  }, [powerUsed]);

  const rackMetrics = useMemo(() => {
    return calculateCapacityUtilization(rackUsed, rackAvailable);
  }, [rackUsed]);

  const coolingMetrics = useMemo(() => {
    return calculateCapacityUtilization(coolingUsed, coolingAvailable);
  }, [coolingUsed]);

  const gpuMetrics = useMemo(() => {
    return calculateCapacityUtilization(gpuUsed, gpuAvailable);
  }, [gpuUsed]);

  const storageMetrics = useMemo(() => {
    return calculateCapacityUtilization(storageUsed, storageAvailable);
  }, [storageUsed]);

  const dimensions: Array<{
    id: string;
    label: string;
    used: number;
    available: number;
    unit: string;
    pct: number | null;
    remaining: number | null;
    icon: typeof Server;
    color: string;
  }> = [
    {
      id: "power",
      label: "IT Electrical Power",
      used: powerUsed,
      available: powerAvailable,
      unit: "kW",
      pct: powerMetrics.utilizationPct,
      remaining: powerMetrics.remainingCapacity,
      icon: Zap,
      color: "#F59E0B",
    },
    {
      id: "rack",
      label: "Physical White Space",
      used: rackUsed,
      available: rackAvailable,
      unit: "Cabinets",
      pct: rackMetrics.utilizationPct,
      remaining: rackMetrics.remainingCapacity,
      icon: Server,
      color: "#06B6D4",
    },
    {
      id: "cooling",
      label: "Cooling Thermal Capacity",
      used: coolingUsed,
      available: coolingAvailable,
      unit: "kW Thermal",
      pct: coolingMetrics.utilizationPct,
      remaining: coolingMetrics.remainingCapacity,
      icon: Snowflake,
      color: "#38BDF8",
    },
    {
      id: "gpu",
      label: "AI Accelerators (GPUs)",
      used: gpuUsed,
      available: gpuAvailable,
      unit: "SXMs",
      pct: gpuMetrics.utilizationPct,
      remaining: gpuMetrics.remainingCapacity,
      icon: Cpu,
      color: "#10B981",
    },
    {
      id: "storage",
      label: "High-Speed NVMe Tier",
      used: storageUsed,
      available: storageAvailable,
      unit: "TB",
      pct: storageMetrics.utilizationPct,
      remaining: storageMetrics.remainingCapacity,
      icon: Database,
      color: "#8B5CF6",
    },
  ];

  // Identify bottleneck
  const bottleneck = useMemo(() => {
    let highest = dimensions[0]!;
    for (const d of dimensions) {
      if ((d.pct || 0) > (highest.pct || 0)) {
        highest = d;
      }
    }
    return highest;
  }, [dimensions]);

  return (
    <div className="rounded-2xl border border-[#1E293B] bg-[#0B0F17] p-6 sm:p-8 lg:p-10 shadow-2xl space-y-8">
      {/* Header */}
      <div className="border-b border-[#1E293B] pb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-mono uppercase tracking-widest text-[#10B981] font-semibold">
            KPI 05 · RESOURCE ALLOCATION & HEADROOM
          </span>
          <h3 className="text-xl sm:text-2xl font-bold text-white mt-1">
            Data Centre Capacity Utilization & Stranded Power Analyzer
          </h3>
          <p className="text-xs text-[#94A3B8] mt-1 max-w-2xl">
            Simulates independent capacity dimensions to prevent stranded power, identify thermal
            constraints, and maximize rack footprint ROI.
          </p>
        </div>
        <div className="px-3 py-1.5 rounded-lg border border-[#1E293B] bg-[#121824] text-xs font-mono text-[#F59E0B] flex items-center gap-1.5">
          <AlertCircle size={14} />
          <span>
            Active Limiting Factor: {bottleneck?.label ?? "Compute"} ({bottleneck?.pct ?? 0}%)
          </span>
        </div>
      </div>

      {/* Interactive Controls & Progress Bars */}
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* IT Power Slider */}
          <div className="p-5 rounded-xl border border-[#1E293B] bg-[#121824] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-white flex items-center gap-1.5">
                <Zap size={14} className="text-[#F59E0B]" />
                IT Power Draw
              </span>
              <span className="font-mono text-xs font-bold text-[#F59E0B]">
                {powerUsed} / {powerAvailable} kW
              </span>
            </div>
            <input
              type="range"
              min="100"
              max={powerAvailable}
              step="25"
              value={powerUsed}
              onChange={(e) => setPowerUsed(Number(e.target.value))}
              className="w-full accent-[#F59E0B]"
            />
            <div className="flex justify-between text-[11px] font-mono text-[#94A3B8]">
              <span>Utilized: {powerMetrics.utilizationPct}%</span>
              <span>Headroom: {powerMetrics.remainingCapacity} kW</span>
            </div>
          </div>

          {/* Rack Space Slider */}
          <div className="p-5 rounded-xl border border-[#1E293B] bg-[#121824] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-white flex items-center gap-1.5">
                <Server size={14} className="text-[#06B6D4]" />
                White Space Racks
              </span>
              <span className="font-mono text-xs font-bold text-[#06B6D4]">
                {rackUsed} / {rackAvailable} Cabinets
              </span>
            </div>
            <input
              type="range"
              min="5"
              max={rackAvailable}
              step="1"
              value={rackUsed}
              onChange={(e) => setRackUsed(Number(e.target.value))}
              className="w-full accent-[#06B6D4]"
            />
            <div className="flex justify-between text-[11px] font-mono text-[#94A3B8]">
              <span>Utilized: {rackMetrics.utilizationPct}%</span>
              <span>Available: {rackMetrics.remainingCapacity} Racks</span>
            </div>
          </div>

          {/* Cooling Thermal Capacity Slider */}
          <div className="p-5 rounded-xl border border-[#1E293B] bg-[#121824] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-white flex items-center gap-1.5">
                <Snowflake size={14} className="text-[#38BDF8]" />
                Cooling Thermal Draw
              </span>
              <span className="font-mono text-xs font-bold text-[#38BDF8]">
                {coolingUsed} / {coolingAvailable} kW
              </span>
            </div>
            <input
              type="range"
              min="100"
              max={coolingAvailable}
              step="20"
              value={coolingUsed}
              onChange={(e) => setCoolingUsed(Number(e.target.value))}
              className="w-full accent-[#38BDF8]"
            />
            <div className="flex justify-between text-[11px] font-mono text-[#94A3B8]">
              <span>Utilized: {coolingMetrics.utilizationPct}%</span>
              <span>Margin: {coolingMetrics.remainingCapacity} kW</span>
            </div>
          </div>

          {/* GPU Compute Cores Slider */}
          <div className="p-5 rounded-xl border border-[#1E293B] bg-[#121824] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-white flex items-center gap-1.5">
                <Cpu size={14} className="text-[#10B981]" />
                GPU Accelerator Silicon
              </span>
              <span className="font-mono text-xs font-bold text-[#10B981]">
                {gpuUsed} / {gpuAvailable} GPUs
              </span>
            </div>
            <input
              type="range"
              min="16"
              max={gpuAvailable}
              step="8"
              value={gpuUsed}
              onChange={(e) => setGpuUsed(Number(e.target.value))}
              className="w-full accent-[#10B981]"
            />
            <div className="flex justify-between text-[11px] font-mono text-[#94A3B8]">
              <span>Utilized: {gpuMetrics.utilizationPct}%</span>
              <span>Free: {gpuMetrics.remainingCapacity} Accelerators</span>
            </div>
          </div>

          {/* NVMe Storage Tier Slider */}
          <div className="p-5 rounded-xl border border-[#1E293B] bg-[#121824] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-white flex items-center gap-1.5">
                <Database size={14} className="text-[#8B5CF6]" />
                NVMe Burst Buffer
              </span>
              <span className="font-mono text-xs font-bold text-[#8B5CF6]">
                {storageUsed} / {storageAvailable} TB
              </span>
            </div>
            <input
              type="range"
              min="50"
              max={storageAvailable}
              step="25"
              value={storageUsed}
              onChange={(e) => setStorageUsed(Number(e.target.value))}
              className="w-full accent-[#8B5CF6]"
            />
            <div className="flex justify-between text-[11px] font-mono text-[#94A3B8]">
              <span>Utilized: {storageMetrics.utilizationPct}%</span>
              <span>Free: {storageMetrics.remainingCapacity} TB</span>
            </div>
          </div>

          {/* Stranded Power Dimension Summary */}
          <div className="p-5 rounded-xl border border-[#F59E0B]/30 bg-[#F59E0B]/5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#F59E0B] uppercase font-mono">
                Stranded Capacity Risk
              </span>
              <span className="font-mono text-xs font-bold text-white">
                {powerMetrics.strandedCapacity} kW
              </span>
            </div>
            <p className="text-xs text-[#94A3B8] leading-relaxed">
              Utility interconnect is contracted for {powerContracted} kW, but provisioned
              substation step-down limits facility availability to {powerAvailable} kW, stranding{" "}
              {powerMetrics.strandedCapacity} kW of capital capacity.
            </p>
          </div>
        </div>

        {/* Multi-Resource Visual Bar Stack */}
        <div className="p-6 rounded-xl border border-[#1E293B] bg-[#121824] space-y-4">
          <h4 className="text-xs font-mono uppercase tracking-wider text-white font-bold flex items-center gap-2">
            <Layers size={14} className="text-[#10B981]" />
            Cross-Resource Utilization Comparison
          </h4>
          <div className="space-y-3">
            {dimensions.map((dim) => {
              const Icon = dim.icon;
              return (
                <div key={dim.id} className="space-y-1">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-[#94A3B8] flex items-center gap-1.5">
                      <Icon size={13} style={{ color: dim.color }} />
                      {dim.label}
                    </span>
                    <span className="text-white font-semibold">
                      {dim.used} / {dim.available} {dim.unit} ({dim.pct}%)
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-[#0B0F17] overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{
                        width: `${Math.min(100, dim.pct || 0)}%`,
                        backgroundColor:
                          (dim.pct || 0) > 90
                            ? "#F43F5E"
                            : (dim.pct || 0) > 75
                              ? "#F59E0B"
                              : dim.color,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
