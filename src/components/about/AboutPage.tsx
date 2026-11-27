import {
  Server,
  Cpu,
  Leaf,
  ShieldCheck,
  Lightbulb,
  Users,
  Lock,
  Layers,
  ArrowRight,
  Compass,
  Sparkles,
} from "lucide-react";
import { InternalLink } from "../common/InternalLink";
import { LongFormCta } from "../common/CtaBlock";
import {
  BOARD_OF_DIRECTORS,
  CORE_VALUES,
  GROUP_GLANCE_STATS,
  LEGACY_HIGHLIGHTS,
  MISSION_THEMES,
  TRUSTED_CUSTOMERS,
  type CoreValue,
} from "../../data/aboutData";
import { StatCounter } from "./StatCounter";
import { DirectorCard } from "./DirectorCard";
import { CustomerLogoGrid } from "./CustomerLogoGrid";

// ---------------------------------------------------------------------------
// Reusable small components
// ---------------------------------------------------------------------------
function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-xs font-mono uppercase tracking-widest text-[#10B981] font-semibold">
      {children}
    </span>
  );
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight leading-tight mt-3 mb-5">
      {children}
    </h2>
  );
}

function IconBadge({ icon: Icon }: { icon: React.ElementType }) {
  return (
    <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-[#10B981]/10 border border-[#10B981]/20 mb-4 shrink-0">
      <Icon size={20} className="text-[#10B981]" aria-hidden="true" />
    </span>
  );
}

const MISSION_THEME_ICONS: Record<string, React.ElementType> = {
  "ai-ready": Server,
  hpc: Cpu,
  "secure-resilient": ShieldCheck,
  scalable: Layers,
  sustainable: Leaf,
  "customer-centric": Users,
};

const CORE_VALUE_ICONS: Record<CoreValue["id"], React.ElementType> = {
  innovation: Lightbulb,
  reliability: ShieldCheck,
  security: Lock,
  sustainability: Leaf,
};

// ---------------------------------------------------------------------------
// SECTION 1 — About Us Hero
// ---------------------------------------------------------------------------
function HeroSection() {
  return (
    <section
      id="hero"
      className="relative min-h-[82vh] flex items-center overflow-hidden border-b border-[#1E293B] bg-[#070A0E]"
    >
      {/* Official project facility imagery */}
      <img
        src="/images/datacenter-facility-exterior.jpg"
        alt=""
        aria-hidden="true"
        className="absolute inset-0 w-full h-full object-cover opacity-15 scale-105 blur-[2px] pointer-events-none select-none"
        loading="eager"
        decoding="async"
      />

      {/* Gradient contrast scrim */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#070A0E]/85 via-[#070A0E]/70 to-[#070A0E]" />

      {/* Subtle architectural grid overlay */}
      <div
        className="absolute inset-0 opacity-[0.04] pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(#F8FAFC 1px, transparent 1px), linear-gradient(90deg, #F8FAFC 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />

      <div className="gn-container relative z-10 py-24 sm:py-32">
        <div className="max-w-4xl">
          <Eyebrow>About Us</Eyebrow>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white tracking-tight leading-[1.1] mt-4 mb-6">
            Building India&apos;s <span className="text-[#10B981]">AI Infrastructure Future</span>
          </h1>

          <p className="text-base sm:text-lg text-[#CBD5E1] leading-relaxed max-w-3xl mb-10">
            We are committed to advancing India&apos;s digital transformation through intelligent,
            secure, scalable, and resilient data center infrastructure. Backed by decades of group
            experience and a vision for technological excellence, we aim to build the foundation for
            India&apos;s next generation of AI-powered enterprises.
          </p>

          <div className="flex flex-wrap items-center gap-4">
            <InternalLink
              to="/contact"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-[#10B981] text-[#070A0E] text-sm font-semibold hover:bg-[#34D399] transition-all shadow-lg shadow-[#10B981]/20 hover:shadow-[#10B981]/30"
            >
              Connect With Us <ArrowRight size={15} />
            </InternalLink>
            <InternalLink
              to="/infrastructure"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg border border-[#334155] bg-[#0B0F17]/90 text-[#E2E8F0] text-sm font-semibold hover:border-[#10B981]/50 hover:text-white transition-all"
            >
              Explore Infrastructure <ArrowRight size={15} />
            </InternalLink>
          </div>
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// SECTION 2 — A Legacy of Trust
// ---------------------------------------------------------------------------
function LegacyOfTrustSection() {
  return (
    <section id="legacy" className="py-16 sm:py-24 bg-[#0A0D14] border-b border-[#1E293B]">
      <div className="gn-container">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-start">
          <div className="lg:col-span-7">
            <Eyebrow>Group Heritage</Eyebrow>
            <SectionHeading>A Legacy of Trust</SectionHeading>
            <p className="text-xl sm:text-2xl font-semibold text-white leading-snug mb-5">
              Over four decades of experience, setting industry standards and building lasting
              customer relationships.
            </p>
            <p className="text-base text-[#94A3B8] leading-relaxed mb-4">
              Established in 1985, our group has built its reputation through decades of business
              experience, operational excellence, customer commitment, and continuous evolution.
              Today, we bring this legacy forward into the rapidly evolving world of AI and digital
              infrastructure.
            </p>
            <p className="text-xs text-[#64748B] leading-relaxed">
              Note: The 1985 founding year, 40+ years of experience, and 7,000+ employee figure
              reflect the broader group&apos;s corporate heritage, which supports our dedicated Data
              Center and AI infrastructure business.
            </p>
          </div>

          <div className="lg:col-span-5 grid grid-cols-1 gap-4">
            {LEGACY_HIGHLIGHTS.map((item) => (
              <div
                key={item.label}
                className="transition-colors duration-300 rounded-xl border border-[#1E293B] bg-[#0B0F17] p-5 flex items-center justify-between gap-4 hover:border-[#10B981]/30"
              >
                <div>
                  <span className="block text-xs font-mono uppercase tracking-wider text-[#64748B]">
                    {item.label}
                  </span>
                  <span className="block text-sm text-[#94A3B8] mt-0.5">{item.detail}</span>
                </div>
                <span className="text-xl sm:text-2xl font-bold font-mono text-[#10B981] shrink-0">
                  {item.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// SECTION 3 — Group at a Glance
// ---------------------------------------------------------------------------
function GroupAtAGlanceSection() {
  return (
    <section
      id="group-at-a-glance"
      className="py-16 sm:py-20 bg-[#070A0E] border-b border-[#1E293B]"
    >
      <div className="gn-container">
        <div className="mb-10 max-w-2xl">
          <Eyebrow>Group at a Glance</Eyebrow>
          <SectionHeading>Scale Backed by Decades of Continuity</SectionHeading>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6">
          {GROUP_GLANCE_STATS.map((stat, i) => (
            <StatCounter key={stat.id} stat={stat} delayMs={i * 90} />
          ))}
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// SECTION 4 — Group Leadership – Board of Directors
// ---------------------------------------------------------------------------
function BoardOfDirectorsSection() {
  return (
    <section
      id="board-of-directors"
      className="py-16 sm:py-24 bg-[#0A0D14] border-b border-[#1E293B]"
    >
      <div className="gn-container">
        <div className="mb-10 max-w-3xl">
          <Eyebrow>Group Leadership</Eyebrow>
          <SectionHeading>Group Leadership – Board of Directors</SectionHeading>
          <p className="text-base text-[#94A3B8] leading-relaxed">
            Guided by experienced leadership and a commitment to excellence, our organisation
            continues to strengthen its foundation for the future of digital infrastructure.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {BOARD_OF_DIRECTORS.map((director, i) => (
            <DirectorCard key={director.id} director={director} delayMs={i * 70} />
          ))}
        </div>

        <p className="mt-8 text-xs text-[#64748B] leading-relaxed">
          Profiles reflect group-level leadership as published on the official group website (
          <a
            href="https://www.isisecurity.in/about"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#94A3B8] underline underline-offset-2 hover:text-[#10B981] transition-colors"
          >
            isisecurity.in/about
          </a>
          ).
        </p>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// SECTION 5 — Our Mission
// ---------------------------------------------------------------------------
function MissionSection() {
  return (
    <section id="mission" className="py-16 sm:py-24 bg-[#070A0E] border-b border-[#1E293B]">
      <div className="gn-container">
        <div className="mb-12">
          <Eyebrow>Purpose &amp; Commitment</Eyebrow>
          <SectionHeading>Our Mission</SectionHeading>

          <blockquote className="rounded-2xl border border-[#1E293B] border-l-4 border-l-[#10B981] bg-[#0B0F17] p-6 sm:p-8 max-w-4xl">
            <p className="text-base sm:text-lg text-[#E2E8F0] leading-relaxed">
              &ldquo;To engineer and deliver world-class, AI-ready data center infrastructure that
              empowers businesses to innovate, scale, and thrive. We are committed to providing
              secure, reliable, scalable, and sustainable digital infrastructure through advanced
              technologies, operational excellence, and customer-focused solutions.&rdquo;
            </p>
          </blockquote>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {MISSION_THEMES.map((theme) => {
            const Icon = MISSION_THEME_ICONS[theme.id] ?? Server;
            return (
              <article
                key={theme.id}
                className="transition-colors duration-300 rounded-2xl border border-[#1E293B] bg-[#0B0F17] p-6 hover:border-[#10B981]/30"
              >
                <IconBadge icon={Icon} />
                <h3 className="text-base font-semibold text-white mb-2">{theme.title}</h3>
                <p className="text-sm text-[#94A3B8] leading-relaxed">{theme.description}</p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// SECTION 6 — Our Vision
// ---------------------------------------------------------------------------
function VisionSection() {
  return (
    <section
      id="vision"
      className="py-16 sm:py-24 bg-[#0A0D14] border-b border-[#1E293B] relative overflow-hidden"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-[#10B981]/10 via-transparent to-transparent pointer-events-none" />
      <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-[#10B981]/5 blur-3xl pointer-events-none" />

      <div className="gn-container relative z-10">
        <div className="rounded-2xl border border-[#10B981]/25 bg-gradient-to-br from-[#0B0F17] via-[#0B0F17] to-[#10B981]/5 p-8 sm:p-12 lg:p-14">
          <div className="flex items-center gap-2.5 mb-3">
            <Compass size={16} className="text-[#10B981]" aria-hidden="true" />
            <Eyebrow>Strategic Aspiration</Eyebrow>
          </div>

          <SectionHeading>Our Vision</SectionHeading>

          <p className="text-2xl sm:text-3xl md:text-4xl font-bold text-white leading-tight mb-6 max-w-4xl">
            To become{" "}
            <span className="text-[#10B981]">India&apos;s No. 1 AI Infrastructure Provider</span> by
            building next-generation data center ecosystems that power artificial intelligence,
            high-performance computing, cloud technologies, and India&apos;s digital transformation.
          </p>

          <p className="text-base sm:text-lg text-[#94A3B8] leading-relaxed max-w-3xl mb-6">
            We envision an India empowered by intelligent infrastructure, where innovation,
            reliability, sustainability, and technological excellence create opportunities for
            businesses and communities.
          </p>

          <div className="inline-flex items-center gap-2 rounded-full border border-[#1E293B] bg-[#070A0E]/80 px-4 py-1.5 text-xs font-mono text-[#94A3B8]">
            <Sparkles size={13} className="text-[#10B981]" aria-hidden="true" />
            <span>Long-term strategic direction and national infrastructure ambition</span>
          </div>
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// SECTION 7 — Our Core Values
// ---------------------------------------------------------------------------
function CoreValuesSection() {
  return (
    <section id="values" className="py-16 sm:py-24 bg-[#070A0E] border-b border-[#1E293B]">
      <div className="gn-container">
        <div className="mb-12 max-w-2xl">
          <Eyebrow>Core Principles</Eyebrow>
          <SectionHeading>Our Core Values</SectionHeading>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {CORE_VALUES.map((value) => {
            const Icon = CORE_VALUE_ICONS[value.id];
            return (
              <article
                key={value.id}
                className="transition-colors duration-300 rounded-2xl border border-[#1E293B] bg-[#0B0F17] p-6 hover:border-[#10B981]/30 flex flex-col"
              >
                <IconBadge icon={Icon} />
                <h3 className="text-lg font-semibold text-white mb-2">{value.title}</h3>
                <p className="text-sm text-[#94A3B8] leading-relaxed">{value.description}</p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// SECTION 8 — Our Trusted Partners
// ---------------------------------------------------------------------------
function CustomerBrandSection() {
  return (
    <section id="customers" className="py-16 sm:py-24 bg-[#0A0D14] border-b border-[#1E293B]">
      <div className="gn-container">
        <div className="mb-10 max-w-2xl">
          <Eyebrow>Partnerships</Eyebrow>
          <SectionHeading>Our Trusted Partners</SectionHeading>
        </div>

        <CustomerLogoGrid customers={TRUSTED_CUSTOMERS} />
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// SECTION 9 — Closing Call to Action
// ---------------------------------------------------------------------------
function ClosingCtaSection() {
  return (
    <section id="cta" className="py-10 sm:py-14 bg-[#070A0E]">
      <div className="gn-container">
        <LongFormCta
          eyebrow="Partner With GreenNext"
          title="Powering the Next Generation of Digital Infrastructure"
          copy="Join us as we build the infrastructure foundation for India's AI-powered future."
          primaryAction={{
            label: "Connect With Us",
            path: "/contact",
          }}
          secondaryAction={{
            label: "Explore Infrastructure",
            path: "/infrastructure",
          }}
        />
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Root export
// ---------------------------------------------------------------------------
export function AboutPage() {
  return (
    <main className="bg-[#070A0E] text-white">
      <HeroSection />
      <LegacyOfTrustSection />
      <GroupAtAGlanceSection />
      <BoardOfDirectorsSection />
      <MissionSection />
      <VisionSection />
      <CoreValuesSection />
      <CustomerBrandSection />
      <ClosingCtaSection />
    </main>
  );
}
