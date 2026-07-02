/** @type {import('next').NextConfig} */
const nextConfig = {
  // Supabase Storage + common avatar hosts
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
      {
        protocol: "https",
        hostname: "*.supabase.in",
        pathname: "/storage/v1/object/public/**",
      },
      // Google user avatars (OAuth)
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      // Generic HTTPS images (avatar URLs pasted by users)
      { protocol: "https", hostname: "**" },
    ],
  },

  async headers() {
    return [
      {
        // COEP/COOP required for SharedArrayBuffer — scoped to /imagens only
        source: "/imagens",
        headers: [
          { key: "Cross-Origin-Opener-Policy",   value: "same-origin"  },
          { key: "Cross-Origin-Embedder-Policy",  value: "require-corp" },
        ],
      },
    ]
  },
}

module.exports = nextConfig
