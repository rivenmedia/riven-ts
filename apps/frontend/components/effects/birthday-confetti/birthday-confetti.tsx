import { cn } from "@/lib/utils";

const CONFETTI_CONFIG = {
  colors: [
    "#ff6b6b",
    "#4ecdc4",
    "#ffe66d",
    "#a8e6cf",
    "#ff8b94",
    "#ffd3b6",
    "#dcedc1",
    "#a8dadc",
    "#f1c0e8",
    "#cfbaf0",
    "#95e1d3",
    "#f38181",
  ],
  shapes: ["square", "circle", "rectangle", ""] as const,
  animations: [
    "confetti-fall-1",
    "confetti-fall-2",
    "confetti-fall-3",
    "confetti-fall-4",
    "confetti-fall-5",
  ] as const,
};

export interface BirthdayConfettiProps {
  active: boolean;
}

export function BirthdayConfetti({ active }: BirthdayConfettiProps) {
  if (!active) {
    return null;
  }

  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      {Array.from({ length: 20 }).map((_, i) => {
        const animationName =
          CONFETTI_CONFIG.animations[i % CONFETTI_CONFIG.animations.length];

        if (!animationName) {
          throw new Error(
            `Animation name not found for confetti index ${i.toString()}`,
          );
        }

        return (
          <div
            key={i}
            className={cn(
              "confetti",
              CONFETTI_CONFIG.shapes[i % CONFETTI_CONFIG.shapes.length],
            )}
            style={{
              left: `${((i * 5.26) % 100).toString()}%`,
              background:
                CONFETTI_CONFIG.colors[i % CONFETTI_CONFIG.colors.length],
              animation: `${animationName} ${(2.5 + (i % 8) * 0.2).toString()}s linear infinite`,
              animationDelay: `${((i * 0.15) % 2).toString()}s`,
              width: `${(8 + (i % 5)).toString()}px`,
              height: `${(8 + ((i * 3) % 5)).toString()}px`,
            }}
          />
        );
      })}
      <style jsx>{`
        @keyframes confetti-fall-1 {
          0% {
            transform: translateY(-100vh) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) translateX(30px) rotate(720deg);
            opacity: 0;
          }
        }

        @keyframes confetti-fall-2 {
          0% {
            transform: translateY(-100vh) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) translateX(-40px) rotate(-540deg);
            opacity: 0;
          }
        }

        @keyframes confetti-fall-3 {
          0% {
            transform: translateY(-100vh) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) translateX(50px) rotate(900deg);
            opacity: 0;
          }
        }

        @keyframes confetti-fall-4 {
          0% {
            transform: translateY(-100vh) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) translateX(-25px) rotate(-720deg);
            opacity: 0;
          }
        }

        @keyframes confetti-fall-5 {
          0% {
            transform: translateY(-100vh) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) translateX(15px) rotate(600deg);
            opacity: 0;
          }
        }

        .confetti {
          position: fixed;
          z-index: 9999;
          pointer-events: none;
          border-radius: 2px;
          opacity: 0;
        }

        .confetti.square {
          border-radius: 0;
        }

        .confetti.circle {
          border-radius: 50%;
        }

        .confetti.rectangle {
          width: 8px;
          height: 12px;
        }
      `}</style>
    </div>
  );
}
