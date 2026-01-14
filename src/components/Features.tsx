import { 
  Sparkles, 
  Calendar, 
  Users, 
  RefreshCw, 
  Link2, 
  Camera 
} from "lucide-react";

const features = [
  {
    icon: Sparkles,
    title: "AI-Assisted Planning",
    description: "Smart, context-aware suggestions while you stay in control.",
  },
  {
    icon: Calendar,
    title: "Smart Itineraries",
    description: "Automatically organized days with realistic timing and buffers.",
  },
  {
    icon: Users,
    title: "Trip Collaboration",
    description: "See who's going, maybe, or away — all in one place.",
  },
  {
    icon: RefreshCw,
    title: "Flexible Planning",
    description: "Adjust plans easily when things change.",
  },
  {
    icon: Link2,
    title: "Shared Trip Hub",
    description: "One live itinerary link everyone stays aligned on.",
  },
  {
    icon: Camera,
    title: "Save Memories",
    description: "A shared album that auto-organizes your trip photos.",
  },
];

const Features = () => {
  return (
    <section id="features" className="py-16 md:py-24 px-6 bg-muted/30">
      <div className="max-w-5xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-14">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4 text-balance">
            Everything you need for the perfect trip
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto text-balance">
            Thoughtfully designed tools to plan, coordinate, and relive your journey — together.
          </p>
        </div>

        {/* Feature Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="bg-card rounded-2xl p-6 shadow-card border border-border/50 hover:shadow-soft transition-shadow"
            >
              <div className="w-11 h-11 rounded-xl bg-secondary flex items-center justify-center mb-5">
                <feature.icon className="w-5 h-5 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                {feature.title}
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
