/**
 * GreenNext Data Centre KPI Calculation Utilities
 *
 * Mathematically rigorous, unit-aware calculation functions for the 10 core Data Centre KPIs:
 * 1. Power Usage Effectiveness (PUE) (ISO/IEC 30134-2)
 * 2. Data Centre Availability & Uptime (IEEE Gold Book / Uptime Institute)
 * 3. Cooling Efficiency (COP, kW/ton, Sensible Heat Transfer)
 * 4. Power Infrastructure Reliability (Redundancy, SAIDI/SAIFI)
 * 5. IT Capacity Utilization & Stranded Power
 * 6. Temperature & Humidity Compliance (ASHRAE TC 9.9, Magnus Dew Point)
 * 7. Mean Time Between Failures (MTBF)
 * 8. Mean Time To Repair (MTTR)
 * 9. Energy Consumption and Operating Cost (kWh, editable tariff)
 * 10. Maintenance Compliance (Preventive Maintenance Compliance PMC%, Planned Maintenance Percentage PMP%)
 */

// ─── KPI 1: Power Usage Effectiveness (PUE) ──────────────────────────────────

export interface PueResult {
  pue: number | null;
  overheadRatio: number | null; // (Facility - IT) / IT = PUE - 1
  rating:
    "Very High Efficiency" | "Efficient Modern" | "Average" | "Legacy / Suboptimal" | "Invalid";
  status: "valid" | "invalid";
  errorMessage?: string;
}

export function calculatePue(facilityEnergy: number, itEnergy: number): PueResult {
  if (
    isNaN(facilityEnergy) ||
    isNaN(itEnergy) ||
    !isFinite(facilityEnergy) ||
    !isFinite(itEnergy) ||
    facilityEnergy < 0 ||
    itEnergy <= 0
  ) {
    return {
      pue: null,
      overheadRatio: null,
      rating: "Invalid",
      status: "invalid",
      errorMessage:
        "IT Equipment Energy must be greater than zero, and Facility Energy must be non-negative.",
    };
  }

  if (facilityEnergy < itEnergy) {
    return {
      pue: null,
      overheadRatio: null,
      rating: "Invalid",
      status: "invalid",
      errorMessage:
        "Total Facility Energy cannot be less than IT Equipment Energy (thermodynamic minimum PUE is 1.0).",
    };
  }

  const rawPue = facilityEnergy / itEnergy;
  const pue = Math.round(rawPue * 1000) / 1000;
  const overheadRatio = Math.round((pue - 1) * 1000) / 1000;

  let rating: PueResult["rating"] = "Average";
  if (pue < 1.2) {
    rating = "Very High Efficiency";
  } else if (pue < 1.4) {
    rating = "Efficient Modern";
  } else if (pue <= 1.6) {
    rating = "Average";
  } else {
    rating = "Legacy / Suboptimal";
  }

  return {
    pue,
    overheadRatio,
    rating,
    status: "valid",
  };
}

/**
 * Calculates both arithmetic mean and capacity-weighted fleet PUE.
 * Capacity-weighted aggregate PUE: Sum(Facility MW) / Sum(IT MW)
 * where for each facility: IT MW = Facility MW / PUE.
 */
export function calculateFleetPue(facilities: Array<{ capacityMw: number; pue: number | null }>): {
  arithmeticMean: number | null;
  capacityWeightedPue: number | null;
  count: number;
} {
  const valid = facilities.filter((f) => f.pue !== null && f.pue >= 1.0 && f.capacityMw > 0);
  if (valid.length === 0) {
    return { arithmeticMean: null, capacityWeightedPue: null, count: 0 };
  }

  const pueSum = valid.reduce((acc, f) => acc + (f.pue as number), 0);
  const arithmeticMean = Math.round((pueSum / valid.length) * 100) / 100;

  let totalFacilityMw = 0;
  let totalItMw = 0;
  for (const f of valid) {
    totalFacilityMw += f.capacityMw;
    totalItMw += f.capacityMw / (f.pue as number);
  }

  const capacityWeightedPue =
    totalItMw > 0 ? Math.round((totalFacilityMw / totalItMw) * 100) / 100 : null;

  return {
    arithmeticMean,
    capacityWeightedPue,
    count: valid.length,
  };
}

// ─── KPI 2: Availability and Uptime ──────────────────────────────────────────

export interface AvailabilityResult {
  availabilityPct: number | null;
  totalHours: number;
  downtimeHours: number;
  uptimeHours: number;
  ninesTier: string;
  status: "valid" | "invalid";
  errorMessage?: string;
}

export function calculateAvailability(
  measurementHours: number,
  downtimeMinutes: number,
): AvailabilityResult {
  if (
    isNaN(measurementHours) ||
    isNaN(downtimeMinutes) ||
    !isFinite(measurementHours) ||
    !isFinite(downtimeMinutes) ||
    measurementHours <= 0 ||
    downtimeMinutes < 0
  ) {
    return {
      availabilityPct: null,
      totalHours: measurementHours,
      downtimeHours: 0,
      uptimeHours: 0,
      ninesTier: "Invalid",
      status: "invalid",
      errorMessage:
        "Measurement period must be greater than zero hours and downtime cannot be negative.",
    };
  }

  const downtimeHours = downtimeMinutes / 60;
  if (downtimeHours > measurementHours) {
    return {
      availabilityPct: null,
      totalHours: measurementHours,
      downtimeHours,
      uptimeHours: 0,
      ninesTier: "Invalid",
      status: "invalid",
      errorMessage: "Downtime cannot exceed the total duration of the measurement period.",
    };
  }

  const uptimeHours = measurementHours - downtimeHours;
  const rawAvailability = (uptimeHours / measurementHours) * 100;
  const availabilityPct = Math.round(rawAvailability * 10000) / 10000;

  let ninesTier = "Below 99.0%";
  if (availabilityPct >= 99.999) {
    ninesTier = "99.999% (Five Nines)";
  } else if (availabilityPct >= 99.99) {
    ninesTier = "99.99% (Four Nines / Tier IV Target)";
  } else if (availabilityPct >= 99.982) {
    ninesTier = "99.982% (Tier III Target)";
  } else if (availabilityPct >= 99.9) {
    ninesTier = "99.9% (Three Nines)";
  } else if (availabilityPct >= 99.0) {
    ninesTier = "99.0% (Two Nines)";
  }

  return {
    availabilityPct,
    totalHours: measurementHours,
    downtimeHours: Math.round(downtimeHours * 100) / 100,
    uptimeHours: Math.round(uptimeHours * 100) / 100,
    ninesTier,
    status: "valid",
  };
}

// ─── KPI 3: Cooling Efficiency (COP, kW/ton, Sensible Heat) ──────────────────

export interface CopResult {
  cop: number | null;
  kwPerTon: number | null;
  rating: "High Efficiency" | "Standard Modern" | "Low Efficiency" | "Invalid";
  status: "valid" | "invalid";
  errorMessage?: string;
}

export function calculateCop(
  coolingThermalOutputKw: number,
  coolingElectricalInputKw: number,
): CopResult {
  if (
    isNaN(coolingThermalOutputKw) ||
    isNaN(coolingElectricalInputKw) ||
    !isFinite(coolingThermalOutputKw) ||
    !isFinite(coolingElectricalInputKw) ||
    coolingThermalOutputKw <= 0 ||
    coolingElectricalInputKw <= 0
  ) {
    return {
      cop: null,
      kwPerTon: null,
      rating: "Invalid",
      status: "invalid",
      errorMessage: "Cooling thermal output and electrical input must both be positive numbers.",
    };
  }

  const rawCop = coolingThermalOutputKw / coolingElectricalInputKw;
  const cop = Math.round(rawCop * 100) / 100;
  // kW/ton = 3.517 / COP (where 1 Ton of refrigeration = 3.51685 kW)
  const kwPerTon = Math.round((3.51685 / cop) * 1000) / 1000;

  let rating: CopResult["rating"] = "Standard Modern";
  if (cop >= 5.0) {
    rating = "High Efficiency";
  } else if (cop >= 3.5) {
    rating = "Standard Modern";
  } else {
    rating = "Low Efficiency";
  }

  return {
    cop,
    kwPerTon,
    rating,
    status: "valid",
  };
}

/**
 * Calculates sensible heat transfer Q = m_dot * Cp * deltaT
 * For water: Cp = 4.184 kJ/(kg·K). Density ~ 1 kg/L.
 * Flow rate in Litres per minute (LPM) converts to: mass flow kg/s = LPM / 60.
 * Heat dissipation Q (kW) = (LPM / 60) * 4.184 * (T_return - T_supply).
 */
export function calculateSensibleHeat(
  flowRateLpm: number,
  supplyTempC: number,
  returnTempC: number,
): {
  heatKw: number | null;
  deltaTC: number | null;
  status: "valid" | "invalid";
  errorMessage?: string;
} {
  if (isNaN(flowRateLpm) || isNaN(supplyTempC) || isNaN(returnTempC) || flowRateLpm <= 0) {
    return {
      heatKw: null,
      deltaTC: null,
      status: "invalid",
      errorMessage: "Coolant flow rate must be positive.",
    };
  }

  if (returnTempC < supplyTempC) {
    return {
      heatKw: null,
      deltaTC: null,
      status: "invalid",
      errorMessage:
        "Return temperature cannot be lower than supply temperature in heat extraction mode.",
    };
  }

  const deltaTC = Math.round((returnTempC - supplyTempC) * 10) / 10;
  const massFlowKgPerSec = flowRateLpm / 60;
  const cpWater = 4.184; // kJ/(kg*K)
  const heatKw = Math.round(massFlowKgPerSec * cpWater * deltaTC * 10) / 10;

  return {
    heatKw,
    deltaTC,
    status: "valid",
  };
}

// ─── KPI 4: Power Availability and Reliability ───────────────────────────────

export interface PowerReliabilityMetrics {
  redundancyTier: "N" | "N+1" | "2N" | "2(N+1)";
  theoreticalPathAvailabilityPct: number;
  singlePointOfFailure: boolean;
  concurrentMaintainable: boolean;
  faultTolerant: boolean;
  generatorTransferTimeSec: number;
}

export function getRedundancyProfile(tier: "N" | "N+1" | "2N" | "2(N+1)"): PowerReliabilityMetrics {
  switch (tier) {
    case "N":
      return {
        redundancyTier: "N",
        theoreticalPathAvailabilityPct: 99.67,
        singlePointOfFailure: true,
        concurrentMaintainable: false,
        faultTolerant: false,
        generatorTransferTimeSec: 15,
      };
    case "N+1":
      return {
        redundancyTier: "N+1",
        theoreticalPathAvailabilityPct: 99.75,
        singlePointOfFailure: true,
        concurrentMaintainable: false,
        faultTolerant: false,
        generatorTransferTimeSec: 10,
      };
    case "2N":
      return {
        redundancyTier: "2N",
        theoreticalPathAvailabilityPct: 99.982,
        singlePointOfFailure: false,
        concurrentMaintainable: true,
        faultTolerant: false,
        generatorTransferTimeSec: 8,
      };
    case "2(N+1)":
      return {
        redundancyTier: "2(N+1)",
        theoreticalPathAvailabilityPct: 99.995,
        singlePointOfFailure: false,
        concurrentMaintainable: true,
        faultTolerant: true,
        generatorTransferTimeSec: 6,
      };
  }
}

// ─── KPI 5: Capacity Utilization & Stranded Power ────────────────────────────

export interface CapacityUtilizationResult {
  utilizationPct: number | null;
  remainingCapacity: number | null;
  strandedCapacity: number | null;
  status: "valid" | "invalid";
  errorMessage?: string;
}

export function calculateCapacityUtilization(
  usedCapacity: number,
  availableCapacity: number,
  contractedOrBreakerLimit?: number,
): CapacityUtilizationResult {
  if (
    isNaN(usedCapacity) ||
    isNaN(availableCapacity) ||
    usedCapacity < 0 ||
    availableCapacity <= 0
  ) {
    return {
      utilizationPct: null,
      remainingCapacity: null,
      strandedCapacity: null,
      status: "invalid",
      errorMessage: "Available capacity must be positive and used capacity cannot be negative.",
    };
  }

  const remaining = Math.max(0, availableCapacity - usedCapacity);
  const rawPct = (usedCapacity / availableCapacity) * 100;
  const utilizationPct = Math.round(rawPct * 10) / 10;

  let strandedCapacity: number | null = null;
  if (contractedOrBreakerLimit !== undefined && contractedOrBreakerLimit >= availableCapacity) {
    strandedCapacity = Math.round((contractedOrBreakerLimit - availableCapacity) * 10) / 10;
  }

  return {
    utilizationPct,
    remainingCapacity: Math.round(remaining * 10) / 10,
    strandedCapacity,
    status: "valid",
  };
}

// ─── KPI 6: Temperature & Humidity Compliance (ASHRAE TC 9.9) ────────────────

export interface ReadingRecord {
  tempC: number;
  rhPct: number;
  timestamp?: string;
  location?: string;
}

export interface EnvironmentalLimits {
  minTempC: number;
  maxTempC: number;
  minRhPct: number;
  maxRhPct: number;
  maxDewPointC: number;
}

export const ASHRAE_A1_RECOMMENDED: EnvironmentalLimits = {
  minTempC: 18.0,
  maxTempC: 27.0,
  minRhPct: 50.0, // or dew point min -9°C
  maxRhPct: 60.0, // non-condensing
  maxDewPointC: 15.0,
};

export const ASHRAE_A1_ALLOWABLE: EnvironmentalLimits = {
  minTempC: 15.0,
  maxTempC: 32.0,
  minRhPct: 20.0,
  maxRhPct: 80.0,
  maxDewPointC: 17.0,
};

/**
 * Calculates Dew Point using the Magnus-Tetens approximation.
 */
export function calculateDewPoint(tempC: number, rhPct: number): number {
  if (rhPct <= 0) return -50;
  const a = 17.27;
  const b = 237.7;
  const alpha = (a * tempC) / (b + tempC) + Math.log(rhPct / 100);
  const dewPoint = (b * alpha) / (a - alpha);
  return Math.round(dewPoint * 10) / 10;
}

export function calculateEnvironmentalCompliance(
  readings: ReadingRecord[],
  limits: EnvironmentalLimits,
): {
  compliancePct: number | null;
  compliantCount: number;
  totalValidCount: number;
  invalidCount: number;
  averageTempC: number | null;
  averageRhPct: number | null;
} {
  if (!readings || readings.length === 0) {
    return {
      compliancePct: null,
      compliantCount: 0,
      totalValidCount: 0,
      invalidCount: 0,
      averageTempC: null,
      averageRhPct: null,
    };
  }

  let compliantCount = 0;
  let totalValidCount = 0;
  let invalidCount = 0;
  let tempSum = 0;
  let rhSum = 0;

  for (const r of readings) {
    // Valid physical sensor bounds: Temp -20°C to 70°C, RH 0% to 100%
    if (
      isNaN(r.tempC) ||
      isNaN(r.rhPct) ||
      r.tempC < -20 ||
      r.tempC > 70 ||
      r.rhPct < 0 ||
      r.rhPct > 100
    ) {
      invalidCount += 1;
      continue;
    }

    totalValidCount += 1;
    tempSum += r.tempC;
    rhSum += r.rhPct;

    const isTempCompliant = r.tempC >= limits.minTempC && r.tempC <= limits.maxTempC;
    const isRhCompliant = r.rhPct >= limits.minRhPct && r.rhPct <= limits.maxRhPct;
    const isDewPointCompliant = calculateDewPoint(r.tempC, r.rhPct) <= limits.maxDewPointC;

    if (isTempCompliant && isRhCompliant && isDewPointCompliant) {
      compliantCount += 1;
    }
  }

  if (totalValidCount === 0) {
    return {
      compliancePct: null,
      compliantCount: 0,
      totalValidCount: 0,
      invalidCount,
      averageTempC: null,
      averageRhPct: null,
    };
  }

  const rawCompliance = (compliantCount / totalValidCount) * 100;
  return {
    compliancePct: Math.round(rawCompliance * 10) / 10,
    compliantCount,
    totalValidCount,
    invalidCount,
    averageTempC: Math.round((tempSum / totalValidCount) * 10) / 10,
    averageRhPct: Math.round((rhSum / totalValidCount) * 10) / 10,
  };
}

// ─── KPI 7: Mean Time Between Failures (MTBF) ────────────────────────────────

export interface MtbfResult {
  mtbfHours: number | null;
  lowerConfidenceBoundHours: number | null; // 90% Poisson one-sided lower bound: T / -ln(0.10)
  totalOperatingHours: number;
  failuresCount: number;
  failureRatePerYear: number | null; // lambda * 8760
  status: "valid" | "zero_failures" | "invalid";
  message: string;
}

export function calculateMtbf(
  equipmentCount: number,
  hoursPerUnit: number,
  failuresCount: number,
): MtbfResult {
  if (
    isNaN(equipmentCount) ||
    isNaN(hoursPerUnit) ||
    isNaN(failuresCount) ||
    equipmentCount <= 0 ||
    hoursPerUnit <= 0 ||
    failuresCount < 0
  ) {
    return {
      mtbfHours: null,
      lowerConfidenceBoundHours: null,
      totalOperatingHours: 0,
      failuresCount: 0,
      failureRatePerYear: null,
      status: "invalid",
      message: "Equipment count and hours must be positive numbers. Failures cannot be negative.",
    };
  }

  const totalOperatingHours = equipmentCount * hoursPerUnit;

  if (failuresCount === 0) {
    // Statistically, MTBF is undefined for 0 failures (division by zero).
    // Using a one-sided Poisson confidence interval at 90% confidence:
    // lambda_max = chi2(2(r+1), 0.90) / 2T = -ln(0.10) / T = ln(10) / T ~ 2.3026 / T
    // MTBF_lower_90% = T / 2.3026
    const lowerBound = Math.round(totalOperatingHours / Math.LN10);
    return {
      mtbfHours: null,
      lowerConfidenceBoundHours: lowerBound,
      totalOperatingHours,
      failuresCount: 0,
      failureRatePerYear: 0,
      status: "zero_failures",
      message: `Zero failures observed across ${totalOperatingHours.toLocaleString()} unit-operating hours. Point estimate MTBF is undefined (T/0). One-sided 90% Poisson lower confidence bound MTBF >= ${lowerBound.toLocaleString()} hours (T / -ln(0.10)).`,
    };
  }

  const rawMtbf = totalOperatingHours / failuresCount;
  const mtbfHours = Math.round(rawMtbf);
  // Failure rate lambda = 1 / MTBF; Annualized failures per unit = (1 / MTBF) * 8760
  const failureRatePerYear = Math.round((8760 / mtbfHours) * 1000) / 1000;

  return {
    mtbfHours,
    lowerConfidenceBoundHours: null,
    totalOperatingHours,
    failuresCount,
    failureRatePerYear,
    status: "valid",
    message: `Demonstrated MTBF of ${mtbfHours.toLocaleString()} hours between failures.`,
  };
}

// ─── KPI 8: Mean Time To Repair (MTTR) ───────────────────────────────────────

export interface MttrResult {
  mttrMinutes: number | null;
  mttrHours: number | null;
  repairsCount: number;
  status: "valid" | "invalid";
  errorMessage?: string;
}

export function calculateMttr(totalRepairMinutes: number, repairsCount: number): MttrResult {
  if (
    isNaN(totalRepairMinutes) ||
    isNaN(repairsCount) ||
    totalRepairMinutes < 0 ||
    repairsCount <= 0
  ) {
    return {
      mttrMinutes: null,
      mttrHours: null,
      repairsCount: 0,
      status: "invalid",
      errorMessage:
        "Number of repairs must be at least 1, and total repair duration cannot be negative.",
    };
  }

  const rawMttrMin = totalRepairMinutes / repairsCount;
  const mttrMinutes = Math.round(rawMttrMin * 10) / 10;
  const mttrHours = Math.round((mttrMinutes / 60) * 100) / 100;

  return {
    mttrMinutes,
    mttrHours,
    repairsCount,
    status: "valid",
  };
}

// ─── KPI 9: Energy Consumption and Operating Cost ────────────────────────────

export type EnergyCostResult =
  | {
      status: "valid";
      itEnergyKwh: number;
      coolingEnergyKwh: number;
      facilityEnergyKwh: number;
      monthlyCost: number;
      annualCost: number;
      carbonEmissionsKgCo2: number;
    }
  | {
      status: "invalid";
      itEnergyKwh: null;
      coolingEnergyKwh: null;
      facilityEnergyKwh: null;
      monthlyCost: null;
      annualCost: null;
      carbonEmissionsKgCo2: null;
      errorMessage: string;
    };

export function calculateEnergyAndCost(
  units: number,
  wattsPerUnit: number,
  hoursPerDay: number,
  daysPerMonth: number,
  pue: number = 1.35,
  tariffPerKwh: number = 8.5, // Default INR 8.50/kWh (Industrial HT tariff in South India)
  carbonIntensityGPerKwh: number = 716, // CEA India national grid average ~716 gCO2/kWh
): EnergyCostResult {
  if (
    ![units, wattsPerUnit, hoursPerDay, daysPerMonth, pue, tariffPerKwh, carbonIntensityGPerKwh].every(
      (value) => Number.isFinite(value),
    ) ||
    units <= 0 ||
    wattsPerUnit <= 0 ||
    hoursPerDay <= 0 ||
    hoursPerDay > 24 ||
    daysPerMonth <= 0 ||
    daysPerMonth > 31 ||
    pue < 1.0 ||
    tariffPerKwh < 0 ||
    carbonIntensityGPerKwh < 0
  ) {
    return {
      status: "invalid",
      itEnergyKwh: null,
      coolingEnergyKwh: null,
      facilityEnergyKwh: null,
      monthlyCost: null,
      annualCost: null,
      carbonEmissionsKgCo2: null,
      errorMessage:
        "Enter finite positive workload, power, hours, days, and PUE values. Tariff and carbon intensity cannot be negative; hours cannot exceed 24 and days cannot exceed 31.",
    };
  }

  // IT Compute Energy = units * watts * hours * days / 1000
  const itEnergyKwh = Math.round(((units * wattsPerUnit * hoursPerDay * daysPerMonth) / 1000) * 10) / 10;
  // Total Facility Energy = IT Energy * PUE
  const facilityEnergyKwh = Math.round(itEnergyKwh * pue * 10) / 10;
  // Cooling and auxiliary overhead
  const coolingEnergyKwh = Math.round(Math.max(0, facilityEnergyKwh - itEnergyKwh) * 10) / 10;

  // Monthly Cost = Facility Energy * Tariff
  const monthlyCost = Math.round(facilityEnergyKwh * tariffPerKwh);
  // Annualized Cost = Monthly * 12
  const annualCost = Math.round(monthlyCost * 12);

  // Carbon emissions in kg CO2e = (kWh * gCO2/kWh) / 1000
  const carbonEmissionsKgCo2 = Math.round((facilityEnergyKwh * carbonIntensityGPerKwh) / 1000);

  return {
    status: "valid",
    itEnergyKwh,
    coolingEnergyKwh,
    facilityEnergyKwh,
    monthlyCost,
    annualCost,
    carbonEmissionsKgCo2,
  };
}

// ─── KPI 10: Maintenance Compliance (PMC% & PMP%) ───────────────────────────

export interface MaintenanceComplianceResult {
  pmcPct: number | null;
  pmpPct: number | null;
  overdueTasks: number;
  status: "valid" | "no_tasks_due" | "invalid";
  message: string;
}

export function calculateMaintenanceCompliance(
  tasksDue: number,
  completedOnTime: number,
  plannedMaintenanceHours: number = 0,
  unplannedBreakdownHours: number = 0,
): MaintenanceComplianceResult {
  if (
    isNaN(tasksDue) ||
    isNaN(completedOnTime) ||
    tasksDue < 0 ||
    completedOnTime < 0 ||
    completedOnTime > tasksDue ||
    plannedMaintenanceHours < 0 ||
    unplannedBreakdownHours < 0
  ) {
    return {
      pmcPct: null,
      pmpPct: null,
      overdueTasks: 0,
      status: "invalid",
      message: "Completed tasks cannot exceed tasks due, and hours cannot be negative.",
    };
  }

  const overdueTasks = tasksDue - completedOnTime;

  if (tasksDue === 0) {
    return {
      pmcPct: null, // Undefined / N/A when denominator is 0
      pmpPct:
        plannedMaintenanceHours + unplannedBreakdownHours > 0
          ? Math.round(
              (plannedMaintenanceHours / (plannedMaintenanceHours + unplannedBreakdownHours)) *
                1000,
            ) / 10
          : null,
      overdueTasks: 0,
      status: "no_tasks_due",
      message: "No preventive maintenance tasks were due in this measurement interval (N/A).",
    };
  }

  const rawPmc = (completedOnTime / tasksDue) * 100;
  const pmcPct = Math.round(rawPmc * 10) / 10;

  let pmpPct: number | null = null;
  const totalMaintHours = plannedMaintenanceHours + unplannedBreakdownHours;
  if (totalMaintHours > 0) {
    pmpPct = Math.round((plannedMaintenanceHours / totalMaintHours) * 1000) / 10;
  }

  return {
    pmcPct,
    pmpPct,
    overdueTasks,
    status: "valid",
    message: `${pmcPct}% of scheduled preventive maintenance tasks completed within compliance window.`,
  };
}
