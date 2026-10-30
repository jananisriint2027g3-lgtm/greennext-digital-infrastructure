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

  return (
    <div
      className="mt-6 rounded-xl border border-[#1E293B] bg-[#0B0F17] p-4 sm:p-5"
      aria-live="polite"
    >
      <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <span className="font-mono text-[10px] uppercase tracking-wider text-[#10B981]">
            What-if analysis
          </span>
          <h3 className="mt-1 text-base font-bold text-white">
            How PUE changes the annual planning picture
          </h3>
        </div>
        <span className="font-mono text-[10px] text-[#64748B]">
          Selected scenario: PUE {currentPue.toFixed(2)}
        </span>
      </div>
      {data.length > 0 ? (
        <div
          className="h-[270px] w-full"
          role="img"
          aria-label="Line chart comparing annual facility energy and annual operating cost across PUE scenarios"
        >
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 8, right: 10, left: 2, bottom: 4 }}>
              <CartesianGrid stroke="#1E293B" strokeDasharray="3 3" />
              <XAxis
                dataKey="pue"
                type="number"
                domain={[1.05, 1.8]}
                tick={{ fill: "#94A3B8", fontSize: 11 }}
                tickFormatter={(value) => Number(value).toFixed(2)}
                label={{
                  value: "PUE",
                  position: "insideBottom",
                  offset: -2,
                  fill: "#64748B",
                  fontSize: 11,
                }}
              />
              <YAxis
                yAxisId="energy"
                tick={{ fill: "#94A3B8", fontSize: 11 }}
                tickFormatter={(value) => `${Math.round(Number(value) / 1000)}k`}
                label={{
                  value: "Annual kWh",
                  angle: -90,
                  position: "insideLeft",
                  fill: "#64748B",
                  fontSize: 11,
                }}
              />
              <YAxis
                yAxisId="cost"
                orientation="right"
                tick={{ fill: "#94A3B8", fontSize: 11 }}
                tickFormatter={(value) => `${symbol}${Math.round(Number(value) / 1000)}k`}
                label={{
                  value: `Annual ${symbol}`,
                  angle: 90,
                  position: "insideRight",
                  fill: "#64748B",
                  fontSize: 11,
                }}
              />
              <Tooltip
                formatter={(value: number, name: string) => [
                  name === "facilityEnergy"
                    ? `${value.toLocaleString()} kWh`
                    : `${symbol}${value.toLocaleString()}`,
                  name === "facilityEnergy" ? "Facility energy" : "Annual cost",
                ]}
                labelFormatter={(label) => `PUE ${Number(label).toFixed(2)}`}
                contentStyle={{
                  background: "#121824",
                  border: "1px solid #334155",
                  color: "#fff",
                  fontSize: 12,
                }}
              />
              <Legend
                formatter={(value) =>
                  value === "facilityEnergy" ? "Facility energy" : "Annual cost"
                }
                wrapperStyle={{ color: "#CBD5E1", fontSize: 11 }}
              />
              <Line
                yAxisId="energy"
                type="monotone"
                dataKey="facilityEnergy"
                stroke="#38BDF8"
                strokeWidth={2}
                dot={{ r: 3, fill: "#38BDF8" }}
                activeDot={{ r: 5 }}
              />
              <Line
                yAxisId="cost"
                type="monotone"
                dataKey="annualCost"
                stroke="#F59E0B"
                strokeWidth={2}
                dot={{ r: 3, fill: "#F59E0B" }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <p className="rounded-lg border border-[#F43F5E]/30 bg-[#F43F5E]/10 p-3 text-xs text-[#FCA5A5]">
          Scenario chart unavailable until the tariff input is a valid non-negative number.
        </p>
      )}
      <p className="mt-3 text-[11px] leading-relaxed text-[#64748B]">
        Illustrative planning output using the current workload, hours, days, tariff, and node-power
        assumptions. It is not live telemetry, a measured PUE series, a utility quote, or a
        guaranteed saving.
      </p>
    </div>
  );
}
