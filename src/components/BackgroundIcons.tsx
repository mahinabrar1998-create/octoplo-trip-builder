import { Plane, Globe, MapPin, Compass, Camera, Luggage } from "lucide-react";

const icons = [
  // Left side
  { Icon: Plane, top: "10%", left: "5%", delay: "0s", size: 32 },
  { Icon: MapPin, top: "45%", left: "3%", delay: "4s", size: 24 },
  { Icon: Camera, top: "80%", left: "8%", delay: "3s", size: 26 },
  { Icon: Plane, top: "60%", left: "6%", delay: "2.5s", size: 22, rotate: true },
  // Center-left
  { Icon: Globe, top: "15%", left: "25%", delay: "1s", size: 26 },
  { Icon: Compass, top: "55%", left: "30%", delay: "3.5s", size: 24 },
  { Icon: Luggage, top: "75%", left: "22%", delay: "0.5s", size: 22 },
  // Center
  { Icon: MapPin, top: "25%", left: "45%", delay: "2s", size: 28 },
  { Icon: Camera, top: "50%", left: "50%", delay: "4.5s", size: 24 },
  { Icon: Plane, top: "70%", left: "48%", delay: "1.5s", size: 26, rotate: true },
  // Center-right
  { Icon: Globe, top: "20%", left: "65%", delay: "3s", size: 24 },
  { Icon: Compass, top: "60%", left: "70%", delay: "0s", size: 22 },
  { Icon: Luggage, top: "85%", left: "72%", delay: "2.5s", size: 26 },
  // Right side
  { Icon: Globe, top: "20%", right: "8%", delay: "2s", size: 28 },
  { Icon: Compass, top: "70%", right: "5%", delay: "1s", size: 30 },
  { Icon: Luggage, top: "35%", right: "4%", delay: "5s", size: 28 },
  { Icon: Globe, top: "85%", right: "10%", delay: "1.5s", size: 20 },
];

const BackgroundIcons = () => {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {icons.map((item, index) => {
        const { Icon, top, left, right, delay, size, rotate } = item;
        // Hide every other icon on mobile (odd indices hidden)
        const mobileHidden = index % 2 === 1 ? "hidden md:block" : "";
        return (
          <div
            key={index}
            className={`absolute animate-float-slow ${mobileHidden}`}
            style={{
              top,
              left,
              right,
              animationDelay: delay,
              transform: rotate ? "rotate(-45deg)" : undefined,
            }}
          >
            <Icon
              size={size}
              className="text-primary/40"
              strokeWidth={1.5}
            />
          </div>
        );
      })}
    </div>
  );
};

export default BackgroundIcons;
