/** @type {import('next').NextConfig} */

// Two deploy targets, one build.
//
//   Container (Cloud Run, App Runner, ECS) → `standalone`, which traces the
//   exact node_modules the server touches into .next/standalone. That is what
//   the Dockerfile's runner stage copies, and it keeps the image near 200 MB.
//
//   Managed SSR (Amplify Hosting) → stock output. Amplify packages the app
//   itself from .next, so a standalone folder would ship a second, duplicated
//   node_modules inside the compute bundle for nothing — and Lambda has a size
//   limit worth staying well clear of.
//
// The Dockerfile sets NEXT_STANDALONE=1; nothing else does.
const standalone = process.env.NEXT_STANDALONE === "1";

const nextConfig = {
  reactStrictMode: true,
  ...(standalone ? { output: "standalone" } : {}),
};

export default nextConfig;
