import { createSupabaseServiceClient } from "@/lib/supabase-service"

const MEDX_URL   = (process.env.MEDX_URL ?? "https://medx65-v65teste.azurewebsites.net").replace(/\/$/, "")
const MEDX_TOKEN = process.env.MEDX_INTEGRATION_TOKEN ?? ""

// ── Token cache (module-level, per serverless instance) ──────────────────────
let cachedToken    = ""
let tokenExpiresAt = 0

export async function getAuthToken(): Promise<string> {
  if (cachedToken && Date.now() < tokenExpiresAt) return cachedToken

  const res  = await fetch(`${MEDX_URL}/api/integration/GetAuthorizedToken?token=${MEDX_TOKEN}`, {
    cache: "no-store",
  })

  if (!res.ok) throw new Error(`MedX auth failed: ${res.status}`)

  const data = await res.json() as { token?: string; Token?: string } | string
  const tok  = typeof data === "string"
    ? data
    : (data as Record<string, string>).token ?? (data as Record<string, string>).Token ?? ""

  if (!tok) throw new Error("MedX: empty token in response")

  cachedToken    = tok
  tokenExpiresAt = Date.now() + 170 * 60 * 1000   // 170 min
  return cachedToken
}

async function medxGet<T>(path: string, params?: Record<string, string>): Promise<T> {
  const token = await getAuthToken()
  const url   = new URL(`${MEDX_URL}/api/integration/${path}`)
  if (params) Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v))

  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    cache:   "no-store",
  })
  if (!res.ok) throw new Error(`MedX GET ${path} failed: ${res.status}`)
  return res.json() as Promise<T>
}

async function medxPost<T>(path: string, body: unknown): Promise<T> {
  const token = await getAuthToken()
  const res   = await fetch(`${MEDX_URL}/api/integration/${path}`, {
    method:  "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body:    JSON.stringify(body),
    cache:   "no-store",
  })
  if (!res.ok) throw new Error(`MedX POST ${path} failed: ${res.status}`)
  return res.json() as Promise<T>
}

async function medxPut<T>(path: string, body: unknown): Promise<T> {
  const token = await getAuthToken()
  const res   = await fetch(`${MEDX_URL}/api/integration/${path}`, {
    method:  "PUT",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body:    JSON.stringify(body),
    cache:   "no-store",
  })
  if (!res.ok) throw new Error(`MedX PUT ${path} failed: ${res.status}`)
  return res.json() as Promise<T>
}

// ── Exported API functions ───────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const getAgenda = (inicio: string, fim: string) =>
  medxGet<any[]>("GetAgenda", { inicio, fim })

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const getAgendaByUsuario = (inicio: string, fim: string, idUsuario: string) =>
  medxGet<any[]>("GetAgendabyUsuario", { inicio, fim, idUsuario })

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const getDisponibilidade = (dti: string, dtf: string, proId: string, intervalo: string) =>
  medxGet<any[]>("GetDisponibilidade", { dti, dtf, proId, intervalo })

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const getPacientes = () =>
  medxGet<any[]>("GetPacientes")

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const getPacienteById = (id: string) =>
  medxGet<any>("GetContatosById", { id })

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const buscarPaciente = (nome: string) =>
  medxGet<any[]>("GetContatosGridBySearch", { Name: nome })

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const inserirAgendamento = (dados: unknown) =>
  medxPost<any>("InsertAgenda", dados)

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const atualizarAgendamento = (dados: unknown) =>
  medxPut<any>("UpdateAgendamento", dados)

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const inserirContato = (dados: unknown) =>
  medxPost<any>("InsertContato", dados)

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const inserirProntuario = (historico: string, idCliente: string) =>
  medxPost<any>("InsertProntuario", { historico, idCliente })

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const getUsuariosAgenda = () =>
  medxGet<any[]>("GetUsuariosAgenda")

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const getStatusAgenda = () =>
  medxGet<any[]>("GetStatusNomeAgenda")

// ── Por usuário ──────────────────────────────────────────────────────────────

const userTokenCache = new Map<string, { token: string; expiresAt: number }>()

async function getAuthTokenFor(url: string, integrationToken: string, cacheKey: string): Promise<string> {
  const cached = userTokenCache.get(cacheKey)
  if (cached && Date.now() < cached.expiresAt) return cached.token

  const res = await fetch(`${url}/api/integration/GetAuthorizedToken?token=${integrationToken}`, {
    cache: "no-store",
  })
  if (!res.ok) throw new Error(`MedX auth failed: ${res.status}`)

  const data = await res.json() as { token?: string; Token?: string } | string
  const tok  = typeof data === "string"
    ? data
    : (data as Record<string, string>).token ?? (data as Record<string, string>).Token ?? ""
  if (!tok) throw new Error("MedX: empty token in response")

  userTokenCache.set(cacheKey, { token: tok, expiresAt: Date.now() + 170 * 60 * 1000 })
  return tok
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function medxGetFor<T = any>(url: string, integrationToken: string, cacheKey: string, path: string, params?: Record<string, string>): Promise<T> {
  const token  = await getAuthTokenFor(url, integrationToken, cacheKey)
  const reqUrl = new URL(`${url}/api/integration/${path}`)
  if (params) Object.entries(params).forEach(([k, v]) => reqUrl.searchParams.set(k, v))
  const res = await fetch(reqUrl.toString(), {
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    cache: "no-store",
  })
  if (!res.ok) throw new Error(`MedX GET ${path} failed: ${res.status}`)
  return res.json() as Promise<T>
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function medxPostFor<T = any>(url: string, integrationToken: string, cacheKey: string, path: string, body: unknown): Promise<T> {
  const token = await getAuthTokenFor(url, integrationToken, cacheKey)
  const res   = await fetch(`${url}/api/integration/${path}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  })
  if (!res.ok) throw new Error(`MedX POST ${path} failed: ${res.status}`)
  return res.json() as Promise<T>
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function medxPutFor<T = any>(url: string, integrationToken: string, cacheKey: string, path: string, body: unknown): Promise<T> {
  const token = await getAuthTokenFor(url, integrationToken, cacheKey)
  const res   = await fetch(`${url}/api/integration/${path}`, {
    method: "PUT",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  })
  if (!res.ok) throw new Error(`MedX PUT ${path} failed: ${res.status}`)
  return res.json() as Promise<T>
}

export async function getMedxClientForUser(userId: string) {
  const supabase = createSupabaseServiceClient()
  const { data } = await supabase
    .from("integracoes_usuario")
    .select("config")
    .eq("user_id", userId)
    .eq("tipo", "medx")
    .eq("ativo", true)
    .single()

  const cfg   = data?.config as { url?: string; integration_token?: string } | null
  const url   = (cfg?.url              ?? process.env.MEDX_URL ?? "").replace(/\/$/, "")
  const token = cfg?.integration_token ?? process.env.MEDX_INTEGRATION_TOKEN ?? ""

  if (!url || !token) throw new Error("MedX não configurado para este usuário")

  return {
    getAgenda:            (inicio: string, fim: string)                        => medxGetFor(url, token, userId, "GetAgenda", { inicio, fim }),
    getAgendaByUsuario:   (inicio: string, fim: string, id: string)            => medxGetFor(url, token, userId, "GetAgendabyUsuario", { inicio, fim, idUsuario: id }),
    getDisponibilidade:   (dti: string, dtf: string, proId: string, intervalo: string) => medxGetFor(url, token, userId, "GetDisponibilidade", { dti, dtf, proId, intervalo }),
    getPacientes:         ()                                                   => medxGetFor(url, token, userId, "GetPacientes"),
    getPacienteById:      (id: string)                                         => medxGetFor(url, token, userId, "GetContatosById", { id }),
    buscarPaciente:       (nome: string)                                       => medxGetFor(url, token, userId, "GetContatosGridBySearch", { Name: nome }),
    inserirAgendamento:   (dados: unknown)                                     => medxPostFor(url, token, userId, "InsertAgenda", dados),
    atualizarAgendamento: (dados: unknown)                                     => medxPutFor(url, token, userId, "UpdateAgendamento", dados),
    inserirContato:       (dados: unknown)                                     => medxPostFor(url, token, userId, "InsertContato", dados),
    inserirProntuario:    (h: string, id: string)                              => medxPostFor(url, token, userId, "InsertProntuario", { historico: h, idCliente: id }),
    getUsuariosAgenda:    ()                                                   => medxGetFor(url, token, userId, "GetUsuariosAgenda"),
    getStatusAgenda:      ()                                                   => medxGetFor(url, token, userId, "GetStatusNomeAgenda"),
  }
}
