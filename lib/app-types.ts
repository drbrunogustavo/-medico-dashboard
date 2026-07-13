export type Plano = "trial" | "starter" | "pro" | "elite"

export interface Perfil {
  user_id:              string
  nome:                 string | null
  especialidade:        string | null
  crm:                  string | null
  cidade:               string | null
  estado:               string | null
  instagram:            string | null
  publico_alvo:         string | null
  diferencial:          string | null
  avatar_url:           string | null
  onboarding_completo:  boolean
  criado_em:            string
  voz_gravacao_autorizada: boolean | null
  // Kit de Marca
  marca_logo_url:        string | null
  marca_cor_primaria:    string | null
  marca_cor_secundaria:  string | null
  marca_cor_fundo:       string | null
  marca_tipografia:      string | null
  marca_slogan:          string | null
  marca_tom_voz:         string | null
}
