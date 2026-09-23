import { createFileRoute } from "@tanstack/react-router";
import { PAGES_CONTENT } from "../../data/pagesContent";
import { PageTemplate } from "../../components/templates/PageTemplate";
import { EnergyFlowModel } from "../../components/home/EnergyFlowModel";

export const Route = createFileRoute("/energy/$slug")({
  head: ({ params }) => {
    const key = `energy/${params.slug}`;
    const page = PAGES_CONTENT[key];
    return {
      meta: [
        { title: `${page?.title || "Energy"} | GreenNext` },
        { name: "description", content: page?.intro || "GreenNext energy efficiency." },
      ],
    };
  },
  component: EnergySubmenuPage,
});

function EnergySubmenuPage() {
  const { slug } = Route.useParams();
  const key = `energy/${slug}`;
  const page = PAGES_CONTENT[key];

  if (!page) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center bg-[#070A0E] text-white p-6">
        <div className="text-center max-w-md">
          <h2 className="text-xl font-bold mb-2">Page Not Found</h2>
          <p className="text-sm text-[#94A3B8] mb-6">
            The requested energy page could not be located.
          </p>
          <a
            href="/energy"
            className="px-4 py-2 rounded bg-[#10B981] text-[#070A0E] text-xs font-semibold"
          >
            Return to Energy Overview
          </a>
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageTemplate data={page} />
      {slug === "optimization" && (
        <section className="max-w-[1340px] mx-auto px-4 sm:px-6 lg:px-8 pb-16">
          <EnergyFlowModel />
        </section>
      )}
    </div>
  );
}
