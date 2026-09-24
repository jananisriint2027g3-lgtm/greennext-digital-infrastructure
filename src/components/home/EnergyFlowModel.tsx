import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Cpu, Zap, Snowflake, Gauge, ArrowRight, ShieldCheck } from "../icons";
import { trackEvent } from "../../lib/analytics";
import aiComputeImg from "../../assets/ai-compute-cluster.jpg";
import powerImg from "../../assets/power-distribution.jpg";
import coolingImg from "../../assets/cooling-systems.jpg";
import nocImg from "../../assets/operations-noc.jpg";

interface FlowStep {
  id: string;
  stepNumber: string;
  title: string;
  headline: string;
  description: string;
  icon: typeof Cpu;
  accentColor: string;
}

const STEP_IMAGES: Record<string, { src: string; alt: string; badge: string }> = {
  compute: {
    src: aiComputeImg,
    alt: "High-density enterprise server racks with organized structured cabling in data center",
    badge: "COMPUTE ARCHITECTURE",
  },
  power: {
    src: powerImg,
    alt: "Industrial data center electrical power distribution room with switchgear and busways",
    badge: "POWER DISTRIBUTION",
  },
  thermal: {
    src: coolingImg,
    alt: "Industrial data center mechanical chiller plant with heavy insulated piping and pumps",
    badge: "CHILLED WATER COOLING",
  },
  efficiency: {
    src: nocImg,
    alt: "Data center network operations center with telemetry monitoring consoles",
    badge: "OPERATIONAL TELEMETRY",
  },
};

const FLOW_STEPS: FlowStep[] = [
  {
    id: "compute",
    stepNumber: "01",
    title: "Compute Demand",
    headline: "Workloads Dictate Electrical Draw",
    description:
      "Modern AI workloads create sustained high-density processing requirements. Compute scheduling is the starting point that drives power consumption profiles.",
    icon: Cpu,
    accentColor: "#06B6D4",
  },
  {
    id: "power",
    stepNumber: "02",
    title: "Power Delivery",
    headline: "Continuous Power Telemetry",
    description:
      "Electricity delivered across substation feeds and per-rack circuits must be measured continuously to correlate power usage with useful compute output.",
    icon: Zap,
    accentColor: "#F59E0B",
  },
  {
    id: "thermal",
    stepNumber: "03",
    title: "Thermal Extraction",
    headline: "Precision Cooling Calibration",
    description:
      "Electrical energy transforms into heat that must be extracted immediately. Dynamic cooling adjusts chiller loops to match measured heat output without over-cooling.",
    icon: Snowflake,
    accentColor: "#38BDF8",
  },
  {
    id: "efficiency",
    stepNumber: "04",
    title: "Resource Efficiency",
    headline: "Closed-Loop Operational Feedback",
    description:
      "Telemetry from power and thermal sensors feeds back into workload scheduling and facility automation, closing the loop and eliminating waste.",
    icon: Gauge,
    accentColor: "#10B981",
  },
];

export function EnergyFlowModel() {
  const [activeStep, setActiveStep] = useState<string>("compute");
  const selected = FLOW_STEPS.find((s) => s.id === activeStep) || FLOW_STEPS[0];

  return (
    <div className="rounded-2xl border border-[#1E293B] bg-[#121824] p-6 sm:p-8 lg:p-10 shadow-2xl">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 mb-8 border-b border-[#1E293B]">
        <div>
          <span className="text-xs font-mono uppercase tracking-widest text-[#10B981] font-semibold">
            Closed-Loop Energy Model
          </span>
          <h3 className="text-xl sm:text-2xl font-bold text-white mt-1">
            Compute ➔ Power ➔ Cooling ➔ Efficiency
          </h3>
        </div>

        <Link
          to="/energy/monitoring"
          className="inline-flex items-center gap-2 text-xs font-medium text-[#10B981] hover:text-[#34D399] transition-colors"
        >
          <span>Explore Energy Architecture</span>
          <ArrowRight size={13} />
        </Link>
      </div>

      {/* 4 Interactive Nodes */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {FLOW_STEPS.map((step) => {
          const Icon = step.icon;
          const isSelected = activeStep === step.id;

          return (
            <button
              key={step.id}
              onClick={() => {
                setActiveStep(step.id);
                trackEvent({
                  tab: "Energy",
                  event: "energy_flow_step_select",
                  value: `${step.stepNumber}: ${step.title}`,
                });
              }}
              className={`p-5 rounded-xl border text-left transition-all relative overflow-hidden group ${
                isSelected
                  ? "bg-[#1A2234] border-[#10B981] shadow-lg shadow-[#10B981]/10"
                  : "bg-[#0B0F17] border-[#1E293B] hover:border-[#334155] hover:bg-[#121824]"
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="font-mono text-xs text-[#64748B] font-semibold">
                  STEP // {step.stepNumber}
                </span>
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center transition-transform group-hover:scale-110"
                  style={{
                    backgroundColor: `${step.accentColor}15`,
                    color: step.accentColor,
                    borderColor: `${step.accentColor}30`,
                    borderWidth: "1px",
                  }}
                >
                  <Icon size={16} />
                </div>
              </div>

              <h4 className="text-sm font-semibold text-white mb-1 group-hover:text-[#10B981] transition-colors">
                {step.title}
              </h4>

              <p className="text-[11px] text-[#94A3B8] line-clamp-2">{step.headline}</p>
            </button>
          );
        })}
      </div>

      {/* Selected Step Explanation Detail Box with Photorealistic Equipment Preview */}
      <div className="rounded-xl border border-[#334155] bg-[#0B0F17] p-6 lg:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          <div className="lg:col-span-7 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: selected.accentColor }}
                />
                <span className="text-xs font-mono uppercase tracking-wider text-[#94A3B8]">
                  Operational Stage: {selected.title}
                </span>
              </div>
              <h4 className="text-lg sm:text-xl font-bold text-white mb-2">{selected.headline}</h4>
              <p className="text-xs sm:text-sm text-[#94A3B8] leading-relaxed mb-6">
                {selected.description}
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-[#1E293B]">
              <div className="flex items-center gap-2 text-[11px] text-[#64748B] font-mono">
                <ShieldCheck size={14} className="text-[#10B981] flex-shrink-0" />
                <span>Illustrative enterprise infrastructure</span>
              </div>

              <Link
                to={`/energy/${selected.id === "compute" ? "workload-aware" : selected.id === "thermal" ? "cooling" : selected.id === "power" ? "monitoring" : "optimization"}`}
                className="px-4 py-2 rounded-lg bg-[#1E293B] hover:bg-[#10B981] hover:text-[#070A0E] text-white text-xs font-semibold transition-all flex items-center gap-2 flex-shrink-0"
              >
                <span>Deep Dive Details</span>
                <ArrowRight size={13} />
              </Link>
            </div>
          </div>

          {/* Right: Photorealistic Infrastructure Preview */}
          <div className="lg:col-span-5">
            <div className="rounded-xl overflow-hidden border border-[#1E293B] bg-[#121824] shadow-xl group">
              <div className="aspect-[16/9] w-full overflow-hidden bg-[#070A0E]">
                <img
                  src={STEP_IMAGES[selected.id]?.src || aiComputeImg}
                  alt={STEP_IMAGES[selected.id]?.alt || selected.title}
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              <div className="px-3.5 py-2 bg-[#0B0F17] border-t border-[#1E293B] flex items-center justify-between text-[10px] font-mono text-[#94A3B8]">
                <span>{STEP_IMAGES[selected.id]?.badge || "PHYSICAL INFRASTRUCTURE"}</span>
                <span className="text-[#10B981]">OPERATIONAL MODEL</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
