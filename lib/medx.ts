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
  medxGet<any[]>("GetContatosGridBySearch", { nome })

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
