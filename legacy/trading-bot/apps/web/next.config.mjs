import withNextIntl from 'next-intl/plugin';

const withIntl = withNextIntl({
  locales: ['ar', 'en'],
  defaultLocale: 'ar'
});

const nextConfig = {
  reactStrictMode: true,
  experimental: {
    typedRoutes: true
  },
  eslint: {
    dirs: ['.']
  }
};

export default withIntl(nextConfig);
