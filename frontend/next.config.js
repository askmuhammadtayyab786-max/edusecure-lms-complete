/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: "standalone", // required for the slim multi-stage Docker build
};

module.exports = nextConfig;
