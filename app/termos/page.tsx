import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export const metadata = {
  title: "Termos de Uso — PRAXIS",
  description: "Termos e condições de uso da plataforma PRAXIS para médicos.",
}

function Section({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 style={{ fontSize: 17, fontWeight: 700, color: "#0D1B2A", marginBottom: 12 }}>
        {n}. {title}
      </h2>
      <div style={{ fontSize: 14, lineHeight: 1.8, color: "#4A3728" }}>
        {children}
      </div>
    </section>
  )
}

export default function TermosPage() {
  return (
    <div style={{ minHeight: "100vh", background: "#F5F0E8", color: "#0D1B2A" }}>
      {/* Nav */}
      <nav style={{
        position: "sticky", top: 0, zIndex: 10,
        background: "rgba(245,240,232,0.92)",
        borderBottom: "1px solid rgba(13,27,42,0.08)",
        backdropFilter: "blur(16px)",
        padding: "0 24px", height: 60,
        display: "flex", alignItems: "center",
      }}>
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
          <svg width="24" height="24" viewBox="0 0 32 32" fill="none">
            <circle cx="16" cy="16" r="14" stroke="#b8976a" strokeWidth="1.5"
              strokeDasharray="70 18" strokeDashoffset="12" opacity="0.7" />
            <path d="M10 22V10h5.5a4 4 0 0 1 0 8H10" stroke="#0D1B2A" strokeWidth="2"
              strokeLinecap="round" strokeLinejoin="round" />
            <line x1="18" y1="14" x2="23" y2="22" stroke="#b8976a" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <span style={{ fontFamily: "var(--font-playfair,Georgia,serif)", fontSize: 14, fontWeight: 600, letterSpacing: "4px", color: "#0D1B2A" }}>
            PRAXIS
          </span>
        </Link>
      </nav>

      {/* Content */}
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "48px 24px 80px" }}>
        <Link href="/" style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          fontSize: 12, color: "#8a7a6a", textDecoration: "none",
          marginBottom: 32,
        }}>
          <ArrowLeft style={{ width: 13, height: 13 }} /> Voltar
        </Link>

        {/* Header */}
        <div style={{ marginBottom: 48 }}>
          <p style={{ fontSize: 11, fontFamily: "monospace", color: "#b8976a", letterSpacing: "3px", textTransform: "uppercase", marginBottom: 12 }}>
            PRAXIS PLATAFORMA
          </p>
          <h1 style={{
            fontFamily: "var(--font-playfair,Georgia,serif)",
            fontSize: "clamp(26px, 4vw, 38px)", fontWeight: 700,
            color: "#0D1B2A", marginBottom: 16, lineHeight: 1.2,
          }}>
            Termos de Uso
          </h1>
          <p style={{ fontSize: 13, color: "#8a7a6a" }}>
            Versão 1.0 · Última atualização: junho de 2026
          </p>
        </div>

        <div style={{ height: 1, background: "rgba(13,27,42,0.10)", marginBottom: 48 }} />

        <div style={{ display: "flex", flexDirection: "column", gap: 36 }}>

          <Section n={1} title="Aceitação dos Termos">
            <p>
              Ao acessar ou utilizar a plataforma PRAXIS, você declara ter lido, compreendido e concordado com estes Termos de Uso, bem como com a nossa{" "}
              <Link href="/privacidade" style={{ color: "#b8976a" }}>Política de Privacidade</Link>.
              Caso não concorde com qualquer disposição deste instrumento, não utilize a plataforma.
            </p>
            <p style={{ marginTop: 10 }}>
              O uso da plataforma é exclusivo para profissionais médicos com CRM ativo ou estudantes de medicina devidamente identificados. A PRAXIS reserva-se o direito de encerrar contas que violem esta condição.
            </p>
          </Section>

          <Section n={2} title="Descrição do Serviço">
            <p>
              A PRAXIS é uma plataforma SaaS (Software como Serviço) voltada para médicos, que oferece ferramentas baseadas em inteligência artificial para marketing médico, gestão clínica, criação de conteúdo, controle financeiro e análise de indicadores clínicos. Os serviços incluem, entre outros:
            </p>
            <ul style={{ paddingLeft: 20, marginTop: 10, display: "flex", flexDirection: "column", gap: 6 }}>
              <li>Geração de roteiros e legendas para redes sociais</li>
              <li>Calculadoras clínicas e ferramentas de apoio diagnóstico</li>
              <li>CRM de leads e gestão de pacientes</li>
              <li>Relatórios financeiros e indicadores de clínica</li>
              <li>Integração com APIs de terceiros (Meta Graph API, Stripe, Supabase)</li>
            </ul>
          </Section>

          <Section n={3} title="Responsabilidade Profissional e Conformidade CFM">
            <p>
              <strong style={{ color: "#0D1B2A" }}>A PRAXIS é uma ferramenta de apoio e não substitui o julgamento clínico profissional.</strong>{" "}
              Todo conteúdo gerado por IA deve ser revisado e aprovado pelo médico antes de sua publicação ou utilização.
            </p>
            <p style={{ marginTop: 10 }}>
              O usuário é integral e exclusivamente responsável pela conformidade de todo conteúdo publicado com as normas do Conselho Federal de Medicina (CFM), especialmente:
            </p>
            <ul style={{ paddingLeft: 20, marginTop: 10, display: "flex", flexDirection: "column", gap: 6 }}>
              <li><strong style={{ color: "#0D1B2A" }}>Resolução CFM nº 1.974/2011</strong> — Regulamentação da publicidade médica</li>
              <li><strong style={{ color: "#0D1B2A" }}>Código de Ética Médica (Res. CFM nº 2.217/2018)</strong> — Capítulo XIV: Publicidade médica</li>
              <li><strong style={{ color: "#0D1B2A" }}>Resolução CFM nº 2.336/2023</strong> — Marketing médico em redes sociais</li>
            </ul>
            <p style={{ marginTop: 10 }}>
              É expressamente vedado ao usuário utilizar a plataforma para criar conteúdo que faça promessas de cura, apresente resultados garantidos, use depoimentos de pacientes sem autorização expressa, ou viole qualquer norma de ética médica vigente. A PRAXIS não se responsabiliza por infrações éticas cometidas pelo usuário.
            </p>
          </Section>

          <Section n={4} title="Planos e Pagamentos">
            <p>
              A plataforma oferece planos pagos (Starter, Pro, Elite e Elite Anual) com período de teste gratuito de 7 (sete) dias. Após o término do trial, o plano será cobrado automaticamente via Stripe com o cartão cadastrado, salvo cancelamento prévio.
            </p>
            <ul style={{ paddingLeft: 20, marginTop: 10, display: "flex", flexDirection: "column", gap: 6 }}>
              <li>Os preços podem ser atualizados com aviso prévio de 30 dias por e-mail</li>
              <li>Não há fidelidade — cancelamento a qualquer momento pelo portal Stripe</li>
              <li>Reembolsos são avaliados individualmente mediante solicitação em até 7 dias da cobrança</li>
              <li>Dados de cartão são processados exclusivamente pelo Stripe — a PRAXIS não armazena dados financeiros</li>
            </ul>
          </Section>

          <Section n={5} title="Propriedade Intelectual">
            <p>
              Todo o código-fonte, design, marca, logotipos e documentação da plataforma PRAXIS são propriedade exclusiva de seus criadores e protegidos pela Lei nº 9.279/1996 (Propriedade Industrial) e Lei nº 9.610/1998 (Direitos Autorais).
            </p>
            <p style={{ marginTop: 10 }}>
              O conteúdo gerado pelo usuário através das ferramentas de IA pertence ao próprio usuário. A PRAXIS não reivindica direitos sobre roteiros, legendas ou relatórios produzidos na plataforma.
            </p>
          </Section>

          <Section n={6} title="Uso Aceitável e Condutas Vedadas">
            <p>É expressamente proibido:</p>
            <ul style={{ paddingLeft: 20, marginTop: 10, display: "flex", flexDirection: "column", gap: 6 }}>
              <li>Usar a plataforma para finalidades ilegais ou que violem normas médicas</li>
              <li>Compartilhar credenciais de acesso com terceiros</li>
              <li>Realizar engenharia reversa, scraping ou tentativas de acesso não autorizado</li>
              <li>Sobrecarregar sistemas com requisições automatizadas além do permitido pelo plano</li>
              <li>Publicar informações falsas sobre procedimentos ou resultados médicos</li>
              <li>Usar a plataforma para assédio, discriminação ou conteúdo ofensivo</li>
            </ul>
          </Section>

          <Section n={7} title="Limitação de Responsabilidade">
            <p>
              A PRAXIS é fornecida "no estado em que se encontra" (as-is). Não garantimos disponibilidade ininterrupta, ausência de erros ou adequação a uso específico. Em nenhuma circunstância a PRAXIS será responsável por danos indiretos, lucros cessantes ou perda de dados decorrentes do uso ou impossibilidade de uso da plataforma.
            </p>
            <p style={{ marginTop: 10 }}>
              Nossa responsabilidade total está limitada ao valor pago nos últimos 3 (três) meses de assinatura.
            </p>
          </Section>

          <Section n={8} title="Privacidade e LGPD">
            <p>
              O tratamento de dados pessoais segue as disposições da Lei Geral de Proteção de Dados (Lei nº 13.709/2018 — LGPD). Para informações detalhadas sobre coleta, uso, armazenamento e seus direitos como titular, consulte nossa{" "}
              <Link href="/privacidade" style={{ color: "#b8976a" }}>Política de Privacidade</Link>.
            </p>
          </Section>

          <Section n={9} title="Suspensão e Encerramento">
            <p>
              A PRAXIS pode suspender ou encerrar sua conta sem aviso prévio em caso de violação destes Termos, inadimplência ou uso fraudulento. Você pode solicitar o encerramento da conta e a exclusão de seus dados a qualquer momento em{" "}
              <Link href="/deletar-dados" style={{ color: "#b8976a" }}>praxisplataforma.com.br/deletar-dados</Link>.
            </p>
            <p style={{ marginTop: 10 }}>
              Após o encerramento, os dados são retidos por 90 dias para fins de recuperação, após o que são anonimizados ou excluídos permanentemente.
            </p>
          </Section>

          <Section n={10} title="Disposições Gerais">
            <p>
              Estes Termos são regidos pela legislação brasileira. O foro competente para dirimir controvérsias é o da Comarca de São Paulo/SP, com renúncia expressa a qualquer outro, por mais privilegiado que seja.
            </p>
            <p style={{ marginTop: 10 }}>
              A PRAXIS pode atualizar estes Termos mediante notificação por e-mail com antecedência mínima de 15 dias. O uso continuado da plataforma após a vigência das alterações implica aceitação dos novos termos.
            </p>
            <p style={{ marginTop: 10 }}>
              Dúvidas:{" "}
              <a href="mailto:contato@praxisplataforma.com.br" style={{ color: "#b8976a" }}>
                contato@praxisplataforma.com.br
              </a>
            </p>
          </Section>

        </div>

        <div style={{ height: 1, background: "rgba(13,27,42,0.10)", margin: "48px 0 32px" }} />

        <p style={{ fontSize: 11, fontFamily: "monospace", color: "#8a7a6a", letterSpacing: "1px" }}>
          © PRAXIS 2026 · Marketing Médico de Alto Padrão ·{" "}
          <Link href="/privacidade" style={{ color: "#8a7a6a" }}>Política de Privacidade</Link>
          {" · "}
          <Link href="/deletar-dados" style={{ color: "#8a7a6a" }}>Exclusão de Dados</Link>
        </p>
      </div>
    </div>
  )
}
