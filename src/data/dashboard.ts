export interface DashboardRegionMetric {
  id: string;
  name: string;
  code: string;
  detail: string;
  status: string;
  compute: number;
  power: number;
  cooling: number;
  network: number;
  events: number;
  alerts: number;
}

export const DASHBOARD_METRICS: Record<string, DashboardRegionMetric> = {
  madurai: {
    id: "madurai",
    name: "Madurai",
    code: "MDU",
    detail: "Regional technology and infrastructure hub.",
    status: "Conceptual / Planning",
    compute: 64,
    power: 71,
    cooling: 82,
    network: 96,
    events: 18,
    alerts: 2,
  },
  coimbatore: {
    id: "coimbatore",
    name: "Coimbatore",
    code: "CJB",
    detail: "Industrial and technology ecosystem.",
    status: "Conceptual / Planning",
    compute: 72,
    power: 68,
    cooling: 79,
    network: 94,
    events: 24,
    alerts: 1,
  },
  trichy: {
    id: "trichy",
    name: "Trichy",
    code: "TRZ",
    detail: "Strategic central Tamil Nadu connectivity.",
    status: "Conceptual / Planning",
    compute: 58,
    power: 62,
    cooling: 86,
    network: 97,
    events: 13,
    alerts: 0,
  },
  mangalore: {
    id: "mangalore",
    name: "Mangalore",
    code: "IXE",
    detail: "Coastal technology and connectivity gateway.",
    status: "Conceptual / Planning",
    compute: 69,
    power: 74,
    cooling: 77,
    network: 93,
    events: 21,
    alerts: 3,
  },
};

export const HOURLY_ACTIVITY_PATTERN = [
  34, 42, 39, 51, 49, 62, 58, 73, 66, 79, 75, 84, 72, 68, 77, 64, 71, 55, 59, 47, 52, 39, 44, 35,
];

export const DASHBOARD_DISCLAIMER =
  "All values, metrics, and status indicators in this dashboard are Illustrative / Demo Data. They do not represent real GreenNext operational measurements.";
