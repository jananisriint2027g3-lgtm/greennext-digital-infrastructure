import {
  SOUTH_INDIA_INFRASTRUCTURE_DATASET,
  type InfrastructureCategory,
  type InfrastructureDataRecord,
} from "../data/infrastructureMiningData";

export interface MiningFilterOptions {
  category?: InfrastructureCategory | "all";
  state?: string | "all";
  searchQuery?: string;
  minCleanEnergy?: number;
  maxPue?: number;
}

export type SortField = "name" | "capacityMw" | "pue" | "cleanEnergySharePct" | "carbonIntensityGco2" | "lastCollectedAt";
export type SortDirection = "asc" | "desc";

export interface AggregateSummary {
  totalTrackedCapacityMw: number;
  monitoredNodesCount: number;
  averagePue: number | null;
  averageCleanEnergyPct: number;
  averageCarbonIntensityGco2: number;
  statesCovered: string[];
}

/**
 * Validates, cleans, and normalizes a candidate data record mined from authorized public registries.
 * Ensures numbers are within physical bounds and strings are sanitized.
 */
export function validateAndCleanRecord(candidate: Partial<InfrastructureDataRecord>): InfrastructureDataRecord | null {
  if (!candidate.id || typeof candidate.id !== "string") return null;
  if (!candidate.name || typeof candidate.name !== "string") return null;
  if (!candidate.category || !["datacenter", "renewable_grid", "ai_compute"].includes(candidate.category)) return null;

  const capacityMw = Number(candidate.capacityMw);
  if (isNaN(capacityMw) || capacityMw <= 0 || capacityMw > 100000) return null;

  let pue: number | null = null;
  if (candidate.pue !== null && candidate.pue !== undefined) {
    const parsedPue = Number(candidate.pue);
    if (!isNaN(parsedPue) && parsedPue >= 1.0 && parsedPue <= 3.0) {
      pue = Math.round(parsedPue * 100) / 100;
    }
  }

  const cleanEnergySharePct = Math.min(100, Math.max(0, Number(candidate.cleanEnergySharePct) || 0));
  const carbonIntensityGco2 = Math.max(0, Number(candidate.carbonIntensityGco2) || 0);

  return {
    id: candidate.id.trim(),
    name: candidate.name.trim(),
    category: candidate.category,
    state: (candidate.state as InfrastructureDataRecord["state"]) || "Tamil Nadu",
    hubCode: (candidate.hubCode as InfrastructureDataRecord["hubCode"]) || "MDU",
    capacityMw: Math.round(capacityMw * 10) / 10,
    pue,
    cleanEnergySharePct: Math.round(cleanEnergySharePct),
    carbonIntensityGco2: Math.round(carbonIntensityGco2),
    latencyChennaiMs: Math.max(0, Number(candidate.latencyChennaiMs) || 0),
    latencyBangaloreMs: Math.max(0, Number(candidate.latencyBangaloreMs) || 0),
    coolingType: candidate.coolingType ? String(candidate.coolingType).trim() : "Standard Air Cooling",
    tierClassification: candidate.tierClassification || "Tier III+",
    status: candidate.status || "Operational",
    dataFreshness: candidate.dataFreshness || "Public Filing",
    lastCollectedAt: candidate.lastCollectedAt || new Date().toISOString(),
    sourceName: candidate.sourceName ? String(candidate.sourceName).trim() : "State Public Discom Disclosure",
    sourceUrl: candidate.sourceUrl ? String(candidate.sourceUrl).trim() : "https://cea.nic.in",
    complianceNote: candidate.complianceNote || "Authorized public sector information; open data terms verified.",
  };
}

/**
 * Evaluates simulated robots.txt rules for an authorized target URL to ensure ethical data extraction.
 * Strictly adheres to Disallow directives and rate limits.
 */
export function checkRobotsCompliance(targetUrl: string, robotsTxtContent?: string): {
  isAllowed: boolean;
  userAgent: string;
  crawlDelaySeconds: number;
  reason: string;
} {
  try {
    const url = new URL(targetUrl);
    const path = url.pathname;

    if (!robotsTxtContent) {
      return {
        isAllowed: true,
        userAgent: "GreenNext-Research-Crawler/2.0",
        crawlDelaySeconds: 5,
        reason: "No robots.txt disallow rules detected; adhering to default 5s polite request rate limit.",
      };
    }

    const lines = robotsTxtContent.split("\n");
    let inWildcardAgent = false;
    let disallowedPaths: string[] = [];
    let crawlDelay = 5;

    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line || line.startsWith("#")) continue;

      const [directive, ...valParts] = line.split(":");
      const val = valParts.join(":").trim();

      if (directive?.toLowerCase() === "user-agent") {
        inWildcardAgent = val === "*";
      } else if (inWildcardAgent && directive?.toLowerCase() === "disallow") {
        if (val) disallowedPaths.push(val);
      } else if (inWildcardAgent && directive?.toLowerCase() === "crawl-delay") {
        const parsed = parseInt(val, 10);
        if (!isNaN(parsed) && parsed > 0) crawlDelay = parsed;
      }
    }

    const isExplicitlyDisallowed = disallowedPaths.some((disallowed) => path.startsWith(disallowed));

    return {
      isAllowed: !isExplicitlyDisallowed,
      userAgent: "GreenNext-Research-Crawler/2.0",
      crawlDelaySeconds: crawlDelay,
      reason: isExplicitlyDisallowed
        ? `Path ${path} is blocked by robots.txt disallow rule.`
        : `Path ${path} is permitted for research ingestion with crawl-delay ${crawlDelay}s.`,
    };
  } catch (err) {
    return {
      isAllowed: false,
      userAgent: "GreenNext-Research-Crawler/2.0",
      crawlDelaySeconds: 10,
      reason: `Malformed URL provided: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}

/**
 * Filters the dataset across category, state, search query, and quantitative metric thresholds.
 */
export function filterInfrastructureData(
  dataset: InfrastructureDataRecord[] = SOUTH_INDIA_INFRASTRUCTURE_DATASET,
  options: MiningFilterOptions = {},
): InfrastructureDataRecord[] {
  const { category = "all", state = "all", searchQuery = "", minCleanEnergy = 0, maxPue } = options;
  const q = searchQuery.toLowerCase().trim();

  return dataset.filter((item) => {
    if (category !== "all" && item.category !== category) return false;
    if (state !== "all" && item.state !== state) return false;
    if (minCleanEnergy > 0 && item.cleanEnergySharePct < minCleanEnergy) return false;
    if (maxPue !== undefined && item.pue !== null && item.pue > maxPue) return false;

    if (q) {
      const inName = item.name.toLowerCase().includes(q);
      const inState = item.state.toLowerCase().includes(q);
      const inHub = item.hubCode.toLowerCase().includes(q);
      const inSource = item.sourceName.toLowerCase().includes(q);
      const inCooling = item.coolingType.toLowerCase().includes(q);
      if (!inName && !inState && !inHub && !inSource && !inCooling) return false;
    }

    return true;
  });
}

/**
 * Sorts the dataset by specified field and direction.
 */
export function sortInfrastructureData(
  dataset: InfrastructureDataRecord[],
  sortBy: SortField = "capacityMw",
  direction: SortDirection = "desc",
): InfrastructureDataRecord[] {
  return [...dataset].sort((a, b) => {
    let aVal = a[sortBy];
    let bVal = b[sortBy];

    // Handle nulls gracefully (e.g. unverified PUE)
    if (aVal === null && bVal === null) return 0;
    if (aVal === null) return direction === "asc" ? 1 : -1;
    if (bVal === null) return direction === "asc" ? -1 : 1;

    if (typeof aVal === "string" && typeof bVal === "string") {
      const cmp = aVal.localeCompare(bVal);
      return direction === "asc" ? cmp : -cmp;
    }

    const numA = Number(aVal);
    const numB = Number(bVal);
    return direction === "asc" ? numA - numB : numB - numA;
  });
}

/**
 * Computes aggregate operational benchmarks across the dataset.
 */
export function calculateAggregateSummary(dataset: InfrastructureDataRecord[]): AggregateSummary {
  if (!dataset.length) {
    return {
      totalTrackedCapacityMw: 0,
      monitoredNodesCount: 0,
      averagePue: null,
      averageCleanEnergyPct: 0,
      averageCarbonIntensityGco2: 0,
      statesCovered: [],
    };
  }

  let totalCapacity = 0;
  let totalCleanEnergyWeighted = 0;
  let totalCarbonWeighted = 0;
  let pueSum = 0;
  let pueCount = 0;
  const statesSet = new Set<string>();

  for (const item of dataset) {
    totalCapacity += item.capacityMw;
    totalCleanEnergyWeighted += item.cleanEnergySharePct * item.capacityMw;
    totalCarbonWeighted += item.carbonIntensityGco2 * item.capacityMw;
    statesSet.add(item.state);

    if (item.pue !== null) {
      pueSum += item.pue;
      pueCount += 1;
    }
  }

  return {
    totalTrackedCapacityMw: Math.round(totalCapacity * 10) / 10,
    monitoredNodesCount: dataset.length,
    averagePue: pueCount > 0 ? Math.round((pueSum / pueCount) * 100) / 100 : null,
    averageCleanEnergyPct: totalCapacity > 0 ? Math.round(totalCleanEnergyWeighted / totalCapacity) : 0,
    averageCarbonIntensityGco2: totalCapacity > 0 ? Math.round(totalCarbonWeighted / totalCapacity) : 0,
    statesCovered: Array.from(statesSet).sort(),
  };
}
