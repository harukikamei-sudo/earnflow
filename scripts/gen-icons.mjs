// favicon.svg から PWA / Apple 用の PNG アイコンを生成する
import sharp from "sharp";
import { readFileSync } from "node:fs";

const svg = readFileSync("public/favicon.svg");
const BG = "#0c0b14";

async function gen(size, out, pad = 0) {
  const inner = Math.round(size * (1 - pad * 2));
  const icon = await sharp(svg, { density: 384 }).resize(inner, inner).png().toBuffer();
  await sharp({ create: { width: size, height: size, channels: 4, background: BG } })
    .composite([{ input: icon, gravity: "center" }])
    .png()
    .toFile(out);
  console.log("✓", out);
}

await gen(192, "public/pwa-192.png");
await gen(512, "public/pwa-512.png");
await gen(512, "public/pwa-maskable-512.png", 0.12);
await gen(180, "public/apple-touch-icon.png");
