/** @type {import('next').NextConfig} */
const nextConfig = {
  // Show extra warnings during development to catch common mistakes.
  reactStrictMode: true,

  // M6 - T6: build a self-contained server bundle (.next/standalone) so the
  // Docker runtime image can run `node server.js` without node_modules.
  output: "standalone",

  // We will add more here later when we need it
  // (for example image domains in M5 - T7).
};

export default nextConfig;
