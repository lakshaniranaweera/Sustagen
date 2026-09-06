/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // No server — the app is fully client-side (browser storage). Static export
  // lets the kiosk run the built `out/` folder with any static file server.
  output: "export",
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
