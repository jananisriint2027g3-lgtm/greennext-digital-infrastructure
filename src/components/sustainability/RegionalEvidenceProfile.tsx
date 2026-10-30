import { REGIONAL_PORTFOLIO } from "../../data/regionalPortfolio";

const STATUS_ORDER = ["Source-reported", "Proposed", "To be confirmed", "Unavailable"] as const;

const STATUS_COLORS: Record<(typeof STATUS_ORDER)[number], string> = {
  "Source-reported": "#10B981",
  Proposed: "#06B6D4",
  "To be confirmed": "#F59E0B",
  Unavailable: "#475569",
};

export function RegionalEvidenceProfile() {
  const rows = REGIONAL_PORTFOLIO.map((location) => {
    const fields = [
      location.land,
      location.buildingArea,
      location.sitePower,
      location.itLoad,
      location.substation,
      location.renewable,
      location.water,
      location.cooling,
      location.pue,
      location.connectivity,
      location.travel,
      location.zoning,
    ];
    const counts = STATUS_ORDER.map(
      (status) => fields.filter((field) => field.status === status).length,
    );
    return { ...location, counts, total: fields.length };
  });

  return (
    <section
      aria-labelledby="regional-evidence-title"
      className="rounded-2xl border border-[#1E293B] bg-[#0B0F17] p-6 shadow-2xl sm:p-8"
    >
      <div className="mb-6 border-b border-[#1E293B] pb-5">
        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#10B981]">
          Regional planning infographic
        </span>
        <h2 id="regional-evidence-title" className="mt-2 text-xl font-bold text-white">
          Evidence profile across the portfolio
        </h2>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-[#94A3B8]">
          Each bar counts the evidence status of 12 planning fields in the existing regional
          portfolio record. It shows data readiness, not infrastructure performance, capacity, or
          project maturity.
        </p>
      </div>

      <div
        className="mb-5 flex flex-wrap gap-x-5 gap-y-2 text-[11px] text-[#94A3B8]"
        aria-label="Evidence status legend"
      >
        {STATUS_ORDER.map((status) => (
          <span key={status} className="inline-flex items-center gap-2">
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: STATUS_COLORS[status] }}
              aria-hidden="true"
            />
            {status}
          </span>
        ))}
      </div>

      <div className="space-y-4">
        {rows.map((row) => (
          <div key={row.id} className="grid gap-2 sm:grid-cols-[110px_1fr_150px] sm:items-center">
            <div>
              <h3 className="text-sm font-semibold text-white">{row.name}</h3>
              <p className="text-[10px] text-[#64748B]">{row.status}</p>
            </div>
            <div
              className="flex h-3 overflow-hidden rounded-full bg-[#1E293B]"
              aria-label={`${row.name}: ${row.counts.join(", ")} fields in legend order`}
            >
              {row.counts.map((count, index) =>
                count > 0 ? (
                  <span
                    key={STATUS_ORDER[index]}
                    style={{
                      width: `${(count / row.total) * 100}%`,
                      backgroundColor: STATUS_COLORS[STATUS_ORDER[index]],
                    }}
                    title={`${STATUS_ORDER[index]}: ${count}`}
                  />
                ) : null,
              )}
            </div>
            <p className="text-right text-[10px] text-[#64748B]">
              {row.total} fields tracked · unavailable retained
            </p>
          </div>
        ))}
      </div>

      <p className="mt-6 text-[11px] leading-relaxed text-[#64748B]">
        Source boundary: normalized reference portfolio records. Source-reported values remain
        subject to site, utility, carrier, and regulatory confirmation.
      </p>
    </section>
  );
}
