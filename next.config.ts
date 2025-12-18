import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    unoptimized: true, // <--- Add this line
  },
  /* config options here */
};

export default nextConfig;
