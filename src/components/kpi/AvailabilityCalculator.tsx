import { useState, useMemo } from "react";
import { Clock, ShieldCheck, AlertCircle, Info, Calendar } from "lucide-react";
import { calculateAvailability, type AvailabilityResult } from "../../lib/kpi-calculations";

const NINES_TABLE = [
  {
    nines: "99.0%",
    label: "Two Nines",
    annualDowntime: "87.6 hours / year",
    monthlyDowntime: "7.3 hours / month",
  },
  {
    nines: "99.9%",
    label: "Three Nines",
    annualDowntime: "8.76 hours / year",
    monthlyDowntime: "43.8 minutes / month",
  },
  {
    nines: "99.95%",
    label: "Three Nines Five",
    annualDowntime: "4.38 hours / year",
    monthlyDowntime: "21.9 minutes / month",
  },
  {
    nines: "99.982%",
    label: "Tier III Target",
    annualDowntime: "1.58 hours (94.6 mins) / year",
    monthlyDowntime: "7.9 minutes / month",
  },
  {
    nines: "99.99%",
    label: "Four Nines (Tier IV Target)",
    annualDowntime: "52.6 minutes / year",
    monthlyDowntime: "4.38 minutes / month",
  },
  {
    nines: "99.999%",
    label: "Five Nines (Carrier Grade)",
    annualDowntime: "5.26 minutes / year",
    monthlyDowntime: "26.3 seconds / month",
  },
];

export function AvailabilityCalculator() {
  const [periodPreset, setPeriodPreset] = useState<"annual" | "quarterly" | "monthly" | "custom">(
    "annual",
  );
  const [measurementHours, setMeasurementHours] = useState<number>(8760);
  const [downtimeMinutes, setDowntimeMinutes] = useState<number>(45);
  const [excludePlannedMaint, setExcludePlannedMaint] = useState<boolean>(true);

  const handlePeriodChange = (preset: "annual" | "quarterly" | "monthly" | "custom") => {
    setPeriodPreset(preset);
    if (preset === "annual") setMeasurementHours(8760);
    if (preset === "quarterly") setMeasurementHours(2190);
    if (preset === "monthly") setMeasurementHours(730);
  };

  const result: AvailabilityResult = useMemo(() => {
    return calculateAvailability(measurementHours, downtimeMinutes);
  }, [measurementHours, downtimeMinutes]);

  return (
    <div className="rounded-2xl border border-[#1E293B] bg-[#0B0F17] p-6 sm:p-8 lg:p-10 shadow-2xl space-y-8">
      {/* Header */}
      <div className="border-b border-[#1E293B] pb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-mono uppercase tracking-widest text-[#10B981] font-semibold">
            KPI 02 · FACILITY & SLA METRIC
          </span>
          <h3 className="text-xl sm:text-2xl font-bold text-white mt-1">
            Data Centre Availability & Uptime Calculator
          </h3>
          <p className="text-xs text-[#94A3B8] mt-1 max-w-2xl">
            Calculates empirical availability over a defined observation window and quantifies
            allowed downtime budgets against operational SLA thresholds.
          </p>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#1E293B] bg-[#121824] text-xs font-mono text-[#94A3B8]">
          <Clock size={14} className="text-[#10B981]" />
          <span>SLA Window Tracking</span>
        </div>
      </div>

      {/* Governing Equation Banner */}
      <div className="p-4 rounded-xl bg-[#121824] border border-[#1E293B] flex flex-col md:flex-row md:items-center justify-between gap-4 font-mono text-xs">
        <div>
          <span className="text-[#64748B] block text-[10px] uppercase tracking-wider">
            Governing Equation
          </span>
          <span className="text-white font-bold text-sm sm:text-base">
            Availability (%) = (Total Time − Qualifying Downtime) ÷ Total Time × 100
          </span>
        </div>
        <div className="text-[11px] text-[#94A3B8]">
          Alternative Form:{" "}
          <span className="text-[#06B6D4]">Availability = MTBF ÷ (MTBF + MTTR)</span>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Input Form (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Measurement Window Selector */}
          <div>
            <label className="block text-xs font-mono uppercase text-[#94A3B8] mb-2 flex items-center gap-1.5">
              <Calendar size={13} className="text-[#10B981]" />
              Observation Measurement Period
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <button
                type="button"
                onClick={() => handlePeriodChange("monthly")}
                className={`p-2.5 rounded-lg border text-left transition-colors ${
                  periodPreset === "monthly"
                    ? "border-[#10B981] bg-[#10B981]/10 text-white"
                    : "border-[#1E293B] bg-[#121824] text-[#94A3B8] hover:text-white"
                }`}
              >
                <div className="font-semibold text-white">Monthly</div>
                <div className="text-[10px] text-[#64748B] font-mono">730 Hours</div>
              </button>
              <button
                type="button"
                onClick={() => handlePeriodChange("quarterly")}
                className={`p-2.5 rounded-lg border text-left transition-colors ${
                  periodPreset === "quarterly"
                    ? "border-[#10B981] bg-[#10B981]/10 text-white"
                    : "border-[#1E293B] bg-[#121824] text-[#94A3B8] hover:text-white"
                }`}
              >
                <div className="font-semibold text-white">Quarterly</div>
                <div className="text-[10px] text-[#64748B] font-mono">2,190 Hours</div>
              </button>
              <button
                type="button"
                onClick={() => handlePeriodChange("annual")}
                className={`p-2.5 rounded-lg border text-left transition-colors ${
                  periodPreset === "annual"
                    ? "border-[#10B981] bg-[#10B981]/10 text-white"
                    : "border-[#1E293B] bg-[#121824] text-[#94A3B8] hover:text-white"
                }`}
              >
                <div className="font-semibold text-white">Annual</div>
                <div className="text-[10px] text-[#64748B] font-mono">8,760 Hours</div>
              </button>
              <button
                type="button"
                onClick={() => handlePeriodChange("custom")}
                className={`p-2.5 rounded-lg border text-left transition-colors ${
                  periodPreset === "custom"
                    ? "border-[#10B981] bg-[#10B981]/10 text-white"
                    : "border-[#1E293B] bg-[#121824] text-[#94A3B8] hover:text-white"
                }`}
              >
                <div className="font-semibold text-white">Custom</div>
                <div className="text-[10px] text-[#64748B] font-mono">User Defined</div>
              </button>
            </div>
          </div>

          {/* Period Hours Input (if custom) */}
          {periodPreset === "custom" && (
            <div>
              <label
                htmlFor="avail-custom-hours"
                className="block text-xs font-semibold text-white mb-1.5"
              >
                Total Measurement Period (Hours)
              </label>
              <input
                id="avail-custom-hours"
                type="number"
                min="1"
                step="1"
                value={measurementHours}
                onChange={(e) => setMeasurementHours(Number(e.target.value))}
                className="w-full rounded-lg border border-[#1E293B] bg-[#121824] px-4 py-2.5 text-white font-mono text-sm focus:border-[#10B981] focus:outline-none"
              />
            </div>
          )}

          {/* Downtime Input */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label htmlFor="avail-downtime-minutes" className="text-xs font-semibold text-white">
                Qualifying Unplanned Downtime (Minutes)
              </label>
              <span className="text-[11px] font-mono text-[#94A3B8]">
                {(downtimeMinutes / 60).toFixed(2)} hours
              </span>
            </div>
            <input
              id="avail-downtime-minutes"
              type="number"
              min="0"
              step="1"
              value={downtimeMinutes}
              onChange={(e) => setDowntimeMinutes(Number(e.target.value))}
              className="w-full rounded-lg border border-[#1E293B] bg-[#121824] px-4 py-2.5 text-white font-mono text-sm focus:border-[#10B981] focus:outline-none"
            />
          </div>

          {/* Planned Maintenance Exclusion Checkbox */}
          <div className="p-3.5 rounded-lg border border-[#1E293B] bg-[#121824] flex items-start gap-3">
            <input
              id="planned-maint-checkbox"
              type="checkbox"
              checked={excludePlannedMaint}
              onChange={(e) => setExcludePlannedMaint(e.target.checked)}
              className="mt-0.5 rounded accent-[#10B981]"
            />
            <label
              htmlFor="planned-maint-checkbox"
              className="text-xs text-[#94A3B8] leading-relaxed cursor-pointer select-none"
            >
              <span className="font-semibold text-white block">
                Exclude Approved Planned Maintenance Windows (Standard SLA Practice)
              </span>
              Under most enterprise colocation Master Services Agreements (MSAs), pre-notified
              maintenance during off-peak change windows (executed under formal MOPs with concurrent
              maintainability) does not count as contractual downtime.
            </label>
          </div>
        </div>

        {/* Results Card (5 Cols) */}
        <div className="lg:col-span-5 rounded-xl border border-[#1E293B] bg-[#121824] p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-[#1E293B] pb-4">
            <span className="text-xs font-mono uppercase tracking-wider text-[#94A3B8]">
              Empirical Availability
            </span>
            <span className="px-2.5 py-0.5 rounded text-[11px] font-mono font-semibold bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30">
              {result.ninesTier}
            </span>
          </div>

          {result.status === "valid" && result.availabilityPct !== null ? (
            <div className="space-y-4">
              <div className="flex items-baseline gap-2">
                <span className="text-4xl sm:text-5xl font-mono font-bold text-white tracking-tight">
                  {result.availabilityPct.toFixed(4)}%
                </span>
              </div>

              <div className="space-y-2 pt-2 border-t border-[#1E293B] text-xs">
                <div className="flex justify-between">
                  <span className="text-[#94A3B8]">Total Measured Window:</span>
                  <span className="font-mono text-white font-semibold">
                    {result.totalHours.toLocaleString()} Hours
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#94A3B8]">Total Delivered Uptime:</span>
                  <span className="font-mono text-[#10B981] font-semibold">
                    {result.uptimeHours.toLocaleString()} Hours
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#94A3B8]">Total Outage Duration:</span>
                  <span className="font-mono text-[#F43F5E] font-semibold">
                    {downtimeMinutes} Minutes ({result.downtimeHours}h)
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-[#0B0F17] border border-[#1E293B] text-[11px] text-[#94A3B8] leading-relaxed">
                <span className="text-[#10B981] font-semibold">Operational Context: </span>
                An availability of {result.availabilityPct.toFixed(3)}% satisfies contracts
                requiring up to {result.ninesTier.split(" ")[0]} SLA uptime over this period.
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-lg bg-[#F43F5E]/10 border border-[#F43F5E]/30 text-xs text-[#F43F5E] flex items-start gap-2">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <span>{result.errorMessage}</span>
            </div>
          )}

          {/* Standards Attribution Note */}
          <div className="border-t border-[#1E293B] pt-4 text-[11px] text-[#64748B] space-y-1.5 leading-relaxed">
            <div className="flex items-center gap-1.5 text-[#94A3B8] font-semibold uppercase tracking-wider text-[10px]">
              <Info size={13} className="text-[#10B981]" />
              Tier Architecture vs Measured Uptime
            </div>
            <p>
              Uptime Institute Tier certifications (Tier I through IV) certify design topology and
              concurrent maintainability. A Tier III design does not automatically guarantee 99.982%
              availability without disciplined operational execution (SOPs/MOPs) and qualified 24/7
              critical facility engineering.
            </p>
          </div>
        </div>
      </div>

      {/* "Nines of Availability" Reference Table */}
      <div className="border-t border-[#1E293B] pt-6 space-y-4">
        <h4 className="text-sm font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
          <ShieldCheck size={16} className="text-[#10B981]" />
          Industry Benchmark: The "Nines of Availability" Budget Table
        </h4>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-[#1E293B] text-[#94A3B8]">
                <th className="py-2.5 pr-4 font-semibold">Availability %</th>
                <th className="py-2.5 px-4 font-semibold">Classification</th>
                <th className="py-2.5 px-4 font-semibold">Allowed Annual Downtime (8,760h)</th>
                <th className="py-2.5 pl-4 font-semibold">Allowed Monthly Downtime (730h)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1E293B]/60 text-white">
              {NINES_TABLE.map((row) => (
                <tr key={row.nines} className="hover:bg-[#121824]/50 transition-colors">
                  <td className="py-2.5 pr-4 font-bold text-[#10B981]">{row.nines}</td>
                  <td className="py-2.5 px-4 text-[#94A3B8] font-sans">{row.label}</td>
                  <td className="py-2.5 px-4 text-[#F8FAFC]">{row.annualDowntime}</td>
                  <td className="py-2.5 pl-4 text-[#64748B]">{row.monthlyDowntime}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
