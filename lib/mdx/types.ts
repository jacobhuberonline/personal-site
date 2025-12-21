export type BlogPostMeta = {
  title: string;
  slug: string;
  date: string;
  summary: string;
  tags?: string[];
  published: boolean;
  image?: string;
};

export type BlogPost = {
  meta: BlogPostMeta;
  content: string;
};
