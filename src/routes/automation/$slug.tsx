import { createFileRoute } from "@tanstack/react-router";
import { PAGES_CONTENT } from "../../data/pagesContent";
import { PageTemplate } from "../../components/templates/PageTemplate";
import { AutomationWorkflow } from "../../components/home/AutomationWorkflow";

export const Route = createFileRoute("/automation/$slug")({
  head: ({ params }) => {
    const key = `automation/${params.slug}`;
    const page = PAGES_CONTENT[key];
    return {
      meta: [
        { title: `${page?.title || "Automation"} | GreenNext` },
        { name: "description", content: page?.intro || "GreenNext intelligent automation." },
      ],
    };
  },
  component: AutomationSubmenuPage,
});

function AutomationSubmenuPage() {
  const { slug } = Route.useParams();
  const key = `automation/${slug}`;
  const page = PAGES_CONTENT[key];

  if (!page) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center bg-[#070A0E] text-white p-6">
        <div className="text-center max-w-md">
          <h2 className="text-xl font-bold mb-2">Page Not Found</h2>
          <p className="text-sm text-[#94A3B8] mb-6">
            The requested automation page could not be located.
          </p>
          <a
            href="/automation"
            className="px-4 py-2 rounded bg-[#10B981] text-[#070A0E] text-xs font-semibold"
          >
            Return to Automation Overview
          </a>
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageTemplate data={page} />
      {slug === "monitoring" && (
        <section className="max-w-[1340px] mx-auto px-4 sm:px-6 lg:px-8 pb-16">
          <AutomationWorkflow />
        </section>
      )}
    </div>
  );
}
