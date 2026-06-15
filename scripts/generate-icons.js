const { createCanvas } = require("canvas")
const fs = require("fs")
const path = require("path")

const SIZES = [72, 96, 128, 144, 152, 192, 384, 512]
const BG    = "#0D1B2A"
const GOLD  = "#b8976a"
const OUT   = path.join(__dirname, "../public/icons")

if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true })

for (const size of SIZES) {
  const canvas = createCanvas(size, size)
  const ctx    = canvas.getContext("2d")

  // Background
  ctx.fillStyle = BG
  ctx.fillRect(0, 0, size, size)

  // Subtle rounded corner effect via clip (maskable safe zone = center 80%)
  const r = size * 0.18
  ctx.beginPath()
  ctx.moveTo(r, 0)
  ctx.lineTo(size - r, 0)
  ctx.quadraticCurveTo(size, 0, size, r)
  ctx.lineTo(size, size - r)
  ctx.quadraticCurveTo(size, size, size - r, size)
  ctx.lineTo(r, size)
  ctx.quadraticCurveTo(0, size, 0, size - r)
  ctx.lineTo(0, r)
  ctx.quadraticCurveTo(0, 0, r, 0)
  ctx.closePath()
  ctx.fillStyle = BG
  ctx.fill()

  // "P" letter — Playfair-style serif P
  ctx.fillStyle = GOLD
  const fontSize = Math.round(size * 0.58)
  ctx.font = `bold ${fontSize}px Georgia, serif`
  ctx.textAlign    = "center"
  ctx.textBaseline = "middle"
  ctx.fillText("P", size / 2, size / 2 + size * 0.03)

  // Gold accent line bottom
  ctx.fillStyle = GOLD
  ctx.fillRect(size * 0.3, size * 0.82, size * 0.4, size * 0.025)

  const buf = canvas.toBuffer("image/png")
  fs.writeFileSync(path.join(OUT, `icon-${size}.png`), buf)
  console.log(`✓ icon-${size}.png`)
}

console.log("\nDone — all icons written to public/icons/")
