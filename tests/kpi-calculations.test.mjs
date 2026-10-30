import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import ts from "typescript";

function loadTsModule(relativePath) {
  let source = fs.readFileSync(new URL(relativePath, import.meta.url), "utf8");
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  return import(`data:text/javascript;base64,${Buffer.from(compiled).toString("base64")}`);
}

const kpiModule = await loadTsModule("../src/lib/kpi-calculations.ts");

const {
  calculatePue,
  calculateFleetPue,
  calculateAvailability,
  calculateCop,
  calculateSensibleHeat,
  getRedundancyProfile,
  calculateCapacityUtilization,
  calculateDewPoint,
  calculateEnvironmentalCompliance,
  calculateMtbf,
  calculateMttr,
  calculateEnergyAndCost,
  calculateMaintenanceCompliance,
  ASHRAE_A1_RECOMMENDED,
  ASHRAE_A1_ALLOWABLE,
} = kpiModule;

test("KPI 1: Power Usage Effectiveness (PUE) Calculation & Boundaries", () => {
  // 1. Valid high-efficiency liquid-cooled data center (12,500 kWh facility / 10,000 kWh IT => PUE 1.25)
  const validPue = calculatePue(12500, 10000);
  assert.equal(validPue.status, "valid");
  assert.equal(validPue.pue, 1.25);
  assert.equal(validPue.overheadRatio, 0.25);
  assert.equal(validPue.rating, "Efficient Modern");

  // 2. Ultra-efficient direct-to-chip data center (11,500 kWh / 10,000 kWh => PUE 1.15)
  const ultraPue = calculatePue(11500, 10000);
  assert.equal(ultraPue.pue, 1.15);
  assert.equal(ultraPue.rating, "Very High Efficiency");

  // 3. Zero IT-energy denominator error handling
  const zeroIt = calculatePue(10000, 0);
  assert.equal(zeroIt.status, "invalid");
  assert.equal(zeroIt.pue, null);
  assert.ok(zeroIt.errorMessage.includes("greater than zero"));

  // 4. Negative energy inputs error handling
  const negativeEnergy = calculatePue(-500, 1000);
  assert.equal(negativeEnergy.status, "invalid");

  // 5. Facility energy less than IT energy (violates thermodynamic physics)
  const invalidLowerFacility = calculatePue(8000, 10000);
  assert.equal(invalidLowerFacility.status, "invalid");
  assert.ok(invalidLowerFacility.errorMessage.includes("thermodynamic minimum"));

  // 6. Fleet PUE (arithmetic mean vs. capacity-weighted fleet PUE)
  const facilities = [
    { capacityMw: 100, pue: 1.2 }, // IT = 100 / 1.2 = 83.33 MW
    { capacityMw: 20, pue: 1.6 }, // IT = 20 / 1.6 = 12.5 MW
  ];
  const fleet = calculateFleetPue(facilities);
  // Arithmetic mean = (1.2 + 1.6) / 2 = 1.40
  assert.equal(fleet.arithmeticMean, 1.4);
  // Capacity-weighted = (100 + 20) / (83.33 + 12.5) = 120 / 95.83 = 1.25
  assert.equal(fleet.capacityWeightedPue, 1.25);
  assert.equal(fleet.count, 2);
});

test("KPI 2: Availability and Uptime Calculations", () => {
  const annualHours = 8760;

  // 1. Zero downtime (100% availability)
  const perfect = calculateAvailability(annualHours, 0);
  assert.equal(perfect.status, "valid");
  assert.equal(perfect.availabilityPct, 100);
  assert.equal(perfect.downtimeHours, 0);
  assert.ok(perfect.ninesTier.includes("Five Nines"));

  // 2. Tier III target (99.982% availability => approx 94.6 minutes downtime/year)
  const tier3 = calculateAvailability(annualHours, 94.6);
  assert.equal(tier3.status, "valid");
  assert.equal(tier3.availabilityPct, 99.982);
  assert.ok(tier3.ninesTier.includes("Tier III"));

  // 3. Downtime equals total measurement period (0% availability)
  const totalOutage = calculateAvailability(730, 730 * 60);
  assert.equal(totalOutage.status, "valid");
  assert.equal(totalOutage.availabilityPct, 0);
  assert.equal(totalOutage.uptimeHours, 0);

  // 4. Downtime exceeds total measurement period (invalid)
  const invalidDowntime = calculateAvailability(100, 100 * 60 + 1);
  assert.equal(invalidDowntime.status, "invalid");

  // 5. Zero measurement hours (invalid)
  const zeroPeriod = calculateAvailability(0, 10);
  assert.equal(zeroPeriod.status, "invalid");
});

test("KPI 3: Cooling Efficiency (COP & Sensible Heat Q = m*Cp*dT)", () => {
  // 1. Valid modern water-cooled chiller (500 kW thermal removed / 100 kW electrical input => COP 5.0)
  const copValid = calculateCop(500, 100);
  assert.equal(copValid.status, "valid");
  assert.equal(copValid.cop, 5.0);
  // kW/ton = 3.517 / 5.0 = 0.703 kW/ton
  assert.equal(copValid.kwPerTon, 0.703);
  assert.equal(copValid.rating, "High Efficiency");

  // 2. Zero electrical input (invalid)
  const zeroInput = calculateCop(500, 0);
  assert.equal(zeroInput.status, "invalid");
  assert.equal(copValid.cop !== null, true);

  // 3. Negative thermal output (invalid)
  const negativeOutput = calculateCop(-100, 50);
  assert.equal(negativeOutput.status, "invalid");

  // 4. Sensible heat transfer calculation Q = m_dot * Cp * deltaT
  // Flow rate 300 LPM, Supply 32°C, Return 42°C (deltaT = 10°C)
  // mass flow = 300 / 60 = 5 kg/s. Q = 5 * 4.184 * 10 = 209.2 kW
  const heat = calculateSensibleHeat(300, 32, 42);
  assert.equal(heat.status, "valid");
  assert.equal(heat.deltaTC, 10);
  assert.equal(heat.heatKw, 209.2);

  // 5. Inverted temperatures (return < supply in cooling extraction mode)
  const invertedTemp = calculateSensibleHeat(300, 45, 30);
  assert.equal(invertedTemp.status, "invalid");
});

test("KPI 4: Power Availability & Redundancy Profiles", () => {
  const profileN = getRedundancyProfile("N");
  assert.equal(profileN.singlePointOfFailure, true);
  assert.equal(profileN.concurrentMaintainable, false);

  const profile2N = getRedundancyProfile("2N");
  assert.equal(profile2N.singlePointOfFailure, false);
  assert.equal(profile2N.concurrentMaintainable, true);
  assert.equal(profile2N.generatorTransferTimeSec, 8);
});

test("KPI 5: Capacity Utilization & Stranded Power", () => {
  // 1. Normal utilization: 800 kW used out of 1000 kW available (80% utilized, 200 kW remaining)
  const cap = calculateCapacityUtilization(800, 1000, 1200);
  assert.equal(cap.status, "valid");
  assert.equal(cap.utilizationPct, 80);
  assert.equal(cap.remainingCapacity, 200);
  assert.equal(cap.strandedCapacity, 200); // 1200 contracted - 1000 available = 200 stranded

  // 2. Zero available capacity error handling
  const zeroAvail = calculateCapacityUtilization(50, 0);
  assert.equal(zeroAvail.status, "invalid");

  // 3. Negative used capacity error handling
  const negativeUsed = calculateCapacityUtilization(-10, 100);
  assert.equal(negativeUsed.status, "invalid");
});

test("KPI 6: Temperature & Humidity Compliance (ASHRAE TC 9.9)", () => {
  // 1. Dew point calculation: 24°C, 50% RH => Dew Point approx 12.9°C
  const dp = calculateDewPoint(24, 50);
  assert.ok(dp >= 12.5 && dp <= 13.5);

  // 2. Environmental Compliance on sensor array
  const readings = [
    { tempC: 22.5, rhPct: 52 }, // Compliant
    { tempC: 25.0, rhPct: 55 }, // Compliant
    { tempC: 30.5, rhPct: 58 }, // Temperature out of recommended range (>27°C)
    { tempC: -99, rhPct: 50 }, // Corrupt/invalid sensor
  ];

  const compliance = calculateEnvironmentalCompliance(readings, ASHRAE_A1_RECOMMENDED);
  assert.equal(compliance.totalValidCount, 3);
  assert.equal(compliance.invalidCount, 1);
  assert.equal(compliance.compliantCount, 1);
  // Compliance = 1 / 3 = 33.3% after applying the configured dew-point limit.
  assert.equal(compliance.compliancePct, 33.3);

  const dewPointExcursion = calculateEnvironmentalCompliance(
    [
      { tempC: 25.8, rhPct: 58 },
      { tempC: 23.0, rhPct: 50 },
    ],
    ASHRAE_A1_RECOMMENDED,
  );
  assert.equal(dewPointExcursion.compliantCount, 1);
  assert.equal(dewPointExcursion.compliancePct, 50);

  // 3. Empty readings array
  const empty = calculateEnvironmentalCompliance([], ASHRAE_A1_RECOMMENDED);
  assert.equal(empty.compliancePct, null);
  assert.equal(empty.totalValidCount, 0);
});

test("KPI 7: Mean Time Between Failures (MTBF)", () => {
  // 1. 20 UPS modules operating for 8,760 hours (1 year) with 2 observed failures
  // Total operating hours = 175,200 hrs. MTBF = 175,200 / 2 = 87,600 hrs
  const mtbf = calculateMtbf(20, 8760, 2);
  assert.equal(mtbf.status, "valid");
  assert.equal(mtbf.totalOperatingHours, 175200);
  assert.equal(mtbf.mtbfHours, 87600);
  assert.equal(mtbf.failureRatePerYear, 0.1);

  // 2. Zero qualifying failures (point estimate undefined, Poisson 90% lower bound T / -ln(0.10))
  const zeroFailures = calculateMtbf(10, 5000, 0);
  assert.equal(zeroFailures.status, "zero_failures");
  assert.equal(zeroFailures.mtbfHours, null);
  // T = 50,000 hrs. 90% lower bound = 50,000 / ln(10) ~ 21,715 hrs
  assert.equal(zeroFailures.lowerConfidenceBoundHours, Math.round(50000 / Math.LN10));
  assert.equal(zeroFailures.failureRatePerYear, 0);

  // 3. Zero operating hours (invalid)
  const zeroHours = calculateMtbf(10, 0, 1);
  assert.equal(zeroHours.status, "invalid");
});

test("KPI 8: Mean Time To Repair (MTTR)", () => {
  // 1. 4 incident repairs taking a total of 180 minutes => MTTR = 45 mins (0.75 hrs)
  const mttr = calculateMttr(180, 4);
  assert.equal(mttr.status, "valid");
  assert.equal(mttr.mttrMinutes, 45);
  assert.equal(mttr.mttrHours, 0.75);

  // 2. Zero repair incidents (invalid / no denominator)
  const zeroRepairs = calculateMttr(120, 0);
  assert.equal(zeroRepairs.status, "invalid");

  // 3. Negative repair minutes (invalid)
  const negativeMin = calculateMttr(-30, 2);
  assert.equal(negativeMin.status, "invalid");
});

test("KPI 9: Energy Consumption and Operating Cost", () => {
  // 8 GPU servers @ 700W each = 5.6 kW. 24 hrs/day, 30 days/month = 720 hours.
  // IT Energy = 5.6 * 720 = 4,032 kWh.
  // With PUE 1.35, Total Facility Energy = 4,032 * 1.35 = 5,443.2 kWh.
  // Cooling overhead = 5443.2 - 4032 = 1,411.2 kWh.
  // Tariff = ₹8.50/kWh => Monthly Cost = 5,443.2 * 8.50 = ₹46,267.
  const cost = calculateEnergyAndCost(8, 700, 24, 30, 1.35, 8.5);
  assert.equal(cost.itEnergyKwh, 4032);
  assert.equal(cost.facilityEnergyKwh, 5443.2);
  assert.equal(cost.coolingEnergyKwh, 1411.2);
  assert.equal(cost.monthlyCost, 46267);
  assert.equal(cost.annualCost, 46267 * 12);
  assert.ok(cost.carbonEmissionsKgCo2 > 0);

  // Invalid or incomplete inputs must not be replaced with silent fallback assumptions.
  const missingUnits = calculateEnergyAndCost(0, 700, 24, 30, 1.35, 8.5);
  assert.equal(missingUnits.status, "invalid");
  assert.equal(missingUnits.facilityEnergyKwh, null);

  const invalidHours = calculateEnergyAndCost(8, 700, 25, 30, 1.35, 8.5);
  assert.equal(invalidHours.status, "invalid");

  const nonFiniteTariff = calculateEnergyAndCost(8, 700, 24, 30, 1.35, Number.NaN);
  assert.equal(nonFiniteTariff.status, "invalid");

  const zeroTariff = calculateEnergyAndCost(8, 700, 24, 30, 1.35, 0);
  assert.equal(zeroTariff.status, "valid");
  assert.equal(zeroTariff.monthlyCost, 0);
});

test("KPI 10: Maintenance Compliance (PMC% & PMP%)", () => {
  // 1. 50 tasks due, 48 completed on-time within window => PMC = 96.0%
  // 400 planned PM hours, 50 unplanned breakdown hours => PMP = 400 / 450 = 88.9%
  const maint = calculateMaintenanceCompliance(50, 48, 400, 50);
  assert.equal(maint.status, "valid");
  assert.equal(maint.pmcPct, 96.0);
  assert.equal(maint.pmpPct, 88.9);
  assert.equal(maint.overdueTasks, 2);

  // 2. Zero tasks due (null/undefined compliance rate, status no_tasks_due)
  const zeroDue = calculateMaintenanceCompliance(0, 0, 100, 0);
  assert.equal(zeroDue.status, "no_tasks_due");
  assert.equal(zeroDue.pmcPct, null);
  assert.equal(zeroDue.pmpPct, 100.0);

  // 3. Completed tasks exceed tasks due (invalid data)
  const invalidCompleted = calculateMaintenanceCompliance(10, 12);
  assert.equal(invalidCompleted.status, "invalid");
});
