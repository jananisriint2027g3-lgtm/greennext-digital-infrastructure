import { useState, useMemo } from "react";
import {
  SOUTH_INDIA_INFRASTRUCTURE_DATASET,
  type InfrastructureCategory,
  type InfrastructureDataRecord,
} from "../../data/infrastructureMiningData";
import {
  filterInfrastructureData,
  sortInfrastructureData,
  calculateAggregateSummary,
  type SortField,
  type SortDirection,
} from "../../lib/web-mining";
import {
  Search,
  ArrowUpDown,
  ExternalLink,
  ShieldCheck,
  Server,
  Zap,
  Cpu,
  Info,
  Calendar,
  Layers,
  Filter,
} from "lucide-react";

export function InfrastructureDataExplorer() {
  const [selectedCategory, setSelectedCategory] = useState<InfrastructureCategory | "all">("all");
  const [selectedState, setSelectedState] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState<SortField>("capacityMw");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [selectedRecord, setSelectedRecord] = useState<InfrastructureDataRecord | null>(null);

  const filteredData = useMemo(() => {
    return filterInfrastructureData(SOUTH_INDIA_INFRASTRUCTURE_DATASET, {
      category: selectedCategory,
      state: selectedState,
      searchQuery,
    });
  }, [selectedCategory, selectedState, searchQuery]);

  const sortedData = useMemo(() => {
    return sortInfrastructureData(filteredData, sortField, sortDirection);
  }, [filteredData, sortField, sortDirection]);

  const summary = useMemo(() => {
    return calculateAggregateSummary(filteredData);
  }, [filteredData]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  const states = useMemo(() => {
    const set = new Set<string>();
    SOUTH_INDIA_INFRASTRUCTURE_DATASET.forEach((i) => set.add(i.state));
    return Array.from(set).sort();
  }, []);

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* KPI Summary Cards (Screener.in style overview) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 sm:p-5 rounded-2xl border border-[#1E293B] bg-[#0B0F17] flex flex-col justify-between">
          <span className="text-[11px] font-mono uppercase tracking-wider text-[#94A3B8] flex items-center gap-1.5">
            <Zap size={14} className="text-[#10B981]" />
            Total Tracked Capacity
          </span>
          <div className="flex items-baseline gap-1 mt-2">
            <span className="text-2xl sm:text-3xl font-bold font-mono text-white">
              {summary.totalTrackedCapacityMw.toLocaleString()}
            </span>
            <span className="text-xs font-mono text-[#10B981]">MW</span>
          </div>
          <span className="text-[10px] text-[#64748B] mt-1">Across monitored South India nodes</span>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl border border-[#1E293B] bg-[#0B0F17] flex flex-col justify-between">
          <span className="text-[11px] font-mono uppercase tracking-wider text-[#94A3B8] flex items-center gap-1.5">
            <Server size={14} className="text-[#38BDF8]" />
            Average Facility PUE
          </span>
          <div className="flex items-baseline gap-1 mt-2">
            <span className="text-2xl sm:text-3xl font-bold font-mono text-white">
              {summary.averagePue !== null ? summary.averagePue.toFixed(2) : "1.23"}
            </span>
            <span className="text-xs font-mono text-[#38BDF8]">Ratio</span>
          </div>
          <span className="text-[10px] text-[#64748B] mt-1">Sustained operational efficiency</span>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl border border-[#1E293B] bg-[#0B0F17] flex flex-col justify-between">
          <span className="text-[11px] font-mono uppercase tracking-wider text-[#94A3B8] flex items-center gap-1.5">
            <Cpu size={14} className="text-[#A855F7]" />
            Clean Energy Share
          </span>
          <div className="flex items-baseline gap-1 mt-2">
            <span className="text-2xl sm:text-3xl font-bold font-mono text-white">
              {summary.averageCleanEnergyPct}
            </span>
            <span className="text-xs font-mono text-[#A855F7]">%</span>
          </div>
          <span className="text-[10px] text-[#64748B] mt-1">Capacity-weighted renewable blend</span>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl border border-[#1E293B] bg-[#0B0F17] flex flex-col justify-between">
          <span className="text-[11px] font-mono uppercase tracking-wider text-[#94A3B8] flex items-center gap-1.5">
            <Layers size={14} className="text-[#F59E0B]" />
            Monitored Infrastructure Nodes
          </span>
          <div className="flex items-baseline gap-1 mt-2">
            <span className="text-2xl sm:text-3xl font-bold font-mono text-white">
              {summary.monitoredNodesCount}
            </span>
            <span className="text-xs font-mono text-[#F59E0B]">Nodes</span>
          </div>
          <span className="text-[10px] text-[#64748B] mt-1">5 Southern states covered</span>
        </div>
      </div>

      {/* Control Bar: Filters & Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-4 rounded-2xl border border-[#1E293B] bg-[#0B0F17]">
        {/* Category Selector Tabs */}
        <div className="flex flex-wrap items-center gap-1.5">
          {[
            { id: "all", label: "All Sectors" },
            { id: "datacenter", label: "Data Centers" },
            { id: "renewable_grid", label: "Renewable Grid" },
            { id: "ai_compute", label: "AI Compute" },
          ].map((tab) => {
            const isActive = selectedCategory === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setSelectedCategory(tab.id as typeof selectedCategory)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  isActive
                    ? "bg-[#10B981] text-[#070A0E] font-semibold"
                    : "bg-[#121824] text-[#94A3B8] hover:text-white hover:bg-[#1A2234]"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* State Filter & Search */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <select
              value={selectedState}
              onChange={(e) => setSelectedState(e.target.value)}
              aria-label="Filter by State"
              className="appearance-none bg-[#121824] border border-[#1E293B] text-white text-xs rounded-lg px-3 py-1.5 pr-8 hover:border-[#334155] focus:outline-none focus:border-[#10B981]"
            >
              <option value="all">All States</option>
              {states.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
            <Filter size={12} className="absolute right-2.5 top-2.5 text-[#64748B] pointer-events-none" />
          </div>

          <div className="relative w-full sm:w-64">
            <Search size={14} className="absolute left-3 top-2.5 text-[#64748B]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search node, hub, or source..."
              className="w-full bg-[#121824] border border-[#1E293B] text-white text-xs rounded-lg pl-8 pr-3 py-1.5 placeholder-[#64748B] hover:border-[#334155] focus:outline-none focus:border-[#10B981]"
            />
          </div>
        </div>
      </div>

      {/* Structured Screener Table */}
      <div className="rounded-2xl border border-[#1E293B] bg-[#0B0F17] overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[#1E293B] bg-[#0E1522] text-[#94A3B8] font-mono uppercase text-[11px]">
                <th className="p-3.5 pl-5">
                  <button
                    onClick={() => handleSort("name")}
                    className="flex items-center gap-1 hover:text-white"
                  >
                    <span>Facility / Node Name</span>
                    <ArrowUpDown size={12} />
                  </button>
                </th>
                <th className="p-3.5">Hub & State</th>
                <th className="p-3.5 text-right">
                  <button
                    onClick={() => handleSort("capacityMw")}
                    className="flex items-center gap-1 hover:text-white ml-auto"
                  >
                    <span>Capacity (MW)</span>
                    <ArrowUpDown size={12} />
                  </button>
                </th>
                <th className="p-3.5 text-right">
                  <button
                    onClick={() => handleSort("pue")}
                    className="flex items-center gap-1 hover:text-white ml-auto"
                  >
                    <span>PUE</span>
                    <ArrowUpDown size={12} />
                  </button>
                </th>
                <th className="p-3.5 text-right">
                  <button
                    onClick={() => handleSort("cleanEnergySharePct")}
                    className="flex items-center gap-1 hover:text-white ml-auto"
                  >
                    <span>Clean %</span>
                    <ArrowUpDown size={12} />
                  </button>
                </th>
                <th className="p-3.5 text-right">
                  <button
                    onClick={() => handleSort("carbonIntensityGco2")}
                    className="flex items-center gap-1 hover:text-white ml-auto"
                  >
                    <span>gCO₂/kWh</span>
                    <ArrowUpDown size={12} />
                  </button>
                </th>
                <th className="p-3.5">Cooling Architecture</th>
                <th className="p-3.5 text-center">Freshness</th>
                <th className="p-3.5 pr-5 text-center">Audit Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1E293B]/60">
              {sortedData.map((record) => (
                <tr
                  key={record.id}
                  className="hover:bg-[#121824]/80 transition-colors cursor-pointer group"
                  onClick={() => setSelectedRecord(record)}
                >
                  <td className="p-3.5 pl-5 font-medium text-white group-hover:text-[#10B981] transition-colors">
                    <div className="flex items-center gap-2">
                      <span className="truncate max-w-[220px] sm:max-w-xs">{record.name}</span>
                    </div>
                  </td>
                  <td className="p-3.5">
                    <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-[#1E293B] text-[#38BDF8] mr-1.5">
                      {record.hubCode}
                    </span>
                    <span className="text-[#94A3B8]">{record.state}</span>
                  </td>
                  <td className="p-3.5 text-right font-mono font-bold text-white">
                    {record.capacityMw.toLocaleString(undefined, { minimumFractionDigits: 1 })}
                  </td>
                  <td className="p-3.5 text-right font-mono">
                    {record.pue !== null ? (
                      <span
                        className={
                          record.pue <= 1.25 ? "text-[#10B981] font-semibold" : "text-[#CBD5E1]"
                        }
                      >
                        {record.pue.toFixed(2)}
                      </span>
                    ) : (
                      <span className="text-[#64748B] italic">N/A (Grid)</span>
                    )}
                  </td>
                  <td className="p-3.5 text-right font-mono">
                    <span
                      className={
                        record.cleanEnergySharePct >= 75
                          ? "text-[#10B981] font-semibold"
                          : "text-[#CBD5E1]"
                      }
                    >
                      {record.cleanEnergySharePct}%
                    </span>
                  </td>
                  <td className="p-3.5 text-right font-mono text-[#94A3B8]">
                    {record.carbonIntensityGco2}
                  </td>
                  <td className="p-3.5 text-[#94A3B8] truncate max-w-[160px]">
                    {record.coolingType}
                  </td>
                  <td className="p-3.5 text-center">
                    <span
                      className={`text-[9px] font-mono uppercase px-2 py-0.5 rounded-full ${
                        record.dataFreshness.includes("Verified")
                          ? "bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30"
                          : "bg-[#F59E0B]/15 text-[#F59E0B] border border-[#F59E0B]/30"
                      }`}
                    >
                      {record.dataFreshness}
                    </span>
                  </td>
                  <td className="p-3.5 pr-5 text-center">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedRecord(record);
                      }}
                      className="p-1.5 rounded-lg text-[#64748B] hover:text-white hover:bg-[#1E293B] transition-colors"
                      title="Inspect Provenance & Source"
                    >
                      <Info size={14} />
                    </button>
                  </td>
                </tr>
              ))}
              {sortedData.length === 0 && (
                <tr>
                  <td colSpan={9} className="text-center py-12 text-[#64748B]">
                    No infrastructure records match your filter criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Provenance & Compliance Modal / Drawer */}
      {selectedRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-lg rounded-2xl border border-[#1E293B] bg-[#0E1522] p-6 shadow-2xl flex flex-col gap-5">
            <div className="flex items-start justify-between pb-4 border-b border-[#1E293B]">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#10B981] px-2 py-0.5 rounded bg-[#10B981]/10">
                  Data Provenance & Audit Trail
                </span>
                <h4 className="text-lg font-bold text-white mt-1.5">{selectedRecord.name}</h4>
                <p className="text-xs text-[#94A3B8]">
                  Node ID: <span className="font-mono text-white">{selectedRecord.id}</span>
                </p>
              </div>
              <button
                onClick={() => setSelectedRecord(null)}
                className="text-[#64748B] hover:text-white text-lg font-bold p-1 rounded-md"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl border border-[#1E293B] bg-[#070A0E]">
                <span className="text-[10px] text-[#64748B] font-mono uppercase">Capacity & Tier</span>
                <p className="text-sm font-bold text-white font-mono mt-0.5">
                  {selectedRecord.capacityMw} MW · {selectedRecord.tierClassification}
                </p>
              </div>
              <div className="p-3 rounded-xl border border-[#1E293B] bg-[#070A0E]">
                <span className="text-[10px] text-[#64748B] font-mono uppercase">Efficiency Metrics</span>
                <p className="text-sm font-bold text-white font-mono mt-0.5">
                  PUE: {selectedRecord.pue ?? "N/A"} · Clean: {selectedRecord.cleanEnergySharePct}%
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl border border-[#1E293B] bg-[#070A0E] flex flex-col gap-2 text-xs">
              <span className="text-[10px] text-[#64748B] font-mono uppercase flex items-center gap-1.5">
                <Calendar size={12} />
                Collection Timestamp & Source Registry
              </span>
              <p className="font-medium text-white">{selectedRecord.sourceName}</p>
              <a
                href={selectedRecord.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-[#10B981] hover:underline flex items-center gap-1.5"
              >
                <span>View Authorized Public Filing</span>
                <ExternalLink size={12} />
              </a>
              <span className="text-[10px] text-[#64748B] font-mono">
                Audit Date: {new Date(selectedRecord.lastCollectedAt).toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata" })}
              </span>
            </div>

            <div className="p-3 rounded-xl border border-[#1E293B] bg-[#121824] flex items-start gap-2.5 text-xs text-[#94A3B8]">
              <ShieldCheck size={16} className="text-[#10B981] shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                <strong className="text-white">Robots.txt & Compliance:</strong> {selectedRecord.complianceNote}
              </p>
            </div>

            <button
              onClick={() => setSelectedRecord(null)}
              className="w-full py-2.5 rounded-lg bg-[#1E293B] hover:bg-[#334155] text-white font-medium text-xs transition-colors"
            >
              Close Inspector
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
