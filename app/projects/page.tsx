import Link from "next/link";
import { projects } from "@/lib/projects";

export default function ProjectsPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-50">
          Projects
        </h1>
        <p className="text-neutral-700 dark:text-neutral-200">
          A few selected projects from my work around healthcare integrations and
          the personal tools and sites I experiment with on the side.
        </p>
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        {projects.map((project) => (
          <div
            key={project.name}
            className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-50">
                  {project.name}
                </h2>
                <p className="mt-2 text-sm text-neutral-700 dark:text-neutral-200">
                  {project.description}
                </p>
                {project.url ? (
                  <Link
                    href={project.url}
                    className="mt-3 inline-flex text-sm font-semibold text-neutral-900 underline decoration-neutral-300 underline-offset-4 transition hover:decoration-neutral-600 dark:text-neutral-100 dark:decoration-neutral-700 dark:hover:decoration-neutral-400"
                  >
                    View
                  </Link>
                ) : null}
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
    </div>
  );
}
