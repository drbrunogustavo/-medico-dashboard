import { MetadataRoute } from "next"

const BASE = "https://praxisplataforma.com.br"

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()
  return [
    { url: BASE,                             lastModified: now, changeFrequency: "weekly",  priority: 1.0 },
    { url: `${BASE}/planos`,                 lastModified: now, changeFrequency: "monthly", priority: 0.9 },
    { url: `${BASE}/captacao`,               lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE}/privacidade`,            lastModified: now, changeFrequency: "yearly",  priority: 0.3 },
    { url: `${BASE}/termos`,                 lastModified: now, changeFrequency: "yearly",  priority: 0.3 },
    { url: `${BASE}/deletar-dados`,          lastModified: now, changeFrequency: "yearly",  priority: 0.2 },
  ]
}
