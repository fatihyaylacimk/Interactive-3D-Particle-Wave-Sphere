const canvas = document.getElementById("scene");
const ctx = canvas.getContext("2d");

let width, height, dpr;
let points = [];
let time = 0;

const mouse = {
  x: 0,
  y: 0,
  rx: 0,
  ry: 0,
  targetRx: -0.25,
  targetRy: 0.35
};

const config = {
  count: 2600,
  radius: 245,
  camera: 760
};

function resize() {
  dpr = Math.max(1, Math.min(window.devicePixelRatio || 1, 2));
  width = window.innerWidth;
  height = window.innerHeight;

  canvas.width = Math.floor(width * dpr);
  canvas.height = Math.floor(height * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function createSphere() {
  points = [];

  for (let i = 0; i < config.count; i++) {
    const phi = Math.acos(1 - 2 * (i + 0.5) / config.count);
    const theta = Math.PI * (1 + Math.sqrt(5)) * i;

    const x = Math.cos(theta) * Math.sin(phi);
    const y = Math.sin(theta) * Math.sin(phi);
    const z = Math.cos(phi);

    points.push({
      bx: x,
      by: y,
      bz: z,
      phase: Math.random() * Math.PI * 2,
      size: Math.random() * 1.4 + 0.45
    });
  }
}

function rotate(x, y, z, rx, ry) {
  const cosY = Math.cos(ry);
  const sinY = Math.sin(ry);

  let x1 = x * cosY - z * sinY;
  let z1 = x * sinY + z * cosY;

  const cosX = Math.cos(rx);
  const sinX = Math.sin(rx);

  let y1 = y * cosX - z1 * sinX;
  let z2 = y * sinX + z1 * cosX;

  return { x: x1, y: y1, z: z2 };
}

function drawBackground() {
  ctx.fillStyle = "rgba(1, 4, 7, 0.34)";
  ctx.fillRect(0, 0, width, height);

  const glow = ctx.createRadialGradient(width / 2, height / 2, 0, width / 2, height / 2, Math.min(width, height) * 0.55);
  glow.addColorStop(0, "rgba(0,255,210,0.11)");
  glow.addColorStop(0.35, "rgba(0,120,255,0.045)");
  glow.addColorStop(1, "rgba(0,0,0,0)");

  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, width, height);
}

function drawCore() {
  const g = ctx.createRadialGradient(width / 2, height / 2, 0, width / 2, height / 2, 210);
  g.addColorStop(0, "rgba(0,255,210,0.20)");
  g.addColorStop(0.3, "rgba(0,255,210,0.07)");
  g.addColorStop(1, "rgba(0,255,210,0)");

  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(width / 2, height / 2, 220, 0, Math.PI * 2);
  ctx.fill();
}

function render() {
  time += 0.014;

  mouse.rx += (mouse.targetRx - mouse.rx) * 0.045;
  mouse.ry += (mouse.targetRy - mouse.ry) * 0.045;

  if (Math.abs(mouse.targetRy) < 2) {
    mouse.targetRy += 0.0025;
  }

  drawBackground();
  drawCore();

  const projected = [];

  for (const p of points) {
    const wave =
      Math.sin((p.by * 7.0) + time * 2.2 + p.phase) * 22 +
      Math.sin((p.bx * 8.0) - time * 1.5) * 16 +
      Math.cos((p.bz * 9.0) + time * 1.9) * 12;

    const r = config.radius + wave;

    const x = p.bx * r;
    const y = p.by * r;
    const z = p.bz * r;

    const rotated = rotate(x, y, z, mouse.rx, mouse.ry);
    const scale = config.camera / (config.camera - rotated.z);

    projected.push({
      x: width / 2 + rotated.x * scale,
      y: height / 2 + rotated.y * scale,
      z: rotated.z,
      scale,
      size: p.size,
      alpha: Math.max(0.08, Math.min(0.96, (rotated.z + config.radius) / (config.radius * 2)))
    });
  }

  projected.sort((a, b) => a.z - b.z);

  ctx.shadowBlur = 12;
  ctx.shadowColor = "rgba(0,255,210,0.8)";

  for (const p of projected) {
    const radius = p.size * p.scale * 1.25;
    const alpha = 0.18 + p.alpha * 0.75;

    ctx.beginPath();
    ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(72, 255, 220, ${alpha})`;
    ctx.fill();
  }

  ctx.shadowBlur = 0;
  drawConnections(projected);

  requestAnimationFrame(render);
}

function drawConnections(projected) {
  ctx.lineWidth = 0.6;

  for (let i = 0; i < projected.length; i += 7) {
    const a = projected[i];

    for (let j = i + 7; j < Math.min(i + 65, projected.length); j += 7) {
      const b = projected[j];
      const dx = a.x - b.x;
      const dy = a.y - b.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < 24) {
        const alpha = (1 - dist / 24) * 0.2;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.strokeStyle = `rgba(72,255,220,${alpha})`;
        ctx.stroke();
      }
    }
  }
}

window.addEventListener("resize", resize);

window.addEventListener("mousemove", (e) => {
  const nx = e.clientX / width - 0.5;
  const ny = e.clientY / height - 0.5;

  mouse.targetRy = nx * 1.35;
  mouse.targetRx = -0.25 + ny * 0.85;
});

window.addEventListener("touchmove", (e) => {
  const t = e.touches[0];
  const nx = t.clientX / width - 0.5;
  const ny = t.clientY / height - 0.5;

  mouse.targetRy = nx * 1.35;
  mouse.targetRx = -0.25 + ny * 0.85;
}, { passive: true });

resize();
createSphere();
ctx.fillStyle = "#010407";
ctx.fillRect(0, 0, width, height);
render();
