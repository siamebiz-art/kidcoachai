import { createCanvas } from "canvas";
import { writeFileSync, mkdirSync } from "fs";

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const dir = "public/icons";
mkdirSync(dir, { recursive: true });

for (const size of sizes) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext("2d");

  // Rounded rect background gradient
  const r = size * 0.2;
  ctx.beginPath();
  ctx.moveTo(r, 0);
  ctx.lineTo(size - r, 0);
  ctx.arcTo(size, 0, size, r, r);
  ctx.lineTo(size, size - r);
  ctx.arcTo(size, size, size - r, size, r);
  ctx.lineTo(r, size);
  ctx.arcTo(0, size, 0, size - r, r);
  ctx.lineTo(0, r);
  ctx.arcTo(0, 0, r, 0, r);
  ctx.closePath();

  const grad = ctx.createLinearGradient(0, 0, size, size);
  grad.addColorStop(0, "#8B5CF6");
  grad.addColorStop(1, "#EC4899");
  ctx.fillStyle = grad;
  ctx.fill();

  // Heart emoji
  ctx.font = `${size * 0.5}px serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("💜", size / 2, size / 2);

  writeFileSync(`${dir}/icon-${size}x${size}.png`, canvas.toBuffer("image/png"));
  console.log(`Created ${size}x${size}`);
}
