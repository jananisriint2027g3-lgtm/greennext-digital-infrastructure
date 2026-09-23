import { createFileRoute } from "@tanstack/react-router";
import { REGIONS_DATA } from "../../data/regions";
import { PAGES_CONTENT } from "../../data/pagesContent";
import { RegionalPageTemplate } from "../../components/templates/RegionalPageTemplate";
import { PageTemplate } from "../../components/templates/PageTemplate";
import { RegionalExplorer } from "../../components/home/RegionalExplorer";
import { DashboardPreview } from "../../components/home/DashboardPreview";

export const Route = createFileRoute("/regions/$slug")({
  head: ({ params }) => {
    const region = REGIONS_DATA[params.slug];
    if (region) {
      return {
        meta: [
          { title: `${region.name} (${region.code}) | Regional Infrastructure | GreenNext` },
          { name: "description", content: region.intro },
        ],
      };
    }

    const key = `regions/${params.slug}`;
    const page = PAGES_CONTENT[key];
    return {
      meta: [
        { title: `${page?.title || "Regions"} | GreenNext` },
        {
          name: "description",
          content: page?.intro || "GreenNext regional digital infrastructure.",
        },
      ],
    };
  },
  component: RegionsSubmenuPage,
});

function RegionsSubmenuPage() {
  const { slug } = Route.useParams();

  // If this is a specific city dossier (Madurai, Coimbatore, Trichy, Mangalore)
  if (REGIONS_DATA[slug]) {
    return <RegionalPageTemplate region={REGIONS_DATA[slug]} />;
  }

  // If this is the regional overview page
  const key = `regions/${slug}`;
  const page = PAGES_CONTENT[key];

  if (!page) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center bg-[#070A0E] text-white p-6">
        <div className="text-center max-w-md">
          <h2 className="text-xl font-bold mb-2">Region Not Found</h2>
          <p className="text-sm text-[#94A3B8] mb-6">
            The requested regional infrastructure page could not be located.
          </p>
          <a
            href="/regions"
            className="px-4 py-2 rounded bg-[#10B981] text-[#070A0E] text-xs font-semibold"
          >
            Return to Regional Overview
          </a>
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageTemplate data={page} />
      <section className="max-w-[1340px] mx-auto px-4 sm:px-6 lg:px-8 space-y-16 pb-16">
        <RegionalExplorer />
        <DashboardPreview />
      </section>
    </div>
  );
}
