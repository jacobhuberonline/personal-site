import fs from "fs/promises";
import path from "path";
import matter from "gray-matter";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkMdx from "remark-mdx";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import type { BlogPost, BlogPostMeta } from "./types";

const postsDirectory = path.join(process.cwd(), "content", "posts");

type ParsedFrontmatter = {
  title?: string;
  slug?: string;
  date?: string;
  summary?: string;
  tags?: string[];
  published?: boolean;
};

const normalizeSlug = (value?: string | null) =>
  typeof value === "string" ? value.replace(/\.mdx?$/i, "") : "";

const buildMeta = (
  frontmatter: ParsedFrontmatter,
  fallbackSlug: string
): BlogPostMeta => ({
  title: frontmatter.title ?? "Untitled",
  slug: frontmatter.slug ?? fallbackSlug,
  date: frontmatter.date ?? "",
  summary: frontmatter.summary ?? "",
  tags: frontmatter.tags ?? [],
  published: frontmatter.published ?? false,
  image: frontmatter.image,
});

export async function getPostBySlug(slug: string): Promise<BlogPost | null> {
  const cleanSlug = normalizeSlug(slug);
  if (!cleanSlug) return null;

  const tryRead = async (filePath: string) => {
    const source = await fs.readFile(filePath, "utf8");
    const { content, data } = matter(source);
    const meta = buildMeta(data as ParsedFrontmatter, cleanSlug);
    const processed = await unified()
      .use(remarkParse)
      .use(remarkMdx)
      .use(remarkRehype)
      .use(rehypeStringify)
      .process(content);
    return { meta, content: String(processed.value) };
  };

  // Primary: filename match
  const directPath = path.join(postsDirectory, `${cleanSlug}.mdx`);
  try {
    return await tryRead(directPath);
  } catch {
    // Fallback: scan files for matching frontmatter slug
    try {
      const files = await fs.readdir(postsDirectory);
      for (const file of files) {
        if (!file.endsWith(".mdx")) continue;
        const filePath = path.join(postsDirectory, file);
        const source = await fs.readFile(filePath, "utf8");
        const { data, content } = matter(source);
        const fmSlug = normalizeSlug(
          (data as ParsedFrontmatter).slug ?? file.replace(/\.mdx$/i, "")
        );
        if (fmSlug === cleanSlug) {
          const meta = buildMeta(data as ParsedFrontmatter, fmSlug);
          const processed = await unified()
            .use(remarkParse)
            .use(remarkMdx)
            .use(remarkRehype)
            .use(rehypeStringify)
            .process(content);
          return { meta, content: String(processed.value) };
        }
      }
    } catch (fallbackError) {
      console.error(`Fallback failed for slug "${slug}":`, fallbackError);
    }
    console.error(`Failed to load post "${slug}"`);
    return null;
  }
}
