import { Handshake } from "lucide-react";
import type { CustomerLogo } from "../../data/aboutData";

interface CustomerLogoGridProps {
  customers: CustomerLogo[];
}

export function CustomerLogoGrid({ customers }: CustomerLogoGridProps) {
  if (customers.length === 0) {
    return (
      <div className="relative overflow-hidden rounded-2xl border border-[#1E293B] bg-gradient-to-br from-[#0B0F17] via-[#0B0F17] to-[#10B981]/5 p-8 sm:p-12">
        <div
          className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{
            backgroundImage:
              "linear-gradient(#F8FAFC 1px, transparent 1px), linear-gradient(90deg, #F8FAFC 1px, transparent 1px)",
            backgroundSize: "36px 36px",
          }}
        />

        <div className="relative z-10 flex flex-col items-center text-center max-w-2xl mx-auto">
          <span className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#10B981]/10 border border-[#10B981]/25 mb-5">
            <Handshake size={22} className="text-[#10B981]" aria-hidden="true" />
          </span>

          <span className="inline-flex items-center gap-2 rounded-full border border-[#10B981]/30 bg-[#10B981]/10 px-3.5 py-1 text-[11px] font-mono uppercase tracking-widest text-[#34D399] font-semibold mb-4">
            <span className="h-1.5 w-1.5 rounded-full bg-[#10B981]" aria-hidden="true" />
            Coming Soon
          </span>

          <h3 className="text-2xl sm:text-3xl font-bold text-white tracking-tight mb-4">
            Building Partnerships. Powering the Future.
          </h3>

          <p className="text-sm sm:text-base text-[#94A3B8] leading-relaxed mb-5">
            We look forward to showcasing the organisations and brands that join us in advancing
            India&apos;s AI and digital infrastructure ecosystem.
          </p>

          <p className="text-xs font-mono text-[#64748B]">
            Our partner and customer showcase is currently being prepared.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
      {customers.map((customer) => {
        const card = (
          <div className="aspect-[16/10] flex items-center justify-center rounded-xl border border-[#1E293B] bg-[#0B0F17] p-4 hover:border-[#10B981]/35 hover:bg-[#121824] transition-colors">
            <img
              src={customer.logoSrc}
              alt={customer.alt}
              className="max-h-12 max-w-full w-auto h-auto object-contain"
              loading="lazy"
              decoding="async"
            />
          </div>
        );

        if (customer.href) {
          return (
            <a
              key={customer.id}
              href={customer.href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={customer.name}
              className="block rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#10B981]"
            >
              {card}
            </a>
          );
        }

        return <div key={customer.id}>{card}</div>;
      })}
    </div>
  );
}
