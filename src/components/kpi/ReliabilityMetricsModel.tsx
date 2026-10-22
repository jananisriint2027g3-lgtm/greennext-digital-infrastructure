import { useState, useId } from "react";
import { calculateMtbf, calculateMttr } from "../../lib/kpi-calculations";

export function ReliabilityMetricsModel() {
  // KPI 7: MTBF state
  const [unitCount, setUnitCount] = useState<number>(100);
  const [periodHours, setPeriodHours] = useState<number>(8760); // 1 year
  const [failures, setFailures] = useState<number>(4);

  // KPI 8: MTTR state
  const [repairMinutes, setRepairMinutes] = useState<number>(360); // 6 hours total
  const [incidents, setIncidents] = useState<number>(3);

  // Granular incident lifecycle breakdown in minutes
  const [lifecycle, setLifecycle] = useState({
    detectionMin: 5,
    triageMin: 15,
    dispatchMin: 30,
    activeRepairMin: 60,
    verificationMin: 10,
  });

  // Accessible element IDs
  const unitCountInputId = useId();
  const periodHoursInputId = useId();
  const failuresInputId = useId();
  const repairMinutesInputId = useId();
  const incidentsInputId = useId();
  const detectionInputId = useId();
  const triageInputId = useId();
  const dispatchInputId = useId();
  const activeRepairInputId = useId();
  const verificationInputId = useId();

  // Calculations
  const totalOperatingHours = unitCount * periodHours;
  const mtbfResult = calculateMtbf(unitCount, periodHours, failures);
  const mttrResult = calculateMttr(repairMinutes, incidents);

  const totalLifecycleMin =
    lifecycle.detectionMin +
    lifecycle.triageMin +
    lifecycle.dispatchMin +
    lifecycle.activeRepairMin +
    lifecycle.verificationMin;

  const annualFailureRateLambda =
    mtbfResult.mtbfHours !== null && mtbfResult.mtbfHours > 0
      ? (1 / mtbfResult.mtbfHours) * 1_000_000 // FIT (Failures in 10^6 hours)
      : 0;

  return (
    <div className="space-y-6">
      {/* KPI 7: MTBF Section */}
      <div className="rounded-xl border border-border/80 bg-card/60 p-6 shadow-sm backdrop-blur">
        <div className="border-b border-border/60 pb-4">
          <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
            KPI 7 — Equipment Population Reliability
          </span>
          <h3 className="text-xl font-bold tracking-tight text-foreground">
            Mean Time Between Failures (MTBF) Calculator
          </h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Measures the statistical operational reliability for a repairable equipment cohort over
            an observation period.
          </p>
        </div>

        <div className="mt-4 rounded-lg bg-muted/40 p-3 text-xs text-muted-foreground">
          <strong className="text-foreground">Formula:</strong>{" "}
          <code className="text-emerald-400">
            MTBF = (Fleet Population × Observation Hours) ÷ Number of Qualifying Failures
          </code>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          {/* Inputs */}
          <div className="space-y-4">
            <div>
              <label htmlFor={unitCountInputId} className="text-xs font-medium text-foreground">
                Monitored Unit Population (N)
              </label>
              <input
                id={unitCountInputId}
                type="number"
                min="1"
                step="1"
                value={unitCount}
                onChange={(e) => setUnitCount(Math.max(1, parseInt(e.target.value) || 1))}
                className="mt-1 w-full rounded border border-border bg-background px-3 py-1.5 text-sm font-mono text-foreground"
              />
              <span className="text-[11px] text-muted-foreground">
                E.g. 100 CRAH units, 20 UPS modules, or 500 PDU circuits
              </span>
            </div>

            <div>
              <label htmlFor={periodHoursInputId} className="text-xs font-medium text-foreground">
                Observation Period (Hours per unit)
              </label>
              <input
                id={periodHoursInputId}
                type="number"
                min="1"
                step="24"
                value={periodHours}
                onChange={(e) => setPeriodHours(Math.max(1, parseFloat(e.target.value) || 1))}
                className="mt-1 w-full rounded border border-border bg-background px-3 py-1.5 text-sm font-mono text-foreground"
              />
              <span className="text-[11px] text-muted-foreground">
                8,760 hours = 1 non-leap calendar year
              </span>
            </div>

            <div>
              <label htmlFor={failuresInputId} className="text-xs font-medium text-foreground">
                Qualifying Unscheduled Failures
              </label>
              <input
                id={failuresInputId}
                type="number"
                min="0"
                step="1"
                value={failures}
                onChange={(e) => setFailures(Math.max(0, parseInt(e.target.value) || 0))}
                className="mt-1 w-full rounded border border-border bg-background px-3 py-1.5 text-sm font-mono text-foreground"
              />
              <span className="text-[11px] text-muted-foreground">
                Excludes scheduled preventive maintenance outages
              </span>
            </div>
          </div>

          {/* Results Display */}
          <div className="rounded-lg border border-border/80 bg-background/60 p-5 flex flex-col justify-between">
            <div>
              <span className="text-xs font-medium text-muted-foreground">Cohort MTBF Output</span>
              <div className="mt-2 text-2xl font-extrabold font-mono text-emerald-400">
                {mtbfResult.mtbfHours !== null ? (
                  `${mtbfResult.mtbfHours.toLocaleString(undefined, { maximumFractionDigits: 1 })} hrs`
                ) : (
                  <span className="text-foreground text-lg">
                    Point Estimate Undefined (0 Failures)
                  </span>
                )}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {mtbfResult.mtbfHours !== null ? (
                  `≈ ${(mtbfResult.mtbfHours / 24).toFixed(1)} operating days per failure across cohort`
                ) : (
                  <span>
                    90% Poisson Lower Bound:{" "}
                    <strong className="text-emerald-400 font-mono">
                      ≥ {mtbfResult.lowerConfidenceBoundHours?.toLocaleString()} unit-hrs
                    </strong>{" "}
                    (T / -ln(0.10))
                  </span>
                )}
              </p>

              <div className="mt-5 space-y-2 border-t border-border/60 pt-4 text-xs">
                <div className="flex justify-between py-1">
                  <span className="text-muted-foreground">
                    Total Cumulative Operating Hours (T):
                  </span>
                  <span className="font-mono font-medium text-foreground">
                    {totalOperatingHours.toLocaleString()} unit-hrs
                  </span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-muted-foreground">Annualized Failure Rate (λ):</span>
                  <span className="font-mono font-medium text-foreground">
                    {annualFailureRateLambda > 0
                      ? `${annualFailureRateLambda.toFixed(2)} FITs`
                      : "0 FITs (Bounded)"}
                  </span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-muted-foreground">Statistical Model:</span>
                  <span className="font-mono font-medium text-emerald-400">
                    {failures === 0
                      ? "Poisson One-Sided 90% Lower Bound"
                      : "Observed Constant Failure Rate"}
                  </span>
                </div>
              </div>
            </div>

            <p className="mt-4 text-[11px] text-muted-foreground border-t border-border/40 pt-3">
              <strong>Caveat:</strong> MTBF assumes a constant failure rate (exponential
              distribution) during the useful life phase. It does not reflect infant mortality or
              end-of-life wear-out wear mechanisms.
            </p>
          </div>
        </div>
      </div>

      {/* KPI 8: MTTR & Incident Lifecycle Section */}
      <div className="rounded-xl border border-border/80 bg-card/60 p-6 shadow-sm backdrop-blur">
        <div className="border-b border-border/60 pb-4">
          <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
            KPI 8 — Incident Response & Restoration Efficiency
          </span>
          <h3 className="text-xl font-bold tracking-tight text-foreground">
            Mean Time To Repair (MTTR) & Incident Lifecycle Decomposition
          </h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Measures maintainability and service restoration velocity from telemetry alert to
            operational sign-off.
          </p>
        </div>

        <div className="mt-4 rounded-lg bg-muted/40 p-3 text-xs text-muted-foreground">
          <strong className="text-foreground">Formula:</strong>{" "}
          <code className="text-emerald-400">
            MTTR = Total Qualifying Repair / Outage Time ÷ Qualifying Incidents
          </code>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          {/* High-Level MTTR Calculator */}
          <div className="rounded-lg border border-border/80 bg-background/50 p-4 space-y-4">
            <h4 className="text-sm font-semibold text-foreground">High-Level MTTR Calculator</h4>
            <div>
              <label htmlFor={repairMinutesInputId} className="text-xs text-muted-foreground">
                Total Cumulative Outage Time (Minutes)
              </label>
              <input
                id={repairMinutesInputId}
                type="number"
                min="0"
                step="10"
                value={repairMinutes}
                onChange={(e) => setRepairMinutes(Math.max(0, parseFloat(e.target.value) || 0))}
                className="mt-1 w-full rounded border border-border bg-background px-3 py-1.5 text-sm font-mono text-foreground"
              />
            </div>
            <div>
              <label htmlFor={incidentsInputId} className="text-xs text-muted-foreground">
                Number of Qualifying Incidents
              </label>
              <input
                id={incidentsInputId}
                type="number"
                min="1"
                step="1"
                value={incidents}
                onChange={(e) => setIncidents(Math.max(1, parseInt(e.target.value) || 1))}
                className="mt-1 w-full rounded border border-border bg-background px-3 py-1.5 text-sm font-mono text-foreground"
              />
            </div>

            <div className="rounded border border-border/60 bg-muted/20 p-4">
              <span className="text-xs text-muted-foreground">Calculated Mean Time To Repair</span>
              <div className="mt-1 text-2xl font-bold font-mono text-emerald-400">
                {mttrResult.mttrHours !== null ? (
                  <>
                    {mttrResult.mttrHours.toFixed(2)} hours{" "}
                    <span className="text-sm font-normal text-muted-foreground">
                      ({mttrResult.mttrMinutes?.toFixed(0)} min)
                    </span>
                  </>
                ) : (
                  "N/A"
                )}
              </div>
              <p className="mt-1 text-[11px] text-muted-foreground">
                Average incident resolution duration across {incidents} qualifying event(s).
              </p>
            </div>
          </div>

          {/* Incident Lifecycle Decomposition */}
          <div className="rounded-lg border border-border/80 bg-background/50 p-4 space-y-4">
            <h4 className="text-sm font-semibold text-foreground flex items-center justify-between">
              <span>Incident Timeline Decomposition</span>
              <span className="text-xs font-mono text-emerald-400">
                Total: {totalLifecycleMin} min
              </span>
            </h4>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label htmlFor={detectionInputId} className="text-muted-foreground">
                  1. MTTD (Detection):
                </label>
                <div className="flex items-center gap-1 mt-1">
                  <input
                    id={detectionInputId}
                    type="number"
                    min="0"
                    value={lifecycle.detectionMin}
                    onChange={(e) =>
                      setLifecycle({ ...lifecycle, detectionMin: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full rounded border border-border bg-background px-2 py-1 font-mono text-foreground"
                  />
                  <span className="text-muted-foreground text-[10px]">m</span>
                </div>
              </div>
              <div>
                <label htmlFor={triageInputId} className="text-muted-foreground">
                  2. MTTI (Identification/Triage):
                </label>
                <div className="flex items-center gap-1 mt-1">
                  <input
                    id={triageInputId}
                    type="number"
                    min="0"
                    value={lifecycle.triageMin}
                    onChange={(e) =>
                      setLifecycle({ ...lifecycle, triageMin: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full rounded border border-border bg-background px-2 py-1 font-mono text-foreground"
                  />
                  <span className="text-muted-foreground text-[10px]">m</span>
                </div>
              </div>
              <div>
                <label htmlFor={dispatchInputId} className="text-muted-foreground">
                  3. MTTR_resp (Dispatch/Arrival):
                </label>
                <div className="flex items-center gap-1 mt-1">
                  <input
                    id={dispatchInputId}
                    type="number"
                    min="0"
                    value={lifecycle.dispatchMin}
                    onChange={(e) =>
                      setLifecycle({ ...lifecycle, dispatchMin: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full rounded border border-border bg-background px-2 py-1 font-mono text-foreground"
                  />
                  <span className="text-muted-foreground text-[10px]">m</span>
                </div>
              </div>
              <div>
                <label htmlFor={activeRepairInputId} className="text-muted-foreground">
                  4. Active Repair (Hands-on):
                </label>
                <div className="flex items-center gap-1 mt-1">
                  <input
                    id={activeRepairInputId}
                    type="number"
                    min="0"
                    value={lifecycle.activeRepairMin}
                    onChange={(e) =>
                      setLifecycle({
                        ...lifecycle,
                        activeRepairMin: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full rounded border border-border bg-background px-2 py-1 font-mono text-foreground"
                  />
                  <span className="text-muted-foreground text-[10px]">m</span>
                </div>
              </div>
              <div className="col-span-2">
                <label htmlFor={verificationInputId} className="text-muted-foreground">
                  5. Return-to-Service Verification:
                </label>
                <div className="flex items-center gap-1 mt-1">
                  <input
                    id={verificationInputId}
                    type="number"
                    min="0"
                    value={lifecycle.verificationMin}
                    onChange={(e) =>
                      setLifecycle({
                        ...lifecycle,
                        verificationMin: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full rounded border border-border bg-background px-2 py-1 font-mono text-foreground"
                  />
                  <span className="text-muted-foreground text-[10px]">m</span>
                </div>
              </div>
            </div>

            {/* Proportion Bar */}
            <div className="mt-3">
              <span className="text-[11px] text-muted-foreground">
                Phase Contribution to Outage Window:
              </span>
              <div className="mt-1 flex h-3 w-full overflow-hidden rounded bg-muted">
                <div
                  style={{ width: `${(lifecycle.detectionMin / (totalLifecycleMin || 1)) * 100}%` }}
                  className="bg-blue-500"
                  title={`Detection: ${lifecycle.detectionMin}m`}
                />
                <div
                  style={{ width: `${(lifecycle.triageMin / (totalLifecycleMin || 1)) * 100}%` }}
                  className="bg-purple-500"
                  title={`Triage: ${lifecycle.triageMin}m`}
                />
                <div
                  style={{ width: `${(lifecycle.dispatchMin / (totalLifecycleMin || 1)) * 100}%` }}
                  className="bg-amber-500"
                  title={`Dispatch: ${lifecycle.dispatchMin}m`}
                />
                <div
                  style={{
                    width: `${(lifecycle.activeRepairMin / (totalLifecycleMin || 1)) * 100}%`,
                  }}
                  className="bg-emerald-500"
                  title={`Active Repair: ${lifecycle.activeRepairMin}m`}
                />
                <div
                  style={{
                    width: `${(lifecycle.verificationMin / (totalLifecycleMin || 1)) * 100}%`,
                  }}
                  className="bg-teal-500"
                  title={`Verification: ${lifecycle.verificationMin}m`}
                />
              </div>
              <div className="mt-2 flex flex-wrap gap-2 text-[10px] text-muted-foreground">
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-blue-500" /> Detect
                </span>
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-purple-500" /> Triage
                </span>
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-amber-500" /> Dispatch
                </span>
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" /> Repair
                </span>
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-teal-500" /> Verify
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 rounded-lg border border-border/40 bg-muted/20 p-3 text-xs text-muted-foreground">
          <strong className="text-foreground">Operational Distinction:</strong> True MTTR can refer
          strictly to hands-on maintenance technician wrench time, whereas Mean Time to Service
          Restoration (MTSR) includes telemetry detection, on-call dispatch, replacement part
          retrieval, hot-swap, and commission testing. Clear SLA contracts specify which boundary
          defines contractual penalties.
        </div>
      </div>
    </div>
  );
}
