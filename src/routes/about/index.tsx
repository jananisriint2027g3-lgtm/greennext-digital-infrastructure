import { createFileRoute } from "@tanstack/react-router";
import { AboutPage } from "../../components/about/AboutPage";

export const Route = createFileRoute("/about/")({
  head: () => ({
    meta: [
      {
        title: "About Us | Building India's AI Infrastructure Future | GreenNext",
      },
      {
        name: "description",
        content:
          "Backed by a group legacy established in 1985 with 40+ years of experience and 7,000+ employees, GreenNext is building intelligent, secure, scalable, and sustainable AI and data center infrastructure in India.",
      },
    ],
  }),
  component: AboutPage,
});
