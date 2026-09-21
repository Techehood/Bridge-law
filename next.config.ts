import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  // Allow access to remote image placeholder.
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**', // This allows any path under the hostname
      },
    ],
  },
  output: 'standalone',
  transpilePackages: ['motion'],
  /**
   * The embedded routes (/bc/1…6 and /tl/1…6) load inside iframes in Book
   * Creator and ThingLink. An iframe caches independently of the page that
   * hosts it, so refreshing the book does not refresh the Bridge — during the
   * pilot that meant testers could sit on a build days old while believing
   * they were seeing the current one.
   *
   * Only the HTML for these routes is exempted. Fingerprinted JS, CSS and
   * images keep their normal caching, so nothing else gets slower.
   */
  async headers() {
    return [
      {
        source: '/bc/:stage',
        headers: [
          {key: 'Cache-Control', value: 'no-store, must-revalidate'},
          {key: 'Pragma', value: 'no-cache'},
        ],
      },
      {
        source: '/tl/:stage',
        headers: [
          {key: 'Cache-Control', value: 'no-store, must-revalidate'},
          {key: 'Pragma', value: 'no-cache'},
        ],
      },
    ];
  },
  webpack: (config, {dev}) => {
    // HMR is disabled in AI Studio via DISABLE_HMR env var.
    // Do not modify — file watching is disabled to prevent flickering during agent edits.
    if (dev && process.env.DISABLE_HMR === 'true') {
      config.watchOptions = {
        ignored: /.*/,
      };
    }
    return config;
  },
};

export default nextConfig;
