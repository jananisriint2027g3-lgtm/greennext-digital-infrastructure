import { useState } from "react";
import { ShieldCheck, Lock, Key, Server, Cpu, AlertTriangle, Eye, Terminal } from "lucide-react";

interface SecurityDomain {
  id: string;
  name: string;
  icon: typeof ShieldCheck;
  subtitle: string;
  threatsMitigated: string[];
  controls: {
    label: string;
    detail: string;
    standard: string;
  }[];
  operationalMetrics: {
    label: string;
    value: string;
  }[];
}

const SECURITY_DOMAINS: SecurityDomain[] = [
  {
    id: "silicon",
    name: "Silicon & Hardware Root-of-Trust",
    icon: Cpu,
    subtitle: "Hardware-level immutability from UEFI boot to GPU execution enclaves",
    threatsMitigated: [
      "Malicious firmware implants (BMC / UEFI / NIC)",
      "Host-level memory inspection of LLM model weights",
      "Physical tampering during transit or deployment",
    ],
    controls: [
      {
        label: "Cryptographic Secure Boot",
        detail: "All microcode and OS stages verified against embedded silicon certificates prior to execution.",
        standard: "NIST SP 800-193",
      },
      {
        label: "Confidential GPU Enclaves",
        detail: "Hardware memory encryption isolating multi-tenant AI training jobs and inference parameters.",
        standard: "Confidential Computing Consortium",
      },
      {
        label: "TPM 2.0 Attestation",
        detail: "Cryptographic measurement registers providing remote verifiable proof of boot state integrity.",
        standard: "ISO/IEC 11889",
      },
    ],
    operationalMetrics: [
      { label: "Firmware Signature Coverage (Illustrative Example)", value: "100%" },
      { label: "Hardware Attestation Interval (Illustrative Example)", value: "Every Boot / 6h" },
    ],
  },
  {
    id: "identity",
    name: "Zero Trust Identity & Access (ZTA)",
    icon: Key,
    subtitle: "Strict least-privilege verification across humans, services, and automation workers",
    threatsMitigated: [
      "Credential theft & long-lived static API key leaks",
      "Privilege escalation and unauthorized operational overrides",
      "Lateral movement across facility subsystems",
    ],
    controls: [
      {
        label: "Mutual TLS (mTLS) Everywhere",
        detail: "All internal service-to-service communication mandates bidirectional cryptographic identity verification.",
        standard: "RFC 8446 (TLS 1.3)",
      },
      {
        label: "Ephemeral Key Management",
        detail: "Zero long-lived static keys in memory; access tokens are bounded to 15-minute operational windows.",
        standard: "OAuth 2.1 / SPIFFE",
      },
      {
        label: "Role-Based Access Control (RBAC)",
        detail: "Rigid demarcation between physical facility engineers, network admins, and tenant AI workflows.",
        standard: "NIST SP 800-207",
      },
    ],
    operationalMetrics: [
      { label: "Max Token Lifetime", value: "15 min" },
      { label: "MFA Enforcement (Illustrative Example)", value: "100% Hardware FIDO2" },
    ],
  },
  {
    id: "network",
    name: "Network Protection & Air-Gapping",
    icon: Lock,
    subtitle: "Isolated management planes, high-speed encrypted transit, and DDoS defense",
    threatsMitigated: [
      "SCADA / building management system penetration",
      "Inter-datacenter fiber tap and wiretapping attacks",
      "Volumetric and application-layer DDoS disruptions",
    ],
    controls: [
      {
        label: "Out-of-Band Management (OOBM)",
        detail: "Critical power, cooling, and console networks are physically separated and air-gapped from the public internet.",
        standard: "IEC 62443-3-3",
      },
      {
        label: "Line-Rate Transit Encryption",
        detail: "Hardware-accelerated MACsec encryption across regional inter-hub dark-fiber links (MDU ↔ CJB ↔ TRZ ↔ IXE).",
        standard: "IEEE 802.1AE (MACsec 256)",
      },
      {
        label: "Multi-Terabit DDoS Shielding",
        detail: "Automated BGP Flowspec scrubbing filtering malicious volumetric bursts at regional carrier ingress nodes.",
        standard: "IETF RFC 5575",
      },
    ],
    operationalMetrics: [
      { label: "Regional Interconnect Latency", value: "< 4.5 ms" },
      { label: "DDoS Mitigation Activation", value: "< 800 ms" },
    ],
  },
  {
    id: "data",
    name: "Cryptographic Data Lifecycle",
    icon: Server,
    subtitle: "End-to-end data sanitization, HSM custody, and sovereign data compliance",
    threatsMitigated: [
      "Residual data exposure on decommissioned storage media",
      "Unauthorized snapshot or checkpoint access",
      "Regulatory non-compliance with data residency mandates",
    ],
    controls: [
      {
        label: "AES-256-GCM Storage Encryption",
        detail: "All NVMe high-throughput working tiers and persistent object backups encrypted with unique envelope keys.",
        standard: "FIPS 140-3 Level 3",
      },
      {
        label: "Automated Cryptographic Eradication",
        detail: "Dynamic workload completion triggers zero-fill and crypto-shredding of scratch training checkpoints.",
        standard: "NIST SP 800-88 Rev 1",
      },
      {
        label: "Sovereign Data Governance",
        detail: "Regional residency guarantees ensuring all customer telemetry and models remain within domestic jurisdiction.",
        standard: "India DPDP Act Compliance",
      },
    ],
    operationalMetrics: [
      { label: "Encryption Key Rotation", value: "30 Days (Automated)" },
      { label: "Crypto-Eradication Latency", value: "Instantaneous" },
    ],
  },
  {
    id: "detection",
    name: "Threat Detection & Autonomous Containment",
    icon: Eye,
    subtitle: "Real-time telemetry anomaly classification and hash-chained audit trails",
    threatsMitigated: [
      "Advanced persistent threats (APTs) dwelling undetected",
      "Log tampering and repudiation during forensic reviews",
      "Slow-moving infrastructure reconnaissance",
    ],
    controls: [
      {
        label: "Behavioral Telemetry Anomaly Engine",
        detail: "Continuous machine-learning baseline monitoring power fluctuations, command bursts, and packet abnormalities.",
        standard: "MITRE ATT&CK for Enterprise",
      },
      {
        label: "Immutable Hash-Chained Audit Logs",
        detail: "Administrative actions and access events committed to append-only storage with SHA-256 hash chains.",
        standard: "SOC 2 Type II Non-Repudiation",
      },
      {
        label: "Automated Containment Runbooks",
        detail: "Confirmed high-confidence breaches automatically trigger port isolation and ephemeral credential revocation.",
        standard: "NIST SP 800-61 Rev 2",
      },
    ],
    operationalMetrics: [
      { label: "Mean Time to Detect (MTTD)", value: "< 2 Minutes" },
      { label: "Audit Log Integrity Retention", value: "7 Years Cryptographic" },
    ],
  },
];

export function CybersecurityFramework() {
  const [activeDomainId, setActiveDomainId] = useState(SECURITY_DOMAINS[0]!.id);
  const activeDomain = SECURITY_DOMAINS.find((d) => d.id === activeDomainId) || SECURITY_DOMAINS[0]!;

  return (
    <div className="flex flex-col gap-6">
      {/* Domain Navigation Tabs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
        {SECURITY_DOMAINS.map((domain) => {
          const Icon = domain.icon;
          const isActive = domain.id === activeDomainId;
          return (
            <button
              key={domain.id}
              onClick={() => setActiveDomainId(domain.id)}
              className={`p-3.5 rounded-xl border text-left transition-all flex flex-col justify-between gap-3 ${
                isActive
                  ? "bg-[#10B981]/15 border-[#10B981] text-white shadow-lg shadow-[#10B981]/10"
                  : "bg-[#0B0F17] border-[#1E293B] text-[#94A3B8] hover:bg-[#121824] hover:border-[#334155] hover:text-white"
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <Icon
                  size={20}
                  className={isActive ? "text-[#10B981]" : "text-[#64748B]"}
                />
                <span
                  className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                    isActive ? "bg-[#10B981]/25 text-[#10B981]" : "bg-[#1E293B] text-[#64748B]"
                  }`}
                >
                  Layer 0{SECURITY_DOMAINS.indexOf(domain) + 1}
                </span>
              </div>
              <span className="text-xs font-semibold leading-tight">{domain.name}</span>
            </button>
          );
        })}
      </div>

      {/* Domain Detail Card */}
      <div className="rounded-2xl border border-[#1E293B] bg-[#0E1522] p-6 sm:p-8 shadow-2xl flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#1E293B]">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-[#10B981]/15 border border-[#10B981]/30 flex items-center justify-center text-[#10B981]">
              <activeDomain.icon size={26} />
            </div>
            <div>
              <h4 className="text-lg sm:text-xl font-bold text-white">{activeDomain.name}</h4>
              <p className="text-xs text-[#94A3B8] mt-0.5">{activeDomain.subtitle}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#10B981]/10 border border-[#10B981]/30 text-[11px] font-mono text-[#10B981]">
              <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
              Illustrative Defense Model
            </span>
          </div>
        </div>

        {/* Threats Mitigated & Metrics Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Threats Mitigated (5 Cols) */}
          <div className="lg:col-span-5 rounded-xl border border-[#1E293B] bg-[#070A0E] p-4 sm:p-5 flex flex-col gap-3">
            <span className="text-xs font-mono uppercase tracking-wider text-[#F59E0B] flex items-center gap-1.5">
              <AlertTriangle size={14} />
              Threat Vectors Addressed in Model
            </span>
            <ul className="space-y-2 mt-1">
              {activeDomain.threatsMitigated.map((threat, idx) => (
                <li key={idx} className="flex items-start gap-2 text-xs text-[#CBD5E1] leading-relaxed">
                  <span className="text-[#10B981] mt-0.5 font-bold">✓</span>
                  <span>{threat}</span>
                </li>
              ))}
            </ul>

            <div className="mt-auto pt-4 border-t border-[#1E293B] grid grid-cols-2 gap-3">
              {activeDomain.operationalMetrics.map((metric, idx) => (
                <div key={idx} className="flex flex-col">
                  <span className="text-[10px] text-[#64748B] font-mono uppercase">{metric.label}</span>
                  <span className="text-sm font-bold text-white font-mono mt-0.5">{metric.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Core Controls & Standards (7 Cols) */}
          <div className="lg:col-span-7 flex flex-col gap-3">
            <span className="text-xs font-mono uppercase tracking-wider text-[#10B981] flex items-center gap-1.5">
              <Terminal size={14} />
              Reference Technical Controls & Standards
            </span>
            <div className="grid grid-cols-1 gap-3">
              {activeDomain.controls.map((ctrl, idx) => (
                <div
                  key={idx}
                  className="rounded-xl border border-[#1E293B] bg-[#121824] p-4 flex flex-col gap-1.5 transition-all hover:border-[#334155]"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold text-white">{ctrl.label}</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#1E293B] text-[#94A3B8] shrink-0 border border-[#334155]">
                      {ctrl.standard}
                    </span>
                  </div>
                  <p className="text-xs text-[#94A3B8] leading-relaxed">{ctrl.detail}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
