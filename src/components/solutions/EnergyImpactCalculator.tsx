import { useMemo, useState } from "react";
import { Activity, ShieldAlert, Snowflake, Zap } from "../icons";
import { trackEvent } from "../../lib/analytics";
import { calculateEnergyAndCost } from "../../lib/kpi-calculations";

type Workload = "AI Training" | "AI Inference" | "Cloud" | "Analytics" | "Enterprise";
const WORKLOAD_WATTS: Record<Workload, number> = {
  "AI Training": 700,
  "AI Inference": 400,
  Cloud: 300,
  Analytics: 450,
  Enterprise: 250,
};

export function EnergyImpactCalculator() {
  const [workload, setWorkload] = useState<Workload>("AI Training");
  const [computeCount, setComputeCount] = useState(8);
  const [hours, setHours] = useState(12);
  const [days, setDays] = useState(22);

  // KPI 9: Electricity tariff & PUE configuration
  const [tariff, setTariff] = useState(8.5); // Default INR 8.50 / kWh
  const [currency, setCurrency] = useState<"INR" | "USD">("INR");
  const [pue, setPue] = useState(1.25); // Configurable facility PUE (default 1.25)

  const estimate = useMemo(() => {
    const raw = calculateEnergyAndCost(
      computeCount,
      WORKLOAD_WATTS[workload],
      hours,
      days,
      pue,
      tariff,
    );

    const currencySymbol = currency === "INR" ? "₹" : "$";
    const monthlyCost = {
      cost: raw.monthlyCost,
      formattedCost: `${currencySymbol}${raw.monthlyCost.toLocaleString()}`,
      currency: currencySymbol,
    };
    const annualCost = {
      cost: raw.annualCost,
      formattedCost: `${currencySymbol}${raw.annualCost.toLocaleString()}`,
      currency: currencySymbol,
    };

    return {
      itEnergyKwh: raw.itEnergyKwh,
      overheadKwh: raw.coolingEnergyKwh,
      totalFacilityEnergyKwh: raw.facilityEnergyKwh,
      intensity: computeCount * hours * days,
      monthlyCost,
      annualCost,
    };
  }, [computeCount, days, hours, workload, pue, tariff, currency]);

  const updateWorkload = (value: Workload) => {
    setWorkload(value);
    trackEvent({ tab: "Energy", event: "energy_calculator_workload_select", value });
  };

  const handleCurrencyChange = (newCurrency: "INR" | "USD") => {
    setCurrency(newCurrency);
    if (newCurrency === "USD" && tariff === 8.5) {
      setTariff(0.11); // Typical US commercial industrial rate $0.11/kWh
    } else if (newCurrency === "INR" && tariff === 0.11) {
      setTariff(8.5);
    }
  };

  return (
    <section className="rounded-2xl border border-[#1E293B] bg-[#0B0F17] p-5 shadow-2xl sm:p-8">
      <div className="mb-7 flex flex-col gap-3 border-b border-[#1E293B] pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#10B981]">
            KPI 9 — Energy Consumption & Operating Cost Model
          </span>
          <h2 className="mt-2 text-2xl font-bold text-white">Workload Energy & Cost Estimator</h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#94A3B8]">
            Calculate baseline IT electricity consumption, facility cooling overhead via PUE, and
            projected utility operating expenditure under customizable industrial tariffs.
          </p>
        </div>
        <span className="flex items-center gap-1.5 rounded border border-[#334155] bg-[#121824] px-2.5 py-1 font-mono text-[10px] uppercase text-[#F59E0B]">
          <ShieldAlert size={12} /> Directional Model
        </span>
      </div>

      <div className="grid gap-7 lg:grid-cols-[0.9fr_1.1fr]">
        {/* Controls */}
        <div className="space-y-5">
          <div>
            <label className="label" htmlFor="energy-workload">
              Workload Archetype
            </label>
            <select
              id="energy-workload"
              value={workload}
              onChange={(event) => updateWorkload(event.target.value as Workload)}
              className="input"
            >
              {Object.keys(WORKLOAD_WATTS).map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </div>

          <RangeField
            id="compute-count"
            label="GPU / Compute Node Count"
            value={computeCount}
            min={1}
            max={128}
            step={1}
            onChange={setComputeCount}
            suffix="units"
          />

          <RangeField
            id="operating-hours"
            label="Daily Operational Hours"
            value={hours}
            min={1}
            max={24}
            step={1}
            onChange={setHours}
            suffix="hrs/day"
          />

          <RangeField
            id="days-month"
            label="Monthly Operational Days"
            value={days}
            min={1}
            max={31}
            step={1}
            onChange={setDays}
            suffix="days/mo"
          />

          <RangeField
            id="facility-pue"
            label="Facility PUE Multiplier"
            value={pue}
            min={1.05}
            max={2.0}
            step={0.01}
            onChange={setPue}
            suffix="PUE"
          />

          {/* Electricity Tariff Input */}
          <div className="rounded-lg border border-[#1E293B] bg-[#121824] p-3.5">
            <div className="flex items-center justify-between">
              <label htmlFor="tariff-input" className="text-xs font-semibold text-white">
                Commercial Electricity Tariff
              </label>
              <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={() => handleCurrencyChange("INR")}
                  className={`rounded px-3 py-1.5 min-h-[36px] font-mono text-xs font-semibold transition ${
                    currency === "INR" ? "bg-[#10B981] text-black" : "bg-[#1E293B] text-[#94A3B8]"
                  }`}
                >
                  INR (₹)
                </button>
                <button
                  type="button"
                  onClick={() => handleCurrencyChange("USD")}
                  className={`rounded px-3 py-1.5 min-h-[36px] font-mono text-xs font-semibold transition ${
                    currency === "USD" ? "bg-[#10B981] text-black" : "bg-[#1E293B] text-[#94A3B8]"
                  }`}
                >
                  USD ($)
                </button>
              </div>
            </div>
            <div className="mt-2 flex items-center gap-2">
              <span className="font-mono text-sm text-[#94A3B8]">
                {currency === "INR" ? "₹" : "$"}
              </span>
              <input
                id="tariff-input"
                type="number"
                step="0.05"
                min="0"
                inputMode="decimal"
                value={tariff}
                onChange={(e) => setTariff(Math.max(0, parseFloat(e.target.value) || 0))}
                className="w-full rounded border border-[#334155] bg-[#0B0F17] px-2.5 py-1 font-mono text-sm text-white focus:border-[#10B981] focus:outline-none"
              />
              <span className="font-mono text-xs text-[#64748B]">/ kWh</span>
            </div>
            <span className="mt-1 block text-[10px] text-[#64748B]">
              Illustrative regional planning assumption (not a GreenNext tariff or power sales
              quote). Currency toggle selects independent reference assumptions and does not perform
              live FX conversion.
            </span>
          </div>
        </div>

        {/* Results */}
        <div className="rounded-xl border border-[#1E293B] bg-[#121824] p-5 sm:p-7">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <span className="font-mono text-[10px] uppercase tracking-wider text-[#64748B]">
                Projected Consumption & OPEX
              </span>
              <h3 className="mt-1 text-lg font-bold text-white">{workload} Profile Output</h3>
            </div>
            <span className="rounded bg-[#070A0E] px-2 py-1 font-mono text-[10px] text-[#94A3B8]">
              {WORKLOAD_WATTS[workload]} W/unit assumption
            </span>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <EstimateCard
              icon={Zap}
              label="IT Compute Energy"
              value={`${estimate.itEnergyKwh.toLocaleString(undefined, { maximumFractionDigits: 1 })} kWh`}
              color="#F59E0B"
            />
            <EstimateCard
              icon={Snowflake}
              label="Cooling & Overhead"
              value={`${estimate.overheadKwh.toLocaleString(undefined, { maximumFractionDigits: 1 })} kWh`}
              color="#38BDF8"
            />
            <EstimateCard
              icon={Activity}
              label="Total Facility Power"
              value={`${estimate.totalFacilityEnergyKwh.toLocaleString(undefined, { maximumFractionDigits: 1 })} kWh`}
              color="#10B981"
            />
          </div>

          {/* Operating Cost Projection Cards */}
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg border border-[#1E293B] bg-[#0B0F17] p-4">
              <span className="text-[10px] uppercase tracking-wide text-[#64748B]">
                Est. Monthly Electricity Cost
              </span>
              <div className="mt-1 text-2xl font-bold font-mono text-[#10B981]">
                {estimate.monthlyCost.formattedCost}
              </div>
              <span className="text-[11px] text-[#94A3B8]">
                Based on {days} operating days ({estimate.totalFacilityEnergyKwh.toFixed(0)} kWh @{" "}
                {estimate.monthlyCost.currency}
                {tariff}/kWh)
              </span>
            </div>

            <div className="rounded-lg border border-[#1E293B] bg-[#0B0F17] p-4">
              <span className="text-[10px] uppercase tracking-wide text-[#64748B]">
                Est. Annualized Facility OPEX
              </span>
              <div className="mt-1 text-2xl font-bold font-mono text-[#38BDF8]">
                {estimate.annualCost.formattedCost}
              </div>
              <span className="text-[11px] text-[#94A3B8]">
                12-month run rate with static workload assumption
              </span>
            </div>
          </div>

          <div className="mt-5 border-t border-[#1E293B] pt-4">
            <p className="text-xs leading-relaxed text-[#94A3B8]">
              <strong>Formulas:</strong>{" "}
              <span className="font-mono text-[#CBD5E1]">
                IT Energy (kWh) = (Units × Assumed Watts × Hours × Days) ÷ 1,000
              </span>
              <br />
              <span className="font-mono text-[#CBD5E1]">
                Facility Energy (kWh) = IT Energy × PUE ({pue.toFixed(2)})
              </span>
              <br />
              <span className="font-mono text-[#CBD5E1]">
                Cost = Facility Energy × Electricity Tariff ({estimate.monthlyCost.currency}
                {tariff}/kWh)
              </span>
            </p>
            <div className="mt-3 rounded border border-amber-500/20 bg-amber-500/5 p-2.5 text-[11px] text-[#F59E0B]">
              <strong>Billing Exclusions:</strong> This estimate computes raw active electrical
              energy consumption. It excludes contractual maximum demand (kVA) charges, power factor
              penalties, Time-of-Day (TOD) peak tariffs, open-access transmission wheeling
              surcharges, and state electricity duties. Not an actual utility bill.
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function RangeField({
  id,
  label,
  value,
  min,
  max,
  step,
  suffix,
  onChange,
}: {
  id: string;
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  suffix: string;
  onChange: (value: number) => void;
}) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <label className="label mb-0" htmlFor={id}>
          {label}
        </label>
        <span className="font-mono text-xs text-[#10B981]">
          {value} <span className="text-[#64748B]">{suffix}</span>
        </span>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="w-full h-6 py-1 cursor-pointer touch-none accent-[#10B981]"
      />
    </div>
  );
}

function EstimateCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: typeof Zap;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="rounded-lg border border-[#1E293B] bg-[#0B0F17] p-4">
      <Icon size={17} style={{ color }} />
      <span className="mt-3 block text-[10px] uppercase tracking-wide text-[#64748B]">{label}</span>
      <strong className="mt-1 block text-base font-mono text-white">{value}</strong>
    </div>
  );
}
