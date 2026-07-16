import * as Sentry from "@sentry/nextjs"

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Captura 10% das transações de performance (ajustar conforme volume crescer)
  tracesSampleRate: 0.1,

  // Session Replay desativado no MVP — habilitar quando necessário
  replaysOnErrorSampleRate: 0,
  replaysSessionSampleRate: 0,

  debug: false,
})
