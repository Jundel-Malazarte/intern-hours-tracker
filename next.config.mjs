/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true, // Skip ESLint during build
  },
  typescript: {
    ignoreBuildErrors: false, // Still check TypeScript
  },
}

export default nextConfig