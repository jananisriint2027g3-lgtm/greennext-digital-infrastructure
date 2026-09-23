import { createFileRoute } from "@tanstack/react-router";
import { PAGES_CONTENT } from "../../data/pagesContent";
import { PageTemplate } from "../../components/templates/PageTemplate";

export const Route = createFileRoute("/about/$slug")({
  head: ({ params }) => {
    const key = `about/${params.slug}`;
    const page = PAGES_CONTENT[key];
    return {
      meta: [
        { title: `${page?.title || "About"} | GreenNext` },
        {
          name: "description",
          content: page?.intro || "GreenNext digital infrastructure initiative.",
        },
      ],
    };
  },
  component: AboutSubmenuPage,
});

function AboutSubmenuPage() {
  const { slug } = Route.useParams();
  const key = `about/${slug}`;
  const page = PAGES_CONTENT[key];

  if (!page) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center bg-[#070A0E] text-white p-6">
        <div className="text-center max-w-md">
          <h2 className="text-xl font-bold mb-2">Page Not Found</h2>
          <p className="text-sm text-[#94A3B8] mb-6">
            The requested about page could not be located.
          </p>
          <a
            href="/about"
            className="px-4 py-2 rounded bg-[#10B981] text-[#070A0E] text-xs font-semibold"
          >
            Return to About Overview
          </a>
        </div>
      </div>
    );
  }

  return <PageTemplate data={page} />;
}
