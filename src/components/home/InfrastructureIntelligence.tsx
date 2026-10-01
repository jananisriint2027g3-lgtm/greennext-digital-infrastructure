import { Link } from "@tanstack/react-router";
import { ArrowRight, CircuitBoard, Gauge, Globe2, Layers, MessageCircle } from "../icons";

const JOURNEY_STEPS = ["Explore", "Understand", "Configure", "Measure", "Connect"];

const ACTIONS = [
  {
    number: "01",
    stage: "Explore",
    title: "Explore Infrastructure",
    description: "See how compute, network, storage, cooling, and power fit together.",
    href: "/solutions/architecture-explorer",
    icon: Layers,
    accent: "#06B6D4",
  },
  {
    number: "02",
    stage: "Configure",
    title: "Configure Your Environment",
    description: "Shape an illustrative starting point around workload, scale, and priority.",
    href: "/solutions/configurator",
    icon: CircuitBoard,
    accent: "#10B981",
  },
  {
    number: "03",
    stage: "Measure",
    title: "Measure Energy Impact",
    description: "Use transparent assumptions to estimate workload energy and cooling demand.",
    href: "/solutions/energy-calculator",
    icon: Gauge,
    accent: "#F59E0B",
  },
  {
    number: "04",
    stage: "Explore",
    title: "Explore Regional Hubs",
    description: "Compare GreenNext's existing MDU, CJB, TRZ, and IXE planning narratives.",
    href: "/regions",
    icon: Globe2,
    accent: "#38BDF8",
  },
  {
    number: "05",
    stage: "Connect",
    title: "Start a Technical Conversation",
    description: "Bring a workload, architecture, energy, or regional question to the team.",
    href: "/contact",
    icon: MessageCircle,
    accent: "#A78BFA",
  },
] as const;

export function InfrastructureIntelligence() {
  return (
    <section className="border-b border-[#1E293B] bg-[#0B0F17] py-16 sm:py-20">
      <div className="mx-auto max-w-[1340px] px-4 sm:px-6 lg:px-8">
        <div className="mb-9 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <span className="mb-2 block font-mono text-xs font-semibold uppercase tracking-widest text-[#10B981]">
              Explore GreenNext
            </span>
            <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
              Infrastructure Intelligence, at your pace
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-[#94A3B8] sm:text-base">
              Move from a high-level view to a clearer technical conversation through focused,
              lightweight experiences for architecture planning.
            </p>
          </div>

          <div
            className="flex flex-wrap items-center gap-x-2 gap-y-1 font-mono text-[10px] uppercase tracking-[0.14em] text-[#64748B]"
            aria-label="GreenNext journey: Explore, Understand, Configure, Measure, Connect"
          >
            {JOURNEY_STEPS.map((step, index) => (
              <span key={step} className="inline-flex items-center gap-2">
                <span className={index === 0 ? "text-[#10B981]" : undefined}>{step}</span>
                {index < JOURNEY_STEPS.length - 1 && <ArrowRight size={11} />}
              </span>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {ACTIONS.map(({ number, stage, title, description, href, icon: Icon, accent }) => (
            <Link
              key={href}
              to={href}
              className="group flex min-h-[208px] flex-col rounded-xl border border-[#1E293B] bg-[#121824] p-5 shadow-xl transition-colors hover:border-[#334155] hover:bg-[#16202E] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#10B981] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0B0F17]"
            >
              <div className="mb-5 flex items-center justify-between">
                <div
                  className="flex h-9 w-9 items-center justify-center rounded-lg border"
                  style={{
                    backgroundColor: `${accent}15`,
                    borderColor: `${accent}35`,
                    color: accent,
                  }}
                >
                  <Icon size={18} />
                </div>
                <span className="font-mono text-[10px] font-bold text-[#64748B]">{number}</span>
              </div>

              <span className="mb-2 font-mono text-[9px] uppercase tracking-widest text-[#64748B]">
                {stage}
              </span>
              <h3 className="text-sm font-bold leading-snug text-white transition-colors group-hover:text-[#34D399]">
                {title}
              </h3>
              <p className="mt-2 flex-1 text-xs leading-relaxed text-[#94A3B8]">{description}</p>

              <span className="mt-5 inline-flex items-center gap-1.5 border-t border-[#1E293B] pt-3 text-xs font-semibold text-[#10B981]">
                Open experience
                <ArrowRight size={13} className="transition-transform group-hover:translate-x-1" />
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
