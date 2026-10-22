import { useState, useMemo } from "react";
import { Snowflake, Gauge, Info, Droplets, AlertTriangle } from "lucide-react";
import { calculateCop, calculateSensibleHeat, type CopResult } from "../../lib/kpi-calculations";

export function CoolingEfficiencyCalculator() {
  const [activeTab, setActiveTab] = useState<"cop" | "liquid">("cop");

  // Mode A: COP inputs
  const [coolingOutputKw, setCoolingOutputKw] = useState<number>(500);
  const [electricalInputKw, setElectricalInputKw] = useState<number>(100);

  // Mode B: Liquid loop sensible heat inputs
  const [flowRateLpm, setFlowRateLpm] = useState<number>(300);
  const [supplyTempC, setSupplyTempC] = useState<number>(32);
  const [returnTempC, setReturnTempC] = useState<number>(42);

  const copResult: CopResult = useMemo(() => {
    return calculateCop(coolingOutputKw, electricalInputKw);
  }, [coolingOutputKw, electricalInputKw]);

  const sensibleResult = useMemo(() => {
    return calculateSensibleHeat(flowRateLpm, supplyTempC, returnTempC);
  }, [flowRateLpm, supplyTempC, returnTempC]);

  return (
    <div className="rounded-2xl border border-[#1E293B] bg-[#0B0F17] p-6 sm:p-8 lg:p-10 shadow-2xl space-y-8">
      {/* Header */}
      <div className="border-b border-[#1E293B] pb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-mono uppercase tracking-widest text-[#10B981] font-semibold">
            KPI 03 · THERMODYNAMICS & EFFICIENCY
          </span>
          <h3 className="text-xl sm:text-2xl font-bold text-white mt-1">
            Cooling Efficiency & Thermal Performance Calculator
          </h3>
          <p className="text-xs text-[#94A3B8] mt-1 max-w-2xl">
            Calculates Coefficient of Performance (COP), electrical power per ton of refrigeration
            (kW/ton), and secondary loop sensible heat dissipation.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab("cop")}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-colors ${
              activeTab === "cop"
                ? "bg-[#10B981] text-[#070A0E] font-bold"
                : "bg-[#121824] border border-[#1E293B] text-[#94A3B8] hover:text-white"
            }`}
          >
            System COP & kW/ton
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("liquid")}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-colors ${
              activeTab === "liquid"
                ? "bg-[#10B981] text-[#070A0E] font-bold"
                : "bg-[#121824] border border-[#1E293B] text-[#94A3B8] hover:text-white"
            }`}
          >
            Liquid Loop Heat (Q = m·Cp·ΔT)
          </button>
        </div>
      </div>

      {activeTab === "cop" ? (
        <div className="space-y-6">
          {/* Governing Formula Banner */}
          <div className="p-4 rounded-xl bg-[#121824] border border-[#1E293B] flex flex-col md:flex-row md:items-center justify-between gap-4 font-mono text-xs">
            <div>
              <span className="text-[#64748B] block text-[10px] uppercase tracking-wider">
                Governing Formulas
              </span>
              <span className="text-white font-bold text-sm">
                COP = Useful Cooling Output (kW) ÷ Cooling Electrical Input (kW)
              </span>
            </div>
            <div className="text-[11px] text-[#38BDF8]">
              kW/Ton = 3.517 ÷ COP (1 Ton = 3.51685 kW)
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-7 space-y-5">
              <div>
                <label
                  htmlFor="cooling-thermal-output"
                  className="text-xs font-semibold text-white flex items-center gap-1.5 mb-1.5"
                >
                  <Snowflake size={14} className="text-[#38BDF8]" />
                  Useful Thermal Heat Removed (kW)
                </label>
                <input
                  id="cooling-thermal-output"
                  type="number"
                  min="1"
                  step="25"
                  value={coolingOutputKw}
                  onChange={(e) => setCoolingOutputKw(Number(e.target.value))}
                  className="w-full rounded-lg border border-[#1E293B] bg-[#121824] px-4 py-2.5 text-white font-mono text-sm focus:border-[#10B981] focus:outline-none"
                />
              </div>

              <div>
                <label
                  htmlFor="cooling-elec-input"
                  className="text-xs font-semibold text-white flex items-center gap-1.5 mb-1.5"
                >
                  <Gauge size={14} className="text-[#F59E0B]" />
                  Total Cooling Electrical Power Input (kW)
                </label>
                <span className="text-[11px] text-[#64748B] block mb-1.5">
                  Include compressor chillers, cooling tower fans, CDU pumps, and air handling units
                </span>
                <input
                  id="cooling-elec-input"
                  type="number"
                  min="1"
                  step="5"
                  value={electricalInputKw}
                  onChange={(e) => setElectricalInputKw(Number(e.target.value))}
                  className="w-full rounded-lg border border-[#1E293B] bg-[#121824] px-4 py-2.5 text-white font-mono text-sm focus:border-[#10B981] focus:outline-none"
                />
              </div>

              <div className="p-3.5 rounded-lg bg-[#121824] border border-[#1E293B] text-xs text-[#94A3B8] leading-relaxed">
                <span className="text-white font-semibold block mb-1">
                  Equipment COP vs. Whole-System COP
                </span>
                A centrifugal chiller compressor may operate at an equipment COP of 6.5 to 7.0 (0.50
                kW/ton). When primary/secondary pumps, cooling tower fans, and CDUs are included,
                real whole-system COP typically averages 3.8 to 5.2.
              </div>
            </div>

            <div className="lg:col-span-5 rounded-xl border border-[#1E293B] bg-[#121824] p-6 space-y-5">
              <div className="flex items-center justify-between border-b border-[#1E293B] pb-3">
                <span className="text-xs font-mono uppercase tracking-wider text-[#94A3B8]">
                  Efficiency Rating
                </span>
                <span className="px-2.5 py-0.5 rounded text-[11px] font-mono font-semibold bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30">
                  {copResult.rating}
                </span>
              </div>

              {copResult.status === "valid" && copResult.cop !== null ? (
                <div className="space-y-4">
                  <div>
                    <span className="text-xs font-mono text-[#94A3B8] block">
                      Coefficient of Performance
                    </span>
                    <span className="text-4xl sm:text-5xl font-mono font-bold text-white tracking-tight">
                      {copResult.cop.toFixed(2)}
                    </span>
                    <span className="text-xs text-[#64748B] block mt-0.5">
                      Units of heat removed per unit of electricity
                    </span>
                  </div>

                  <div className="p-3 rounded-lg bg-[#0B0F17] border border-[#1E293B] space-y-1.5 text-xs font-mono">
                    <div className="flex justify-between">
                      <span className="text-[#94A3B8]">Refrigeration Metric:</span>
                      <span className="text-[#38BDF8] font-bold">
                        {copResult.kwPerTon?.toFixed(3)} kW / Ton
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#94A3B8]">Cooling Power Overhead:</span>
                      <span className="text-white font-semibold">
                        {(
                          (electricalInputKw / (coolingOutputKw + electricalInputKw)) *
                          100
                        ).toFixed(1)}
                        %
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-3 rounded bg-[#F43F5E]/10 border border-[#F43F5E]/30 text-xs text-[#F43F5E]">
                  {copResult.errorMessage}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Sensible Heat Governing Formula */}
          <div className="p-4 rounded-xl bg-[#121824] border border-[#1E293B] flex flex-col md:flex-row md:items-center justify-between gap-4 font-mono text-xs">
            <div>
              <span className="text-[#64748B] block text-[10px] uppercase tracking-wider">
                Sensible Heat Transfer Equation
              </span>
              <span className="text-white font-bold text-sm">
                Q = ṁ · Cp · ΔT = (LPM ÷ 60) × 4.184 kJ/kg·K × (T_return − T_supply)
              </span>
            </div>
            <div className="text-[11px] text-[#10B981]">
              Water Specific Heat Cp = 4.184 kJ/(kg·K)
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-7 space-y-4">
              <div>
                <label
                  htmlFor="flow-rate-input"
                  className="text-xs font-semibold text-white flex items-center gap-1.5 mb-1.5"
                >
                  <Droplets size={14} className="text-[#38BDF8]" />
                  Secondary Coolant Flow Rate (Litres / Minute - LPM)
                </label>
                <input
                  id="flow-rate-input"
                  type="number"
                  min="1"
                  step="10"
                  value={flowRateLpm}
                  onChange={(e) => setFlowRateLpm(Number(e.target.value))}
                  className="w-full rounded-lg border border-[#1E293B] bg-[#121824] px-4 py-2.5 text-white font-mono text-sm focus:border-[#10B981] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="supply-temp-input"
                    className="text-xs font-semibold text-white block mb-1.5"
                  >
                    Supply Water Temp T_supply (°C)
                  </label>
                  <input
                    id="supply-temp-input"
                    type="number"
                    step="0.5"
                    value={supplyTempC}
                    onChange={(e) => setSupplyTempC(Number(e.target.value))}
                    className="w-full rounded-lg border border-[#1E293B] bg-[#121824] px-4 py-2.5 text-white font-mono text-sm focus:border-[#10B981] focus:outline-none"
                  />
                  <span className="text-[10px] text-[#64748B] block mt-1">
                    ASHRAE W4 target: ~32°C–40°C
                  </span>
                </div>
                <div>
                  <label
                    htmlFor="return-temp-input"
                    className="text-xs font-semibold text-white block mb-1.5"
                  >
                    Return Water Temp T_return (°C)
                  </label>
                  <input
                    id="return-temp-input"
                    type="number"
                    step="0.5"
                    value={returnTempC}
                    onChange={(e) => setReturnTempC(Number(e.target.value))}
                    className="w-full rounded-lg border border-[#1E293B] bg-[#121824] px-4 py-2.5 text-white font-mono text-sm focus:border-[#10B981] focus:outline-none"
                  />
                  <span className="text-[10px] text-[#64748B] block mt-1">
                    Typically 8°C–12°C delta-T
                  </span>
                </div>
              </div>
            </div>

            <div className="lg:col-span-5 rounded-xl border border-[#1E293B] bg-[#121824] p-6 space-y-4">
              <span className="text-xs font-mono uppercase tracking-wider text-[#94A3B8] block border-b border-[#1E293B] pb-2">
                Heat Extraction Capacity
              </span>

              {sensibleResult.status === "valid" && sensibleResult.heatKw !== null ? (
                <div className="space-y-4">
                  <div>
                    <span className="text-xs font-mono text-[#94A3B8] block">
                      Sensible Heat Extracted (Q)
                    </span>
                    <span className="text-4xl sm:text-5xl font-mono font-bold text-white tracking-tight">
                      {sensibleResult.heatKw.toFixed(1)} kW
                    </span>
                    <span className="text-xs text-[#10B981] block mt-0.5">
                      Capable of cooling ~{Math.floor(sensibleResult.heatKw / 35)} high-density 35
                      kW GPU racks
                    </span>
                  </div>

                  <div className="p-3 rounded-lg bg-[#0B0F17] border border-[#1E293B] text-xs font-mono space-y-1">
                    <div className="flex justify-between">
                      <span className="text-[#94A3B8]">Coolant Delta-T (ΔT):</span>
                      <span className="text-[#38BDF8] font-bold">{sensibleResult.deltaTC}°C</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#94A3B8]">Mass Flow Rate (ṁ):</span>
                      <span className="text-white">
                        {(flowRateLpm / 60).toFixed(2)} kg / second
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-3 rounded bg-[#F43F5E]/10 border border-[#F43F5E]/30 text-xs text-[#F43F5E]">
                  {sensibleResult.errorMessage}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
