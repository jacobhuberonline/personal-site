import Image from "next/image";
import Link from "next/link";
import { getPosts } from "../../lib/mdx/get-posts";
import { cn } from "@/lib/utils";

const formatDate = (date: string) =>
  date
    ? new Date(date).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "—";

export default async function BlogIndexPage() {
  const posts = await getPosts();

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-50">
          Blog
        </h1>
        <p className="text-neutral-700 dark:text-neutral-200">
          Notes on building web products, design systems, and developer tools.
        </p>
      </div>

      <div className="space-y-4">
        {posts.length === 0 && (
          <p className="text-sm text-neutral-600 dark:text-neutral-300">
            No posts published yet. Check back soon.
          </p>
        )}
        {posts.map((post) => (
          <Link
            key={post.slug}
            href={`/blog/${post.slug}`}
            className="block overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-neutral-800 dark:bg-neutral-900"
          >
            <div className="flex flex-col gap-3">
              <div className="relative aspect-[16/9] w-full overflow-hidden bg-neutral-100 dark:bg-neutral-800/70">
                {post.image ? (
                  <Image
                    src={post.image}
                    alt={post.title}
                    fill
                    className="object-cover transition duration-300"
                    sizes="(min-width: 1024px) 450px, (min-width: 768px) 50vw, 100vw"
                    priority
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-xs font-medium text-neutral-500 dark:text-neutral-400">
                    No image
                  </div>
                )}
              </div>
              <div className="px-5 pb-5 pt-1">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-50">
                    {post.title}
                  </h2>
                  <span className="text-xs text-neutral-500 dark:text-neutral-400">
                    {formatDate(post.date)}
                  </span>
                </div>
                <p className="mt-2 text-sm text-neutral-700 dark:text-neutral-200">
                  {post.summary}
                </p>
                {post.tags?.length ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {post.tags.map((tag) => (
                      <span
                        key={tag}
                        className={cn(
                          "rounded-full px-3 py-1 text-xs font-medium",
                          "bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-200"
                        )}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
