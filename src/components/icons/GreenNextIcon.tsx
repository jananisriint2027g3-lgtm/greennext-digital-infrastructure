import { forwardRef, type ReactNode, type SVGProps } from "react";

export type GreenNextIconName =
  | "alert"
  | "analytics"
  | "arrow-down"
  | "arrow-left"
  | "arrow-right"
  | "arrow-up"
  | "automation"
  | "check"
  | "check-circle"
  | "chevron-down"
  | "chevron-left"
  | "chevron-right"
  | "chevron-up"
  | "close"
  | "compute"
  | "cooling"
  | "data"
  | "datacenter"
  | "energy"
  | "external-link"
  | "grip"
  | "intelligence"
  | "menu"
  | "message"
  | "minus"
  | "monitoring"
  | "network"
  | "pause"
  | "play"
  | "regional"
  | "refresh"
  | "search"
  | "security"
  | "send"
  | "storage"
  | "sustainability"
  | "telemetry"
  | "users";

export interface GreenNextIconProps extends SVGProps<SVGSVGElement> {
  name?: GreenNextIconName;
  size?: number | string;
  strokeWidth?: number;
}

const strokeProps = {
  fill: "none",
  stroke: "currentColor",
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

function glyph(name: GreenNextIconName): ReactNode {
  switch (name) {
    case "sustainability":
      return (
        <>
          <path d="M20.5 3.5C12.3 3.9 6.9 6.7 5.4 11.2c-1.1 3.2.7 6.4 3.8 6.8 4.8.6 8.7-4.2 9.9-14.5Z" />
          <path d="M4 21c2.8-5.3 6.6-8.7 11.5-11" />
          <circle cx="15.8" cy="8.2" r="1" />
          <circle cx="12.4" cy="11.1" r="1" />
        </>
      );
    case "intelligence":
      return (
        <>
          <rect x="6.5" y="6.5" width="11" height="11" rx="2" />
          <path d="M9.5 3.5v3M14.5 3.5v3M9.5 17.5v3M14.5 17.5v3M3.5 9.5h3M3.5 14.5h3M17.5 9.5h3M17.5 14.5h3" />
          <circle cx="10" cy="11" r=".8" />
          <circle cx="14" cy="11" r=".8" />
          <path d="M10 14c1.2.8 2.8.8 4 0" />
        </>
      );
    case "compute":
      return (
        <>
          <rect x="5.5" y="5.5" width="13" height="13" rx="2" />
          <rect x="9" y="9" width="6" height="6" rx="1" />
          <path d="M9 2.5v3M12 2.5v3M15 2.5v3M9 18.5v3M12 18.5v3M15 18.5v3M2.5 9h3M2.5 12h3M2.5 15h3M18.5 9h3M18.5 12h3M18.5 15h3" />
        </>
      );
    case "datacenter":
      return (
        <>
          <rect x="4" y="4" width="16" height="5" rx="1" />
          <rect x="4" y="10" width="16" height="5" rx="1" />
          <rect x="4" y="16" width="16" height="4" rx="1" />
          <path d="M7 6.5h.01M7 12.5h.01M7 18h.01M10 6.5h6M10 12.5h6M10 18h6" />
        </>
      );
    case "network":
      return (
        <>
          <circle cx="5" cy="12" r="2.2" />
          <circle cx="19" cy="6" r="2.2" />
          <circle cx="19" cy="18" r="2.2" />
          <path d="m7 11 9.8-4M7 13l9.8 4" />
        </>
      );
    case "storage":
      return (
        <>
          <ellipse cx="12" cy="6" rx="7" ry="3" />
          <path d="M5 6v6c0 1.7 3.1 3 7 3s7-1.3 7-3V6M5 12v6c0 1.7 3.1 3 7 3s7-1.3 7-3v-6" />
        </>
      );
    case "energy":
      return <path d="M13.5 2.5 5 13h6l-.5 8.5L19 10h-6l.5-7.5Z" />;
    case "cooling":
      return (
        <>
          <path d="M12 3v18M3 12h18M5.6 5.6l12.8 12.8M18.4 5.6 5.6 18.4" />
          <circle cx="12" cy="12" r="2.2" />
        </>
      );
    case "telemetry":
      return (
        <>
          <path d="M3 17.5h2.5l2.4-7 3.1 9 3.2-13 2.2 8H21" />
          <path d="M3 21h18" />
        </>
      );
    case "monitoring":
      return (
        <>
          <rect x="3.5" y="4.5" width="17" height="12" rx="1.5" />
          <path d="M8 20h8M12 16.5V20M7 12l2-2 2 1.5 3-3 3 2" />
        </>
      );
    case "automation":
      return (
        <>
          <rect x="3.5" y="4" width="5" height="5" rx="1" />
          <rect x="15.5" y="15" width="5" height="5" rx="1" />
          <path d="M8.5 6.5h3a4 4 0 0 1 4 4v4.5M15.5 17.5h-3a4 4 0 0 1-4-4V11" />
          <path d="m13.5 14.5 2 2 2-2" />
        </>
      );
    case "security":
      return (
        <>
          <path d="M12 3 19 6v5.5c0 4.2-2.8 7.5-7 9.5-4.2-2-7-5.3-7-9.5V6l7-3Z" />
          <path d="m8.5 12 2.3 2.3 4.8-5" />
        </>
      );
    case "regional":
      return (
        <>
          <circle cx="12" cy="12" r="8.5" />
          <path d="M3.5 12h17M12 3.5c2.2 2.3 3.3 5.1 3.3 8.5s-1.1 6.2-3.3 8.5c-2.2-2.3-3.3-5.1-3.3-8.5S9.8 5.8 12 3.5Z" />
          <circle cx="16.7" cy="8" r="1.1" />
        </>
      );
    case "analytics":
      return (
        <>
          <path d="M4 19.5V14M10 19.5V9M16 19.5V5M22 19.5H2" />
          <path d="m3 11 5-4 5 2 7-6" />
        </>
      );
    case "data":
      return (
        <>
          <path d="M6 3.5h8l4 4v13H6z" />
          <path d="M14 3.5v4h4M9 12h6M9 16h6" />
        </>
      );
    case "alert":
      return (
        <>
          <path d="m12 3 9 17H3L12 3Z" />
          <path d="M12 9v4M12 16h.01" />
        </>
      );
    case "check-circle":
      return <><circle cx="12" cy="12" r="8.5" /><path d="m8 12 2.6 2.6L16.5 9" /></>;
    case "check":
      return <path d="m5 12 4.2 4.2L19 6.5" />;
    case "message":
      return <><path d="M4 5.5h16v10H9l-5 4v-4H4z" /><path d="M8 10.5h.01M12 10.5h.01M16 10.5h.01" /></>;
    case "send":
      return <path d="m21 3-7.2 18-3.6-7.2L3 10.2 21 3ZM10.2 13.8 21 3" />;
    case "search":
      return <><circle cx="10.8" cy="10.8" r="6.8" /><path d="m16 16 5 5" /></>;
    case "users":
      return <><circle cx="9" cy="8" r="3" /><path d="M3.5 20c.4-3.4 2.2-5 5.5-5s5.1 1.6 5.5 5M16 5.5a3 3 0 0 1 0 5.8M16 15c2.8.2 4.2 1.8 4.5 4" /></>;
    case "arrow-right":
      return <path d="M4 12h15M13 6l6 6-6 6" />;
    case "arrow-left":
      return <path d="M20 12H5M11 6l-6 6 6 6" />;
    case "arrow-down":
      return <path d="M12 4v15M6 13l6 6 6-6" />;
    case "arrow-up":
      return <path d="M12 20V5M6 11l6-6 6 6" />;
    case "chevron-right":
      return <path d="m9 5 7 7-7 7" />;
    case "chevron-left":
      return <path d="m15 5-7 7 7 7" />;
    case "chevron-down":
      return <path d="m5 9 7 7 7-7" />;
    case "chevron-up":
      return <path d="m5 15 7-7 7 7" />;
    case "external-link":
      return <><path d="M14 4h6v6M20 4l-9 9" /><path d="M18 13v5.5A1.5 1.5 0 0 1 16.5 20h-12A1.5 1.5 0 0 1 3 18.5v-12A1.5 1.5 0 0 1 4.5 5H10" /></>;
    case "close":
      return <path d="m6 6 12 12M18 6 6 18" />;
    case "menu":
      return <path d="M4 7h16M4 12h16M4 17h16" />;
    case "refresh":
      return <path d="M20 11a8 8 0 0 0-14.8-3.9L3 9M3 4v5h5M4 13a8 8 0 0 0 14.8 3.9L21 15M21 20v-5h-5" />;
    case "pause":
      return <path d="M8 5v14M16 5v14" />;
    case "play":
      return <path d="m8 5 11 7-11 7V5Z" />;
    case "grip":
      return <path d="M9 5h.01M15 5h.01M9 12h.01M15 12h.01M9 19h.01M15 19h.01" />;
    case "minus":
      return <path d="M5 12h14" />;
    default:
      return null;
  }
}

export const GreenNextIcon = forwardRef<SVGSVGElement, GreenNextIconProps>(
  ({ name = "datacenter", size = 24, strokeWidth = 1.7, "aria-label": ariaLabel, ...props }, ref) => (
    <svg
      ref={ref}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      strokeWidth={strokeWidth}
      aria-hidden={ariaLabel ? undefined : true}
      aria-label={ariaLabel}
      {...strokeProps}
      {...props}
    >
      {glyph(name)}
    </svg>
  ),
);

GreenNextIcon.displayName = "GreenNextIcon";

function createIcon(name: GreenNextIconName) {
  const Icon = forwardRef<SVGSVGElement, GreenNextIconProps>((props, ref) => (
    <GreenNextIcon ref={ref} name={name} {...props} />
  ));
  Icon.displayName = `GreenNext${name}`;
  return Icon;
}

export const Activity = createIcon("telemetry");
export const AlertCircle = createIcon("alert");
export const AlertTriangle = createIcon("alert");
export const ArrowDown = createIcon("arrow-down");
export const ArrowLeft = createIcon("arrow-left");
export const ArrowRight = createIcon("arrow-right");
export const ArrowUp = createIcon("arrow-up");
export const Bot = createIcon("intelligence");
export const Building2 = createIcon("datacenter");
export const Check = createIcon("check");
export const CheckCircle = createIcon("check-circle");
export const CheckCircle2 = createIcon("check-circle");
export const ChevronDown = createIcon("chevron-down");
export const ChevronDownIcon = createIcon("chevron-down");
export const ChevronLeft = createIcon("chevron-left");
export const ChevronLeftIcon = createIcon("chevron-left");
export const ChevronRight = createIcon("chevron-right");
export const ChevronRightIcon = createIcon("chevron-right");
export const ChevronUp = createIcon("chevron-up");
export const Circle = createIcon("check-circle");
export const CircleDot = createIcon("telemetry");
export const Clock = createIcon("monitoring");
export const CloudCog = createIcon("network");
export const Cpu = createIcon("compute");
export const CircuitBoard = createIcon("compute");
export const Database = createIcon("storage");
export const ExternalLink = createIcon("external-link");
export const FileText = createIcon("data");
export const Gauge = createIcon("monitoring");
export const GitBranch = createIcon("automation");
export const Globe2 = createIcon("regional");
export const GripVertical = createIcon("grip");
export const Home = createIcon("datacenter");
export const Layers = createIcon("datacenter");
export const Leaf = createIcon("sustainability");
export const MapPin = createIcon("regional");
export const Menu = createIcon("menu");
export const MessageCircle = createIcon("message");
export const Minus = createIcon("minus");
export const MoreHorizontal = createIcon("grip");
export const Network = createIcon("network");
export const PanelLeft = createIcon("menu");
export const Pause = createIcon("pause");
export const Play = createIcon("play");
export const PlayCircle = createIcon("automation");
export const Radio = createIcon("network");
export const RotateCcw = createIcon("refresh");
export const Scan = createIcon("monitoring");
export const Search = createIcon("search");
export const Send = createIcon("send");
export const Server = createIcon("datacenter");
export const ShieldAlert = createIcon("security");
export const ShieldCheck = createIcon("security");
export const Snowflake = createIcon("cooling");
export const Sparkles = createIcon("intelligence");
export const TrendingUp = createIcon("analytics");
export const Users = createIcon("users");
export const X = createIcon("close");
export const Zap = createIcon("energy");
