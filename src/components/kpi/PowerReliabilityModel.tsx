import { useState } from "react";
import {
  Zap,
  ShieldCheck,
  AlertTriangle,
  ArrowRight,
  Play,
  CheckCircle2,
  RefreshCw,
} from "lucide-react";
import { getRedundancyProfile, type PowerReliabilityMetrics } from "../../lib/kpi-calculations";

export function PowerReliabilityModel() {
  const [selectedTier, setSelectedTier] = useState<"N" | "N+1" | "2N" | "2(N+1)">("2N");
  const [simState, setSimState] = useState<"normal" | "utility_fail" | "generator_running">(
    "normal",
  );

  const profile: PowerReliabilityMetrics = getRedundancyProfile(selectedTier);

  const runSimulation = () => {
    setSimState("utility_fail");
    setTimeout(() => {
      setSimState("generator_running");
    }, 2500);
  };

  const resetSim = () => {
    setSimState("normal");
  };

  return (
    <div className="rounded-2xl border border-[#1E293B] bg-[#0B0F17] p-6 sm:p-8 lg:p-10 shadow-2xl space-y-8">
      {/* Header */}
      <div className="border-b border-[#1E293B] pb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-mono uppercase tracking-widest text-[#10B981] font-semibold">
            KPI 04 · ELECTRICAL INFRASTRUCTURE
          </span>
          <h3 className="text-xl sm:text-2xl font-bold text-white mt-1">
            Power Infrastructure Reliability & Redundancy Architecture
          </h3>
          <p className="text-xs text-[#94A3B8] mt-1 max-w-2xl">
            Evaluates power delivery path reliability, single points of failure (SPOF), concurrent
            maintainability, and emergency generator transition dynamics.
          </p>
        </div>
      </div>

      {/* Redundancy Selector Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {(["N", "N+1", "2N", "2(N+1)"] as const).map((tier) => (
          <button
            key={tier}
            type="button"
            onClick={() => setSelectedTier(tier)}
            className={`p-4 rounded-xl border text-left transition-all ${
              selectedTier === tier
                ? "border-[#10B981] bg-[#10B981]/10 shadow-lg shadow-[#10B981]/5"
                : "border-[#1E293B] bg-[#121824] hover:border-[#334155]"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-mono text-lg font-bold text-white">{tier}</span>
              <span
                className={`w-2 h-2 rounded-full ${
                  tier.startsWith("2") ? "bg-[#10B981]" : "bg-[#F59E0B]"
                }`}
              />
            </div>
            <p className="text-[11px] text-[#94A3B8] mt-1">
              {tier === "N" && "Single-path baseline; no redundancy."}
              {tier === "N+1" && "Shared component spare (+1 module)."}
              {tier === "2N" && "Dual independent A+B distribution."}
              {tier === "2(N+1)" && "Dual paths + redundant modules."}
            </p>
          </button>
        ))}
      </div>

      {/* Topology Evaluation Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-7 rounded-xl border border-[#1E293B] bg-[#121824] p-6 space-y-5">
          <div className="flex items-center justify-between border-b border-[#1E293B] pb-3">
            <span className="text-xs font-mono uppercase text-[#94A3B8]">
              Topology Specifications · Configuration {profile.redundancyTier}
            </span>
            <span className="font-mono text-xs text-[#10B981] font-semibold">
              Theoretical Path Benchmark: ~{profile.theoreticalPathAvailabilityPct}%
            </span>
          </div>
          <p className="text-[11px] text-[#64748B] italic">
            Note: Theoretical availability reflects architectural topology design targets under IEEE
            Gold Book assumptions. It is not an SLA guarantee or measured GreenNext telemetry;
            actual availability depends on component failure rates, maintenance states, and
            common-cause utility events.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-3 rounded-lg bg-[#0B0F17] border border-[#1E293B]">
              <span className="text-[10px] text-[#64748B] uppercase block">
                Single Point of Failure
              </span>
              <span
                className={`font-semibold font-mono mt-1 block ${profile.singlePointOfFailure ? "text-[#F43F5E]" : "text-[#10B981]"}`}
              >
                {profile.singlePointOfFailure ? "YES (Modelled Vulnerability)" : "NO (Modelled)"}
              </span>
            </div>
            <div className="p-3 rounded-lg bg-[#0B0F17] border border-[#1E293B]">
              <span className="text-[10px] text-[#64748B] uppercase block">
                Concurrent Maintenance
              </span>
              <span
                className={`font-semibold font-mono mt-1 block ${profile.concurrentMaintainable ? "text-[#10B981]" : "text-[#F59E0B]"}`}
              >
                {profile.concurrentMaintainable ? "YES (Modelled Serviceability)" : "NO (Requires Outage)"}
              </span>
            </div>
            <div className="p-3 rounded-lg bg-[#0B0F17] border border-[#1E293B]">
              <span className="text-[10px] text-[#64748B] uppercase block">Fault Tolerance</span>
              <span
                className={`font-semibold font-mono mt-1 block ${profile.faultTolerant ? "text-[#10B981]" : "text-[#94A3B8]"}`}
              >
                {profile.faultTolerant ? "YES (Modelled Isolation)" : "Manual Intervention"}
              </span>
            </div>
          </div>

          <div className="text-xs text-[#94A3B8] leading-relaxed space-y-2">
            <p>
              <strong className="text-white">Path Architecture: </strong>
              {profile.redundancyTier === "2N" || profile.redundancyTier === "2(N+1)"
                ? "Two completely isolated power trains from incoming utility substation switchgear down to rack-mount dual-corded server power supplies (Feed A + Feed B). Maintenance can be performed on either feed without shutting down server workloads."
                : "Single power train. An electrical fault, maintenance isolation, or cable breach anywhere between the utility service and the rack PDU results in partial or complete compute hall outage."}
            </p>
          </div>
        </div>

        {/* Interactive Outage Scenario Simulator (5 Cols) */}
        <div className="lg:col-span-5 rounded-xl border border-[#1E293B] bg-[#121824] p-6 space-y-5">
          <div className="flex items-center justify-between border-b border-[#1E293B] pb-3">
            <span className="text-xs font-mono uppercase text-[#94A3B8]">
              Interactive Failover Simulation
            </span>
            <span className="text-[10px] font-mono text-[#F59E0B] px-2 py-0.5 rounded bg-[#F59E0B]/10">
              Interactive Test
            </span>
          </div>

          <div className="space-y-3 font-mono text-xs">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 p-2.5 rounded bg-[#0B0F17] border border-[#1E293B]">
              <span className="text-[#94A3B8]">Incoming Grid Utility:</span>
              <span
                className={
                  simState === "normal" ? "text-[#10B981] font-bold" : "text-[#F43F5E] font-bold"
                }
              >
                {simState === "normal"
                  ? "MODEL STATE: UTILITY AVAILABLE"
                  : "TRIPPED (Blackout Simulated)"}
              </span>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 p-2.5 rounded bg-[#0B0F17] border border-[#1E293B]">
              <span className="text-[#94A3B8]">UPS Double-Conversion:</span>
              <span className="text-[#10B981] font-bold">
                {simState === "utility_fail"
                  ? "SIMULATED: DISCHARGING BATTERIES (0ms transfer)"
                  : "MODEL STATE: UPS AVAILABLE"}
              </span>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 p-2.5 rounded bg-[#0B0F17] border border-[#1E293B]">
              <span className="text-[#94A3B8]">Diesel Generator Plant:</span>
              <span
                className={
                  simState === "generator_running" ? "text-[#10B981] font-bold" : "text-[#64748B]"
                }
              >
                {simState === "generator_running"
                  ? "SIMULATED: RUNNING & SYNCHRONIZED (Load Accepted)"
                  : simState === "utility_fail"
                    ? "CRANKING... (~8s sync)"
                    : "STANDBY"}
              </span>
            </div>
          </div>

          <div className="pt-2 flex gap-2">
            {simState === "normal" ? (
              <button
                type="button"
                onClick={runSimulation}
                className="w-full flex items-center justify-center gap-2 min-h-[44px] py-3 rounded-lg bg-[#F59E0B] text-[#070A0E] text-xs font-bold hover:bg-[#F59E0B]/90 transition-colors"
              >
                <Play size={14} />
                Simulate Grid Drop
              </button>
            ) : (
              <button
                type="button"
                onClick={resetSim}
                className="w-full flex items-center justify-center gap-2 min-h-[44px] py-3 rounded-lg bg-[#1E293B] text-white text-xs font-semibold hover:bg-[#334155] transition-colors"
              >
                <RefreshCw size={14} />
                Restore Grid Utility
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Grid Interruption Metrics Callout */}
      <div className="border-t border-[#1E293B] pt-6 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs leading-relaxed text-[#94A3B8]">
        <div className="p-4 rounded-xl bg-[#121824] border border-[#1E293B]">
          <h5 className="font-bold text-white mb-1 font-mono uppercase tracking-wider text-[11px]">
            SAIDI & SAIFI Reliability Indices
          </h5>
          <p>
            System Average Interruption Duration Index (SAIDI) and Frequency Index (SAIFI) quantify
            regional transmission grid reliability. GreenNext regional models evaluate local
            TANTRANSCO (Tamil Nadu) and KPTCL (Karnataka) 230/110 kV feeder histories to ensure
            generator fuel reserves exceed historical outage restoration times.
          </p>
        </div>
        <div className="p-4 rounded-xl bg-[#121824] border border-[#1E293B]">
          <h5 className="font-bold text-white mb-1 font-mono uppercase tracking-wider text-[11px]">
            Voltage Sag Immunity (ITIC Curve)
          </h5>
          <p>
            Modern AI GPU power supplies demand strict voltage stability. Transient voltage dips
            exceeding 20% can cause switch-mode power supplies to cycle. Double-conversion VFI
            (Voltage and Frequency Independent) UPS systems isolate IT silicon from grid voltage
            disturbances with zero transfer time.
          </p>
        </div>
      </div>
    </div>
  );
}
