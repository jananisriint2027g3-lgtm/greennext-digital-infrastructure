import { useState, useMemo } from "react";
import { Zap, Server, Info, CheckCircle2, AlertTriangle, ArrowRight } from "lucide-react";
import { calculatePue, type PueResult } from "../../lib/kpi-calculations";

type EnergyUnit = "kW" | "kWh" | "MWh";

export function PueCalculator() {
  const [facilityEnergy, setFacilityEnergy] = useState<number>(12500);
  const [itEnergy, setItEnergy] = useState<number>(10000);
  const [unit, setUnit] = useState<EnergyUnit>("kWh");
  const [categoryLevel, setCategoryLevel] = useState<"Cat1" | "Cat2">("Cat2");

  const result: PueResult = useMemo(() => {
    return calculatePue(facilityEnergy, itEnergy);
  }, [facilityEnergy, itEnergy]);

  const setPreset = (fac: number, it: number) => {
    setFacilityEnergy(fac);
    setItEnergy(it);
  };

  const badgeColors: Record<PueResult["rating"], { bg: string; text: string; border: string }> = {
    "Very High Efficiency": {
      bg: "bg-[#10B981]/15",
      text: "text-[#10B981]",
      border: "border-[#10B981]/30",
    },
    "Efficient Modern": {
      bg: "bg-[#06B6D4]/15",
      text: "text-[#06B6D4]",
      border: "border-[#06B6D4]/30",
    },
    Average: { bg: "bg-[#F59E0B]/15", text: "text-[#F59E0B]", border: "border-[#F59E0B]/30" },
    "Legacy / Suboptimal": {
      bg: "bg-[#F43F5E]/15",
      text: "text-[#F43F5E]",
      border: "border-[#F43F5E]/30",
    },
    Invalid: { bg: "bg-[#64748B]/15", text: "text-[#94A3B8]", border: "border-[#64748B]/30" },
  };

  return (
    <div className="rounded-2xl border border-[#1E293B] bg-[#0B0F17] p-6 sm:p-8 lg:p-10 shadow-2xl space-y-8">
      {/* Header */}
      <div className="border-b border-[#1E293B] pb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-mono uppercase tracking-widest text-[#10B981] font-semibold">
            KPI 01 · ISO/IEC 30134-2 · ILLUSTRATIVE MODEL
          </span>
          <h3 className="text-xl sm:text-2xl font-bold text-white mt-1">
            Illustrative Power Usage Effectiveness (PUE) Calculator
          </h3>
          <p className="text-xs text-[#94A3B8] mt-1 max-w-2xl">
            PUE expresses the relationship between total facility energy and energy delivered to
            productive IT compute equipment. This local calculator uses user-supplied planning values;
            it is not a live facility measurement.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono text-[#64748B]">Units:</span>
          {(["kW", "kWh", "MWh"] as EnergyUnit[]).map((u) => (
            <button
              key={u}
              type="button"
              onClick={() => setUnit(u)}
              className={`px-2.5 py-1 rounded text-xs font-mono transition-colors ${
                unit === u
                  ? "bg-[#10B981] text-[#070A0E] font-bold"
                  : "bg-[#121824] border border-[#1E293B] text-[#94A3B8] hover:text-white"
              }`}
            >
              {u}
            </button>
          ))}
        </div>
      </div>
      <p className="-mt-5 text-[11px] leading-relaxed text-[#64748B]">
        Enter facility and IT values in the same unit and for the same measurement period. The
        selector changes the displayed unit label only; it does not convert kW, kWh, or MWh values.
      </p>

      {/* Formula Definition Banner */}
      <div className="p-4 rounded-xl bg-[#121824] border border-[#1E293B] flex flex-col md:flex-row md:items-center justify-between gap-4 font-mono text-xs">
        <div>
          <span className="text-[#64748B] block text-[10px] uppercase tracking-wider">
            Governing Equation
          </span>
          <span className="text-white font-bold text-sm sm:text-base">
            PUE = Total Facility Energy ÷ IT Equipment Energy
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[#94A3B8]">Thermodynamic Ideal:</span>
          <span className="px-2 py-0.5 rounded bg-[#10B981]/20 text-[#10B981] font-bold">
            1.000
          </span>
        </div>
      </div>

      {/* Calculator Body */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Controls (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Presets */}
          <div>
            <label className="block text-xs font-mono uppercase text-[#94A3B8] mb-2">
              Architecture Presets
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <button
                type="button"
                onClick={() => setPreset(11500, 10000)}
                className="p-2.5 rounded-lg border border-[#1E293B] bg-[#121824] text-left hover:border-[#10B981] transition-colors"
              >
                <div className="font-semibold text-white">Liquid DLC</div>
                <div className="text-[10px] text-[#10B981] font-mono">PUE 1.15</div>
              </button>
              <button
                type="button"
                onClick={() => setPreset(13000, 10000)}
                className="p-2.5 rounded-lg border border-[#1E293B] bg-[#121824] text-left hover:border-[#06B6D4] transition-colors"
              >
                <div className="font-semibold text-white">Modern Hybrid</div>
                <div className="text-[10px] text-[#06B6D4] font-mono">PUE 1.30</div>
              </button>
              <button
                type="button"
                onClick={() => setPreset(14800, 10000)}
                className="p-2.5 rounded-lg border border-[#1E293B] bg-[#121824] text-left hover:border-[#F59E0B] transition-colors"
              >
                <div className="font-semibold text-white">Colocation Avg</div>
                <div className="text-[10px] text-[#F59E0B] font-mono">PUE 1.48</div>
              </button>
              <button
                type="button"
                onClick={() => setPreset(17500, 10000)}
                className="p-2.5 rounded-lg border border-[#1E293B] bg-[#121824] text-left hover:border-[#F43F5E] transition-colors"
              >
                <div className="font-semibold text-white">Legacy Air</div>
                <div className="text-[10px] text-[#F43F5E] font-mono">PUE 1.75</div>
              </button>
            </div>
          </div>

          {/* Form Inputs */}
          <div className="space-y-4">
            <div>
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 mb-1.5">
                <label
                  htmlFor="pue-facility-input"
                  className="text-xs font-semibold text-white flex items-center gap-1.5"
                >
                  <Zap size={14} className="text-[#F59E0B]" />
                  Total Data Centre Facility Energy ({unit})
                </label>
                <span className="text-[11px] font-mono text-[#94A3B8]">
                  Includes IT + cooling + power delivery + lighting
                </span>
              </div>
              <input
                id="pue-facility-input"
                type="number"
                inputMode="decimal"
                min="0"
                step="100"
                value={facilityEnergy}
                onChange={(e) => setFacilityEnergy(Number(e.target.value))}
                className="w-full rounded-lg border border-[#1E293B] bg-[#121824] px-4 py-2.5 text-white font-mono text-sm focus:border-[#10B981] focus:outline-none"
              />
            </div>

            <div>
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 mb-1.5">
                <label
                  htmlFor="pue-it-input"
                  className="text-xs font-semibold text-white flex items-center gap-1.5"
                >
                  <Server size={14} className="text-[#10B981]" />
                  IT Equipment Energy ({unit})
                </label>
                <span className="text-[11px] font-mono text-[#94A3B8]">
                  Servers, GPUs, storage arrays, and network switches
                </span>
              </div>
              <input
                id="pue-it-input"
                type="number"
                inputMode="decimal"
                min="1"
                step="100"
                value={itEnergy}
                onChange={(e) => setItEnergy(Number(e.target.value))}
                className="w-full rounded-lg border border-[#1E293B] bg-[#121824] px-4 py-2.5 text-white font-mono text-sm focus:border-[#10B981] focus:outline-none"
              />
            </div>

            {/* Measurement Boundary Category */}
            <div>
              <label className="block text-xs font-mono uppercase text-[#94A3B8] mb-1.5">
              Illustrative Measurement Boundary
              </label>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <button
                  type="button"
                  onClick={() => setCategoryLevel("Cat1")}
                  className={`p-3 rounded-lg border text-left transition-colors ${
                    categoryLevel === "Cat1"
                      ? "border-[#10B981] bg-[#10B981]/10 text-white"
                      : "border-[#1E293B] bg-[#121824] text-[#94A3B8] hover:text-white"
                  }`}
                >
                  <div className="font-semibold text-white">UPS-output boundary</div>
                  <div className="text-[10px] text-[#64748B] mt-0.5">
                    Illustrative boundary: IT load is represented at centralized UPS output and
                    includes downstream PDU and cable losses.
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setCategoryLevel("Cat2")}
                  className={`p-3 rounded-lg border text-left transition-colors ${
                    categoryLevel === "Cat2"
                      ? "border-[#10B981] bg-[#10B981]/10 text-white"
                      : "border-[#1E293B] bg-[#121824] text-[#94A3B8] hover:text-white"
                  }`}
                >
                  <div className="font-semibold text-white">PDU / rack-output boundary</div>
                  <div className="text-[10px] text-[#64748B] mt-0.5">
                    Illustrative boundary: IT load is represented at a floor PDU or rack busway to
                    isolate equipment draw.
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Results Card (5 Cols) */}
        <div className="lg:col-span-5 rounded-xl border border-[#1E293B] bg-[#121824] p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-[#1E293B] pb-4">
            <span className="text-xs font-mono uppercase tracking-wider text-[#94A3B8]">
              Calculated PUE Result
            </span>
            <span
              className={`px-2.5 py-0.5 rounded text-[11px] font-mono font-semibold border ${
                badgeColors[result.rating].bg
              } ${badgeColors[result.rating].text} ${badgeColors[result.rating].border}`}
            >
              {result.rating}
            </span>
          </div>

          {result.status === "valid" && result.pue !== null ? (
            <div className="space-y-4">
              <div className="flex items-baseline gap-2">
                <span className="text-4xl sm:text-5xl font-mono font-bold text-white tracking-tight">
                  {result.pue.toFixed(3)}
                </span>
                <span className="text-xs font-mono text-[#94A3B8]">ratio</span>
              </div>

              <div className="space-y-2 pt-2 border-t border-[#1E293B] text-xs">
                <div className="flex justify-between">
                  <span className="text-[#94A3B8]">IT Compute Energy Share:</span>
                  <span className="font-mono text-white font-semibold">
                    {((1 / result.pue) * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#94A3B8]">Auxiliary Facility Overhead:</span>
                  <span className="font-mono text-[#F59E0B] font-semibold">
                    {(((result.pue - 1) / result.pue) * 100).toFixed(1)}% (
                    {((result.pue - 1) * 100).toFixed(1)}% of IT)
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#94A3B8]">Facility Overhead per 100 kW IT:</span>
                  <span className="font-mono text-[#F43F5E] font-semibold">
                    {((result.pue - 1) * 100).toFixed(1)} kW
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-[#0B0F17] border border-[#1E293B] text-[11px] text-[#94A3B8] leading-relaxed">
                <span className="text-[#10B981] font-semibold">Interpretation: </span>
                For every 1.00 {unit} of electrical energy delivered to compute silicon, the
                facility consumes an additional {(result.pue - 1).toFixed(3)} {unit} in cooling,
                power conditioning, and auxiliary support.
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-lg bg-[#F43F5E]/10 border border-[#F43F5E]/30 text-xs text-[#F43F5E] flex items-start gap-2">
              <AlertTriangle size={16} className="shrink-0 mt-0.5" />
              <span>{result.errorMessage || "Please enter valid energy quantities."}</span>
            </div>
          )}

          {/* Boundaries Explanatory Box */}
          <div className="border-t border-[#1E293B] pt-4 text-[11px] text-[#64748B] space-y-2 leading-relaxed">
            <div className="flex items-center gap-1.5 text-[#94A3B8] font-semibold uppercase tracking-wider text-[10px]">
              <Info size={13} className="text-[#10B981]" />
              Measurement Boundary Notice
            </div>
            <p>
              ISO/IEC 30134-2 defines PUE using a documented measurement boundary and matching
              measurement period; its public preview describes categories and continuous 12-month
              reporting. These simplified boundary choices are illustrative and do not establish
              ISO compliance or certification. PUE alone does not account for water efficiency
              (WUE) or compute productivity.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
