/** @type {import('next').NextConfig} */
// Dev and build always run on webpack (see package.json scripts: --webpack).
// Do NOT run `next dev --turbopack` or `next build --turbopack` for this project.
const nextConfig = {
  reactStrictMode: true,
};

module.exports = nextConfig;
