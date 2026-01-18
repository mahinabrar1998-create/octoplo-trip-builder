import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Sparkles, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
const EntryCards = () => {
  const navigate = useNavigate();
  const [scratchClicked, setScratchClicked] = useState(false);
  return <section id="how-it-works" className="py-12 px-6 md:py-[8px]">
      <div className="max-w-4xl mx-auto">
        <div className="grid md:grid-cols-2 gap-6">
          {/* Primary Card - AI Generated */}
          <div className="relative bg-card rounded-2xl p-8 shadow-soft-lg border border-border/50 md:scale-[1.02] hover:shadow-lg transition-shadow">
            {/* Accent badge */}
            <div className="inline-flex items-center gap-1.5 bg-secondary text-secondary-foreground text-xs font-medium px-3 py-1.5 rounded-full mb-6">
              <Sparkles className="w-3.5 h-3.5" />
              Recommended
            </div>

            <h3 className="text-xl font-semibold text-foreground mb-3">
              Let Octoplo build it for you
            </h3>
            
            <p className="text-muted-foreground mb-8 leading-relaxed">Answer a few questions and get a complete trip plan.</p>

            <Button size="lg" className="w-full rounded-xl font-medium shadow-soft" onClick={() => navigate("/generate")}>
              Generate my trip
            </Button>

            <p className="text-xs text-muted-foreground text-center mt-4">
              Takes under a minute
            </p>
          </div>

          {/* Secondary Card - Manual */}
          <div className="bg-card rounded-2xl p-8 shadow-card border border-border/50 hover:shadow-soft transition-shadow">
            <div className="inline-flex items-center gap-1.5 text-muted-foreground text-xs font-medium px-3 py-1.5 rounded-full mb-6 border border-border">
              <Pencil className="w-3.5 h-3.5" />
              DIY
            </div>

            <h3 className="text-xl font-semibold text-foreground mb-3">
              Build it myself
            </h3>
            
            <p className="text-muted-foreground mb-8 leading-relaxed">
              Create your itinerary time-block by time-block. Octoplo suggests activities, costs, and backups as you go.
            </p>

            <Button variant="outline" size="lg" type="button" aria-pressed={scratchClicked} className={`w-full rounded-xl font-medium transition-colors ${scratchClicked ? "bg-primary text-primary-foreground border-primary hover:bg-primary active:bg-primary" : "hover:bg-primary hover:text-primary-foreground hover:border-primary active:bg-primary active:text-primary-foreground"}`} onPointerDown={() => setScratchClicked(true)} onClick={() => setScratchClicked(true)}>
              Start from scratch
            </Button>

            <p className="text-xs text-muted-foreground text-center mt-4">
              AI suggestions are optional
            </p>
          </div>
        </div>
      </div>
    </section>;
};
export default EntryCards;