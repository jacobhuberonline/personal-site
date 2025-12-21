import fs from "fs/promises";
import path from "path";
import matter from "gray-matter";
import { BlogPostMeta } from "./types";

const postsDirectory = path.join(process.cwd(), "content", "posts");

export async function getPosts(): Promise<BlogPostMeta[]> {
  const files = await fs.readdir(postsDirectory);

  const posts = await Promise.all(
    files
      .filter((file) => file.endsWith(".mdx"))
      .map(async (file) => {
        const fullPath = path.join(postsDirectory, file);
        const source = await fs.readFile(fullPath, "utf8");
        const { data } = matter(source);

        return {
          title: data.title ?? "Untitled",
          slug: data.slug ?? file.replace(/\.mdx$/, ""),
          date: data.date ?? "",
          summary: data.summary ?? "",
          tags: data.tags ?? [],
          published: data.published ?? false,
          image: data.image ?? undefined,
        } satisfies BlogPostMeta;
      })
  );

  return posts
    .filter((post) => post.published)
    .sort(
      (a, b) =>
        new Date(b.date).getTime() - new Date(a.date).getTime()
    );
}
