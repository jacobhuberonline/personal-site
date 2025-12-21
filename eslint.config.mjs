import nextConfig from "eslint-config-next";

const ignores = [
  "**/node_modules/**",
  ".next/**",
  ".turbo/**",
  "dist/**",
  "out/**",
  "content/**/*.mdx",
];

export default [
  {
    ignores,
  },
  ...nextConfig,
  {
    files: [
      "eslint.config.mjs",
      "postcss.config.mjs",
      "next.config.mjs",
      "tailwind.config.ts",
    ],
    rules: {
      "import/no-anonymous-default-export": "off",
    },
  },
];
