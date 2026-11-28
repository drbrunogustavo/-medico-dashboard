import { createCipheriv, createDecipheriv, randomBytes } from "crypto"

/**
 * Credenciais de integrações ficam em integracoes_usuario.config (jsonb).
 * Com INTEGRACOES_KEY definida (32 bytes em base64), o objeto é gravado como { _enc: "v1.iv.tag.dados" }.
 * Sem a chave, grava em texto e avisa no log. Registros antigos em texto continuam legíveis.
 */
export type ConfigIntegracao = Record<string, string>

const SEGREDO = /token|secret|key|senha|password/i

function chave(): Buffer | null {
  const b64 = process.env.INTEGRACOES_KEY
  if (!b64) return null
  const k = Buffer.from(b64, "base64")
  return k.length === 32 ? k : null
}

export function cifrarConfig(cfg: ConfigIntegracao): Record<string, unknown> {
  const k = chave()
  if (!k) { console.warn("[cripto-config] INTEGRACOES_KEY ausente ou inválida: credenciais gravadas sem criptografia"); return cfg }
  const iv = randomBytes(12)
  const c = createCipheriv("aes-256-gcm", k, iv)
  const dados = Buffer.concat([c.update(JSON.stringify(cfg), "utf8"), c.final()])
  const tag = c.getAuthTag()
  return { _enc: ["v1", iv.toString("base64"), tag.toString("base64"), dados.toString("base64")].join(".") }
}

export function lerConfig(raw: unknown): ConfigIntegracao {
  if (!raw || typeof raw !== "object") return {}
  const enc = (raw as { _enc?: unknown })._enc
  if (typeof enc !== "string") return raw as ConfigIntegracao
  const k = chave()
  if (!k) { console.error("[cripto-config] registro criptografado, mas INTEGRACOES_KEY ausente ou inválida"); return {} }
  try {
    const [v, iv, tag, dados] = enc.split(".")
    if (v !== "v1") return {}
    const d = createDecipheriv("aes-256-gcm", k, Buffer.from(iv, "base64"))
    d.setAuthTag(Buffer.from(tag, "base64"))
    const txt = Buffer.concat([d.update(Buffer.from(dados, "base64")), d.final()]).toString("utf8")
    return JSON.parse(txt) as ConfigIntegracao
  } catch (e) {
    console.error("[cripto-config] falha ao descriptografar", e)
    return {}
  }
}

export const MASCARA = "••••"

/** Esconde valores secretos para a tela: só os 4 últimos caracteres. */
export function mascararConfig(cfg: ConfigIntegracao): ConfigIntegracao {
  const out: ConfigIntegracao = {}
  for (const [k, v] of Object.entries(cfg)) {
    out[k] = SEGREDO.test(k) && v ? MASCARA + v.slice(-4) : v
  }
  return out
}

/** Valor que o cliente devolveu sem alterar (ainda com a máscara) mantém o segredo já salvo. */
export function mesclarSegredos(novo: ConfigIntegracao, atual: ConfigIntegracao): ConfigIntegracao {
  const out: ConfigIntegracao = {}
  for (const [k, v] of Object.entries(novo)) {
    out[k] = SEGREDO.test(k) && v.startsWith(MASCARA) ? (atual[k] ?? "") : v
  }
  return out
}
