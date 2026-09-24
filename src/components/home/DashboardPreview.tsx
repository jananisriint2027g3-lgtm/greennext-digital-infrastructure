import { useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  DASHBOARD_METRICS,
  HOURLY_ACTIVITY_PATTERN,
  DASHBOARD_DISCLAIMER,
  DashboardRegionMetric,
} from "../../data/dashboard";
import {
  Cpu,
  Zap,
  Snowflake,
  Network,
  Activity,
  AlertTriangle,
  Radio,
  ArrowRight,
  ShieldAlert,
} from "lucide-react";
import { trackEvent } from "../../lib/analytics";

export function DashboardPreview() {
  const [selectedRegionKey, setSelectedRegionKey] = useState<string>("madurai");
  const activeMetric: DashboardRegionMetric =
    DASHBOARD_METRICS[selectedRegionKey] || DASHBOARD_METRICS.madurai;

  const metricCards = [
    {
      label: "Compute Utilisation",
      value: activeMetric.compute,
      icon: Cpu,
      color: "#06B6D4",
      sub: "Illustrative workload signal",
    },
    {
      label: "Energy Monitoring",
      value: activeMetric.power,
      icon: Zap,
      color: "#F59E0B",
      sub: "Illustrative power load",
    },
    {
      label: "Cooling Status",
      value: activeMetric.cooling,
      icon: Snowflake,
      color: "#38BDF8",
      sub: "Illustrative thermal loop",
    },
    {
      label: "Network Connectivity",
      value: activeMetric.network,
      icon: Network,
      color: "#10B981",
      sub: "Illustrative link health",
    },
  ];

  return (
    <div
      id="dashboard"
      className="rounded-2xl border border-[#1E293B] bg-[#0B0F17] overflow-hidden shadow-2xl"
    >
      {/* Top Banner: Global Disclaimers */}
      <div className="bg-[#121824] px-6 py-3.5 border-b border-[#1E293B] flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#10B981]" />
          <span className="font-mono text-white font-semibold">
            REGIONAL INFRASTRUCTURE DASHBOARD
          </span>
          <span className="text-[#475569]">|</span>
          <span className="px-2 py-0.5 rounded bg-[#10B981]/15 text-[#10B981] font-mono text-[10px] font-bold">
            ILLUSTRATIVE / DEMO DATA
          </span>
        </div>

        <div className="flex items-center gap-2 font-mono text-[#94A3B8] text-[11px]">
          <Radio size={13} className="text-[#10B981] animate-pulse" />
          <span>SYSTEMS VIEW ACTIVE (DEMO)</span>
        </div>
      </div>

      {/* Region Selector Tabs */}
      <div className="border-b border-[#1E293B] bg-[#070A0E] px-6 flex flex-wrap gap-2">
        {Object.values(DASHBOARD_METRICS).map((m) => {
          const isSelected = selectedRegionKey === m.id;
          return (
            <button
              key={m.id}
              onClick={() => {
                setSelectedRegionKey(m.id);
                trackEvent({
                  tab: "Automation",
                  event: "automation_dashboard_node_select",
                  value: `${m.name} (${m.code}) Dashboard Node`,
                });
              }}
              className={`py-3 px-4 font-mono text-xs font-semibold transition-all border-b-2 -mb-px flex items-center gap-2 ${
                isSelected
                  ? "border-[#10B981] text-[#10B981] bg-[#121824]/50"
                  : "border-transparent text-[#94A3B8] hover:text-white"
              }`}
            >
              <span>{m.code}</span>
              <span className="font-sans font-medium text-white">{m.name}</span>
            </button>
          );
        })}
      </div>

      {/* Main Dashboard Body */}
      <div className="p-6 sm:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Node Profile Sidebar (4 Cols) */}
        <div className="lg:col-span-4 rounded-xl border border-[#1E293B] bg-[#121824] p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-3xl font-mono font-bold text-white">{activeMetric.code}</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#070A0E] border border-[#1E293B] text-[#10B981]">
                {activeMetric.status}
              </span>
            </div>

            <h4 className="text-lg font-bold text-white mb-1">{activeMetric.name}</h4>
            <p className="text-xs text-[#94A3B8] mb-6">{activeMetric.detail}</p>

            <div className="space-y-3 pt-4 border-t border-[#1E293B]">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#94A3B8] flex items-center gap-1.5">
                  <Activity size={13} className="text-[#10B981]" />
                  <span>Automation Events</span>
                </span>
                <span className="font-mono text-white font-bold">
                  {activeMetric.events}{" "}
                  <span className="text-[10px] font-normal text-[#64748B]">/ 24h</span>
                </span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-[#94A3B8] flex items-center gap-1.5">
                  <AlertTriangle size={13} className="text-[#F59E0B]" />
                  <span>Open Alerts</span>
                </span>
                <span className="font-mono text-white font-bold">
                  {activeMetric.alerts}{" "}
                  <span className="text-[10px] font-normal text-[#64748B]">illustrative</span>
                </span>
              </div>
            </div>
          </div>

          <div className="pt-6 mt-6 border-t border-[#1E293B]">
            <Link
              to={`/regions/${activeMetric.id}`}
              className="w-full py-2 px-3 rounded-lg bg-[#1E293B] hover:bg-[#10B981] hover:text-[#070A0E] text-white text-xs font-semibold transition-all flex items-center justify-center gap-2"
            >
              <span>View Full {activeMetric.name} Dossier</span>
              <ArrowRight size={13} />
            </Link>
          </div>
        </div>

        {/* Telemetry Metric Cards & 24h Activity Graph (8 Cols) */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          {/* 4 Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {metricCards.map((m) => {
              const Icon = m.icon;
              return (
                <div
                  key={m.label}
                  className="rounded-xl border border-[#1E293B] bg-[#121824] p-4 flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between mb-2">
                    <Icon size={16} style={{ color: m.color }} />
                    <span className="text-[9px] font-mono text-[#64748B] uppercase">Demo</span>
                  </div>

                  <div>
                    <span className="text-2xl sm:text-3xl font-mono font-bold text-white block mb-2">
                      {m.value}%
                    </span>

                    {/* Progress Bar Track */}
                    <div className="h-1.5 w-full rounded-full bg-[#070A0E] overflow-hidden mb-2">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${m.value}%`,
                          backgroundColor: m.color,
                        }}
                      />
                    </div>

                    <span className="text-[11px] font-medium text-[#CBD5E1] block truncate">
                      {m.label}
                    </span>
                    <span className="text-[9px] text-[#64748B] block truncate">{m.sub}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* 24-Hour Operational Pattern Chart */}
          <div className="rounded-xl border border-[#1E293B] bg-[#121824] p-5">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#1E293B]">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#64748B] block">
                  Connected Telemetry Signals
                </span>
                <h5 className="text-xs font-semibold text-white">
                  24-Hour Operational Pattern (Illustrative Signal Curve)
                </h5>
              </div>
              <span className="text-[10px] font-mono text-[#10B981] bg-[#10B981]/10 px-2 py-0.5 rounded">
                Hourly Profile
              </span>
            </div>

            {/* Simulated Hourly Bar Chart */}
            <div className="h-28 flex items-end gap-1 sm:gap-1.5 pt-4 pb-1">
              {HOURLY_ACTIVITY_PATTERN.map((val, idx) => (
                <div
                  key={idx}
                  className="flex-1 bg-gradient-to-t from-[#10B981]/40 via-[#06B6D4]/60 to-[#10B981] rounded-t-sm hover:opacity-100 opacity-80 transition-opacity relative group"
                  style={{ height: `${val}%` }}
                >
                  <div className="absolute -top-7 left-1/2 -translate-x-1/2 hidden group-hover:block z-20 px-1.5 py-0.5 rounded bg-[#070A0E] border border-[#334155] text-[9px] font-mono text-white whitespace-nowrap">
                    {val}%
                  </div>
                </div>
              ))}
            </div>

            {/* X-Axis Timeline */}
            <div className="flex items-center justify-between text-[10px] font-mono text-[#64748B] pt-2 border-t border-[#1E293B]">
              <span>00:00</span>
              <span>04:00</span>
              <span>08:00</span>
              <span>12:00</span>
              <span>16:00</span>
              <span>20:00</span>
              <span>24:00</span>
            </div>
          </div>
        </div>
      </div>

      {/* Global Bottom Disclaimer */}
      <div className="px-6 py-3 bg-[#070A0E] border-t border-[#1E293B] text-[11px] text-[#64748B] flex items-center gap-2">
        <ShieldAlert size={14} className="text-[#F59E0B] flex-shrink-0" />
        <span>{DASHBOARD_DISCLAIMER}</span>
      </div>
    </div>
  );
}
