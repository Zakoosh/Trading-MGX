/** @type {import('next').NextConfig} */ 
const withNextIntl = require('next-intl/plugin')('./i18n.ts');

module.exports = withNextIntl({
  reactStrictMode: true,
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
  experimental: { typedRoutes: true },
});
