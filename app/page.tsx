import Link from "next/link";
import { getPosts } from "../lib/mdx/get-posts";
import { projects } from "@/lib/projects";

const featuredProjects = projects.slice(0, 4);

const services = [
  {
    title: "Business websites",
    description:
      "Clear, mobile-friendly sites for small businesses, service providers, and local organizations that need to look current and be easy to contact.",
  },
  {
    title: "Service pages and landing pages",
    description:
      "Focused pages for a specific offer, location, campaign, or audience, with copy and structure built around the action you want visitors to take.",
  },
  {
    title: "Portfolio and content structure",
    description:
      "Project galleries, journals, FAQs, resource pages, and other content systems that make it easier to explain your work and keep the site useful.",
  },
  {
    title: "Small web tools",
    description:
      "Practical forms, dashboards, automations, and internal tools when a standard brochure site is not enough for the workflow behind the business.",
  },
];

const formatDate = (date: string) =>
  date
    ? new Date(date).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "—";

export default async function HomePage() {
  const posts = await getPosts();
  const latestPosts = posts.slice(0, 3);

  return (
    <div className="space-y-12">
      <section className="space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-neutral-900 sm:text-4xl dark:text-neutral-50">
            Jacob
          </h1>
          <p className="text-sm font-semibold tracking-wide text-neutral-500">
            Websites, web tools, and automation for businesses
          </p>
        </div>
        <div className="space-y-3">
          <p className="max-w-2xl text-lg text-neutral-700 dark:text-neutral-200">
            I build practical websites for small businesses, service providers,
            and community organizations that need a cleaner way to show up
            online and turn visitors into real conversations.
          </p>
          <p className="max-w-2xl text-sm text-neutral-600 dark:text-neutral-300">
            My background is software engineering, healthcare data integrations,
            and automation, so I can help with both the public website and the
            behind-the-scenes workflows that make a business easier to run.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Link
            href="/contact"
            className="inline-flex items-center justify-center rounded-xl bg-neutral-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-neutral-700 dark:bg-neutral-50 dark:text-neutral-950 dark:hover:bg-neutral-200"
          >
            Start a website project
          </Link>
          <Link
            href="/projects"
            className="inline-flex items-center justify-center rounded-xl border border-neutral-300 bg-white px-5 py-3 text-sm font-semibold text-neutral-900 transition hover:border-neutral-500 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-50 dark:hover:border-neutral-400"
          >
            See recent work
          </Link>
        </div>
      </section>

      <section id="services" className="space-y-4 scroll-mt-24">
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-50">
            Website Services
          </h2>
          <p className="max-w-2xl text-sm text-neutral-600 dark:text-neutral-300">
            I help with the parts most business owners need first: a site that
            explains what you do, shows proof, works well on phones, and gives
            people a clear next step.
          </p>
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          {services.map((service) => (
            <div
              key={service.title}
              className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900"
            >
              <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-50">
                {service.title}
              </h3>
              <p className="mt-2 text-sm text-neutral-700 dark:text-neutral-200">
                {service.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-50">
            Recent Website Work
          </h2>
          <Link
            href="/projects"
            className="text-sm font-medium text-neutral-600 transition hover:text-neutral-900 dark:text-neutral-300 dark:hover:text-neutral-50"
          >
            View all
          </Link>
        </div>
        <p className="max-w-2xl text-sm text-neutral-600 dark:text-neutral-300">
          A few examples of websites and web products I&apos;ve built, from
          service businesses to training programs and custom tools.
        </p>
        <div className="grid gap-6 md:grid-cols-2">
          {featuredProjects.map((project) => (
            <div
              key={project.name}
              className="flex h-full flex-col rounded-xl border border-neutral-200 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-50">
                    {project.name}
                  </h3>
                  <p className="mt-2 text-sm text-neutral-700 dark:text-neutral-200">
                    {project.description}
                  </p>
                </div>
              </div>
              <div className="mt-auto flex flex-col gap-3 pt-4 md:flex-row md:items-center md:justify-between">
                <div className="flex flex-wrap gap-2">
                  {project.tech.map((tech) => (
                    <span
                      key={tech}
                      className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium text-neutral-700 dark:bg-neutral-800 dark:text-neutral-200"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
                {project.url ? (
                  <Link
                    href={project.url}
                    className="inline-flex text-sm font-semibold text-neutral-900 underline decoration-neutral-300 underline-offset-4 transition hover:decoration-neutral-600 dark:text-neutral-100 dark:decoration-neutral-700 dark:hover:decoration-neutral-400"
                  >
                    View
                  </Link>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-50">
            Writing & Notes
          </h2>
          <Link
            href="/blog"
            className="text-sm font-medium text-neutral-600 transition hover:text-neutral-900 dark:text-neutral-300 dark:hover:text-neutral-50"
          >
            View blog
          </Link>
        </div>
        <div className="space-y-4">
          {latestPosts.length === 0 && (
            <p className="text-sm text-neutral-600 dark:text-neutral-300">
              No posts yet. Content will appear here once published.
            </p>
          )}
          {latestPosts.map((post) => (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
              className="block rounded-xl border border-neutral-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-neutral-800 dark:bg-neutral-900"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-50">
                  {post.title}
                </h3>
                <span className="text-xs text-neutral-500 dark:text-neutral-400">
                  {formatDate(post.date)}
                </span>
              </div>
              <p className="mt-2 text-sm text-neutral-700 dark:text-neutral-200">
                {post.summary}
              </p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
