import { createFileRoute } from "@tanstack/react-router";
import { PAGES_CONTENT } from "../../data/pagesContent";
import { PageTemplate } from "../../components/templates/PageTemplate";

export const Route = createFileRoute("/sustainability/")({
  head: () => ({
    meta: [
      { title: "Sustainability | GreenNext Digital Infrastructure" },
      {
        name: "description",
        content:
          "Digital growth without ignoring resource efficiency. Energy-aware infrastructure, efficient cooling, and resource optimization across South India.",
      },
    ],
  }),
  component: SustainabilityIndexPage,
});

function SustainabilityIndexPage() {
  const content = PAGES_CONTENT["sustainability"];
  return <PageTemplate data={content} />;
}
