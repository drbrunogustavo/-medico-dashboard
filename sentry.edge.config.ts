import * as Sentry from "@sentry/nextjs"

// Cobre middleware.ts e qualquer route com runtime = "edge"
Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  tracesSampleRate: 0.1,

  debug: false,
})
