import withMDX from "@next/mdx";

/** @type {import('next').NextConfig} */
const nextConfig = {
  pageExtensions: ["ts", "tsx", "mdx"],
  experimental: {
    mdxRs: true,
  },
  async redirects() {
    return [
      {
        source: "/family/schedule",
        destination: "/family/baby",
        permanent: false,
      },
    ];
  },
};

export default withMDX({
  extension: /\.mdx?$/,
})(nextConfig);
