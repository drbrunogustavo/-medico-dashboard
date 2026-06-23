import { redirect } from "next/navigation"

export default function EmagrecimentoRedirect() {
  redirect("/prescricao?tab=emagrecimento")
}
