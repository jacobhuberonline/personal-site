import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Website Services",
  description:
    "Professional websites, landing pages, and small web tools for small businesses and service providers.",
};

const services = [
  {
    title: "Business websites",
    description:
      "Clean, mobile-friendly sites that explain what you do, show credibility, and make it easy for visitors to contact you.",
  },
  {
    title: "Landing pages",
    description:
      "Focused pages for a service, campaign, location, or audience, structured around one clear next step.",
  },
  {
    title: "Site refreshes",
    description:
      "Practical improvements to outdated pages, content structure, calls to action, speed, and mobile presentation.",
  },
  {
    title: "Small web tools",
    description:
      "Simple forms, dashboards, automations, and internal tools that support the workflow behind the business.",
  },
];

const process = [
  {
    title: "Clarify",
    description:
      "Define the audience, offer, proof points, pages, and action the site needs to support.",
  },
  {
    title: "Build",
    description:
      "Design and develop a maintainable site with responsive layouts, clear copy, and reliable contact paths.",
  },
  {
    title: "Launch",
    description:
      "Ship the site, review the essentials, and leave you with a practical path for updates.",
  },
];

export default function ServicesPage() {
  return (
    <div className="space-y-10">
      <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px] lg:items-start">
        <div className="space-y-5">
          <div className="space-y-3">
            <h1 className="text-3xl font-bold text-neutral-900 sm:text-4xl dark:text-neutral-50">
              Website Services
            </h1>
            <p className="max-w-3xl text-lg text-neutral-700 dark:text-neutral-200">
              Professional websites and practical web tools for small
              businesses, service providers, and local organizations.
            </p>
            <p className="max-w-3xl text-sm text-neutral-600 dark:text-neutral-300">
              I focus on concise messaging, fast pages, mobile-friendly design,
              and clear next steps so your site supports real business
              conversations.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href="/contact"
              className="inline-flex items-center justify-center rounded-xl bg-neutral-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-neutral-700 dark:bg-neutral-50 dark:text-neutral-950 dark:hover:bg-neutral-200"
            >
              Start a project
            </Link>
            <Link
              href="/projects"
              className="inline-flex items-center justify-center rounded-xl border border-neutral-300 bg-white px-5 py-3 text-sm font-semibold text-neutral-900 transition hover:border-neutral-500 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-50 dark:hover:border-neutral-400"
            >
              See recent work
            </Link>
          </div>
        </div>

        <aside className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
            Best Fit
          </h2>
          <ul className="mt-4 space-y-3 text-sm text-neutral-700 dark:text-neutral-200">
            <li>Small business websites</li>
            <li>Service-based businesses</li>
            <li>Local organizations</li>
            <li>Lean internal workflows</li>
          </ul>
        </aside>
      </section>

      <section className="space-y-4">
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-50">
            What I Can Help With
          </h2>
          <p className="max-w-2xl text-sm text-neutral-600 dark:text-neutral-300">
            The goal is a site that is easy to understand, easy to maintain, and
            built around the way your business actually works.
          </p>
        </div>
        <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
          {services.map((service) => (
            <article
              key={service.title}
              className="grid gap-2 border-b border-neutral-200 p-5 last:border-b-0 sm:grid-cols-[190px_1fr] sm:gap-6 dark:border-neutral-800"
            >
              <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-50">
                {service.title}
              </h3>
              <p className="text-sm text-neutral-700 dark:text-neutral-200">
                {service.description}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-50">
          Simple Process
        </h2>
        <div className="grid gap-5 md:grid-cols-3">
          {process.map((step, index) => (
            <article
              key={step.title}
              className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900"
            >
              <div className="text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                Step {index + 1}
              </div>
              <h3 className="mt-3 text-lg font-semibold text-neutral-900 dark:text-neutral-50">
                {step.title}
              </h3>
              <p className="mt-2 text-sm text-neutral-700 dark:text-neutral-200">
                {step.description}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="rounded-xl border border-neutral-900 bg-neutral-900 p-6 text-white shadow-sm dark:border-neutral-700 dark:bg-neutral-50 dark:text-neutral-950">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <h2 className="text-xl font-semibold">
              Need a more useful website?
            </h2>
            <p className="max-w-2xl text-sm text-neutral-200 dark:text-neutral-700">
              Send a short note with your business, current site if you have
              one, and what you want the site to help with.
            </p>
          </div>
          <Link
            href="/contact"
            className="inline-flex shrink-0 items-center justify-center rounded-xl bg-white px-5 py-3 text-sm font-semibold text-neutral-900 transition hover:bg-neutral-200 dark:bg-neutral-900 dark:text-white dark:hover:bg-neutral-700"
          >
            Contact Jacob
          </Link>
        </div>
      </section>
    </div>
  );
}
