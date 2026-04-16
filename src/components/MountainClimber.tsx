import type { CSSProperties } from "react";
import { cn } from "@/lib/utils";
import hikerImage from "@/assets/hiker-loading.png";

interface MountainClimberProps {
  className?: string;
  message?: string;
}

interface SliceProps {
  className?: string;
  clipPath: string;
  style?: CSSProperties;
}

const AnimatedSlice = ({ className, clipPath, style }: SliceProps) => (
  <img
    src={hikerImage}
    alt=""
    aria-hidden="true"
    className={cn(
      "pointer-events-none absolute inset-0 h-full w-full select-none object-cover",
      className,
    )}
    style={{ clipPath, ...style }}
  />
);

const MountainClimber = ({ className, message }: MountainClimberProps) => {
  return (
    <div className={cn("flex flex-col items-center gap-3", className)}>
      <div
        role="img"
        aria-label={message ?? "Animated hiker climbing a hill while your trip loads"}
        className="relative w-full max-w-[420px] overflow-hidden rounded-3xl"
      >
        <div className="hiker-scene relative aspect-[1237/864] overflow-hidden rounded-3xl bg-gradient-to-br from-background via-background to-secondary/20 shadow-soft-lg">
          <img
            src={hikerImage}
            alt=""
            aria-hidden="true"
            className="hiker-base pointer-events-none absolute inset-0 h-full w-full select-none object-cover opacity-45"
            width={1237}
            height={864}
          />

          <div className="hiker-wash absolute left-[30%] top-[28%] h-[34%] w-[20%] rounded-full bg-background/90 blur-2xl" />
          <div className="hiker-wash absolute left-[47%] top-[26%] h-[18%] w-[12%] rounded-full bg-background/55 blur-xl" />
          <div className="hiker-wash absolute left-[58%] top-[15%] h-[16%] w-[12%] rounded-full bg-background/50 blur-xl" />

          <AnimatedSlice
            className="hiker-guide-1 opacity-0"
            clipPath="polygon(43% 27%, 49% 23%, 56% 27%, 59% 44%, 53% 60%, 44% 58%, 40% 42%)"
          />
          <AnimatedSlice
            className="hiker-guide-2 opacity-0"
            clipPath="polygon(58% 14%, 63% 10%, 71% 15%, 73% 33%, 66% 49%, 58% 45%, 55% 29%)"
          />
          <AnimatedSlice
            className="hiker-dots"
            clipPath="polygon(45% 50%, 72% 43%, 72% 61%, 45% 63%)"
          />
          <AnimatedSlice
            className="hiker-curve"
            clipPath="polygon(27% 18%, 45% 12%, 48% 28%, 32% 36%, 24% 26%)"
          />

          <div className="absolute inset-0">
            <AnimatedSlice
              className="hiker-body"
              clipPath="polygon(29% 28%, 38% 24%, 46% 30%, 45% 41%, 40% 51%, 29% 52%, 25% 37%)"
            />
            <AnimatedSlice
              className="hiker-front-arm"
              clipPath="polygon(38% 33%, 48% 31%, 52% 36%, 49% 43%, 40% 41%)"
            />
            <AnimatedSlice
              className="hiker-front-leg"
              clipPath="polygon(35% 43%, 45% 42%, 48% 61%, 39% 67%, 33% 54%)"
            />
            <AnimatedSlice
              className="hiker-back-leg"
              clipPath="polygon(28% 42%, 36% 41%, 38% 60%, 30% 69%, 25% 57%)"
            />
          </div>

          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[22%] bg-gradient-to-t from-background via-background/95 to-transparent" />
          <div className="pointer-events-none absolute inset-0 rounded-3xl border border-border/70" />
        </div>
      </div>
      {message && (
        <p className="text-muted-foreground text-sm animate-pulse">{message}</p>
      )}
      <style>{`
        .hiker-scene {
          isolation: isolate;
        }

        .hiker-base {
          filter: saturate(0.94) contrast(1.02);
        }

        @keyframes sceneBreathe {
          0%, 100% { opacity: 0.88; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.04); }
        }

        @keyframes guidePulse {
          0%, 100% { opacity: 0; transform: translate3d(0, 0.5%, 0) scale(0.96); }
          35% { opacity: 0.22; }
          60% { opacity: 0.48; transform: translate3d(0, -1.2%, 0) scale(1); }
        }

        @keyframes dotsDrift {
          0% { opacity: 0.18; transform: translate3d(-1.2%, 1%, 0); }
          50% { opacity: 0.72; transform: translate3d(1%, -1.2%, 0); }
          100% { opacity: 0.18; transform: translate3d(3.2%, -2.4%, 0); }
        }

        @keyframes arrowSweep {
          0%, 100% { opacity: 0.16; transform: translate3d(-1%, 1%, 0) rotate(-3deg); }
          50% { opacity: 0.55; transform: translate3d(2.4%, -2%, 0) rotate(1deg); }
        }

        @keyframes climberBody {
          0%, 100% { transform: translate3d(-1.2%, 1.2%, 0) rotate(-3deg); }
          25% { transform: translate3d(0.8%, -1.6%, 0) rotate(0deg); }
          50% { transform: translate3d(2.6%, -3.9%, 0) rotate(2deg); }
          75% { transform: translate3d(1.4%, -2.4%, 0) rotate(-1deg); }
        }

        @keyframes frontArmReach {
          0%, 100% { transform: translate3d(-1%, 1%, 0) rotate(-8deg); }
          50% { transform: translate3d(2.8%, -3.4%, 0) rotate(10deg); }
        }

        @keyframes frontLegLift {
          0%, 100% { transform: translate3d(-1%, 1.5%, 0) rotate(-7deg); }
          50% { transform: translate3d(2.4%, -4.6%, 0) rotate(13deg); }
        }

        @keyframes backLegPush {
          0%, 100% { transform: translate3d(-1%, 1.2%, 0) rotate(8deg); }
          50% { transform: translate3d(1.8%, -2.2%, 0) rotate(-4deg); }
        }

        .hiker-wash {
          animation: sceneBreathe 2.8s ease-in-out infinite;
        }

        .hiker-guide-1,
        .hiker-guide-2,
        .hiker-dots,
        .hiker-curve,
        .hiker-body,
        .hiker-front-arm,
        .hiker-front-leg,
        .hiker-back-leg {
          will-change: transform, opacity;
        }

        .hiker-guide-1 {
          animation: guidePulse 1.6s ease-in-out infinite;
        }

        .hiker-guide-2 {
          animation: guidePulse 1.6s ease-in-out infinite 0.8s;
        }

        .hiker-dots {
          animation: dotsDrift 1.45s linear infinite;
        }

        .hiker-curve {
          animation: arrowSweep 1.9s ease-in-out infinite;
        }

        .hiker-body {
          transform-origin: 35% 41%;
          animation: climberBody 1.15s cubic-bezier(0.55, 0.12, 0.35, 1) infinite;
        }

        .hiker-front-arm {
          transform-origin: 39% 37%;
          animation: frontArmReach 1.15s cubic-bezier(0.55, 0.12, 0.35, 1) infinite;
        }

        .hiker-front-leg {
          transform-origin: 39% 51%;
          animation: frontLegLift 1.15s cubic-bezier(0.55, 0.12, 0.35, 1) infinite;
        }

        .hiker-back-leg {
          transform-origin: 31% 51%;
          animation: backLegPush 1.15s cubic-bezier(0.55, 0.12, 0.35, 1) infinite;
        }

        @media (prefers-reduced-motion: reduce) {
          .hiker-wash,
          .hiker-guide-1,
          .hiker-guide-2,
          .hiker-dots,
          .hiker-curve,
          .hiker-body,
          .hiker-front-arm,
          .hiker-front-leg,
          .hiker-back-leg {
            animation: none !important;
            opacity: 1;
            transform: none !important;
          }
        }
      `}</style>
    </div>
  );
};

export default MountainClimber;
