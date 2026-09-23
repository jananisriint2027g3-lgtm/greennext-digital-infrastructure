import { createFileRoute } from "@tanstack/react-router";
import { PAGES_CONTENT } from "../../data/pagesContent";
import { PageTemplate } from "../../components/templates/PageTemplate";

export const Route = createFileRoute("/about/")({
  head: () => ({
    meta: [
      { title: "About GreenNext | AI-Driven Infrastructure Initiative" },
      {
        name: "description",
        content:
          "GreenNext brings together infrastructure intelligence, energy efficiency, intelligent automation, and regional digital infrastructure across South India.",
      },
    ],
  }),
  component: AboutIndexPage,
});

function AboutIndexPage() {
  const content = PAGES_CONTENT["about"];
  return <PageTemplate data={content} />;
}
