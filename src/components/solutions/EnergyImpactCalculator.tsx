import { useMemo, useState } from "react";
import { Activity, ShieldAlert, Snowflake, Zap } from "../icons";
import { trackEvent } from "../../lib/analytics";

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
  const estimate = useMemo(() => {
    const energy = (computeCount * WORKLOAD_WATTS[workload] * hours * days) / 1000;
    return { energy, cooling: energy * 0.35, intensity: computeCount * hours * days };
  }, [computeCount, days, hours, workload]);
  const updateWorkload = (value: Workload) => {
    setWorkload(value);
    trackEvent({ tab: "Energy", event: "energy_calculator_workload_select", value });
  };
  return (
    <section className="rounded-2xl border border-[#1E293B] bg-[#0B0F17] p-5 shadow-2xl sm:p-8">
      <div className="mb-7 flex flex-col gap-3 border-b border-[#1E293B] pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#10B981]">
            Illustrative planning tool
          </span>
          <h2 className="mt-2 text-2xl font-bold text-white">Estimate workload impact</h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#94A3B8]">
            Use transparent assumptions to create a directional estimate for an early infrastructure
            conversation.
          </p>
        </div>
        <span className="flex items-center gap-1.5 rounded border border-[#334155] bg-[#121824] px-2.5 py-1 font-mono text-[10px] uppercase text-[#F59E0B]">
          <ShieldAlert size={12} /> Estimated only
        </span>
      </div>
      <div className="grid gap-7 lg:grid-cols-[0.8fr_1.2fr]">
        <div className="space-y-5">
          <div>
            <label className="label" htmlFor="energy-workload">
              Workload type
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
            label="GPU / compute count"
            value={computeCount}
            min={1}
            max={128}
            step={1}
            onChange={setComputeCount}
            suffix="units"
          />
          <RangeField
            id="operating-hours"
            label="Operating hours"
            value={hours}
            min={1}
            max={24}
            step={1}
            onChange={setHours}
            suffix="hours/day"
          />
          <RangeField
            id="days-month"
            label="Operating days"
            value={days}
            min={1}
            max={31}
            step={1}
            onChange={setDays}
            suffix="days/month"
          />
        </div>
        <div className="rounded-xl border border-[#1E293B] bg-[#121824] p-5 sm:p-7">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <span className="font-mono text-[10px] uppercase tracking-wider text-[#64748B]">
                Estimated output
              </span>
              <h3 className="mt-1 text-lg font-bold text-white">{workload} profile</h3>
            </div>
            <span className="rounded bg-[#070A0E] px-2 py-1 font-mono text-[10px] text-[#94A3B8]">
              {WORKLOAD_WATTS[workload]} W/unit assumption
            </span>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <EstimateCard
              icon={Zap}
              label="Energy consumption"
              value={`${estimate.energy.toFixed(1)} kWh`}
              color="#F59E0B"
            />
            <EstimateCard
              icon={Snowflake}
              label="Cooling demand"
              value={`${estimate.cooling.toFixed(1)} kWh-eq`}
              color="#38BDF8"
            />
            <EstimateCard
              icon={Activity}
              label="Workload intensity"
              value={`${estimate.intensity.toLocaleString()} compute-hours`}
              color="#10B981"
            />
          </div>
          <div className="mt-6 border-t border-[#1E293B] pt-5">
            <p className="text-xs leading-relaxed text-[#94A3B8]">
              Calculation:{" "}
              <span className="font-mono text-[#CBD5E1]">
                units × assumed watts × hours/day × days/month ÷ 1,000
              </span>
              . Cooling demand uses an illustrative 35% multiplier against estimated compute energy.
              These are planning estimates, not facility measurements or efficiency claims.
            </p>
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
        className="w-full accent-[#10B981]"
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
      <strong className="mt-1 block text-lg font-mono text-white">{value}</strong>
    </div>
  );
}
