export type BucketConsulta = "0-30" | "31-90" | "91-180" | "180+" | "nunca"

export function calcIdadeAnos(nasc: string): number | null {
  if (!nasc) return null
  const d = new Date(nasc)
  if (isNaN(d.getTime())) return null
  return Math.floor((Date.now() - d.getTime()) / (365.25 * 24 * 3600 * 1000))
}

export function bucketConsulta(ultimaData: string | null): BucketConsulta {
  if (!ultimaData) return "nunca"
  const dias = Math.floor((Date.now() - new Date(ultimaData).getTime()) / (1000 * 60 * 60 * 24))
  if (dias <= 30)  return "0-30"
  if (dias <= 90)  return "31-90"
  if (dias <= 180) return "91-180"
  return "180+"
}
