import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPostBySlug } from "../../../lib/mdx/get-post-by-slug";
import { getPosts } from "../../../lib/mdx/get-posts";
import Image from "next/image";
import Link from "next/link";

const formatDate = (date: string) =>
  date
    ? new Date(date).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : "—";

type BlogPageProps = {
  params: { slug: string } | Promise<{ slug: string }>;
};

export const dynamicParams = true;
const defaultOgImage = "/images/default-social.png";

export async function generateStaticParams() {
  const posts = await getPosts();
  return posts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({
  params,
}: BlogPageProps): Promise<Metadata> {
  const resolved = await params;
  const slug = typeof resolved === "object" ? resolved.slug : resolved;
  const post = await getPostBySlug(slug);

  if (!post || !post.meta.published) {
    return {
      title: "Post not found",
    };
  }

  return {
    title: `${post.meta.title} | Blog`,
    description: post.meta.summary,
    openGraph: {
      images: [
        {
          url: post.meta.image || defaultOgImage,
          width: 1200,
          height: 630,
          alt: post.meta.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      images: [post.meta.image || defaultOgImage],
    },
  };
}

export default async function BlogPostPage({ params }: BlogPageProps) {
  const resolved = await params;
  const slug = typeof resolved === "object" ? resolved.slug : resolved;
  const post = await getPostBySlug(slug);

  if (!post || !post.meta.published) {
    notFound();
  }

  return (
    <article className="prose prose-neutral max-w-none dark:prose-invert">
      <header className="mb-8">
        <p className="text-sm font-medium uppercase tracking-wide text-neutral-500">
          Blog Post
        </p>
        <h1 className="mt-2 text-3xl font-bold text-neutral-900 dark:text-neutral-50">
          {post.meta.title}
        </h1>
        <p className="text-sm text-neutral-600">{formatDate(post.meta.date)}</p>
        <div className="not-prose mt-6 overflow-hidden rounded-2xl border border-neutral-200/70 bg-neutral-100/40 dark:border-neutral-800/70 dark:bg-neutral-900/60">
          <Image
            src={post.meta.image || defaultOgImage}
            alt={post.meta.title}
            width={1200}
            height={630}
            className="h-auto w-full object-cover"
            priority
          />
        </div>
      </header>
      <div
        className="prose prose-neutral max-w-none dark:prose-invert"
        dangerouslySetInnerHTML={{ __html: post.content }}
      >
      </div>
      <div className="not-prose mt-10">
        <div className="flex flex-col gap-3 rounded-2xl border border-neutral-200/80 bg-white/80 p-5 shadow-sm dark:border-neutral-800/70 dark:bg-neutral-900/70">
          <p className="text-sm font-semibold uppercase tracking-wide text-neutral-600 dark:text-neutral-300">
            Need a hand?
          </p>
          <p className="text-neutral-800 dark:text-neutral-100">
            I help people set up fast, clear websites, and can build one for you end to end.
            Reach out if you want help getting yours live.
          </p>
          <Link
            href="/contact"
            className="inline-flex w-fit items-center justify-center rounded-lg bg-neutral-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200"
          >
            Contact me
          </Link>
        </div>
      </div>
    </article>
  );
}
