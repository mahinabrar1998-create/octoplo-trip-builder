import { Plane, Globe, MapPin, Compass, Camera, Luggage } from "lucide-react";

const icons = [
  { Icon: Plane, top: "10%", left: "5%", delay: "0s", size: 32 },
  { Icon: Globe, top: "20%", right: "8%", delay: "2s", size: 28 },
  { Icon: MapPin, top: "45%", left: "3%", delay: "4s", size: 24 },
  { Icon: Compass, top: "70%", right: "5%", delay: "1s", size: 30 },
  { Icon: Camera, top: "80%", left: "8%", delay: "3s", size: 26 },
  { Icon: Luggage, top: "35%", right: "4%", delay: "5s", size: 28 },
  { Icon: Plane, top: "60%", left: "6%", delay: "2.5s", size: 22, rotate: true },
  { Icon: Globe, top: "85%", right: "10%", delay: "1.5s", size: 20 },
];

const BackgroundIcons = () => {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {icons.map((item, index) => {
        const { Icon, top, left, right, delay, size, rotate } = item;
        return (
          <div
            key={index}
            className="absolute animate-float-slow"
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
              className="text-primary/60"
              strokeWidth={1.5}
            />
          </div>
        );
      })}
    </div>
  );
};

export default BackgroundIcons;
