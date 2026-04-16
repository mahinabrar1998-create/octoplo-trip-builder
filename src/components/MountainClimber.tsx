import { cn } from "@/lib/utils";

interface MountainClimberProps {
  className?: string;
  message?: string;
}

const MountainClimber = ({ className, message }: MountainClimberProps) => {
  return (
    <div className={cn("flex flex-col items-center gap-4", className)}>
      <div className="relative w-72 h-56">
        {/* Floating travel icons — bigger and spread out */}
        <svg viewBox="0 0 300 60" className="absolute top-0 left-0 w-full h-16 overflow-visible">
          {/* Plane - left side */}
          <g className="animate-[float_3s_ease-in-out_infinite]" style={{ transformOrigin: '40px 30px' }}>
            <circle cx="40" cy="30" r="18" className="fill-primary/10" />
            {/* Simplified airplane */}
            <path d="M25,30 L55,30 M40,22 L48,30 L40,38" className="stroke-primary/60" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            <path d="M35,30 L40,25 L40,35 Z" className="fill-primary/50" />
            {/* Contrails */}
            <path d="M20,26 L12,24 M20,30 L10,30 M20,34 L12,36" className="stroke-primary/40" strokeWidth="2" strokeLinecap="round" />
          </g>
          
          {/* Globe - center */}
          <g className="animate-[float_3s_ease-in-out_infinite_0.6s]" style={{ transformOrigin: '150px 25px' }}>
            <circle cx="150" cy="25" r="20" className="stroke-primary/35 fill-none" strokeWidth="2" />
            <ellipse cx="150" cy="25" rx="9" ry="20" className="stroke-primary/35 fill-none" strokeWidth="1.5" />
            <line x1="130" y1="25" x2="170" y2="25" className="stroke-primary/35" strokeWidth="1.5" />
            <line x1="140" y1="12" x2="140" y2="38" className="stroke-primary/35" strokeWidth="1" />
            <line x1="160" y1="12" x2="160" y2="38" className="stroke-primary/35" strokeWidth="1" />
          </g>
          
          {/* Hills/Mountains - right side */}
          <g className="animate-[float_3s_ease-in-out_infinite_1.2s]" style={{ transformOrigin: '260px 35px' }}>
            <circle cx="260" cy="35" r="18" className="fill-primary/10" />
            {/* Three peaks */}
            <path d="M235,48 L248,22 L261,48 Z" className="fill-primary/45" />
            <path d="M250,48 L263,18 L276,48 Z" className="fill-primary/55" />
            <path d="M265,48 L278,26 L291,48 Z" className="fill-primary/40" />
            {/* Snow caps */}
            <path d="M251,30 L257,22 L260,28" className="stroke-background/60" strokeWidth="2" strokeLinecap="round" fill="none" />
            <path d="M266,26 L272,18 L275,24" className="stroke-background/60" strokeWidth="2" strokeLinecap="round" fill="none" />
          </g>
        </svg>

        {/* Ground + Character scene */}
        <svg viewBox="0 0 200 100" className="absolute bottom-0 left-0 w-full h-36 overflow-visible">
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

          {/* Walker group */}
          <g className="animate-[walk_4s_ease-in-out_infinite]">
            {/* Shadow */}
            <ellipse cx="80" cy="83" rx="10" ry="2" className="fill-foreground/10" />

            {/* Left leg */}
            <g style={{ transformBox: 'fill-box', transformOrigin: '50% 0%' }}
               className="animate-[leftLeg_0.8s_ease-in-out_infinite]">
              <rect x="75" y="63" width="4.5" height="16" rx="2" className="fill-foreground" />
              {/* Left shin */}
              <g style={{ transformBox: 'fill-box', transformOrigin: '50% 0%' }}
                 className="animate-[leftShin_0.8s_ease-in-out_infinite]">
                <rect x="75" y="76" width="4.5" height="5" rx="2" className="fill-foreground/90" />
                <rect x="73" y="79" width="7" height="3.5" rx="1.5" className="fill-foreground/80" />
              </g>
            </g>

            {/* Right leg */}
            <g style={{ transformBox: 'fill-box', transformOrigin: '50% 0%' }}
               className="animate-[rightLeg_0.8s_ease-in-out_infinite]">
              <rect x="80" y="63" width="4.5" height="16" rx="2" className="fill-foreground" />
              {/* Right shin */}
              <g style={{ transformBox: 'fill-box', transformOrigin: '50% 0%' }}
                 className="animate-[rightShin_0.8s_ease-in-out_infinite]">
                <rect x="80" y="76" width="4.5" height="5" rx="2" className="fill-foreground/90" />
                <rect x="79" y="79" width="7" height="3.5" rx="1.5" className="fill-foreground/80" />
              </g>
            </g>

            {/* Torso with slight bob */}
            <g className="animate-[torso_0.4s_ease-in-out_infinite]">
              <rect x="73" y="42" width="14" height="23" rx="4" className="fill-foreground" />

              {/* Backpack */}
              <rect x="68" y="44" width="8" height="16" rx="3" className="fill-primary" />
              <rect x="69" y="46" width="6" height="4" rx="1.5" className="fill-primary/70" />
              <line x1="76" y1="46" x2="73" y2="50" className="stroke-primary/80" strokeWidth="1.2" />

              {/* Left arm */}
              <g style={{ transformBox: 'fill-box', transformOrigin: '50% 0%' }}
                 className="animate-[leftArm_0.8s_ease-in-out_infinite]">
                <rect x="68" y="46" width="4" height="10" rx="2" className="fill-foreground" />
                <rect x="68" y="54" width="4" height="6" rx="2" className="fill-foreground/90 animate-[leftForearm_0.8s_ease-in-out_infinite]"
                  style={{ transformBox: 'fill-box', transformOrigin: '50% 0%' }} />
              </g>
              {/* Right arm */}
              <g style={{ transformBox: 'fill-box', transformOrigin: '50% 0%' }}
                 className="animate-[rightArm_0.8s_ease-in-out_infinite]">
                <rect x="88" y="46" width="4" height="10" rx="2" className="fill-foreground" />
                <rect x="88" y="54" width="4" height="6" rx="2" className="fill-foreground/90 animate-[rightForearm_0.8s_ease-in-out_infinite]"
                  style={{ transformBox: 'fill-box', transformOrigin: '50% 0%' }} />
              </g>

              {/* Head */}
              <circle cx="80" cy="34" r="9" className="fill-foreground" />
              {/* Hair / cap */}
              <path d="M71,32 Q75,24 85,28 Q89,30 89,33 Z" className="fill-primary" />
              <rect x="82" y="31" width="9" height="2.5" rx="1" className="fill-primary/80" />
            </g>
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
        @keyframes torso {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-1.2px); }
        }
        @keyframes leftLeg {
          0% { transform: rotate(-15deg); }
          50% { transform: rotate(15deg); }
          100% { transform: rotate(-15deg); }
        }
        @keyframes rightLeg {
          0% { transform: rotate(15deg); }
          50% { transform: rotate(-15deg); }
          100% { transform: rotate(15deg); }
        }
        @keyframes leftShin {
          0% { transform: rotate(8deg); }
          25% { transform: rotate(-5deg); }
          50% { transform: rotate(0deg); }
          75% { transform: rotate(12deg); }
          100% { transform: rotate(8deg); }
        }
        @keyframes rightShin {
          0% { transform: rotate(0deg); }
          25% { transform: rotate(12deg); }
          50% { transform: rotate(8deg); }
          75% { transform: rotate(-5deg); }
          100% { transform: rotate(0deg); }
        }
        @keyframes leftArm {
          0%, 100% { transform: rotate(18deg); }
          50% { transform: rotate(-18deg); }
        }
        @keyframes rightArm {
          0%, 100% { transform: rotate(-18deg); }
          50% { transform: rotate(18deg); }
        }
        @keyframes leftForearm {
          0%, 100% { transform: rotate(-10deg); }
          50% { transform: rotate(15deg); }
        }
        @keyframes rightForearm {
          0%, 100% { transform: rotate(15deg); }
          50% { transform: rotate(-10deg); }
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
