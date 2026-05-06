/** @type {import('next').NextConfig} */
const nextConfig = {
  /** Acesso dev por 127.0.0.1 ou IP da rede sem quebrar webpack-hmr */
  allowedDevOrigins: ['127.0.0.1'],
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  serverExternalPackages: ['better-sqlite3'],
  async headers() {
    return [
      {
        source: '/sw.js',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=0, must-revalidate',
          },
        ],
      },
      {
        source: '/sql-wasm.wasm',
        headers: [
          { key: 'Content-Type', value: 'application/wasm' },
          { key: 'Cache-Control', value: 'public, max-age=604800' },
        ],
      },
      {
        source: '/sql-wasm-browser.wasm',
        headers: [
          { key: 'Content-Type', value: 'application/wasm' },
          { key: 'Cache-Control', value: 'public, max-age=604800' },
        ],
      },
    ]
  },
}

export default nextConfig
