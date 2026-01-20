import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerClose,
} from "@/components/ui/drawer";
import { supabase } from "@/integrations/supabase/client";
import {
  Loader2,
  X,
  Users,
  Check,
  HelpCircle,
  XCircle,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

type ResponseType = "going" | "maybe" | "not_going";

type Invite = {
  id: string;
  guest_name: string;
  guest_email: string;
};

type BlockResponse = {
  invite_id: string;
  day_index: number;
  block_index: number;
  response: ResponseType;
};

type Day = {
  dayNumber: number;
  date: string;
  blocks: { title: string; time: string; endTime: string }[];
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tripId: string;
  tripName: string;
  days: Day[];
};

const GuestResponsesSummary = ({ open, onOpenChange, tripId, tripName, days }: Props) => {
  const [loading, setLoading] = useState(false);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [responses, setResponses] = useState<BlockResponse[]>([]);
  const [openDays, setOpenDays] = useState<number[]>([1]);

  // Reset state when tripId changes
  useEffect(() => {
    setInvites([]);
    setResponses([]);
  }, [tripId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch invites
      const { data: inviteData, error: inviteError } = await supabase
        .from("trip_invites" as never)
        .select("id, guest_name, guest_email")
        .eq("trip_id", tripId);

      if (inviteError) throw inviteError;
      setInvites((inviteData as unknown as Invite[]) || []);

      // Fetch all responses for this trip's invites
      if (inviteData && inviteData.length > 0) {
        const inviteIds = (inviteData as { id: string }[]).map((i) => i.id);
        const { data: respData, error: respError } = await supabase
          .from("trip_block_responses" as never)
          .select("invite_id, day_index, block_index, response")
          .in("invite_id", inviteIds);

        if (respError) throw respError;
        setResponses((respData as unknown as BlockResponse[]) || []);
      } else {
        setResponses([]);
      }
    } catch (err) {
      console.error("Error fetching responses:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      void fetchData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, tripId]);

  const handleOpenChange = (isOpen: boolean) => {
    onOpenChange(isOpen);
  };

  const toggleDay = (dayNumber: number) => {
    setOpenDays((prev) =>
      prev.includes(dayNumber) ? prev.filter((d) => d !== dayNumber) : [...prev, dayNumber]
    );
  };

  const getResponsesForBlock = (dayIndex: number, blockIndex: number) => {
    return responses.filter(
      (r) => r.day_index === dayIndex && r.block_index === blockIndex
    );
  };

  const getGuestName = (inviteId: string) => {
    const invite = invites.find((i) => i.id === inviteId);
    return invite?.guest_name || "Unknown";
  };

  const ResponseIcon = ({ response }: { response: ResponseType }) => {
    switch (response) {
      case "going":
        return <Check className="w-3.5 h-3.5 text-green-600" />;
      case "maybe":
        return <HelpCircle className="w-3.5 h-3.5 text-yellow-600" />;
      case "not_going":
        return <XCircle className="w-3.5 h-3.5 text-red-600" />;
    }
  };

  return (
    <Drawer open={open} onOpenChange={handleOpenChange}>
      <DrawerContent className="max-h-[90vh]">
        <DrawerHeader className="border-b border-border pb-4">
          <div className="flex items-center justify-between">
            <DrawerTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              Guest Responses
            </DrawerTitle>
            <DrawerClose asChild>
              <Button variant="ghost" size="icon">
                <X className="w-4 h-4" />
              </Button>
            </DrawerClose>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            See who's available for "{tripName}"
          </p>
        </DrawerHeader>

        <div className="p-4 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : invites.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No guests have been invited yet.
            </p>
          ) : (
            <div className="space-y-3">
              {/* Summary */}
              <div className="bg-muted/50 rounded-lg p-3 mb-4">
                <p className="text-sm text-muted-foreground">
                  {invites.length} guest{invites.length !== 1 ? "s" : ""} invited •{" "}
                  {new Set(responses.map((r) => r.invite_id)).size} responded
                </p>
              </div>

              {/* Days */}
              {days.map((day, dayIndex) => (
                <Collapsible
                  key={day.dayNumber}
                  open={openDays.includes(day.dayNumber)}
                  onOpenChange={() => toggleDay(day.dayNumber)}
                >
                  <CollapsibleTrigger className="w-full">
                    <div className="bg-card rounded-lg p-3 border border-border/50 hover:border-primary/30 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                            {day.dayNumber}
                          </div>
                          <div className="text-left">
                            <div className="font-medium text-foreground text-sm">
                              Day {day.dayNumber}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {new Date(day.date).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                              })}
                            </div>
                          </div>
                        </div>
                        <ChevronDown
                          className={cn(
                            "w-4 h-4 text-muted-foreground transition-transform",
                            openDays.includes(day.dayNumber) && "rotate-180"
                          )}
                        />
                      </div>
                    </div>
                  </CollapsibleTrigger>

                  <CollapsibleContent>
                    <div className="mt-2 space-y-2 pl-2">
                      {day.blocks.map((block, blockIndex) => {
                        const blockResponses = getResponsesForBlock(dayIndex, blockIndex);
                        const going = blockResponses.filter((r) => r.response === "going");
                        const maybe = blockResponses.filter((r) => r.response === "maybe");
                        const notGoing = blockResponses.filter((r) => r.response === "not_going");

                        return (
                          <div
                            key={blockIndex}
                            className="bg-card rounded-lg p-3 border border-border/30"
                          >
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <div>
                                <p className="text-sm font-medium text-foreground">
                                  {block.title}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {block.time} - {block.endTime}
                                </p>
                              </div>
                              {blockResponses.length > 0 && (
                                <div className="flex items-center gap-2 text-xs shrink-0">
                                  {going.length > 0 && (
                                    <span className="flex items-center gap-0.5 text-green-600">
                                      <Check className="w-3 h-3" />
                                      {going.length}
                                    </span>
                                  )}
                                  {maybe.length > 0 && (
                                    <span className="flex items-center gap-0.5 text-yellow-600">
                                      <HelpCircle className="w-3 h-3" />
                                      {maybe.length}
                                    </span>
                                  )}
                                  {notGoing.length > 0 && (
                                    <span className="flex items-center gap-0.5 text-red-600">
                                      <XCircle className="w-3 h-3" />
                                      {notGoing.length}
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>

                            {blockResponses.length === 0 ? (
                              <p className="text-xs text-muted-foreground italic">
                                No responses yet
                              </p>
                            ) : (
                              <div className="flex flex-wrap gap-1.5">
                                {blockResponses.map((r, i) => (
                                  <span
                                    key={i}
                                    className={cn(
                                      "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs",
                                      r.response === "going" && "bg-green-100 text-green-700",
                                      r.response === "maybe" && "bg-yellow-100 text-yellow-700",
                                      r.response === "not_going" && "bg-red-100 text-red-700"
                                    )}
                                  >
                                    <ResponseIcon response={r.response} />
                                    {getGuestName(r.invite_id)}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              ))}
            </div>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export default GuestResponsesSummary;
