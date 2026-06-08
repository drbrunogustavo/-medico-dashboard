/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        // Required for @ffmpeg/ffmpeg SharedArrayBuffer support
        source: '/(.*)',
        headers: [
          { key: 'Cross-Origin-Opener-Policy',  value: 'same-origin'   },
          { key: 'Cross-Origin-Embedder-Policy', value: 'require-corp'  },
        ],
      },
    ]
  },
}

module.exports = nextConfig
