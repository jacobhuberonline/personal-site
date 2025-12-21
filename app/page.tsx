import Link from "next/link";
import { getPosts } from "../lib/mdx/get-posts";
import { projects } from "@/lib/projects";

const featuredProjects = projects.slice(0, 2);

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
            Software engineer · Healthcare data integrations & API-driven automation
          </p>
        </div>
        <div className="space-y-3">
          <p className="max-w-2xl text-lg text-neutral-700 dark:text-neutral-200">
            I&apos;m a software engineer focused on healthcare data integrations,
            API-driven automation, and modern web tooling. I like turning messy
            data and workflows into predictable, reliable systems.
          </p>
          <p className="max-w-2xl text-sm text-neutral-600 dark:text-neutral-300">
            Most of my side projects revolve around creating and running websites,
            building small tools, and experimenting with ideas that simplify daily
            life or explore new technology.
          </p>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-50">
            Featured Projects
          </h2>
          <Link
            href="/projects"
            className="text-sm font-medium text-neutral-600 transition hover:text-neutral-900 dark:text-neutral-300 dark:hover:text-neutral-50"
          >
            View all
          </Link>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          {featuredProjects.map((project) => (
            <div
              key={project.name}
              className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900"
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
              <div className="mt-4 flex flex-wrap gap-2">
                {project.tech.map((tech) => (
                  <span
                    key={tech}
                    className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium text-neutral-700 dark:bg-neutral-800 dark:text-neutral-200"
                  >
                    {tech}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-50">
            Latest Writing
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
