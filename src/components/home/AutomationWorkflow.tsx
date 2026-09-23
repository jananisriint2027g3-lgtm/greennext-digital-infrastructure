import { useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  Activity,
  Scan,
  GitBranch,
  CheckCircle,
  PlayCircle,
  FileText,
  ShieldCheck,
  ChevronRight,
  ArrowRight,
} from "lucide-react";
import nocImg from "../../assets/operations-noc.jpg";

interface AutoStep {
  id: string;
  stepNumber: string;
  name: string;
  action: string;
  detail: string;
  icon: typeof Activity;
}

const AUTOMATION_STEPS: AutoStep[] = [
  {
    id: "monitor",
    stepNumber: "01",
    name: "Monitor",
    action: "Continuous Telemetry Collection",
    detail:
      "Collecting electrical, thermal, storage, and network signals across physical infrastructure into a unified telemetry stream.",
    icon: Activity,
  },
  {
    id: "detect",
    stepNumber: "02",
    name: "Detect",
    action: "Deviation Flagging",
    detail:
      "Comparing live operating conditions against calibrated historical envelopes to identify emerging deviations.",
    icon: Scan,
  },
  {
    id: "analyze",
    stepNumber: "03",
    name: "Analyze",
    action: "Contextual Correlation",
    detail:
      "Correlating signals across adjacent infrastructure layers to distinguish benign variation from critical faults.",
    icon: GitBranch,
  },
  {
    id: "decide",
    stepNumber: "04",
    name: "Decide",
    action: "Protocol Matching",
    detail:
      "Evaluating severity levels and selecting predetermined response protocols or human operator escalations.",
    icon: CheckCircle,
  },
  {
    id: "automate",
    stepNumber: "05",
    name: "Automate",
    action: "Bounded Operational Action",
    detail:
      "Executing safe, bounded adjustments to cooling parameters or routing structured alerts with actionable context.",
    icon: PlayCircle,
  },
  {
    id: "report",
    stepNumber: "06",
    name: "Report",
    action: "Audit & Documentation",
    detail:
      "Documenting conditions, actions taken, and resolution metrics into standardized institutional operational reports.",
    icon: FileText,
  },
];

export function AutomationWorkflow() {
  const [activeStep, setActiveStep] = useState<string>("monitor");
  const current = AUTOMATION_STEPS.find((s) => s.id === activeStep) || AUTOMATION_STEPS[0];

  return (
    <div className="rounded-2xl border border-[#1E293B] bg-[#121824] p-6 sm:p-8 lg:p-10 shadow-2xl">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 mb-8 border-b border-[#1E293B]">
        <div>
          <span className="text-xs font-mono uppercase tracking-widest text-[#10B981] font-semibold">
            Closed-Loop Operational Sequence
          </span>
          <h3 className="text-xl sm:text-2xl font-bold text-white mt-1">
            Monitor ➔ Detect ➔ Analyze ➔ Decide ➔ Automate ➔ Report
          </h3>
        </div>

        <Link
          to="/automation/monitoring"
          className="inline-flex items-center gap-2 text-xs font-medium text-[#10B981] hover:text-[#34D399] transition-colors"
        >
          <span>Explore Automation Section</span>
          <ArrowRight size={13} />
        </Link>
      </div>

      {/* 6 Step Interactive Horizontal Chain */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
        {AUTOMATION_STEPS.map((step) => {
          const Icon = step.icon;
          const isSelected = activeStep === step.id;

          return (
            <button
              key={step.id}
              onClick={() => setActiveStep(step.id)}
              className={`p-4 rounded-xl border text-left transition-all flex flex-col justify-between min-h-[120px] group ${
                isSelected
                  ? "bg-[#1A2234] border-[#10B981] shadow-lg shadow-[#10B981]/10"
                  : "bg-[#0B0F17] border-[#1E293B] hover:border-[#334155] hover:bg-[#121824]"
              }`}
            >
              <div className="flex items-center justify-between w-full mb-2">
                <span className="font-mono text-xs text-[#10B981] font-semibold">
                  {step.stepNumber}
                </span>
                <Icon
                  size={16}
                  className={`transition-colors ${
                    isSelected ? "text-[#10B981]" : "text-[#64748B] group-hover:text-white"
                  }`}
                />
              </div>

              <div>
                <h4 className="text-sm font-semibold text-white mb-0.5">{step.name}</h4>
                <p className="text-[10px] text-[#94A3B8] truncate">{step.action}</p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Step Detail Callout with Operations Center Preview */}
      <div className="p-6 lg:p-8 rounded-xl border border-[#334155] bg-[#0B0F17] mb-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          <div className="lg:col-span-7 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="font-mono text-xs text-[#10B981] font-semibold">
                  STAGE {current.stepNumber}: {current.name.toUpperCase()}
                </span>
                <span className="text-[#475569]">·</span>
                <span className="text-xs text-white font-medium">{current.action}</span>
              </div>
              <p className="text-xs sm:text-sm text-[#94A3B8] leading-relaxed mb-6">
                {current.detail}
              </p>
            </div>

            <div className="pt-4 border-t border-[#1E293B] flex flex-wrap items-center justify-between gap-3">
              <span className="text-[10px] font-mono text-[#64748B]">
                OPERATIONS CONSOLE // TELEMETRY PIPELINE
              </span>
              <Link
                to={`/automation/${current.id === "detect" ? "anomaly" : current.id === "decide" ? "alerts" : current.id === "automate" ? "alerts" : current.id === "report" ? "reporting" : "monitoring"}`}
                className="px-3.5 py-2 rounded-lg border border-[#334155] hover:border-[#10B981] text-white text-xs font-semibold hover:text-[#10B981] transition-all flex items-center gap-1.5 flex-shrink-0"
              >
                <span>Capabilities</span>
                <ChevronRight size={13} />
              </Link>
            </div>
          </div>

          <div className="lg:col-span-5">
            <div className="rounded-xl overflow-hidden border border-[#1E293B] bg-[#121824] shadow-xl group">
              <div className="aspect-[16/9] w-full overflow-hidden bg-[#070A0E]">
                <img
                  src={nocImg}
                  alt="Enterprise data center network operations center with telemetry monitoring workstations"
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              <div className="px-3.5 py-2 bg-[#0B0F17] border-t border-[#1E293B] flex items-center justify-between text-[10px] font-mono text-[#94A3B8]">
                <span>OPERATIONS CENTER (ILLUSTRATIVE)</span>
                <span className="text-[#38BDF8]">CONTINUOUS MONITORING</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mandatory Conceptual Disclaimer */}
      <div className="flex items-center gap-2 text-xs text-[#64748B] pt-4 border-t border-[#1E293B]">
        <ShieldCheck size={15} className="text-[#10B981] flex-shrink-0" />
        <span>
          <strong>Status:</strong> These represent conceptual capabilities and workflows — not
          claims of currently deployed production systems.
        </span>
      </div>
    </div>
  );
}
