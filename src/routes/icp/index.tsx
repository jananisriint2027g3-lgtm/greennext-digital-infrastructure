import { createFileRoute } from "@tanstack/react-router";
import { PAGES_CONTENT } from "../../data/pagesContent";
import { PageTemplate } from "../../components/templates/PageTemplate";
import { CustomerFitFramework } from "../../components/icp/CustomerFitFramework";
import { LongFormCta } from "../../components/common/CtaBlock";

export const Route = createFileRoute("/icp/")({
  head: () => ({
    meta: [
      { title: "Industries & Qualification Framework | GreenNext" },
      {
        name: "description",
        content:
          "Discover how GreenNext digital infrastructure advisory aligns with data center operators, AI hyperscalers, enterprise edge teams, and sustainability leaders.",
      },
    ],
  }),
  component: IcpIndexPage,
});

function IcpIndexPage() {
  const content = PAGES_CONTENT["icp"]!;
  return (
    <div className="w-full bg-[#070A0E] text-white">
      <PageTemplate data={content} showCta={false} />
      <section className="max-w-[1340px] mx-auto px-4 sm:px-6 lg:px-8 pb-16 space-y-12">
        <CustomerFitFramework />
        <LongFormCta
          eyebrow="Direct Technical Consultation"
          title="Ready to Review Your Facility Specifications?"
          copy="Connect with GreenNext infrastructure architects to evaluate power delivery, rack cooling containment, and regional site feasibility."
          primaryAction={{
            label: "Schedule Technical Discovery",
            path: "/contact",
          }}
          secondaryAction={{
            label: "Explore Energy Calculator",
            path: "/solutions/energy-calculator",
          }}
        />
      </section>
    </div>
  );
}
