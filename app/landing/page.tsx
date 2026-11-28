import { redirect } from "next/navigation"

// Endereço antigo da página inicial: mantém links externos funcionando.
export default function LandingAntiga() {
  redirect("/")
}
