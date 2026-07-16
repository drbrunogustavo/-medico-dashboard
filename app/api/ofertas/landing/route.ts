import { NextRequest, NextResponse } from "next/server"
import { checkAuth } from "@/lib/auth-check"
import { createSupabaseServerClient } from "@/lib/supabase-server"
import { AI_MODEL } from "@/lib/ai-config"
import { getAnthropicClient, captureAnthropicError } from "@/lib/anthropic"

export const maxDuration = 60


function cleanHtml(raw: string): string {
  return raw
    .replace(/^```html\n?/i, "")
    .replace(/^```\n?/i, "")
    .replace(/\n?```$/i, "")
    .trim()
}

export async function POST(req: NextRequest) {
  const auth = await checkAuth()
  if (!auth.authenticated) return auth.response
  const client = getAnthropicClient()
  try {
    const { tema, publico, objetivo, tom, landingPage } = await req.json()

    const supabase = createSupabaseServerClient()
    const { data: perfil } = await supabase
      .from("perfis")
      .select("cidade")
      .eq("user_id", auth.userId)
      .single()
    const localizacao = perfil?.cidade ?? "a região atendida pelo médico"

    const prompt = `Você é um desenvolvedor frontend especialista em landing pages médicas de alta conversão.

Crie uma landing page HTML completa e autocontida para esta campanha médica:

Tema: ${tema}
Público-alvo: ${publico}
Objetivo: ${objetivo}
Tom: ${tom}

Conteúdo da campanha (use para personalizar o texto):
${JSON.stringify(landingPage, null, 2)}

REQUISITOS TÉCNICOS OBRIGATÓRIOS:
- HTML completo autocontido — CSS dentro de <style>, sem arquivos externos EXCETO Google Fonts (Inter)
- Totalmente responsivo com media queries mobile-first
- Aparência premium, não genérica
- Retornar APENAS o HTML completo — sem markdown, sem explicações

SEÇÕES OBRIGATÓRIAS (nesta ordem):

1. HERO
   - Fundo: gradiente escuro de #08090e para #0f1018
   - Headline principal em branco, font-size 2.8rem desktop / 1.8rem mobile, bold
   - Subtítulo em #9ca3af, font-size 1.1rem
   - Botão CTA em #00c07f, padding 16px 40px, border-radius 8px, hover: brightness 110%
   - Elemento decorativo: círculo gradiente sutil no canto superior direito

2. PROBLEMA (id="problema")
   - Fundo: #13141d
   - Título: "Você se identifica com isso?"
   - Lista de 4-5 dores do público com ✗ em vermelho (#ef4444) antes de cada item

3. SOLUÇÃO (id="solucao")
   - Título: "A solução que você estava esperando"
   - 3 cards com borda #1c1d2a, background #13141d, ícone emoji, título, descrição
   - Hover: borda muda para #00c07f40, transform translateY(-4px), transition 0.3s

4. SOBRE O MÉDICO (id="medico")
   - Nome: o médico usuário
   - Especialidades: Endocrinologia · Nutrologia · Longevidade
   - Localização: ${localizacao}
   - CRM: visível abaixo do nome
   - Texto de autoridade em 3 linhas personalizadas para a campanha
   - Avatar com as iniciais do médico em círculo verde

5. PROVA SOCIAL (id="depoimentos")
   - 3 depoimentos fictícios em cards
   - Cada card: aspas decorativas, texto do depoimento, nome + idade + resultado obtido
   - Cards com fundo #13141d, borda #1c1d2a

6. FAQ (id="faq")
   - 5 perguntas usando acordeão CSS puro com :checked trick (input[type=checkbox] hidden + label)
   - Animação suave: max-height transition
   - Zero JavaScript para o acordeão

7. CTA FINAL (id="cta")
   - Fundo escuro com borda accent (#00c07f)
   - Headline de urgência em destaque
   - Botão WhatsApp grande (fundo #25D366) com ícone SVG do WhatsApp embutido
   - Texto de escassez abaixo em #9ca3af
   - Link href do WhatsApp: usar placeholder "https://wa.me/SEUNUMERO" (o médico substitui pelo número real)

8. RODAPÉ
   - Fundo #08090e, borda topo #1c1d2a
   - Nome + CRM + especialidade
   - Links para Instagram (@praxisplataforma) e WhatsApp
   - Aviso: "Conteúdo informativo. Consulte sempre um médico especialista."

ESTILOS GLOBAIS:
- font-family: 'Inter', sans-serif (Google Fonts)
- background: #08090e, color: #e8eaf2
- scroll-behavior: smooth no html
- Navbar fixa simples com logo e botão "Agendar Consulta"
- Botão WhatsApp flutuante no canto inferior direito (position: fixed, z-index: 999)
- Seções com padding 80px vertical desktop, 48px mobile
- IntersectionObserver em JS inline no final do body para animações fade-in (class "fade-in" + "visible")
  CSS: .fade-in { opacity:0; transform:translateY(24px); transition:opacity 0.6s, transform 0.6s }
       .fade-in.visible { opacity:1; transform:none }

Retorne APENAS o HTML começando com <!DOCTYPE html> e terminando com </html>.`

    const resp = await client.messages.create({
      model: AI_MODEL,
      max_tokens: 8000,
      messages: [{ role: "user", content: prompt }],
    })

    const raw = resp.content.find((b) => b.type === "text")?.text ?? ""
    const html = cleanHtml(raw)

    return NextResponse.json({ html })
  } catch (err) {
    captureAnthropicError(err, "/api/ofertas/landing")
    console.error(err)
    return NextResponse.json({ error: "Erro ao gerar landing page" }, { status: 500 })
  }
}
