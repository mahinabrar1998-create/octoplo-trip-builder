import { cn } from "@/lib/utils";

interface MountainClimberProps {
  className?: string;
  message?: string;
}

const MountainClimber = ({ className, message }: MountainClimberProps) => {
  return (
    <div className={cn("flex flex-col items-center gap-4", className)}>
      <div className="relative w-24 h-28">
        {/* Mountain */}
        <svg viewBox="0 0 96 112" fill="none" className="w-full h-full">
          {/* Back mountain */}
          <polygon
            points="60,20 96,100 24,100"
            className="fill-muted-foreground/15"
          />
          {/* Front mountain */}
          <polygon
            points="28,30 68,100 0,100"
            className="fill-muted-foreground/25"
          />
          {/* Snow cap */}
          <polygon
            points="28,30 35,48 21,48"
            className="fill-background"
          />
          {/* Ground line */}
          <line x1="0" y1="100" x2="96" y2="100" className="stroke-muted-foreground/20" strokeWidth="1.5" />

          {/* Climber - animated */}
          <g className="animate-climb">
            {/* Body */}
            <circle cx="0" cy="-6" r="3" className="fill-primary" />
            {/* Torso */}
            <line x1="0" y1="-3" x2="0" y2="5" className="stroke-primary" strokeWidth="1.8" strokeLinecap="round" />
            {/* Left leg */}
            <line x1="0" y1="5" x2="-3" y2="10" className="stroke-primary animate-leg-left" strokeWidth="1.5" strokeLinecap="round" />
            {/* Right leg */}
            <line x1="0" y1="5" x2="3" y2="10" className="stroke-primary animate-leg-right" strokeWidth="1.5" strokeLinecap="round" />
            {/* Left arm */}
            <line x1="0" y1="0" x2="-4" y2="-3" className="stroke-primary animate-arm-left" strokeWidth="1.5" strokeLinecap="round" />
            {/* Right arm */}
            <line x1="0" y1="0" x2="4" y2="-3" className="stroke-primary animate-arm-right" strokeWidth="1.5" strokeLinecap="round" />
            {/* Walking stick */}
            <line x1="4" y1="-3" x2="5" y2="8" className="stroke-primary/60" strokeWidth="1" strokeLinecap="round" />
          </g>
        </svg>
      </div>
      {message && (
        <p className="text-muted-foreground text-sm animate-pulse">{message}</p>
      )}
    </div>
  );
};

export default MountainClimber;
