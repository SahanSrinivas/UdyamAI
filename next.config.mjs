/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Cloud Run runs one container, so the build emits one: `standalone` traces
  // the exact node_modules the server touches into .next/standalone, which is
  // what the Dockerfile's runner stage copies. Keeps the image around 200 MB
  // instead of shipping the whole dependency tree.
  output: "standalone",

  experimental: {
    // The AgamiAI corpus is read with fs at runtime rather than imported, so
    // Next's file tracer cannot see it. Name it explicitly or the standalone
    // build ships without any data. (The Dockerfile also copies src/data
    // directly — belt and braces, because a missing corpus is a blank
    // dashboard rather than a crash at build time.)
    outputFileTracingIncludes: {
      "/**/*": ["./src/data/agami/*.json"],
    },
  },
};

export default nextConfig;
