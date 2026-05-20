import { useEffect, useRef, useState } from "react";

interface ConfettiPiece {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  rotation: number;
  rotationSpeed: number;
}

export function useConfetti() {
  const [active, setActive] = useState(false);

  function trigger() {
    setActive(true);
    setTimeout(() => setActive(false), 3500);
  }

  return { active, trigger };
}

export function ConfettiOverlay({ active }: { active: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!active) return;
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;

    let animId = 0;
    let w = window.innerWidth;
    let h = window.innerHeight;
    canvas.width = w;
    canvas.height = h;

    const colors = ["#f43f5e", "#3b82f6", "#10b981", "#f59e0b", "#a855f7", "#ec4899", "#22d3ee", "#84cc16"];
    const pieces: ConfettiPiece[] = [];

    for (let i = 0; i < 150; i++) {
      pieces.push({
        x: w / 2 + (Math.random() - 0.5) * 200,
        y: h / 2 - 100 + (Math.random() - 0.5) * 100,
        vx: (Math.random() - 0.5) * 18,
        vy: -Math.random() * 18 - 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: Math.random() * 8 + 4,
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 12,
      });
    }

    const gravity = 0.35;
    const drag = 0.96;

    function loop() {
      ctx.clearRect(0, 0, w, h);
      let alive = false;
      for (const p of pieces) {
        p.vy += gravity;
        p.vx *= drag;
        p.vy *= drag;
        p.x += p.vx;
        p.y += p.vy;
        p.rotation += p.rotationSpeed;
        if (p.y < h + 50) alive = true;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
        ctx.restore();
      }
      if (alive) {
        animId = requestAnimationFrame(loop);
      }
    }

    loop();

    function onResize() {
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = w;
      canvas.height = h;
    }
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", onResize);
    };
  }, [active]);

  if (!active) return null;

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 z-[100]"
    />
  );
}
