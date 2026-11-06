import { useMemo } from "react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { calculateEnergyAndCost } from "../../lib/kpi-calculations";

type Props = {
  computeCount: number;
  wattsPerUnit: number;
  hours: number;
  days: number;
  tariff: number | "";
  currency: "INR" | "USD";
  currentPue: number;
};

const PUE_SCENARIOS = [1.05, 1.15, 1.25, 1.35, 1.45, 1.55, 1.65, 1.8];

export function EnergyScenarioChart({
  computeCount,
  wattsPerUnit,
  hours,
  days,
  tariff,
  currency,
  currentPue,
}: Props) {
  const data = useMemo(() => {
    if (tariff === "") return [];
    return PUE_SCENARIOS.map((pue) => {
      const result = calculateEnergyAndCost(computeCount, wattsPerUnit, hours, days, pue, tariff);
      if (result.status === "invalid") return null;
      return {
        pue,
        facilityEnergy: Math.round(result.facilityEnergyKwh),
        annualCost: Math.round(result.annualCost),
        selected: Math.abs(pue - currentPue) < 0.011,
      };
    }).filter((point): point is NonNullable<typeof point> => point !== null);
  }, [computeCount, wattsPerUnit, hours, days, tariff, currentPue]);

  const symbol = currency === "INR" ? "₹" : "$";

  // Derive comparative metrics
  const currentScenario = data.find((d) => d.selected) ?? data[Math.floor(data.length / 2)];
  const optimalScenario = data[0]; // PUE 1.05 or 1.15
  const potentialSavings =
    currentScenario && optimalScenario
      ? Math.max(0, currentScenario.annualCost - optimalScenario.annualCost)
      : 0;

  return (
    <div
      className="mt-6 rounded-2xl border border-[#1E293B] bg-[#0B0F17] p-5 sm:p-6 shadow-xl"
      aria-live="polite"
    >
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-[#1E293B] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] uppercase tracking-wider text-[#10B981] font-bold px-2 py-0.5 rounded bg-[#10B981]/15 border border-[#10B981]/30">
              Analytical Dashboard
            </span>
            <span className="text-[10px] font-mono text-[#64748B]">What-If Simulation</span>
          </div>
          <h3 className="mt-2 text-lg sm:text-xl font-bold text-white tracking-tight">
            PUE Sensitivity & Annual Operational Energy Impact
          </h3>
          <p className="text-xs text-[#94A3B8] mt-0.5">
            Evaluate annual kWh draw and operational expenditure variations across thermal efficiency envelopes.
          </p>
        </div>

        {currentScenario && optimalScenario && (
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="px-3 py-2 rounded-xl border border-[#334155] bg-[#121824] text-right">
              <span className="text-[10px] font-mono text-[#64748B] uppercase block">Selected PUE</span>
              <span className="text-sm font-mono font-bold text-[#38BDF8]">{currentPue.toFixed(2)}</span>
            </div>
            {potentialSavings > 0 && (
              <div className="px-3 py-2 rounded-xl border border-[#10B981]/40 bg-[#10B981]/10 text-right">
                <span className="text-[10px] font-mono text-[#10B981] uppercase block">Optimal Delta</span>
                <span className="text-sm font-mono font-bold text-[#10B981]">
                  -{symbol}{Math.round(potentialSavings / 1000).toLocaleString()}k/yr
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {data.length > 0 ? (
        <div
          className="h-[300px] w-full"
          role="img"
          aria-label="Line chart comparing annual facility energy and annual operating cost across PUE scenarios"
        >
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 12, right: 16, left: 8, bottom: 8 }}>
              <CartesianGrid stroke="#1E293B" strokeDasharray="3 3" opacity={0.6} />
              <XAxis
                dataKey="pue"
                type="number"
                domain={[1.05, 1.8]}
                tick={{ fill: "#94A3B8", fontSize: 11, fontFamily: "monospace" }}
                tickFormatter={(value) => `${Number(value).toFixed(2)}`}
                label={{
                  value: "Power Usage Effectiveness (PUE)",
                  position: "insideBottom",
                  offset: -4,
                  fill: "#64748B",
                  fontSize: 11,
                  fontFamily: "monospace",
                }}
              />
              <YAxis
                yAxisId="energy"
                tick={{ fill: "#94A3B8", fontSize: 11, fontFamily: "monospace" }}
                tickFormatter={(value) => `${Math.round(Number(value) / 1000)}k`}
                label={{
                  value: "Annual Facility (kWh)",
                  angle: -90,
                  position: "insideLeft",
                  fill: "#38BDF8",
                  fontSize: 11,
                }}
              />
              <YAxis
                yAxisId="cost"
                orientation="right"
                tick={{ fill: "#94A3B8", fontSize: 11, fontFamily: "monospace" }}
                tickFormatter={(value) => `${symbol}${Math.round(Number(value) / 1000)}k`}
                label={{
                  value: `Annual OPEX (${symbol})`,
                  angle: 90,
                  position: "insideRight",
                  fill: "#F59E0B",
                  fontSize: 11,
                }}
              />
              <Tooltip
                formatter={(value: number, name: string) => [
                  name === "facilityEnergy"
                    ? `${value.toLocaleString()} kWh/yr`
                    : `${symbol}${value.toLocaleString()}/yr`,
                  name === "facilityEnergy" ? "Total Facility Energy" : "Annual Operating Cost",
                ]}
                labelFormatter={(label) => `Efficiency Ratio: ${Number(label).toFixed(2)} PUE`}
                contentStyle={{
                  background: "#0B0F17",
                  border: "1px solid #334155",
                  borderRadius: "0.75rem",
                  boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.5)",
                  color: "#fff",
                  fontSize: "12px",
                  padding: "10px 14px",
                }}
              />
              <Legend
                formatter={(value) =>
                  value === "facilityEnergy" ? (
                    <span className="text-[#38BDF8] text-xs font-medium">Facility Energy (kWh)</span>
                  ) : (
                    <span className="text-[#F59E0B] text-xs font-medium">Annual OPEX Cost ({symbol})</span>
                  )
                }
                wrapperStyle={{ paddingTop: "12px" }}
              />
              <Line
                yAxisId="energy"
                type="monotone"
                dataKey="facilityEnergy"
                stroke="#38BDF8"
                strokeWidth={2.5}
                dot={{ r: 4, fill: "#0B0F17", stroke: "#38BDF8", strokeWidth: 2 }}
                activeDot={{ r: 6, fill: "#38BDF8", stroke: "#fff", strokeWidth: 2 }}
              />
              <Line
                yAxisId="cost"
                type="monotone"
                dataKey="annualCost"
                stroke="#F59E0B"
                strokeWidth={2.5}
                dot={{ r: 4, fill: "#0B0F17", stroke: "#F59E0B", strokeWidth: 2 }}
                activeDot={{ r: 6, fill: "#F59E0B", stroke: "#fff", strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <p className="rounded-xl border border-[#F43F5E]/30 bg-[#F43F5E]/10 p-4 text-xs text-[#FCA5A5]">
          Scenario chart unavailable until the tariff input is a valid non-negative number.
        </p>
      )}

      <div className="mt-4 pt-3 border-t border-[#1E293B] flex items-center justify-between text-[11px] text-[#64748B]">
        <span>Illustrative modeling envelope based on user parameters.</span>
        <span className="font-mono">PUE = Total Facility Energy / IT Equipment Energy</span>
      </div>
    </div>
  );
}
