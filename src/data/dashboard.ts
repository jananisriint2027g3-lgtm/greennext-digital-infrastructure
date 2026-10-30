export interface DashboardRegionMetric {
  id: string;
  name: string;
  code: string;
  detail: string;
  status: string;
  compute: number | null;
  power: number | null;
  cooling: number | null;
  network: number | null;
  events: number | null;
  alerts: number | null;
  /** Illustrative hourly signal curve; never represents connected telemetry. */
  hourlyPattern: number[];
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
    hourlyPattern: [
      34, 42, 39, 51, 49, 62, 58, 73, 66, 79, 75, 84, 72, 68, 77, 64, 71, 55, 59, 47, 52, 39, 44,
      35,
    ],
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
    hourlyPattern: [
      38, 45, 43, 55, 52, 66, 61, 75, 70, 82, 78, 88, 76, 72, 81, 68, 74, 58, 62, 50, 55, 43, 47,
      39,
    ],
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
    hourlyPattern: [
      30, 36, 41, 47, 44, 57, 53, 65, 60, 71, 68, 77, 70, 63, 73, 59, 66, 52, 56, 45, 49, 37, 42,
      33,
    ],
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
    hourlyPattern: [
      42, 48, 45, 56, 53, 64, 61, 72, 68, 80, 76, 86, 74, 70, 79, 66, 73, 57, 61, 50, 54, 44, 48,
      41,
    ],
  },
  hosur: {
    id: "hosur",
    name: "Hosur",
    code: "HSR",
    detail: "Bengaluru-adjacent industrial and logistics planning node.",
    status: "Conceptual / Planning",
    compute: 72,
    power: 78,
    cooling: 81,
    network: 95,
    events: 18,
    alerts: 2,
    hourlyPattern: [
      36, 44, 41, 53, 50, 60, 57, 69, 65, 76, 72, 82, 70, 66, 75, 62, 68, 54, 58, 47, 51, 40, 44,
      37,
    ],
  },
  tirunelveli: {
    id: "tirunelveli",
    name: "Tirunelveli",
    code: "TNV",
    detail: "Southern Tamil Nadu renewable-energy and regional connectivity node.",
    status: "Conceptual / Planning",
    compute: 64,
    power: 71,
    cooling: 76,
    network: 91,
    events: 14,
    alerts: 1,
    hourlyPattern: [
      31, 39, 36, 48, 45, 56, 52, 64, 59, 70, 67, 78, 66, 61, 71, 57, 63, 49, 54, 43, 47, 35, 40,
      32,
    ],
  },
  puducherry: {
    id: "puducherry",
    name: "Puducherry",
    code: "PDY",
    detail: "Coastal innovation and cross-border connectivity planning node.",
    status: "Conceptual / Planning",
    compute: 68,
    power: 75,
    cooling: 79,
    network: 94,
    events: 16,
    alerts: 2,
    hourlyPattern: [
      40, 46, 43, 54, 51, 63, 59, 71, 66, 78, 74, 85, 73, 69, 78, 65, 71, 56, 60, 49, 53, 42, 46,
      39,
    ],
  },
};

export const DASHBOARD_DISCLAIMER =
  "All values, metrics, and status indicators in this dashboard are Illustrative / Demo Data. They do not represent real GreenNext operational measurements.";
