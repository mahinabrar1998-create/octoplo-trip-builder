import { cn } from "@/lib/utils";

interface MountainClimberProps {
  className?: string;
  message?: string;
}

const MountainClimber = ({ className, message }: MountainClimberProps) => {
  return (
    <div className={cn("flex flex-col items-center gap-4", className)}>
      <div className="relative w-64 h-48">
        {/* Floating travel icons */}
        <svg viewBox="0 0 200 40" className="absolute top-0 left-0 w-full h-10 overflow-visible">
          <g className="animate-[float_3s_ease-in-out_infinite]">
            {/* Map pin */}
            <circle cx="60" cy="18" r="8" className="fill-primary/15" />
            <path d="M60,12 a4,4 0 1,0 0.01,0 L60,22 Z" className="fill-primary/60" />
            <circle cx="60" cy="14.5" r="1.5" className="fill-background" />
          </g>
          <g className="animate-[float_3s_ease-in-out_infinite_0.5s]">
            {/* Plane */}
            <path d="M120,22 l-4,-2 l-8,0 l3,2 l-3,2 l8,0 Z" className="fill-primary/40" />
          </g>
          <g className="animate-[float_3s_ease-in-out_infinite_1s]">
            {/* Globe */}
            <circle cx="140" cy="12" r="7" className="stroke-primary/35 fill-none" strokeWidth="1.2" />
            <ellipse cx="140" cy="12" rx="3" ry="7" className="stroke-primary/35 fill-none" strokeWidth="1" />
            <line x1="133" y1="12" x2="147" y2="12" className="stroke-primary/35" strokeWidth="1" />
          </g>
        </svg>

        {/* Ground + Character scene */}
        <svg viewBox="0 0 200 100" className="absolute bottom-0 left-0 w-full h-32 overflow-visible">
          {/* Ground line */}
          <line x1="20" y1="82" x2="180" y2="82"
            className="stroke-primary/20" strokeWidth="1.5" strokeLinecap="round" />
          {/* Dotted trail */}
          {[0,1,2,3,4].map(i => (
            <circle
              key={i}
              cx={120 + i * 12}
              cy="82"
              r="2.5"
              className="fill-primary/25 animate-pulse"
              style={{ animationDelay: `${i * 0.2}s` }}
            />
          ))}

          {/* Walker group — slides left to right */}
          <g className="animate-[walk_3s_ease-in-out_infinite]">
            {/* Shadow */}
            <ellipse cx="80" cy="83" rx="10" ry="2" className="fill-foreground/10" />

            {/* Left leg */}
            <rect x="75" y="63" width="4.5" height="18" rx="2"
              className="fill-foreground origin-top animate-[leftLeg_0.6s_ease-in-out_infinite]"
              style={{ transformBox: 'fill-box', transformOrigin: '50% 0%' }} />
            {/* Right leg */}
            <rect x="80" y="63" width="4.5" height="18" rx="2"
              className="fill-foreground origin-top animate-[rightLeg_0.6s_ease-in-out_infinite]"
              style={{ transformBox: 'fill-box', transformOrigin: '50% 0%' }} />

            {/* Shoes */}
            <rect x="73" y="78" width="7" height="3.5" rx="1.5"
              className="fill-foreground/80 origin-top animate-[leftLeg_0.6s_ease-in-out_infinite]"
              style={{ transformBox: 'fill-box', transformOrigin: '50% 0%' }} />
            <rect x="79" y="78" width="7" height="3.5" rx="1.5"
              className="fill-foreground/80 origin-top animate-[rightLeg_0.6s_ease-in-out_infinite]"
              style={{ transformBox: 'fill-box', transformOrigin: '50% 0%' }} />

            {/* Torso */}
            <rect x="73" y="42" width="14" height="23" rx="4" className="fill-foreground" />

            {/* Backpack */}
            <rect x="68" y="44" width="8" height="16" rx="3" className="fill-primary" />
            <rect x="69" y="46" width="6" height="4" rx="1.5" className="fill-primary/70" />
            {/* Backpack strap */}
            <line x1="76" y1="46" x2="73" y2="50" className="stroke-primary/80" strokeWidth="1.2" />

            {/* Left arm */}
            <rect x="68" y="46" width="4" height="14" rx="2"
              className="fill-foreground origin-top animate-[leftArm_0.6s_ease-in-out_infinite]"
              style={{ transformBox: 'fill-box', transformOrigin: '50% 0%' }} />
            {/* Right arm */}
            <rect x="88" y="46" width="4" height="14" rx="2"
              className="fill-foreground origin-top animate-[rightArm_0.6s_ease-in-out_infinite]"
              style={{ transformBox: 'fill-box', transformOrigin: '50% 0%' }} />

            {/* Head */}
            <circle cx="80" cy="34" r="9" className="fill-foreground" />
            {/* Hair / cap */}
            <path d="M71,32 Q75,24 85,28 Q89,30 89,33 Z" className="fill-primary" />
            {/* Cap brim */}
            <rect x="82" y="31" width="9" height="2.5" rx="1" className="fill-primary/80" />
          </g>
        </svg>
      </div>

      {message && (
        <p className="text-muted-foreground text-sm animate-pulse">{message}</p>
      )}

      <style>{`
        @keyframes walk {
          0%, 100% { transform: translateX(-15px); }
          50% { transform: translateX(15px); }
        }
        @keyframes leftLeg {
          0%, 100% { transform: rotate(-12deg); }
          50% { transform: rotate(12deg); }
        }
        @keyframes rightLeg {
          0%, 100% { transform: rotate(12deg); }
          50% { transform: rotate(-12deg); }
        }
        @keyframes leftArm {
          0%, 100% { transform: rotate(12deg); }
          50% { transform: rotate(-12deg); }
        }
        @keyframes rightArm {
          0%, 100% { transform: rotate(-12deg); }
          50% { transform: rotate(12deg); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
      `}</style>
    </div>
  );
};

export default MountainClimber;
