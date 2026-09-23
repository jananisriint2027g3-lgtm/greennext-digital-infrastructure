import { createFileRoute } from "@tanstack/react-router";
import { PAGES_CONTENT } from "../../data/pagesContent";
import { PageTemplate } from "../../components/templates/PageTemplate";
import { SevenLayerStack } from "../../components/home/SevenLayerStack";

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
  component: InfrastructureSubmenuPage,
});

function InfrastructureSubmenuPage() {
  const { slug } = Route.useParams();
  const key = `infrastructure/${slug}`;
  const page = PAGES_CONTENT[key];

  if (!page) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center bg-[#070A0E] text-white p-6">
        <div className="text-center max-w-md">
          <h2 className="text-xl font-bold mb-2">Page Not Found</h2>
          <p className="text-sm text-[#94A3B8] mb-6">
            The requested infrastructure page could not be located.
          </p>
          <a
            href="/infrastructure"
            className="px-4 py-2 rounded bg-[#10B981] text-[#070A0E] text-xs font-semibold"
          >
            Return to Infrastructure Overview
          </a>
        </div>
      </div>
    );
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
    </div>
  );
}
