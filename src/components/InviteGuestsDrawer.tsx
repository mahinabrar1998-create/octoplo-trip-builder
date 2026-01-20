import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerClose,
} from "@/components/ui/drawer";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Loader2,
  X,
  UserPlus,
  Copy,
  Check,
  Trash2,
  Mail,
} from "lucide-react";

type Invite = {
  id: string;
  guest_name: string;
  guest_email: string;
  invite_token: string;
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tripId: string;
  tripName: string;
};

const InviteGuestsDrawer = ({ open, onOpenChange, tripId, tripName }: Props) => {
  const { toast } = useToast();
  const [invites, setInvites] = useState<Invite[]>([]);
  const [loading, setLoading] = useState(false);
  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Reset state when tripId changes
  useEffect(() => {
    setInvites([]);
    setGuestName("");
    setGuestEmail("");
  }, [tripId]);

  const fetchInvites = async () => {
    if (!tripId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("trip_invites" as never)
        .select("id, guest_name, guest_email, invite_token")
        .eq("trip_id", tripId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setInvites((data as unknown as Invite[]) || []);
    } catch (err) {
      console.error("Error fetching invites:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      void fetchInvites();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, tripId]);

  const handleOpenChange = (isOpen: boolean) => {
    onOpenChange(isOpen);
  };

  const handleInvite = async () => {
    if (!guestName.trim() || !guestEmail.trim()) {
      toast({
        title: "Missing info",
        description: "Please enter both name and email.",
        variant: "destructive",
      });
      return;
    }

    setSending(true);
    try {
      const { data, error } = await supabase
        .from("trip_invites" as never)
        .insert({
          trip_id: tripId,
          guest_name: guestName.trim(),
          guest_email: guestEmail.trim(),
        } as never)
        .select()
        .single();

      if (error) {
        if (error.code === "23505") {
          toast({
            title: "Already invited",
            description: "This email has already been invited.",
            variant: "destructive",
          });
        } else {
          throw error;
        }
        return;
      }

      setInvites((prev) => [data as unknown as Invite, ...prev]);
      setGuestName("");
      setGuestEmail("");
      toast({
        title: "Guest invited!",
        description: "Copy the link to share with them.",
      });
    } catch (err) {
      console.error("Error inviting guest:", err);
      toast({
        title: "Error",
        description: "Failed to invite guest.",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  const copyInviteLink = async (invite: Invite) => {
    const url = `${window.location.origin}/trip/${tripId}/respond/${invite.invite_token}`;
    await navigator.clipboard.writeText(url);
    setCopiedId(invite.id);
    setTimeout(() => setCopiedId(null), 2000);
    toast({
      title: "Link copied!",
      description: `Share this with ${invite.guest_name}.`,
    });
  };

  const deleteInvite = async (inviteId: string) => {
    try {
      const { error } = await supabase
        .from("trip_invites" as never)
        .delete()
        .eq("id", inviteId);

      if (error) throw error;
      setInvites((prev) => prev.filter((i) => i.id !== inviteId));
      toast({ title: "Invite removed" });
    } catch (err) {
      console.error("Error deleting invite:", err);
      toast({
        title: "Error",
        description: "Failed to remove invite.",
        variant: "destructive",
      });
    }
  };

  return (
    <Drawer open={open} onOpenChange={handleOpenChange}>
      <DrawerContent className="max-h-[90vh]">
        <DrawerHeader className="border-b border-border pb-4">
          <div className="flex items-center justify-between">
            <DrawerTitle className="flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-primary" />
              Invite Guests
            </DrawerTitle>
            <DrawerClose asChild>
              <Button variant="ghost" size="icon">
                <X className="w-4 h-4" />
              </Button>
            </DrawerClose>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Invite friends to share their availability for "{tripName}"
          </p>
        </DrawerHeader>

        <div className="p-4 space-y-6 overflow-y-auto">
          {/* Add Guest Form */}
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Guest Name</Label>
                <Input
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  placeholder="John Doe"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Email</Label>
                <Input
                  type="email"
                  value={guestEmail}
                  onChange={(e) => setGuestEmail(e.target.value)}
                  placeholder="john@example.com"
                />
              </div>
            </div>
            <Button
              onClick={handleInvite}
              disabled={sending}
              className="w-full gap-2"
            >
              {sending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <UserPlus className="w-4 h-4" />
              )}
              Add Guest
            </Button>
          </div>

          {/* Invited Guests */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
              <Mail className="w-4 h-4" />
              Invited Guests ({invites.length})
            </h3>

            {loading ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              </div>
            ) : invites.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No guests invited yet. Add someone above!
              </p>
            ) : (
              <div className="space-y-2">
                {invites.map((invite) => (
                  <div
                    key={invite.id}
                    className="flex items-center justify-between bg-muted/50 rounded-lg p-3"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground truncate">
                        {invite.guest_name}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {invite.guest_email}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0 ml-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyInviteLink(invite)}
                        className="h-8 px-2"
                      >
                        {copiedId === invite.id ? (
                          <Check className="w-4 h-4 text-green-600" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteInvite(invite.id)}
                        className="h-8 px-2 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export default InviteGuestsDrawer;
