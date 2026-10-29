import { useState, useId } from "react";
import {
  calculateDewPoint,
  calculateEnvironmentalCompliance,
  ASHRAE_A1_RECOMMENDED,
  ASHRAE_A1_ALLOWABLE,
} from "../../lib/kpi-calculations";

interface SampleReading {
  id: string;
  timestamp: string;
  location: string;
  dryBulbC: number;
  relativeHumidityPct: number;
}

const DEFAULT_SAMPLE_READINGS: SampleReading[] = [
  {
    id: "s1",
    timestamp: "10:00",
    location: "Row A1 - Rack 01 (Inlet Mid)",
    dryBulbC: 22.4,
    relativeHumidityPct: 48,
  },
  {
    id: "s2",
    timestamp: "10:05",
    location: "Row A1 - Rack 04 (Inlet Top)",
    dryBulbC: 24.1,
    relativeHumidityPct: 52,
  },
  {
    id: "s3",
    timestamp: "10:10",
    location: "Row A2 - Rack 08 (Inlet Mid)",
    dryBulbC: 21.8,
    relativeHumidityPct: 45,
  },
  {
    id: "s4",
    timestamp: "10:15",
    location: "Row B1 - Rack 02 (GPU Ingress)",
    dryBulbC: 25.8,
    relativeHumidityPct: 58,
  },
  {
    id: "s5",
    timestamp: "10:20",
    location: "Row B2 - Rack 06 (GPU Ingress)",
    dryBulbC: 27.2,
    relativeHumidityPct: 62,
  },
  {
    id: "s6",
    timestamp: "10:25",
    location: "Row C1 - Storage Array Ingress",
    dryBulbC: 23.0,
    relativeHumidityPct: 50,
  },
  {
    id: "s7",
    timestamp: "10:30",
    location: "Row C2 - Network Ingress Top",
    dryBulbC: 28.5,
    relativeHumidityPct: 66,
  }, // Out of recommended
  {
    id: "s8",
    timestamp: "10:35",
    location: "Row D1 - Legacy Blade Enclosure",
    dryBulbC: 26.5,
    relativeHumidityPct: 54,
  },
];

export function EnvironmentalComplianceWidget() {
  const [envelope, setEnvelope] = useState<"recommended" | "allowableA1">("recommended");
  const [customLimits, setCustomLimits] = useState({
    minTempC: ASHRAE_A1_RECOMMENDED.minTempC,
    maxTempC: ASHRAE_A1_RECOMMENDED.maxTempC,
    minRhPct: ASHRAE_A1_RECOMMENDED.minRhPct,
    maxRhPct: ASHRAE_A1_RECOMMENDED.maxRhPct,
    maxDewPointC: ASHRAE_A1_RECOMMENDED.maxDewPointC,
  });

  // Single test sensor
  const [testTempC, setTestTempC] = useState<number>(23.5);
  const [testRhPct, setTestRhPct] = useState<number>(50);

  // Form IDs for accessibility
  const envelopeSelectId = useId();
  const minTempInputId = useId();
  const maxTempInputId = useId();
  const minRhInputId = useId();
  const maxRhInputId = useId();
  const testTempInputId = useId();
  const testRhInputId = useId();

  const handleEnvelopeChange = (env: "recommended" | "allowableA1") => {
    setEnvelope(env);
    if (env === "recommended") {
      setCustomLimits({
        minTempC: ASHRAE_A1_RECOMMENDED.minTempC,
        maxTempC: ASHRAE_A1_RECOMMENDED.maxTempC,
        minRhPct: ASHRAE_A1_RECOMMENDED.minRhPct,
        maxRhPct: ASHRAE_A1_RECOMMENDED.maxRhPct,
        maxDewPointC: ASHRAE_A1_RECOMMENDED.maxDewPointC,
      });
    } else {
      setCustomLimits({
        minTempC: ASHRAE_A1_ALLOWABLE.minTempC,
        maxTempC: ASHRAE_A1_ALLOWABLE.maxTempC,
        minRhPct: ASHRAE_A1_ALLOWABLE.minRhPct,
        maxRhPct: ASHRAE_A1_ALLOWABLE.maxRhPct,
        maxDewPointC: ASHRAE_A1_ALLOWABLE.maxDewPointC,
      });
    }
  };

  const singleSensorDewPoint = calculateDewPoint(testTempC, testRhPct);
  const isTempCompliant = testTempC >= customLimits.minTempC && testTempC <= customLimits.maxTempC;
  const isRhCompliant = testRhPct >= customLimits.minRhPct && testRhPct <= customLimits.maxRhPct;
  const isDewPointCompliant = singleSensorDewPoint <= customLimits.maxDewPointC;
  const isSingleCompliant = isTempCompliant && isRhCompliant && isDewPointCompliant;

  // Multi-sensor sample calculation
  const complianceResults = DEFAULT_SAMPLE_READINGS.map((reading) => {
    const dewPoint = calculateDewPoint(reading.dryBulbC, reading.relativeHumidityPct);
    const tempOk =
      reading.dryBulbC >= customLimits.minTempC && reading.dryBulbC <= customLimits.maxTempC;
    const rhOk =
      reading.relativeHumidityPct >= customLimits.minRhPct &&
      reading.relativeHumidityPct <= customLimits.maxRhPct;
    const dewPointOk = dewPoint <= customLimits.maxDewPointC;
    return {
      ...reading,
      dewPointC: dewPoint,
      compliant: tempOk && rhOk && dewPointOk,
      tempOk,
      rhOk,
      dewPointOk,
    };
  });

  const compliantCount = complianceResults.filter((r) => r.compliant).length;
  const complianceSummary = calculateEnvironmentalCompliance(
    DEFAULT_SAMPLE_READINGS.map((r) => ({ tempC: r.dryBulbC, rhPct: r.relativeHumidityPct })),
    customLimits,
  );

  return (
    <div className="rounded-xl border border-border/80 bg-card/60 p-6 shadow-sm backdrop-blur">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-border/60 pb-4">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
            KPI 6 — Environmental Monitoring & Thermal Compliance
          </span>
          <h3 className="text-xl font-bold tracking-tight text-foreground">
            ASHRAE TC 9.9 Thermal Envelope Compliance Engine
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <label htmlFor={envelopeSelectId} className="text-xs text-muted-foreground">
            Standard Profile:
          </label>
          <select
            id={envelopeSelectId}
            value={envelope}
            onChange={(e) => handleEnvelopeChange(e.target.value as "recommended" | "allowableA1")}
            className="rounded-md border border-border bg-background px-2.5 py-1 text-xs text-foreground focus:border-emerald-500 focus:outline-none"
          >
            <option value="recommended">
              ASHRAE TC 9.9 Recommended (18°C - 27°C, ≤60% RH / ≤15°C DP)
            </option>
            <option value="allowableA1">
              ASHRAE TC 9.9 Class A1 Allowable (15°C - 32°C, 20% - 80% RH / ≤17°C DP)
            </option>
          </select>
        </div>
      </div>

      <div className="mt-4 rounded-lg bg-muted/40 p-3 text-xs text-muted-foreground">
        <strong className="text-foreground">Formula:</strong>{" "}
        <code className="text-emerald-400">
          Compliance (%) = (Valid Readings Within Configured Limits ÷ Total Valid Readings) × 100
        </code>
        <br />
        <span className="mt-1 block">
          Magnus Dew Point Approximation:{" "}
          <code className="text-foreground">
            T_dp = (b × γ) / (a − γ) where γ = ln(RH/100) + (a × T)/(b + T), a=17.27, b=237.7°C
          </code>
        </span>
      </div>

      {/* Threshold Configurator */}
      <div className="mt-6 grid gap-4 rounded-lg border border-border/60 bg-background/50 p-4 sm:grid-cols-4">
        <div>
          <label htmlFor={minTempInputId} className="text-xs font-medium text-muted-foreground">
            Min Inlet Temp (°C)
          </label>
          <input
            id={minTempInputId}
            type="number"
            step="0.5"
            inputMode="decimal"
            value={customLimits.minTempC}
            onChange={(e) =>
              setCustomLimits({ ...customLimits, minTempC: parseFloat(e.target.value) || 0 })
            }
            className="mt-1 w-full rounded border border-border bg-background px-2.5 py-1 text-sm font-mono text-foreground"
          />
        </div>
        <div>
          <label htmlFor={maxTempInputId} className="text-xs font-medium text-muted-foreground">
            Max Inlet Temp (°C)
          </label>
          <input
            id={maxTempInputId}
            type="number"
            step="0.5"
            inputMode="decimal"
            value={customLimits.maxTempC}
            onChange={(e) =>
              setCustomLimits({ ...customLimits, maxTempC: parseFloat(e.target.value) || 0 })
            }
            className="mt-1 w-full rounded border border-border bg-background px-2.5 py-1 text-sm font-mono text-foreground"
          />
        </div>
        <div>
          <label htmlFor={minRhInputId} className="text-xs font-medium text-muted-foreground">
            Min Relative Humidity (%)
          </label>
          <input
            id={minRhInputId}
            type="number"
            step="1"
            inputMode="numeric"
            value={customLimits.minRhPct}
            onChange={(e) =>
              setCustomLimits({ ...customLimits, minRhPct: parseFloat(e.target.value) || 0 })
            }
            className="mt-1 w-full rounded border border-border bg-background px-2.5 py-1 text-sm font-mono text-foreground"
          />
        </div>
        <div>
          <label htmlFor={maxRhInputId} className="text-xs font-medium text-muted-foreground">
            Max Relative Humidity (%)
          </label>
          <input
            id={maxRhInputId}
            type="number"
            step="1"
            inputMode="numeric"
            value={customLimits.maxRhPct}
            onChange={(e) =>
              setCustomLimits({ ...customLimits, maxRhPct: parseFloat(e.target.value) || 0 })
            }
            className="mt-1 w-full rounded border border-border bg-background px-2.5 py-1 text-sm font-mono text-foreground"
          />
        </div>
      </div>

      {/* Live Single Sensor Diagnostic */}
      <div className="mt-6 rounded-lg border border-border/80 bg-background/80 p-4">
        <h4 className="text-sm font-semibold text-foreground flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <span>Interactive Sensor Probe Diagnostic</span>
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium self-start sm:self-auto ${
              isSingleCompliant
                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
            }`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${isSingleCompliant ? "bg-emerald-400" : "bg-amber-400"}`}
            />
            {isSingleCompliant ? "Compliant with Configured Envelope" : "Excursion Detected"}
          </span>
        </h4>

        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <div>
            <label htmlFor={testTempInputId} className="text-xs text-muted-foreground">
              Simulated Dry Bulb Temp (°C)
            </label>
            <input
              id={testTempInputId}
              type="number"
              step="0.1"
              inputMode="decimal"
              value={testTempC}
              onChange={(e) => setTestTempC(parseFloat(e.target.value) || 0)}
              className="mt-1 w-full rounded border border-border bg-background px-3 py-1.5 text-sm font-mono text-foreground"
            />
            <p className="mt-1 text-[11px] text-muted-foreground">
              Range: {customLimits.minTempC}°C to {customLimits.maxTempC}°C (
              <span
                className={isTempCompliant ? "text-emerald-400" : "text-amber-400 font-semibold"}
              >
                {isTempCompliant ? "Within bounds" : "Out of bounds"}
              </span>
              )
            </p>
          </div>
          <div>
            <label htmlFor={testRhInputId} className="text-xs text-muted-foreground">
              Simulated Relative Humidity (%)
            </label>
            <input
              id={testRhInputId}
              type="number"
              step="1"
              min="0"
              max="100"
              inputMode="numeric"
              value={testRhPct}
              onChange={(e) => setTestRhPct(parseFloat(e.target.value) || 0)}
              className="mt-1 w-full rounded border border-border bg-background px-3 py-1.5 text-sm font-mono text-foreground"
            />
            <p className="mt-1 text-[11px] text-muted-foreground">
              Range: {customLimits.minRhPct}% to {customLimits.maxRhPct}% (
              <span className={isRhCompliant ? "text-emerald-400" : "text-amber-400 font-semibold"}>
                {isRhCompliant ? "Within bounds" : "Out of bounds"}
              </span>
              )
            </p>
          </div>
          <div className="rounded border border-border/60 bg-muted/20 p-3">
            <span className="text-xs text-muted-foreground">Calculated Dew Point</span>
            <div className="mt-1 text-2xl font-bold font-mono text-foreground">
              {singleSensorDewPoint}°C
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Configured dew-point limit: ≤{customLimits.maxDewPointC}°C
            </p>
          </div>
        </div>
      </div>

      {/* Fleet Sensor Array Sample Table */}
      <div className="mt-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h4 className="text-sm font-semibold text-foreground">
            Illustrative Inlet Sensor Array Sample ({DEFAULT_SAMPLE_READINGS.length} probes)
          </h4>
          <div className="text-left sm:text-right">
            <span className="text-xs text-muted-foreground">Array Compliance: </span>
            <span className="text-base font-bold font-mono text-emerald-400">
              {complianceSummary.compliancePct !== null
                ? `${complianceSummary.compliancePct.toFixed(1)}%`
                : "N/A"}
            </span>{" "}
            <span className="text-xs text-muted-foreground">
              ({compliantCount}/{complianceResults.length} in-envelope)
            </span>
          </div>
        </div>

        <div className="mt-3 overflow-x-auto rounded-lg border border-border/60">
          <table className="w-full min-w-[560px] text-left text-xs">
            <thead className="bg-muted/50 text-muted-foreground border-b border-border/60">
              <tr>
                <th className="px-3 py-2">Time</th>
                <th className="px-3 py-2">Sensor Location</th>
                <th className="px-3 py-2">Dry Bulb Temp</th>
                <th className="px-3 py-2">Relative Humidity</th>
                <th className="px-3 py-2">Dew Point</th>
                <th className="px-3 py-2">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40 font-mono">
              {complianceResults.map((reading) => (
                <tr key={reading.id} className="hover:bg-muted/20 transition-colors">
                  <td className="px-3 py-2 text-muted-foreground">{reading.timestamp}</td>
                  <td className="px-3 py-2 font-sans text-foreground">{reading.location}</td>
                  <td className="px-3 py-2">
                    <span
                      className={reading.tempOk ? "text-foreground" : "text-amber-400 font-bold"}
                    >
                      {reading.dryBulbC}°C
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    <span className={reading.rhOk ? "text-foreground" : "text-amber-400 font-bold"}>
                      {reading.relativeHumidityPct}%
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    <span className={reading.dewPointOk ? "text-muted-foreground" : "text-amber-400 font-bold"}>
                      {reading.dewPointC}°C
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    {reading.compliant ? (
                      <span className="inline-flex items-center rounded bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-400">
                        NORMAL
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-400">
                        EXCURSION
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-4 rounded-lg border border-border/40 bg-muted/20 p-3 text-xs text-muted-foreground">
        <strong className="text-foreground">Illustrative sample note:</strong> These readings and
         compliance results are local sample data, not live facility telemetry. Temperature
         envelopes are benchmarked against ASHRAE TC 9.9 (Thermal Guidelines for Data Processing Environments, 5th
        Edition). Recommended bounds balance IT hardware reliability, fan power consumption, and
        economiser operating hours. Excursions within Allowable Class A1 do not cause immediate
        thermal shutdown but increase component failure probabilities over prolonged exposure.
      </div>
    </div>
  );
}
