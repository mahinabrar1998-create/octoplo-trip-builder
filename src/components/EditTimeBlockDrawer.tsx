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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sparkles, Loader2, Check, X, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

type TimeBlock = {
  time: string;
  endTime: string;
  title: string;
  description: string;
  location: string;
  estimatedCost: string;
  category: "food" | "activity" | "transport" | "accommodation" | "free-time";
  transportNote?: string;
  weatherConsideration?: string;
};

type Suggestion = {
  title: string;
  description: string;
  location: string;
  estimatedCost: string;
  reason: string;
};

interface EditTimeBlockDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  block: TimeBlock | null;
  dayNumber: number;
  blockIndex: number;
  isNewBlock?: boolean;
  destination: string;
  tripDates: { start: string; end: string };
  onSave: (dayNumber: number, blockIndex: number, updatedBlock: TimeBlock) => void;
  onDelete?: (dayNumber: number, blockIndex: number) => void;
}

const categories = [
  { value: "food", label: "🍽️ Food" },
  { value: "activity", label: "🎯 Activity" },
  { value: "transport", label: "🚗 Transport" },
  { value: "accommodation", label: "🏨 Accommodation" },
  { value: "free-time", label: "☕ Free Time" },
  { value: "shopping", label: "🛍️ Shopping" },
];

export function EditTimeBlockDrawer({
  open,
  onOpenChange,
  block,
  dayNumber,
  blockIndex,
  isNewBlock = false,
  destination,
  tripDates,
  onSave,
  onDelete,
}: EditTimeBlockDrawerProps) {
  const { toast } = useToast();
  const [editedBlock, setEditedBlock] = useState<TimeBlock | null>(null);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  // Initialize/reset edited block when drawer opens or block changes
  useEffect(() => {
    if (block && open) {
      setEditedBlock({ ...block });
      setSuggestions([]);
    }
  }, [block, open]);

  const handleGetSuggestions = async () => {
    if (!editedBlock) return;

    setLoadingSuggestions(true);
    setSuggestions([]);

    try {
      const { data, error } = await supabase.functions.invoke("suggest-alternatives", {
        body: {
          block: editedBlock,
          category: editedBlock.category,
          destination,
          tripDates,
        },
      });

      if (error) throw error;

      if (data?.suggestions) {
        setSuggestions(data.suggestions);
      }
    } catch (err) {
      console.error("Error getting suggestions:", err);
      const message = err instanceof Error ? err.message : "Failed to get suggestions";
      toast({
        title: "Couldn't get suggestions",
        description: message,
        variant: "destructive",
      });
    } finally {
      setLoadingSuggestions(false);
    }
  };

  const applySuggestion = (suggestion: Suggestion) => {
    if (!editedBlock) return;
    setEditedBlock({
      ...editedBlock,
      title: suggestion.title,
      description: suggestion.description,
      location: suggestion.location,
      estimatedCost: suggestion.estimatedCost,
    });
    setSuggestions([]);
    toast({
      title: "Suggestion applied",
      description: "You can still modify the details before saving.",
    });
  };

  const handleSave = () => {
    if (!editedBlock) return;
    onSave(dayNumber, blockIndex, editedBlock);
    onOpenChange(false);
    setSuggestions([]);
  };

  const handleClose = () => {
    onOpenChange(false);
    setSuggestions([]);
    setEditedBlock(null);
  };

  const handleDelete = () => {
    if (onDelete) {
      onDelete(dayNumber, blockIndex);
      onOpenChange(false);
      setSuggestions([]);
      setEditedBlock(null);
    }
  };

  if (!block || !editedBlock) return null;

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[90vh]">
        <div className="overflow-y-auto">
          <DrawerHeader className="text-left">
            <DrawerTitle>{isNewBlock ? "Add Activity" : "Edit Activity"}</DrawerTitle>
            <DrawerDescription>
              Day {dayNumber} {editedBlock.time && `• ${editedBlock.time}`}{editedBlock.endTime && ` - ${editedBlock.endTime}`}
            </DrawerDescription>
          </DrawerHeader>

          <div className="px-4 space-y-4">
            {/* Category Selection - First step */}
            <div className="space-y-2">
              <Label className="text-xs font-medium">What type of activity?</Label>
              <div className="grid grid-cols-3 gap-2">
                {categories.map((cat) => (
                  <button
                    key={cat.value}
                    onClick={() => setEditedBlock({ ...editedBlock, category: cat.value as TimeBlock["category"] })}
                    className={`p-2 rounded-lg border text-sm transition-colors ${
                      editedBlock.category === cat.value
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border hover:border-primary/50 hover:bg-muted"
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* AI Suggestions Button - Shows after category selected */}
            {editedBlock.category && (
              <Button
                variant="outline"
                onClick={handleGetSuggestions}
                disabled={loadingSuggestions}
                className="w-full gap-2 border-primary/30 hover:border-primary hover:bg-primary/5"
              >
                {loadingSuggestions ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-primary" />
                    Finding {categories.find(c => c.value === editedBlock.category)?.label.split(" ")[1]} options...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-primary" />
                    Suggest {categories.find(c => c.value === editedBlock.category)?.label.split(" ")[1]} Ideas
                  </>
                )}
              </Button>
            )}

            {/* Suggestions List */}
            {suggestions.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground font-medium">AI Suggestions:</p>
                {suggestions.map((suggestion, i) => (
                  <button
                    key={i}
                    onClick={() => applySuggestion(suggestion)}
                    className="w-full text-left p-3 rounded-lg border border-border hover:border-primary/50 hover:bg-primary/5 transition-colors space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm text-foreground">{suggestion.title}</span>
                      <span className="text-xs text-muted-foreground">{suggestion.estimatedCost}</span>
                    </div>
                    <p className="text-xs text-primary">{suggestion.reason}</p>
                  </button>
                ))}
              </div>
            )}

            {/* Edit Form */}
            <div className="space-y-3 pt-2 border-t border-border">
              <div className="space-y-1.5">
                <Label htmlFor="title" className="text-xs">Title</Label>
                <Input
                  id="title"
                  value={editedBlock.title}
                  onChange={(e) => setEditedBlock({ ...editedBlock, title: e.target.value })}
                  className="h-9"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="time" className="text-xs">Start Time</Label>
                  <Input
                    id="time"
                    value={editedBlock.time}
                    onChange={(e) => setEditedBlock({ ...editedBlock, time: e.target.value })}
                    placeholder="9:00 AM"
                    className="h-9"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="endTime" className="text-xs">End Time</Label>
                  <Input
                    id="endTime"
                    value={editedBlock.endTime}
                    onChange={(e) => setEditedBlock({ ...editedBlock, endTime: e.target.value })}
                    placeholder="11:00 AM"
                    className="h-9"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="description" className="text-xs">Description</Label>
                <Textarea
                  id="description"
                  value={editedBlock.description}
                  onChange={(e) => setEditedBlock({ ...editedBlock, description: e.target.value })}
                  rows={2}
                  className="resize-none text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="location" className="text-xs">Location</Label>
                  <Input
                    id="location"
                    value={editedBlock.location}
                    onChange={(e) => setEditedBlock({ ...editedBlock, location: e.target.value })}
                    className="h-9"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="cost" className="text-xs">Est. Cost</Label>
                  <Input
                    id="cost"
                    value={editedBlock.estimatedCost}
                    onChange={(e) => setEditedBlock({ ...editedBlock, estimatedCost: e.target.value })}
                    placeholder="$25"
                    className="h-9"
                  />
                </div>
              </div>

            </div>
          </div>

          <DrawerFooter className="flex-col gap-2">
            <div className="flex gap-2">
              <DrawerClose asChild>
                <Button variant="outline" onClick={handleClose} className="flex-1 gap-1">
                  <X className="w-4 h-4 text-primary" />
                  Cancel
                </Button>
              </DrawerClose>
              <Button onClick={handleSave} className="flex-1 gap-1">
                <Check className="w-4 h-4" />
                {isNewBlock ? "Add Activity" : "Save Changes"}
              </Button>
            </div>
            {!isNewBlock && onDelete && (
              <Button variant="ghost" onClick={handleDelete} className="w-full gap-1 text-muted-foreground hover:text-destructive">
                <Trash2 className="w-4 h-4 text-primary" />
                Delete Activity
              </Button>
            )}
          </DrawerFooter>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
