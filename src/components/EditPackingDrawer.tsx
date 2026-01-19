import { useState, useEffect } from "react";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sparkles, Loader2, Check, X, Luggage, Plus, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface EditPackingDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  packingTips: string[];
  destination: string;
  tripDates: { start: string; end: string };
  onSave: (tips: string[]) => void;
}

export function EditPackingDrawer({
  open,
  onOpenChange,
  packingTips,
  destination,
  tripDates,
  onSave,
}: EditPackingDrawerProps) {
  const { toast } = useToast();
  const [tips, setTips] = useState<string[]>([]);
  const [newTip, setNewTip] = useState("");
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  useEffect(() => {
    if (open) {
      setTips(packingTips.length > 0 ? [...packingTips] : []);
    }
  }, [packingTips, open]);

  const handleAddTip = () => {
    if (newTip.trim()) {
      setTips([...tips, newTip.trim()]);
      setNewTip("");
    }
  };

  const handleRemoveTip = (index: number) => {
    setTips(tips.filter((_, i) => i !== index));
  };

  const handleGetSuggestions = async () => {
    setLoadingSuggestions(true);

    try {
      const { data, error } = await supabase.functions.invoke("suggest-alternatives", {
        body: {
          type: "packing",
          destination,
          tripDates,
        },
      });

      if (error) throw error;

      if (data?.suggestions) {
        const newTips = data.suggestions.map((s: { title: string }) => s.title);
        setTips([...tips, ...newTips.slice(0, 3)]);
        toast({ title: "AI suggestions added" });
      }
    } catch (err) {
      console.error("Error getting packing suggestions:", err);
      toast({
        title: "Couldn't get suggestions",
        description: "Please add tips manually.",
        variant: "destructive",
      });
    } finally {
      setLoadingSuggestions(false);
    }
  };

  const handleSave = () => {
    onSave(tips);
    onOpenChange(false);
  };

  const handleClose = () => {
    onOpenChange(false);
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[90vh]">
        <div className="overflow-y-auto">
          <DrawerHeader className="text-left">
            <DrawerTitle className="flex items-center gap-2">
              <Luggage className="w-5 h-5 text-primary" />
              Packing Tips
            </DrawerTitle>
            <DrawerDescription>
              {destination} • {tripDates.start} to {tripDates.end}
            </DrawerDescription>
          </DrawerHeader>

          <div className="px-4 space-y-4">
            {/* AI Suggestions */}
            <Button
              variant="outline"
              onClick={handleGetSuggestions}
              disabled={loadingSuggestions}
              className="w-full gap-2 border-primary/30 hover:border-primary hover:bg-primary/5"
            >
              {loadingSuggestions ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Getting suggestions...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-primary" />
                  Get AI Packing Suggestions
                </>
              )}
            </Button>

            {/* Current Tips */}
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground font-medium">Your packing tips:</p>
              {tips.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {tips.map((tip, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-1 bg-muted text-muted-foreground px-2.5 py-1 rounded-full text-sm group"
                    >
                      <span>{tip}</span>
                      <button
                        onClick={() => handleRemoveTip(i)}
                        className="ml-1 text-muted-foreground hover:text-destructive transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No tips added yet</p>
              )}
            </div>

            {/* Add New Tip */}
            <div className="flex gap-2 pt-2 border-t border-border">
              <Input
                placeholder="e.g., Comfortable walking shoes"
                value={newTip}
                onChange={(e) => setNewTip(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddTip()}
                className="flex-1 h-9"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={handleAddTip}
                disabled={!newTip.trim()}
                className="h-9 w-9"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <DrawerFooter className="flex-row gap-2">
            <DrawerClose asChild>
              <Button variant="outline" onClick={handleClose} className="flex-1 gap-1">
                <X className="w-4 h-4" />
                Cancel
              </Button>
            </DrawerClose>
            <Button onClick={handleSave} className="flex-1 gap-1">
              <Check className="w-4 h-4" />
              Save Tips
            </Button>
          </DrawerFooter>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
