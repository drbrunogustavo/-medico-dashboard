import { NextRequest } from "next/server"
import { repassarClaude } from "@/lib/ai-proxy"

export async function POST(request: NextRequest) {
  return repassarClaude(request, "/api/ganchos")
}
