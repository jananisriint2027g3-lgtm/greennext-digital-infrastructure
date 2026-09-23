import { createFileRoute } from "@tanstack/react-router";
import { SOLUTIONS_DATA } from "../../data/solutions";
import { SolutionPageTemplate } from "../../components/templates/SolutionPageTemplate";

export const Route = createFileRoute("/solutions/$slug")({
  head: ({ params }) => {
    const solution = SOLUTIONS_DATA[params.slug];
    return {
      meta: [
        { title: `${solution?.title || "Solution"} | GreenNext Use Cases` },
        { name: "description", content: solution?.problem || "GreenNext operational use cases." },
      ],
    };
  },
  component: SolutionSubmenuPage,
});

function SolutionSubmenuPage() {
  const { slug } = Route.useParams();
  const solution = SOLUTIONS_DATA[slug];

  if (!solution) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center bg-[#070A0E] text-white p-6">
        <div className="text-center max-w-md">
          <h2 className="text-xl font-bold mb-2">Solution Not Found</h2>
          <p className="text-sm text-[#94A3B8] mb-6">
            The requested use case page could not be located.
          </p>
          <a
            href="/solutions"
            className="px-4 py-2 rounded bg-[#10B981] text-[#070A0E] text-xs font-semibold"
          >
            Return to Solutions Overview
          </a>
        </div>
      </div>
    );
  }

  return <SolutionPageTemplate solution={solution} />;
}
