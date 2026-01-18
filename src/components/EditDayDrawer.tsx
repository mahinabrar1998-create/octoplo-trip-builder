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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Check, X, Calendar } from "lucide-react";
import { Day, Weather } from "@/types/trip";

interface EditDayDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  day: Day | null;
  onSave: (updatedDay: Day) => void;
}

const weatherConditions: Weather["condition"][] = [
  "sunny",
  "partly-cloudy",
  "cloudy",
  "rainy",
  "stormy",
  "snowy",
  "windy",
];

export function EditDayDrawer({
  open,
  onOpenChange,
  day,
  onSave,
}: EditDayDrawerProps) {
  const [editedDay, setEditedDay] = useState<Day | null>(null);

  useEffect(() => {
    if (day && open) {
      setEditedDay({ ...day });
    }
  }, [day, open]);

  const handleSave = () => {
    if (!editedDay) return;
    onSave(editedDay);
    onOpenChange(false);
  };

  const handleClose = () => {
    onOpenChange(false);
  };

  if (!day || !editedDay) return null;

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[90vh]">
        <div className="overflow-y-auto">
          <DrawerHeader className="text-left">
            <DrawerTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              Edit Day {day.dayNumber}
            </DrawerTitle>
            <DrawerDescription>
              {new Date(day.date).toLocaleDateString("en-US", {
                weekday: "long",
                month: "long",
                day: "numeric",
              })}
            </DrawerDescription>
          </DrawerHeader>

          <div className="px-4 space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Date</Label>
              <Input
                type="date"
                value={editedDay.date}
                onChange={(e) =>
                  setEditedDay({ ...editedDay, date: e.target.value })
                }
                className="h-9"
              />
            </div>

            <div className="space-y-3 pt-2 border-t border-border">
              <h4 className="text-sm font-medium text-foreground">Weather</h4>
              
              <div className="space-y-1.5">
                <Label className="text-xs">Condition</Label>
                <Select
                  value={editedDay.weather.condition}
                  onValueChange={(value) =>
                    setEditedDay({
                      ...editedDay,
                      weather: {
                        ...editedDay.weather,
                        condition: value as Weather["condition"],
                      },
                    })
                  }
                >
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {weatherConditions.map((condition) => (
                      <SelectItem key={condition} value={condition}>
                        {condition.replace("-", " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">High Temp (°F)</Label>
                  <Input
                    type="number"
                    value={editedDay.weather.highTemp}
                    onChange={(e) =>
                      setEditedDay({
                        ...editedDay,
                        weather: {
                          ...editedDay.weather,
                          highTemp: parseInt(e.target.value) || 0,
                        },
                      })
                    }
                    className="h-9"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Low Temp (°F)</Label>
                  <Input
                    type="number"
                    value={editedDay.weather.lowTemp}
                    onChange={(e) =>
                      setEditedDay({
                        ...editedDay,
                        weather: {
                          ...editedDay.weather,
                          lowTemp: parseInt(e.target.value) || 0,
                        },
                      })
                    }
                    className="h-9"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Weather Note</Label>
                <Input
                  value={editedDay.weather.note}
                  onChange={(e) =>
                    setEditedDay({
                      ...editedDay,
                      weather: {
                        ...editedDay.weather,
                        note: e.target.value,
                      },
                    })
                  }
                  placeholder="e.g., Bring an umbrella"
                  className="h-9"
                />
              </div>
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
              Save Changes
            </Button>
          </DrawerFooter>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
