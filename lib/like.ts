/** Escapa os curingas de LIKE/ILIKE (%, _ e a barra invertida) para comparar um texto literal. */
export function escapeLike(texto: string): string {
  return texto.replace(/[\\%_]/g, c => "\\" + c)
}
