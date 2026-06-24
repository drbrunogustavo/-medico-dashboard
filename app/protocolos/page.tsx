import { redirect } from "next/navigation"

export default function ProtocolosRedirect() {
  redirect("/prescricao?tab=protocolos")
}
