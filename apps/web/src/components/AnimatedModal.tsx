import { useAnimatedExit } from "../hooks/useAnimatedExit";
import clsx from "clsx";

interface Props {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
  panelClassName?: string;
}

/**
 * Modal wrapper with smooth enter/exit animations.
 * Delays unmounting so fade-out / scale-out animations can finish.
 */
export function AnimatedModal({ open, onClose, children, className, panelClassName }: Props) {
  const { isOpen, isClosing } = useAnimatedExit(open, 220);

  if (!isOpen) return null;

  return (
    <div
      className={clsx(
        "fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm",
        isClosing ? "animate-backdrop-out" : "animate-fade-in",
        className,
      )}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className={clsx(
          panelClassName,
          isClosing ? "animate-scale-out" : "animate-scale-in",
        )}
      >
        {children}
      </div>
    </div>
  );
}
