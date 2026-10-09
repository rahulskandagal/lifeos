import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Emit a self-contained server bundle (.next/standalone) for the Docker image.
  ...(process.env.VERCEL ? {} : { output: "standalone" as const }),
};

export default nextConfig;

