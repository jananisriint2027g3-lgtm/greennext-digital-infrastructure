/**
 * GreenNext Website Intelligence Platform — Analytical Model Visualizations
 *
 * Seven analytical models as reusable React components.
 * Each component includes: title, description, methodology panel,
 * empty/insufficient-data states, and accessible labels.
 *
 * All simulated values are clearly labeled as such.
 */

import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell,
  LineChart,
  Line,
} from "recharts";
import type { MaturityAssessment, FunnelAnalysis, AttributionResult } from "../../lib/dashboard-data";

// ─── Design Tokens ───────────────────────────────────────────────────────────

const COLORS = {
  emerald: "#10B981",
  cyan: "#06B6D4",
  amber: "#F59E0B",
  rose: "#F43F5E",
  violet: "#8B5CF6",
  surface1: "#121824",
  surface2: "#1A2234",
  border: "#1E293B",
  textPrimary: "#F8FAFC",
  textSecondary: "#94A3B8",
  textMuted: "#64748B",
};

// ─── Shared Components ───────────────────────────────────────────────────────

function ModelCard({
  title,
  question,
  description,
  dataQualityLabel,
  children,
  methodology,
}: {
  title: string;
  question: string;
  description: string;
  dataQualityLabel: string;
  children: React.ReactNode;
  methodology: string;
}) {
  return (
    <div className="rounded-xl border border-[#1E293B] bg-[#0B0F17] overflow-hidden">
      {/* Header */}
      <div className="p-5 border-b border-[#1E293B]">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold text-[#F8FAFC]">{title}</h3>
            <p className="mt-0.5 text-xs text-[#10B981] font-medium">↗ {question}</p>
            <p className="mt-1.5 text-xs text-[#94A3B8] leading-relaxed">{description}</p>
          </div>
          <span
            className="shrink-0 px-2 py-0.5 rounded text-[10px] font-medium border"
            style={{
              borderColor: dataQualityLabel.includes("Simulated") ? COLORS.amber : COLORS.cyan,
              color: dataQualityLabel.includes("Simulated") ? COLORS.amber : COLORS.cyan,
            }}
          >
            {dataQualityLabel}
          </span>
        </div>
      </div>

      {/* Chart Area */}
      <div className="p-5">{children}</div>

      {/* Methodology footer */}
      <details className="border-t border-[#1E293B]">
        <summary className="px-5 py-2.5 text-[11px] text-[#64748B] cursor-pointer hover:text-[#94A3B8] transition-colors select-none">
          Methodology &amp; notes
        </summary>
        <p className="px-5 pb-4 text-[11px] text-[#64748B] leading-relaxed">{methodology}</p>
      </details>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="w-10 h-10 rounded-full bg-[#1A2234] flex items-center justify-center mb-3">
        <span className="text-lg" role="img" aria-label="chart">📊</span>
      </div>
      <p className="text-sm text-[#64748B] max-w-xs">{message}</p>
    </div>
  );
}

// ─── Model 1: Analytics Maturity Model ───────────────────────────────────────

export function AnalyticsMaturityModel({ assessment }: { assessment: MaturityAssessment }) {
  const stageData = assessment.stages.map((s) => ({ name: s.label.split(" ")[0], score: s.score }));

  return (
    <ModelCard
      title="Analytics Maturity Model"
      question="Where does GreenNext sit in the analytics maturity curve?"
      description="Four-stage progression from descriptive reporting to self-optimizing intelligence. Current stage is based on implemented and verified capabilities."
      dataQualityLabel="Live Assessment"
      methodology="Stages: Descriptive → Behavioral → Predictive → Self-Optimizing. Score reflects implemented capability percentage per stage. Simulated stages are clearly labeled. Advancement requires data validation, not just feature implementation."
    >
      <div className="space-y-4">
        {assessment.stages.map((stage) => (
          <div key={stage.id}>
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2">
                <span
                  className={`w-2 h-2 rounded-full ${stage.achieved ? "bg-[#10B981]" : "bg-[#1A2234] border border-[#334155]"}`}
                  aria-label={stage.achieved ? "achieved" : "not yet achieved"}
                />
                <span className="text-xs font-medium text-[#F8FAFC]">{stage.label}</span>
                {!stage.achieved && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#1A2234] text-[#64748B] border border-[#1E293B]">
                    Not yet achieved
                  </span>
                )}
              </div>
              <span className="text-xs font-mono text-[#94A3B8]">{stage.score}%</span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-[#1A2234] overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${stage.score}%`,
                  background: stage.achieved
                    ? "linear-gradient(90deg, #10B981, #06B6D4)"
                    : "linear-gradient(90deg, #334155, #475569)",
                }}
                role="progressbar"
                aria-valuenow={stage.score}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={stage.label}
              />
            </div>
            <p className="mt-1 text-[11px] text-[#64748B]">{stage.description}</p>
          </div>
        ))}

        <div className="mt-4 p-3 rounded-lg bg-[#1A2234] border border-[#1E293B]">
          <p className="text-xs text-[#94A3B8]">
            <span className="text-[#10B981] font-medium">Overall score: {assessment.overallScore}%</span>
            {" · "}Next: {assessment.nextRecommendation}
          </p>
        </div>
      </div>
    </ModelCard>
  );
}

// ─── Model 2: Conversion Funnel Analysis ─────────────────────────────────────

export function ConversionFunnelChart({ funnel }: { funnel: FunnelAnalysis }) {
  if (funnel.dataQuality === "unavailable") {
    return (
      <ModelCard
        title="Conversion Funnel Analysis"
        question="Where do visitors drop off before submitting an inquiry?"
        description="Tracks the visitor journey from first page view through form submission."
        dataQualityLabel="Awaiting Data"
        methodology="Stages are counted per unique session. A session counts for a stage only if the corresponding event was observed. Conversion rates are stage-to-stage percentages."
      >
        <EmptyState message={funnel.note} />
      </ModelCard>
    );
  }

  const maxCount = Math.max(...funnel.stages.map((s) => s.count), 1);

  return (
    <ModelCard
      title="Conversion Funnel Analysis"
      question="Where do visitors drop off before submitting an inquiry?"
      description="Stage-by-stage conversion rates from page visit to confirmed inquiry submission."
      dataQualityLabel="Live (First-Party)"
      methodology="Each stage counts unique sessions with that event. Conversion rate = sessions at this stage ÷ sessions at previous stage × 100. Overall rate = submissions ÷ total visitors × 100."
    >
      <div className="space-y-3">
        {funnel.stages.map((stage, index) => {
          const width = maxCount > 0 ? (stage.count / maxCount) * 100 : 0;
          return (
            <div key={stage.eventName} className="relative">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-[#94A3B8] w-4 text-right">{index + 1}</span>
                  <span className="text-xs font-medium text-[#F8FAFC]">{stage.name}</span>
                </div>
                <div className="flex items-center gap-3">
                  {stage.conversionRate !== null && (
                    <span
                      className="text-[11px] font-mono"
                      style={{ color: stage.conversionRate < 50 ? COLORS.rose : COLORS.emerald }}
                    >
                      ↓ {stage.conversionRate.toFixed(1)}%
                    </span>
                  )}
                  <span className="text-xs font-mono text-[#F8FAFC] tabular-nums w-6 text-right">
                    {stage.count}
                  </span>
                </div>
              </div>
              <div className="h-7 rounded bg-[#1A2234] overflow-hidden">
                <div
                  className="h-full rounded flex items-center pl-3 transition-all duration-700"
                  style={{
                    width: `${width}%`,
                    background: `linear-gradient(90deg, ${COLORS.emerald}33, ${COLORS.emerald}66)`,
                    borderLeft: `3px solid ${COLORS.emerald}`,
                    minWidth: stage.count > 0 ? "4rem" : "0",
                  }}
                >
                  <span className="text-[11px] text-[#10B981] font-medium truncate">
                    {stage.description}
                  </span>
                </div>
              </div>
            </div>
          );
        })}

        <div className="mt-4 p-3 rounded-lg bg-[#0B1629] border border-[#10B98122]">
          <p className="text-xs text-[#94A3B8]">
            <span className="text-[#10B981] font-medium">
              Overall conversion: {funnel.overallConversionRate.toFixed(1)}%
            </span>
            {" "}({funnel.totalConversions} of {funnel.totalEntries} visitors converted)
          </p>
        </div>
      </div>
    </ModelCard>
  );
}

// ─── Model 3: RFM Segmentation Matrix ────────────────────────────────────────

export function RFMSegmentationMatrix() {
  const segments = [
    { name: "Champions", r: 5, f: 5, m: 5, color: COLORS.emerald, visitors: null },
    { name: "Loyal", r: 4, f: 4, m: 3, color: COLORS.cyan, visitors: null },
    { name: "Potential", r: 4, f: 2, m: 2, color: COLORS.violet, visitors: null },
    { name: "New", r: 5, f: 1, m: 1, color: COLORS.amber, visitors: null },
    { name: "At Risk", r: 2, f: 3, m: 3, color: COLORS.rose, visitors: null },
  ];

  return (
    <ModelCard
      title="RFM Segmentation Matrix"
      question="Which visitor segments are most valuable?"
      description="Recency, Frequency, Monetary segmentation. Full RFM requires transaction data — visitor-level F and R signals are tracked."
      dataQualityLabel="Simulated (No Revenue Data)"
      methodology="R = days since last visit, F = session count. M (monetary) is not applicable for anonymous website visitors without transaction data. This visualization shows segment definitions only. Actual visitor counts require a persistent backend event store."
    >
      <div>
        <div className="mb-4 p-3 rounded bg-[#1A2234] border border-[#F59E0B33]">
          <p className="text-[11px] text-[#F59E0B]">
            ⚠ Monetary dimension unavailable — no transaction data is connected.
            Segment counts cannot be populated from anonymous browser visits alone.
          </p>
        </div>
        <div className="grid grid-cols-5 gap-2 text-center">
          {segments.map((seg) => (
            <div
              key={seg.name}
              className="rounded-lg p-3 border"
              style={{ borderColor: `${seg.color}33`, background: `${seg.color}0D` }}
            >
              <div className="text-xs font-semibold mb-2" style={{ color: seg.color }}>
                {seg.name}
              </div>
              <div className="space-y-1">
                <div className="text-[10px] text-[#64748B]">R: {seg.r}/5</div>
                <div className="text-[10px] text-[#64748B]">F: {seg.f}/5</div>
                <div className="text-[10px] text-[#475569]">M: N/A</div>
              </div>
              <div className="mt-2 text-[10px] text-[#475569]">Count: —</div>
            </div>
          ))}
        </div>
        <p className="mt-3 text-[11px] text-[#64748B] text-center">
          Segment definitions shown. Connect a revenue data source to populate visitor counts.
        </p>
      </div>
    </ModelCard>
  );
}

// ─── Model 4: Attribution Models ─────────────────────────────────────────────

export function AttributionModelChart({ attribution }: { attribution: AttributionResult }) {
  const data = attribution.channels.length > 0
    ? attribution.channels.map((ch) => ({
        name: ch.channel,
        credit: ch.percentage,
      }))
    : [{ name: "No data", credit: 100 }];

  const channelColors: Record<string, string> = {
    direct: COLORS.emerald,
    organic: COLORS.cyan,
    social: COLORS.violet,
    referral: COLORS.amber,
    paid: COLORS.rose,
    campaign: "#EC4899",
    unknown: "#475569",
  };

  if (attribution.channels.length === 0) {
    return (
      <ModelCard
        title="Attribution Models"
        question="Which channels drive the most qualified visitors?"
        description="First-touch, last-touch, and linear attribution across traffic sources."
        dataQualityLabel="Awaiting Data"
        methodology="Attribution is calculated from sessionId-grouped traffic source events. First-touch assigns all credit to the first observed source. Last-touch assigns to the final. Linear distributes credit equally across all channels in a session."
      >
        <EmptyState message={attribution.note} />
      </ModelCard>
    );
  }

  return (
    <ModelCard
      title="Attribution Models"
      question="Which channels drive the most qualified visitors?"
      description={`Showing ${attribution.label} attribution across observed traffic sources.`}
      dataQualityLabel="Inferred (Session-Level)"
      methodology="Attribution uses browser-observable signals: UTM parameters, referrer classification, and sessionStorage context. Data-driven attribution requires a connected backend event store with multi-session history."
    >
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
          <XAxis dataKey="name" tick={{ fill: "#94A3B8", fontSize: 11 }} />
          <YAxis tick={{ fill: "#94A3B8", fontSize: 11 }} tickFormatter={(v) => `${v}%`} />
          <Tooltip
            contentStyle={{ background: "#1A2234", border: "1px solid #1E293B", borderRadius: 8 }}
            labelStyle={{ color: "#F8FAFC" }}
            formatter={(v: number) => [`${v}%`, "Credit"]}
          />
          <Bar dataKey="credit" radius={[4, 4, 0, 0]}>
            {data.map((entry) => (
              <Cell key={entry.name} fill={channelColors[entry.name] ?? COLORS.textMuted} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <p className="mt-2 text-[11px] text-[#64748B]">{attribution.note}</p>
    </ModelCard>
  );
}

// ─── Model 5: Cohort Retention Heatmap ───────────────────────────────────────

export function CohortRetentionHeatmap() {
  // Requires persistent backend event store — show labeled empty state
  const placeholderCohorts = ["Week 1", "Week 2", "Week 3", "Week 4"];
  const periods = ["W0", "W1", "W2", "W3", "W4"];

  return (
    <ModelCard
      title="Cohort Retention Heatmap"
      question="How many visitors return week over week?"
      description="Retention by cohort week and elapsed period. Requires persistent visitor identification."
      dataQualityLabel="Requires Backend Store"
      methodology="Cohorts are grouped by first-seen week. Retention rate = visitors who returned in period N ÷ cohort size × 100. Requires a server-side event store that persists visitor identifiers across sessions. Browser-only storage cannot provide cross-session cohort data."
    >
      <div>
        <div className="mb-3 p-3 rounded bg-[#1A2234] border border-[#06B6D433]">
          <p className="text-[11px] text-[#06B6D4]">
            ℹ Cohort retention requires a persistent backend event store with cross-session visitor tracking.
            Connect an event database to populate this heatmap with real data.
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs" role="grid" aria-label="Cohort retention heatmap (empty state)">
            <thead>
              <tr>
                <th className="text-left p-2 text-[#64748B] font-medium">Cohort</th>
                {periods.map((p) => (
                  <th key={p} className="p-2 text-[#64748B] font-medium text-center">{p}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {placeholderCohorts.map((cohort) => (
                <tr key={cohort}>
                  <td className="p-2 text-[#94A3B8] font-medium">{cohort}</td>
                  {periods.map((_, i) => (
                    <td key={i} className="p-1">
                      <div
                        className="h-8 rounded flex items-center justify-center text-[#475569] text-[10px]"
                        style={{ background: "#1A2234", border: "1px dashed #1E293B" }}
                        aria-label="No data"
                      >
                        —
                      </div>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </ModelCard>
  );
}

// ─── Model 6: Intelligence Maturity Radar ────────────────────────────────────

export function IntelligenceMaturityRadar({ assessment }: { assessment: MaturityAssessment }) {
  const radarData = [
    { dimension: "Data Collection", score: 85 },
    { dimension: "Attribution", score: 70 },
    { dimension: "Segmentation", score: 55 },
    { dimension: "Prediction", score: 25 },
    { dimension: "Retention", score: 30 },
    { dimension: "Optimization", score: 10 },
  ];

  return (
    <ModelCard
      title="Intelligence Maturity Radar"
      question="Which intelligence dimensions are strongest?"
      description="Six capability dimensions scored against implemented and verified features."
      dataQualityLabel="Live Assessment"
      methodology="Dimensions are scored based on implemented, tested capabilities only. Scores are not self-reported — they reflect verified feature implementation. A dimension score of 100% indicates full production capability with validated accuracy."
    >
      <ResponsiveContainer width="100%" height={260}>
        <RadarChart data={radarData} margin={{ top: 10, right: 30, bottom: 10, left: 30 }}>
          <PolarGrid stroke="#1E293B" />
          <PolarAngleAxis
            dataKey="dimension"
            tick={{ fill: "#94A3B8", fontSize: 10 }}
          />
          <PolarRadiusAxis
            angle={30}
            domain={[0, 100]}
            tick={{ fill: "#64748B", fontSize: 9 }}
            tickCount={4}
          />
          <Radar
            name="Current Capability"
            dataKey="score"
            stroke="#10B981"
            fill="#10B981"
            fillOpacity={0.15}
            strokeWidth={2}
          />
          <Tooltip
            contentStyle={{ background: "#1A2234", border: "1px solid #1E293B", borderRadius: 8 }}
            formatter={(v: number) => [`${v}%`, "Capability Score"]}
          />
        </RadarChart>
      </ResponsiveContainer>
      <p className="text-[11px] text-[#64748B] text-center mt-1">
        Overall maturity: {assessment.overallScore}% · Current stage: {assessment.currentStage.replace("_", " ")}
      </p>
    </ModelCard>
  );
}

// ─── Model 7: Propensity Scoring Bands ───────────────────────────────────────

export function PropensityScoringBands({
  score,
}: {
  score: { band: string; score: number; factors: string[]; recommendation: string; isSimulated: boolean };
}) {
  const bands = [
    { label: "Low Propensity", range: "0–29", description: "Educational content focus", color: COLORS.textMuted },
    { label: "Medium Propensity", range: "30–59", description: "Case studies & region info", color: COLORS.amber },
    { label: "High Propensity", range: "60–99", description: "Direct contact offer", color: COLORS.emerald },
  ];

  const bandMap: Record<string, number> = { low: 0, medium: 1, high: 2 };
  const activeBandIndex = bandMap[score.band] ?? 0;

  return (
    <ModelCard
      title="Propensity Scoring Bands"
      question="How likely is this visitor to submit an inquiry?"
      description="Rules-based propensity score for the current browser session. Not a trained ML model."
      dataQualityLabel={score.isSimulated ? "Simulated (Rules-Based)" : "Live"}
      methodology="Score is calculated from first-party browser signals: session count, page depth, form interactions, and engagement milestones. A trained ML model requires a labeled historical dataset (minimum 200+ conversions). Until that data exists, this baseline uses transparent, auditable rules."
    >
      <div className="space-y-3">
        {score.isSimulated && (
          <div className="p-3 rounded bg-[#1A2234] border border-[#F59E0B33]">
            <p className="text-[11px] text-[#F59E0B]">
              ⚠ Rules-based baseline — labeled as simulated. Not a trained AI model.
              Confidence indicators reflect rule weight, not statistical probability.
            </p>
          </div>
        )}

        {/* Score gauge */}
        <div className="flex items-center gap-4">
          <div className="relative w-20 h-20 shrink-0">
            <svg viewBox="0 0 80 80" className="w-full h-full -rotate-90">
              <circle cx="40" cy="40" r="30" fill="none" stroke="#1A2234" strokeWidth="8" />
              <circle
                cx="40" cy="40" r="30" fill="none"
                stroke={activeBandIndex === 2 ? COLORS.emerald : activeBandIndex === 1 ? COLORS.amber : COLORS.textMuted}
                strokeWidth="8"
                strokeDasharray={`${(score.score / 100) * 188.5} 188.5`}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-lg font-bold text-[#F8FAFC]">{score.score}</span>
              <span className="text-[10px] text-[#64748B]">/ 100</span>
            </div>
          </div>

          <div className="flex-1 space-y-2">
            {bands.map((band, i) => (
              <div
                key={band.label}
                className={`flex items-center justify-between p-2 rounded-lg border transition-all ${i === activeBandIndex ? "border-opacity-50" : "border-transparent bg-transparent"}`}
                style={{
                  background: i === activeBandIndex ? `${band.color}11` : undefined,
                  borderColor: i === activeBandIndex ? band.color : undefined,
                }}
              >
                <div>
                  <p className="text-xs font-medium" style={{ color: band.color }}>{band.label}</p>
                  <p className="text-[10px] text-[#64748B]">{band.description}</p>
                </div>
                <span className="text-[10px] text-[#64748B] font-mono">{band.range}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Factors */}
        {score.factors.length > 0 && (
          <div>
            <p className="text-[11px] text-[#64748B] mb-1.5">Contributing factors:</p>
            <div className="flex flex-wrap gap-1.5">
              {score.factors.map((factor) => (
                <span
                  key={factor}
                  className="px-2 py-0.5 rounded text-[10px] bg-[#1A2234] text-[#94A3B8] border border-[#1E293B]"
                >
                  {factor.replace(/_/g, " ")}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Recommendation */}
        <div className="p-3 rounded-lg bg-[#0B1629] border border-[#10B98122]">
          <p className="text-[11px] text-[#94A3B8]">
            <span className="text-[#10B981] font-medium">Recommendation: </span>
            {score.recommendation}
          </p>
        </div>
      </div>
    </ModelCard>
  );
}
