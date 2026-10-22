import { createFileRoute, notFound } from "@tanstack/react-router";
import { PAGES_CONTENT } from "../../data/pagesContent";
import { PageTemplate } from "../../components/templates/PageTemplate";

export const Route = createFileRoute("/icp/$slug")({
  head: ({ params }) => {
    const key = `icp/${params.slug}`;
    const page = PAGES_CONTENT[key];
    return {
      meta: [
        { title: `${page?.title || "Ideal Customer Profile"} | GreenNext` },
        {
          name: "description",
          content: page?.intro || "GreenNext customer profile and infrastructure qualification.",
        },
      ],
    };
  },
  loader: ({ params }) => {
    if (!PAGES_CONTENT[`icp/${params.slug}`]) throw notFound();
  },
  component: IcpSubmenuPage,
});

function IcpSubmenuPage() {
  const { slug } = Route.useParams();
  const key = `icp/${slug}`;
  const page = PAGES_CONTENT[key];

  if (!page) {
    throw notFound();
  }

  return (
    <div className="w-full bg-[#070A0E] text-white">
      <PageTemplate data={page} />
    </div>
  );
}
