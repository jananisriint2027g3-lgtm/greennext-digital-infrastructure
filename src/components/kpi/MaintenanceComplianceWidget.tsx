import { useState, useId } from "react";
import { calculateMaintenanceCompliance } from "../../lib/kpi-calculations";

interface SampleMopTask {
  id: string;
  asset: string;
  system: string;
  frequency: string;
  dueDate: string;
  completedDate: string | null;
  status: "completed_on_time" | "completed_late" | "pending" | "overdue";
  mopVerified: boolean;
}

const DEFAULT_SAMPLE_TASKS: SampleMopTask[] = [
  {
    id: "PM-2026-081",
    asset: "UPS-A1 (Static Inverter & Capacitor Bank)",
    system: "Power Distribution",
    frequency: "Monthly",
    dueDate: "2026-10-15",
    completedDate: "2026-10-14",
    status: "completed_on_time",
    mopVerified: true,
  },
  {
    id: "PM-2026-082",
    asset: "CRAH-04 (EC Fan Belt & Valve Actuator)",
    system: "Cooling Infrastructure",
    frequency: "Quarterly",
    dueDate: "2026-10-16",
    completedDate: "2026-10-15",
    status: "completed_on_time",
    mopVerified: true,
  },
  {
    id: "PM-2026-083",
    asset: "Generator GEN-02 (Load Bank Run & Fuel Polish)",
    system: "Emergency Generation",
    frequency: "Monthly",
    dueDate: "2026-10-18",
    completedDate: "2026-10-20",
    status: "completed_late",
    mopVerified: true,
  },
  {
    id: "PM-2026-084",
    asset: "VESDA Aspirating Smoke Detector Chamber Clean",
    system: "Fire Protection",
    frequency: "Semi-Annual",
    dueDate: "2026-10-20",
    completedDate: "2026-10-19",
    status: "completed_on_time",
    mopVerified: true,
  },
  {
    id: "PM-2026-085",
    asset: "Chilled Water Primary Pump P-101 Bearing Lube",
    system: "Cooling Plant",
    frequency: "Quarterly",
    dueDate: "2026-10-21",
    completedDate: null,
    status: "overdue",
    mopVerified: false,
  },
];

export function MaintenanceComplianceWidget() {
  // Preventive Maintenance inputs
  const [tasksDue, setTasksDue] = useState<number>(45);
  const [completedOnTime, setCompletedOnTime] = useState<number>(41);
  const [tasksOverdue, setTasksOverdue] = useState<number>(4);

  // Planned Maintenance Hours inputs
  const [plannedHours, setPlannedHours] = useState<number>(180);
  const [unplannedHours, setUnplannedHours] = useState<number>(20);

  // Form IDs
  const tasksDueInputId = useId();
  const completedOnTimeInputId = useId();
  const tasksOverdueInputId = useId();
  const plannedHoursInputId = useId();
  const unplannedHoursInputId = useId();

  const pmcResult = calculateMaintenanceCompliance(
    tasksDue,
    completedOnTime,
    plannedHours,
    unplannedHours,
  );

  const getPmcStatusBadge = (rate: number | null) => {
    if (rate === null) {
      return {
        label: "N/A — No Tasks Due",
        className: "bg-muted text-muted-foreground border border-border/40",
      };
    }
    if (rate >= 90) {
      return {
        label: "World-Class (≥90%)",
        className: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
      };
    }
    if (rate >= 75) {
      return {
        label: "Acceptable (75-89%)",
        className: "bg-amber-500/10 text-amber-400 border border-amber-500/20",
      };
    }
    return {
      label: "Needs Attention (<75%)",
      className: "bg-rose-500/10 text-rose-400 border border-rose-500/20",
    };
  };

  const badge = getPmcStatusBadge(pmcResult.pmcPct);

  return (
    <div className="rounded-xl border border-border/80 bg-card/60 p-6 shadow-sm backdrop-blur">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-border/60 pb-4">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
            KPI 10 — Operational Discipline & Asset Maintenance
          </span>
          <h3 className="text-xl font-bold tracking-tight text-foreground">
            Preventive Maintenance Compliance (PMC) & Planned Work Ratio
          </h3>
        </div>
        <span
          className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${badge.className}`}
        >
          {badge.label}
        </span>
      </div>

      <div className="mt-4 rounded-lg bg-muted/40 p-3 text-xs text-muted-foreground">
        <strong className="text-foreground">Formulas:</strong>
        <div className="mt-1 space-y-1 font-mono">
          <p className="text-emerald-400">
            PMC (%) = (Preventive Maintenance Tasks Completed On Time ÷ Total PM Tasks Due) × 100
          </p>
          <p className="text-teal-400">
            PMP (%) = (Planned Maintenance Labor Hours ÷ Total Maintenance Labor Hours) × 100
          </p>
        </div>
      </div>

      {/* Interactive Controls */}
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* Metric 1: PMC */}
        <div className="rounded-lg border border-border/80 bg-background/50 p-4 space-y-4">
          <h4 className="text-sm font-semibold text-foreground">
            Preventive Maintenance Schedule Compliance
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label htmlFor={tasksDueInputId} className="text-xs text-muted-foreground">
                Tasks Due in Window
              </label>
              <input
                id={tasksDueInputId}
                type="number"
                min="0"
                inputMode="numeric"
                value={tasksDue}
                onChange={(e) => setTasksDue(Math.max(0, parseInt(e.target.value) || 0))}
                className="mt-1 w-full rounded border border-border bg-background px-2.5 py-1 text-sm font-mono text-foreground"
              />
            </div>
            <div>
              <label htmlFor={completedOnTimeInputId} className="text-xs text-muted-foreground">
                Completed On-Time
              </label>
              <input
                id={completedOnTimeInputId}
                type="number"
                min="0"
                max={tasksDue}
                inputMode="numeric"
                value={completedOnTime}
                onChange={(e) => setCompletedOnTime(Math.max(0, parseInt(e.target.value) || 0))}
                className="mt-1 w-full rounded border border-border bg-background px-2.5 py-1 text-sm font-mono text-foreground"
              />
            </div>
            <div>
              <label htmlFor={tasksOverdueInputId} className="text-xs text-muted-foreground">
                Overdue / Backlog
              </label>
              <input
                id={tasksOverdueInputId}
                type="number"
                min="0"
                inputMode="numeric"
                value={tasksOverdue}
                onChange={(e) => setTasksOverdue(Math.max(0, parseInt(e.target.value) || 0))}
                className="mt-1 w-full rounded border border-border bg-background px-2.5 py-1 text-sm font-mono text-foreground"
              />
            </div>
          </div>

          <div className="rounded border border-border/60 bg-muted/20 p-3">
            <span className="text-xs text-muted-foreground">
              Preventive Maintenance Compliance (PMC)
            </span>
            <div className="mt-1 text-2xl sm:text-3xl font-bold font-mono text-emerald-400">
              {pmcResult.pmcPct !== null ? `${pmcResult.pmcPct.toFixed(1)}%` : "N/A — No Tasks Due"}
            </div>
            <p className="mt-1 text-[11px] text-muted-foreground">
              {tasksDue > 0
                ? `${completedOnTime} of ${tasksDue} scheduled work orders executed within OEM/site SLA window.`
                : "No scheduled preventive work orders in the selected observation window."}
            </p>
          </div>
        </div>

        {/* Metric 2: PMP */}
        <div className="rounded-lg border border-border/80 bg-background/50 p-4 space-y-4">
          <h4 className="text-sm font-semibold text-foreground">
            Planned vs Reactive Labor Ratio (PMP)
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor={plannedHoursInputId} className="text-xs text-muted-foreground">
                Planned PM Hours
              </label>
              <input
                id={plannedHoursInputId}
                type="number"
                min="0"
                inputMode="decimal"
                value={plannedHours}
                onChange={(e) => setPlannedHours(Math.max(0, parseFloat(e.target.value) || 0))}
                className="mt-1 w-full rounded border border-border bg-background px-2.5 py-1 text-sm font-mono text-foreground"
              />
            </div>
            <div>
              <label htmlFor={unplannedHoursInputId} className="text-xs text-muted-foreground">
                Unplanned / Reactive Hours
              </label>
              <input
                id={unplannedHoursInputId}
                type="number"
                min="0"
                inputMode="decimal"
                value={unplannedHours}
                onChange={(e) => setUnplannedHours(Math.max(0, parseFloat(e.target.value) || 0))}
                className="mt-1 w-full rounded border border-border bg-background px-2.5 py-1 text-sm font-mono text-foreground"
              />
            </div>
          </div>

          <div className="rounded border border-border/60 bg-muted/20 p-3">
            <span className="text-xs text-muted-foreground">
              Planned Maintenance Percentage (PMP)
            </span>
            <div className="mt-1 text-3xl font-bold font-mono text-teal-400">
              {pmcResult.pmpPct !== null ? `${pmcResult.pmpPct.toFixed(1)}%` : "N/A"}
            </div>
            <p className="mt-1 text-[11px] text-muted-foreground">
              Industry benchmark: &gt;85% planned activity signals pro-active risk mitigation vs
              fire-fighting.
            </p>
          </div>
        </div>
      </div>

      {/* Illustrative MOP Execution Sample Table */}
      <div className="mt-6">
        <h4 className="text-sm font-semibold text-foreground">
          Illustrative Method of Procedure (MOP) Execution Log
        </h4>

        <div className="mt-3 overflow-x-auto rounded-lg border border-border/60">
          <table className="w-full min-w-[640px] text-left text-xs">
            <thead className="bg-muted/50 text-muted-foreground border-b border-border/60">
              <tr>
                <th className="px-3 py-2">WO #</th>
                <th className="px-3 py-2">Asset & Description</th>
                <th className="px-3 py-2">Discipline</th>
                <th className="px-3 py-2">Frequency</th>
                <th className="px-3 py-2">Due Date</th>
                <th className="px-3 py-2">MOP Validated</th>
                <th className="px-3 py-2">Execution Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40 font-mono">
              {DEFAULT_SAMPLE_TASKS.map((task) => (
                <tr key={task.id} className="hover:bg-muted/20 transition-colors">
                  <td className="px-3 py-2 font-medium text-emerald-400">{task.id}</td>
                  <td className="px-3 py-2 font-sans text-foreground">{task.asset}</td>
                  <td className="px-3 py-2 font-sans text-muted-foreground">{task.system}</td>
                  <td className="px-3 py-2 text-muted-foreground">{task.frequency}</td>
                  <td className="px-3 py-2 text-muted-foreground">{task.dueDate}</td>
                  <td className="px-3 py-2">
                    {task.mopVerified ? (
                      <span className="text-emerald-400 font-sans">✓ Verified</span>
                    ) : (
                      <span className="text-amber-400 font-sans">Pending signoff</span>
                    )}
                  </td>
                  <td className="px-3 py-2 font-sans">
                    {task.status === "completed_on_time" && (
                      <span className="inline-flex items-center rounded bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-400">
                        Completed On-Time
                      </span>
                    )}
                    {task.status === "completed_late" && (
                      <span className="inline-flex items-center rounded bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-400">
                        Late Execution
                      </span>
                    )}
                    {task.status === "overdue" && (
                      <span className="inline-flex items-center rounded bg-rose-500/10 px-2 py-0.5 text-[10px] font-medium text-rose-400">
                        Overdue / Backlog
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
        <strong className="text-foreground">CMMS Integration Notice:</strong> The figures above
        represent an interactive demonstration of computerized maintenance management system (CMMS)
        tracking principles. Live deployment requires API integration with an enterprise CMMS (such
        as IBM Maximo, SAP PM, or ServiceNow) with validated timestamp audit trails.
      </div>
    </div>
  );
}
