import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // Profile photos come straight from the object storage public URL (plain <img>),
  // so no image optimizer domains are needed.
};

export default nextConfig;
