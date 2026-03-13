/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",

  experimental: {
    workerThreads: false,
    cpus: 1,
  },

  typescript: {
    ignoreBuildErrors: true,
  },

  images: {
    unoptimized: true,
  },
};

export default nextConfig;
