import { useEffect, useRef } from "react";
import { useSettingsStore } from "../stores/settings";

export function ParticleBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const enabled = useSettingsStore((s) => s.settings?.particlesEnabled ?? false);

  useEffect(() => {
    if (!enabled) return;
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;

    let animId = 0;
    let w = 0;
    let h = 0;

    const particles: {
      x: number;
      y: number;
      vx: number;
      vy: number;
      radius: number;
      opacity: number;
      color: string;
    }[] = [];

    const colors = ["#7c5cff", "#3b82f6", "#10b981", "#f59e0b", "#ec4899", "#22d3ee"];

    function resize() {
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = w;
      canvas.height = h;
    }

    function spawn() {
      for (let i = 0; i < 40; i++) {
        particles.push({
          x: Math.random() * w,
          y: Math.random() * h,
          vx: (Math.random() - 0.5) * 0.4,
          vy: (Math.random() - 0.5) * 0.4,
          radius: Math.random() * 2 + 1,
          opacity: Math.random() * 0.5 + 0.2,
          color: colors[Math.floor(Math.random() * colors.length)],
        });
      }
    }

    function draw() {
      ctx.clearRect(0, 0, w, h);
      for (const p of particles) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.opacity;
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }

    function update() {
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = w;
        if (p.x > w) p.x = 0;
        if (p.y < 0) p.y = h;
        if (p.y > h) p.y = 0;
      }
    }

    function loop() {
      update();
      draw();
      animId = requestAnimationFrame(loop);
    }

    resize();
    spawn();
    loop();

    window.addEventListener("resize", resize);
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, [enabled]);

  if (!enabled) return null;

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 z-[1]"
      style={{ mixBlendMode: "screen" }}
    />
  );
}
