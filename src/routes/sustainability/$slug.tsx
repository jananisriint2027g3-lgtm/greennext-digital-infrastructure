import { createFileRoute } from "@tanstack/react-router";
import { PAGES_CONTENT } from "../../data/pagesContent";
import { PageTemplate } from "../../components/templates/PageTemplate";

export const Route = createFileRoute("/sustainability/$slug")({
  head: ({ params }) => {
    const key = `sustainability/${params.slug}`;
    const page = PAGES_CONTENT[key];
    return {
      meta: [
        { title: `${page?.title || "Sustainability"} | GreenNext` },
        { name: "description", content: page?.intro || "GreenNext sustainability principles." },
      ],
    };
  },
  component: SustainabilitySubmenuPage,
});

function SustainabilitySubmenuPage() {
  const { slug } = Route.useParams();
  const key = `sustainability/${slug}`;
  const page = PAGES_CONTENT[key];

  if (!page) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center bg-[#070A0E] text-white p-6">
        <div className="text-center max-w-md">
          <h2 className="text-xl font-bold mb-2">Page Not Found</h2>
          <p className="text-sm text-[#94A3B8] mb-6">
            The requested sustainability page could not be located.
          </p>
          <a
            href="/sustainability"
            className="px-4 py-2 rounded bg-[#10B981] text-[#070A0E] text-xs font-semibold"
          >
            Return to Sustainability Overview
          </a>
        </div>
      </div>
    );
  }

  return <PageTemplate data={page} />;
}
