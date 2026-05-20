import { useEffect, useState } from "react";

interface Particle {
  id: number;
  x: number;
  y: number;
  color: string;
  size: number;
  delay: number;
  duration: number;
  rotation: number;
}

const COLORS = ["#7c5cff", "#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#ec4899", "#22d3ee", "#ffffff"];

function generateParticles(count: number): Particle[] {
  return Array.from({ length: count }).map((_, i) => ({
    id: i,
    x: 40 + Math.random() * 20,
    y: 40 + Math.random() * 20,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    size: 4 + Math.random() * 8,
    delay: Math.random() * 0.3,
    duration: 1.5 + Math.random() * 1.5,
    rotation: Math.random() * 360,
  }));
}

export function CelebrationOverlay({ show, onDone }: { show: boolean; onDone?: () => void }) {
  const [visible, setVisible] = useState(false);
  const [particles] = useState(() => generateParticles(40));

  useEffect(() => {
    if (show) {
      setVisible(true);
      const t = setTimeout(() => {
        setVisible(false);
        onDone?.();
      }, 2800);
      return () => clearTimeout(t);
    }
  }, [show, onDone]);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[200] pointer-events-none flex items-center justify-center">
      {/* Dark backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fade-in" />

      {/* Center message */}
      <div className="relative z-10 text-center animate-scale-in">
        <div className="mb-3 sm:mb-4 animate-bounce-soft"><svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-amber-400 mx-auto sm:w-14 sm:h-14"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg></div>
        <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight drop-shadow-2xl">
          ¡Completado!
        </h2>
        <p className="text-xs sm:text-sm text-blue-400 font-bold mt-1 sm:mt-2 uppercase tracking-widest">
          Has terminado una nueva aventura
        </p>
      </div>

      {/* Confetti particles */}
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute rounded-full pointer-events-none"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            boxShadow: `0 0 ${p.size * 2}px ${p.color}`,
            animation: `confetti-pop ${p.duration}s cubic-bezier(0.22, 1, 0.36, 1) ${p.delay}s forwards`,
            opacity: 0,
          }}
        />
      ))}

      <style>{`
        @keyframes confetti-pop {
          0% {
            opacity: 1;
            transform: translate(0, 0) rotate(0deg) scale(1);
          }
          100% {
            opacity: 0;
            transform: translate(
              ${Math.random() > 0.5 ? '' : '-'}${100 + Math.random() * 300}px,
              ${200 + Math.random() * 300}px
            ) rotate(${Math.random() > 0.5 ? '' : '-'}${360 + Math.random() * 720}deg) scale(0);
          }
        }
      `}</style>
    </div>
  );
}
