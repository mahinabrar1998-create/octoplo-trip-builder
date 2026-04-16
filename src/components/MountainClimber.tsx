import { cn } from "@/lib/utils";
import hikerImage from "@/assets/hiker-loading.png";

interface MountainClimberProps {
  className?: string;
  message?: string;
}

const MountainClimber = ({ className, message }: MountainClimberProps) => {
  return (
    <div className={cn("flex flex-col items-center gap-2", className)}>
      <div className="relative w-[320px] h-[320px] animate-[hikerBob_2s_ease-in-out_infinite]">
        <img
          src={hikerImage}
          alt="Hiker climbing"
          className="w-full h-full object-contain"
          width={1024}
          height={768}
        />
      </div>
      {message && (
        <p className="text-muted-foreground text-sm animate-pulse">{message}</p>
      )}
      <style>{`
        @keyframes hikerBob {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
      `}</style>
    </div>
  );
};

export default MountainClimber;
