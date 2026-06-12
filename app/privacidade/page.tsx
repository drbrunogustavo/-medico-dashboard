import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export const metadata = {
  title: "Política de Privacidade — PRAXIS",
  description: "Como a PRAXIS coleta, usa e protege seus dados pessoais.",
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 style={{ fontSize: 17, fontWeight: 700, color: "var(--text-primary)", marginBottom: 12 }}>
        {title}
      </h2>
      <div style={{ fontSize: 14, lineHeight: 1.8, color: "var(--text-secondary)" }}>
        {children}
      </div>
    </section>
  )
}

export default function PrivacidadePage() {
  return (
    <div style={{ minHeight: "100vh", background: "var(--background)" }}>
      {/* Nav */}
      <nav style={{
        position: "sticky", top: 0, zIndex: 10,
        background: "rgba(var(--surface-rgb, 10,10,10),0.9)",
        borderBottom: "1px solid var(--border)",
        backdropFilter: "blur(16px)",
        padding: "0 24px", height: 60,
        display: "flex", alignItems: "center",
      }}>
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
          <svg width="24" height="24" viewBox="0 0 32 32" fill="none">
            <circle cx="16" cy="16" r="14" stroke="#00c07f" strokeWidth="1.5"
              strokeDasharray="70 18" strokeDashoffset="12" opacity="0.6" />
            <path d="M10 22V10h5.5a4 4 0 0 1 0 8H10" stroke="#f5f5f7" strokeWidth="2"
              strokeLinecap="round" strokeLinejoin="round" />
            <line x1="18" y1="14" x2="23" y2="22" stroke="#00c07f" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <span style={{ fontFamily: "var(--font-playfair,Georgia,serif)", fontSize: 14, fontWeight: 600, letterSpacing: "4px", color: "#f0f0f0" }}>
            PRAXIS
          </span>
        </Link>
      </nav>

      {/* Content */}
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "48px 24px 80px" }}>
        <Link href="/" style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          fontSize: 12, color: "var(--text-muted)", textDecoration: "none",
          marginBottom: 32,
        }}>
          <ArrowLeft style={{ width: 13, height: 13 }} /> Voltar
        </Link>

        {/* Header */}
        <div style={{ marginBottom: 48 }}>
          <p style={{ fontSize: 11, fontFamily: "monospace", color: "#00c07f", letterSpacing: "3px", textTransform: "uppercase", marginBottom: 12 }}>
            PRAXIS PLATAFORMA
          </p>
          <h1 style={{
            fontFamily: "var(--font-playfair,Georgia,serif)",
            fontSize: "clamp(26px, 4vw, 38px)", fontWeight: 700,
            color: "var(--text-primary)", marginBottom: 16, lineHeight: 1.2,
          }}>
            Política de Privacidade
          </h1>
          <p style={{ fontSize: 13, color: "var(--text-muted)" }}>
            Última atualização: junho de 2026
          </p>
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: "var(--border)", marginBottom: 48 }} />

        <div style={{ display: "flex", flexDirection: "column", gap: 36 }}>

          <Section title="1. Quais dados coletamos">
            <p style={{ marginBottom: 12 }}>A PRAXIS coleta as seguintes categorias de dados pessoais:</p>
            <ul style={{ paddingLeft: 20, display: "flex", flexDirection: "column", gap: 8 }}>
              <li><strong style={{ color: "var(--text-primary)" }}>Dados de identificação:</strong> nome completo, endereço de e-mail, CRM, cidade e especialidade médica informados durante o cadastro e onboarding.</li>
              <li><strong style={{ color: "var(--text-primary)" }}>Dados de uso:</strong> histórico de interações com a plataforma, conteúdos gerados, pautas criadas, resultados de calculadoras e preferências de configuração.</li>
              <li><strong style={{ color: "var(--text-primary)" }}>Dados clínicos agregados:</strong> informações sobre a clínica (número de consultas, ticket médio, metas) inseridas voluntariamente pelo usuário para geração de relatórios e diagnósticos estratégicos.</li>
              <li><strong style={{ color: "var(--text-primary)" }}>Dados financeiros:</strong> registros de faturamento e despesas inseridos pelo usuário — nunca dados de cartão de crédito, que são processados diretamente pelo Stripe.</li>
              <li><strong style={{ color: "var(--text-primary)" }}>Dados de leads e pacientes:</strong> informações de contato (nome, e-mail, telefone) de leads inseridos no CRM da plataforma.</li>
              <li><strong style={{ color: "var(--text-primary)" }}>Dados de redes sociais:</strong> métricas e posts do Instagram conectado via Meta Graph API, com consentimento explícito do usuário.</li>
            </ul>
          </Section>

          <Section title="2. Como usamos os dados">
            <p style={{ marginBottom: 12 }}>Os dados coletados são utilizados exclusivamente para:</p>
            <ul style={{ paddingLeft: 20, display: "flex", flexDirection: "column", gap: 8 }}>
              <li><strong style={{ color: "var(--text-primary)" }}>Personalização da IA:</strong> geração de roteiros, legendas, relatórios e análises estratégicas alinhados ao perfil e especialidade do médico. Os prompts enviados à API da Anthropic (Claude) incluem contexto do usuário, mas não identificam pacientes individualmente.</li>
              <li><strong style={{ color: "var(--text-primary)" }}>Marketing médico:</strong> ferramentas de criação de conteúdo, calendário editorial e análise de performance no Instagram.</li>
              <li><strong style={{ color: "var(--text-primary)" }}>Gestão clínica:</strong> CRM de leads, NPS, agenda e indicadores da clínica.</li>
              <li><strong style={{ color: "var(--text-primary)" }}>Melhorias da plataforma:</strong> análise de uso agregado e anônimo para aprimorar funcionalidades.</li>
              <li><strong style={{ color: "var(--text-primary)" }}>Comunicação:</strong> envio de notificações relacionadas à conta, atualizações de plano e suporte técnico.</li>
            </ul>
            <p style={{ marginTop: 12 }}>Não vendemos, alugamos ou compartilhamos seus dados pessoais com terceiros para fins comerciais.</p>
          </Section>

          <Section title="3. Integrações com terceiros">
            <p style={{ marginBottom: 12 }}>A PRAXIS integra com os seguintes serviços externos, cada um com sua própria política de privacidade:</p>
            <ul style={{ paddingLeft: 20, display: "flex", flexDirection: "column", gap: 8 }}>
              <li><strong style={{ color: "var(--text-primary)" }}>Supabase (banco de dados e autenticação):</strong> todos os dados do usuário são armazenados em infraestrutura Supabase com criptografia em repouso e em trânsito.</li>
              <li><strong style={{ color: "var(--text-primary)" }}>Stripe (pagamentos):</strong> dados de cartão de crédito são processados diretamente pelo Stripe. A PRAXIS nunca armazena dados de pagamento — apenas o ID da assinatura e status.</li>
              <li><strong style={{ color: "var(--text-primary)" }}>Anthropic Claude (IA):</strong> conteúdo gerado é processado pela API da Anthropic. Consulte a política de privacidade da Anthropic em anthropic.com/privacy.</li>
              <li><strong style={{ color: "var(--text-primary)" }}>Meta Graph API (Instagram):</strong> métricas e posts do Instagram são acessados apenas com autorização explícita do usuário via OAuth. Tokens de acesso são armazenados com segurança e podem ser revogados a qualquer momento.</li>
              <li><strong style={{ color: "var(--text-primary)" }}>Vercel (hospedagem):</strong> a plataforma é hospedada na infraestrutura Vercel, localizada nos Estados Unidos. Os dados são transferidos com proteções adequadas.</li>
            </ul>
          </Section>

          <Section title="4. Seus direitos (LGPD)">
            <p style={{ marginBottom: 12 }}>Em conformidade com a Lei Geral de Proteção de Dados (Lei 13.709/2018), você tem os seguintes direitos:</p>
            <ul style={{ paddingLeft: 20, display: "flex", flexDirection: "column", gap: 8 }}>
              <li><strong style={{ color: "var(--text-primary)" }}>Acesso:</strong> solicitar uma cópia de todos os dados pessoais que mantemos sobre você.</li>
              <li><strong style={{ color: "var(--text-primary)" }}>Correção:</strong> atualizar informações incorretas ou incompletas diretamente nas configurações da plataforma.</li>
              <li><strong style={{ color: "var(--text-primary)" }}>Exclusão:</strong> solicitar a exclusão de todos os seus dados pessoais. Processamos solicitações de exclusão em até 30 dias úteis. Acesse <Link href="/deletar-dados" style={{ color: "#00c07f" }}>praxisplatforma.com.br/deletar-dados</Link> para fazer a solicitação.</li>
              <li><strong style={{ color: "var(--text-primary)" }}>Portabilidade:</strong> solicitar seus dados em formato estruturado (JSON ou CSV).</li>
              <li><strong style={{ color: "var(--text-primary)" }}>Revogação de consentimento:</strong> cancelar integrações (ex: Instagram) a qualquer momento pelas configurações da conta.</li>
              <li><strong style={{ color: "var(--text-primary)" }}>Oposição:</strong> opor-se ao processamento de dados em casos específicos previstos em lei.</li>
            </ul>
          </Section>

          <Section title="5. Retenção de dados">
            <p>Seus dados são mantidos enquanto sua conta estiver ativa. Após o cancelamento da assinatura, os dados são retidos por 90 dias para permitir reativação, após o que são anonimizados ou excluídos permanentemente, salvo obrigação legal contrária.</p>
          </Section>

          <Section title="6. Segurança">
            <p>Adotamos medidas técnicas e organizacionais para proteger seus dados, incluindo: criptografia TLS em trânsito, criptografia em repouso no banco de dados, autenticação segura via Supabase Auth, controle de acesso baseado em funções e monitoramento de atividades suspeitas.</p>
          </Section>

          <Section title="7. Alterações nesta política">
            <p>Podemos atualizar esta política periodicamente. Notificaremos usuários ativos por e-mail em caso de mudanças relevantes. A data da última atualização está sempre indicada no topo deste documento.</p>
          </Section>

          <Section title="8. Contato">
            <p>
              Para exercer seus direitos ou esclarecer dúvidas sobre privacidade, entre em contato:
            </p>
            <div style={{
              marginTop: 16, padding: "16px 20px", borderRadius: 12,
              background: "rgba(0,192,127,0.06)", border: "1px solid rgba(0,192,127,0.2)",
            }}>
              <p style={{ margin: 0, fontFamily: "monospace", fontSize: 13, color: "#00c07f" }}>
                contato@praxisplatforma.com.br
              </p>
              <p style={{ margin: "6px 0 0", fontSize: 12, color: "var(--text-muted)" }}>
                Respondemos em até 5 dias úteis.
              </p>
            </div>
          </Section>

        </div>

        <div style={{ height: 1, background: "var(--border)", margin: "48px 0 32px" }} />

        <p style={{ fontSize: 11, fontFamily: "monospace", color: "var(--text-muted)", letterSpacing: "1px" }}>
          © PRAXIS 2026 · Marketing Médico de Alto Padrão ·{" "}
          <Link href="/deletar-dados" style={{ color: "var(--text-muted)" }}>Solicitar Exclusão de Dados</Link>
        </p>
      </div>
    </div>
  )
}
