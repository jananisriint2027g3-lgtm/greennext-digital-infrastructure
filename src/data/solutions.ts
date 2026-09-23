export interface SolutionItem {
  id: string;
  code: string;
  title: string;
  eyebrow: string;
  problem: string;
  approach: string;
  expectedValue: string;
  relatedCapabilities: Array<{ label: string; path: string }>;
  cta: { label: string; path: string };
}

export const SOLUTIONS_DATA: Record<string, SolutionItem> = {
  "energy-monitoring": {
    id: "energy-monitoring",
    code: "UC-01",
    title: "Data Center Energy Monitoring",
    eyebrow: "Infrastructure Use Cases · UC-01",
    problem:
      "Infrastructure operators in high-density compute environments often lack granular, real-time visibility into where and how energy is being consumed across their facilities. Without this data, inefficiencies persist unnoticed and energy costs are difficult to attribute or optimise. Billing data arrives too infrequently and at too coarse a granularity to support real operational decisions.",
    approach:
      "Continuous power monitoring across infrastructure layers — from facility-level consumption to per-rack measurement — generates the operational data needed to understand energy consumption patterns, identify anomalies, and inform optimisation decisions. This monitoring data is connected with workload and thermal information to provide a unified operational picture.",
    expectedValue:
      "Operators gain a factual, continuously updated picture of energy consumption, enabling them to make informed decisions about workload placement, equipment configuration, and cooling strategy — rather than making decisions on assumption or delayed billing data.",
    relatedCapabilities: [
      { label: "Power Monitoring", path: "/energy/monitoring" },
      { label: "Energy Analytics", path: "/energy/analytics" },
      { label: "Operational Optimization", path: "/energy/optimization" },
    ],
    cta: {
      label: "Discuss Energy Monitoring Requirements →",
      path: "/contact",
    },
  },
  "health-monitoring": {
    id: "health-monitoring",
    code: "UC-02",
    title: "Infrastructure Health Monitoring",
    eyebrow: "Infrastructure Use Cases · UC-02",
    problem:
      "In complex infrastructure environments, hardware degradation, configuration drift, and emerging faults are often detected only after they have caused service disruption. Reactive incident management is more costly and disruptive than early identification — but early identification requires continuous monitoring at a granularity that is impractical to maintain manually.",
    approach:
      "Integrated monitoring across compute, network, storage, power, and cooling systems provides a continuous operational health picture. Defined thresholds and anomaly detection logic flag conditions that warrant attention before they escalate to service-affecting incidents. Alerts are routed to operational teams with the context needed for an informed initial response.",
    expectedValue:
      "Earlier identification of developing infrastructure issues, supporting planned rather than emergency interventions and reducing the frequency and severity of unplanned downtime.",
    relatedCapabilities: [
      { label: "Intelligent Monitoring", path: "/automation/monitoring" },
      { label: "Anomaly Detection", path: "/automation/anomaly" },
      { label: "Automated Alerts", path: "/automation/alerts" },
    ],
    cta: {
      label: "Discuss Health Monitoring Solutions →",
      path: "/contact",
    },
  },
  "ai-workload-management": {
    id: "ai-workload-management",
    code: "UC-03",
    title: "AI Workload Management",
    eyebrow: "Infrastructure Use Cases · UC-03",
    problem:
      "AI workloads — particularly training runs and large-scale inference deployments — can place extreme and variable demands on compute, power, and cooling infrastructure. Managing these workloads without visibility into infrastructure conditions risks thermal incidents, power demand spikes, or under-provisioning that constrains workload execution.",
    approach:
      "Workload-aware infrastructure management connects AI compute scheduling with real-time signals from the power and cooling infrastructure. This provides operators and scheduling systems with the contextual data needed to place, pace, and manage AI workloads in line with available infrastructure capacity — reducing the risk of infrastructure-driven workload failures.",
    expectedValue:
      "More reliable AI workload execution, with infrastructure conditions visible to the teams managing both the workloads and the physical systems they run on. Reduced risk of thermal incidents, power demand spikes, and capacity constraints during critical compute operations.",
    relatedCapabilities: [
      { label: "AI-Ready Infrastructure", path: "/infrastructure/ai-ready" },
      { label: "Workload-Aware Resources", path: "/energy/workload-aware" },
      { label: "Intelligent Monitoring", path: "/automation/monitoring" },
    ],
    cta: {
      label: "Discuss AI Workload Infrastructure →",
      path: "/contact",
    },
  },
  "cooling-optimization": {
    id: "cooling-optimization",
    code: "UC-04",
    title: "Cooling Optimization",
    eyebrow: "Infrastructure Use Cases · UC-04",
    problem:
      "Cooling represents a significant proportion of total data center energy consumption. Over-cooling is common — driven by conservative safety margins and limited real-time thermal visibility — and results in substantial unnecessary energy expenditure that scales with infrastructure size.",
    approach:
      "Continuous thermal monitoring across the compute environment — combined with workload intensity data — provides the visibility needed to calibrate cooling systems to actual thermal load rather than worst-case assumptions. This enables cooling system parameters to be adjusted based on measured conditions rather than fixed conservative margins.",
    expectedValue:
      "Improved thermal management with reduced energy waste, without compromising the thermal stability required for reliable hardware operation. Cooling calibration that responds to actual operational conditions rather than assumed maximums.",
    relatedCapabilities: [
      { label: "Cooling Efficiency", path: "/energy/cooling" },
      { label: "Power Monitoring", path: "/energy/monitoring" },
      { label: "Efficient Cooling", path: "/sustainability/efficient-cooling" },
    ],
    cta: {
      label: "Discuss Cooling Optimization →",
      path: "/contact",
    },
  },
  "capacity-planning": {
    id: "capacity-planning",
    code: "UC-05",
    title: "Capacity Planning",
    eyebrow: "Infrastructure Use Cases · UC-05",
    problem:
      "Infrastructure capacity decisions are often made on inadequate data — either overprovisioning leads to unnecessary capital expenditure and ongoing energy waste, or under-provisioning creates operational bottlenecks at exactly the moment when capacity is most needed. Neither is acceptable at scale.",
    approach:
      "Historical utilisation data, trend analysis, and regional demand signals provide the quantitative foundation for capacity planning decisions — for compute, power delivery, cooling infrastructure, and network connectivity. This enables capacity expansion to be planned ahead of need rather than in response to it.",
    expectedValue:
      "Capacity decisions informed by operational evidence rather than assumptions, enabling more efficient capital allocation and growth planning. Reduced risk of both unnecessary overprovisioning and operationally costly under-provisioning.",
    relatedCapabilities: [
      { label: "Capacity Management", path: "/automation/capacity" },
      { label: "Energy Analytics", path: "/energy/analytics" },
      { label: "Operational Reporting", path: "/automation/reporting" },
    ],
    cta: {
      label: "Discuss Capacity Planning →",
      path: "/contact",
    },
  },
  "anomaly-detection": {
    id: "anomaly-detection",
    code: "UC-06",
    title: "Anomaly Detection",
    eyebrow: "Infrastructure Use Cases · UC-06",
    problem:
      "Infrastructure environments produce significant volumes of operational data. Identifying the specific signals that indicate genuine anomalies — rather than normal operational variation — requires context and analytical capability that is difficult to maintain manually at scale. Without automated anomaly detection, important conditions are identified late or not at all.",
    approach:
      "Automated anomaly detection logic, calibrated to the normal operating envelope of specific infrastructure systems, flags deviations that warrant operator attention — filtering operational noise and surfacing genuinely significant conditions. Anomalies are presented with the context operators need to assess significance and decide on a response.",
    expectedValue:
      "Faster identification of genuine infrastructure anomalies, with reduced alert fatigue compared to threshold-only approaches. Operators receive fewer, more meaningful alerts — and can respond with more confidence.",
    relatedCapabilities: [
      { label: "Anomaly Detection", path: "/automation/anomaly" },
      { label: "Intelligent Monitoring", path: "/automation/monitoring" },
      { label: "Automated Alerts", path: "/automation/alerts" },
    ],
    cta: {
      label: "Discuss Anomaly Detection →",
      path: "/contact",
    },
  },
  "automated-alerts": {
    id: "automated-alerts",
    code: "UC-07",
    title: "Automated Operational Alerts",
    eyebrow: "Infrastructure Use Cases · UC-07",
    problem:
      "Manual monitoring of infrastructure systems at the granularity required for effective operational management is impractical at scale. Important conditions are missed, or identified too late for preventive action. When alerts do exist, poorly designed alerting systems generate so much noise that operators learn to ignore them.",
    approach:
      "Automated alert workflows route infrastructure conditions to the appropriate operational teams in structured, actionable formats — including context about the condition, its location in the infrastructure stack, and relevant operational history. Alert definitions are designed for operational value rather than technical completeness.",
    expectedValue:
      "Operational teams receive timely, contextual alerts that support faster and more informed responses, without requiring continuous manual monitoring of every infrastructure signal. Reduced alert fatigue, improved response times, and more consistent operational outcomes.",
    relatedCapabilities: [
      { label: "Automated Alerts", path: "/automation/alerts" },
      { label: "Anomaly Detection", path: "/automation/anomaly" },
      { label: "Operational Reporting", path: "/automation/reporting" },
    ],
    cta: {
      label: "Discuss Automated Operational Alerting →",
      path: "/contact",
    },
  },
};
