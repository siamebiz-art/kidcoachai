import { createCanvas, loadImage } from "canvas";
import { writeFileSync, mkdirSync } from "fs";

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const dir = "public/icons";
mkdirSync(dir, { recursive: true });

const img = await loadImage("public/icons/icon-512x512.png");

for (const size of sizes) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext("2d");
  ctx.drawImage(img, 0, 0, size, size);
  writeFileSync(`${dir}/icon-${size}x${size}.png`, canvas.toBuffer("image/png"));
  console.log(`✓ icon-${size}x${size}.png`);
}

// Favicon sizes
const faviconSizes = [16, 32, 180];
for (const size of faviconSizes) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext("2d");
  ctx.drawImage(img, 0, 0, size, size);
  const name = size === 180 ? "apple-touch-icon.png" : `favicon-${size}x${size}.png`;
  writeFileSync(`public/${name}`, canvas.toBuffer("image/png"));
  console.log(`✓ ${name}`);
}

console.log("Done!");
