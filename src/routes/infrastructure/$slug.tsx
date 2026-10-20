import { createFileRoute, notFound } from "@tanstack/react-router";
import { PAGES_CONTENT } from "../../data/pagesContent";
import { PageTemplate } from "../../components/templates/PageTemplate";
import { SevenLayerStack } from "../../components/home/SevenLayerStack";
import { CybersecurityFramework } from "../../components/infrastructure/CybersecurityFramework";

export const Route = createFileRoute("/infrastructure/$slug")({
  head: ({ params }) => {
    const key = `infrastructure/${params.slug}`;
    const page = PAGES_CONTENT[key];
    return {
      meta: [
        { title: `${page?.title || "Infrastructure"} | GreenNext` },
        { name: "description", content: page?.intro || "GreenNext infrastructure systems." },
      ],
    };
  },
  loader: ({ params }) => {
    if (!PAGES_CONTENT[`infrastructure/${params.slug}`]) throw notFound();
  },
  component: InfrastructureSubmenuPage,
});

function InfrastructureSubmenuPage() {
  const { slug } = Route.useParams();
  const key = `infrastructure/${slug}`;
  const page = PAGES_CONTENT[key];

  if (!page) {
    throw notFound();
  }

  return (
    <div>
      <PageTemplate data={page} />
      {slug === "architecture" && (
        <section className="max-w-[1340px] mx-auto px-4 sm:px-6 lg:px-8 pb-16">
          <div className="rounded-2xl border border-[#1E293B] bg-[#0B0F17] p-6 sm:p-8 lg:p-10 shadow-2xl">
            <div className="mb-6">
              <span className="text-xs font-mono uppercase tracking-widest text-[#10B981] font-semibold">
                Interactive Model
              </span>
              <h3 className="text-xl sm:text-2xl font-bold text-white mt-1">
                7-Layer Stack Visual Inspector
              </h3>
            </div>
            <SevenLayerStack />
          </div>
        </section>
      )}
      {slug === "cybersecurity" && (
        <section className="max-w-[1340px] mx-auto px-4 sm:px-6 lg:px-8 pb-16">
          <div className="rounded-2xl border border-[#1E293B] bg-[#0B0F17] p-6 sm:p-8 lg:p-10 shadow-2xl">
            <div className="mb-6">
              <span className="text-xs font-mono uppercase tracking-widest text-[#10B981] font-semibold">
                Interactive Model
              </span>
              <h3 className="text-xl sm:text-2xl font-bold text-white mt-1">
                Zero-Trust Defense-in-Depth Visual Inspector
              </h3>
              <p className="text-xs text-[#94A3B8] mt-1">
                Select a domain to inspect enforced security controls, mitigated threats, and operational benchmarks.
              </p>
            </div>
            <CybersecurityFramework />
          </div>
        </section>
      )}
    </div>
  );
}
