import { useState } from "react";
import { Event } from "./EventCard";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar, MapPin, TrendingDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface BidDialogProps {
  event: Event | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const BidDialog = ({ event, open, onOpenChange }: BidDialogProps) => {
  const [bidAmount, setBidAmount] = useState("");
  const [quantity, setQuantity] = useState("1");
  const { toast } = useToast();

  if (!event) return null;

  const handleSubmitBid = () => {
    const bid = parseFloat(bidAmount);
    const qty = parseInt(quantity);

    if (!bid || bid < event.currentPrice) {
      toast({
        title: "Invalid Bid",
        description: `Bid must be at least $${event.currentPrice}`,
        variant: "destructive",
      });
      return;
    }

    if (!qty || qty < 1 || qty > event.ticketsAvailable) {
      toast({
        title: "Invalid Quantity",
        description: `Quantity must be between 1 and ${event.ticketsAvailable}`,
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Bid Placed Successfully!",
      description: `Your bid of $${bid} for ${qty} ticket(s) to ${event.name} has been placed.`,
    });

    setBidAmount("");
    setQuantity("1");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-2xl">Place Your Bid</DialogTitle>
          <DialogDescription>
            Enter your bid for {event.name}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="aspect-video overflow-hidden rounded-lg bg-muted">
            <img
              src={event.imageUrl}
              alt={event.name}
              className="w-full h-full object-cover"
            />
          </div>

          <div className="space-y-3">
            <h3 className="font-semibold text-lg">{event.name}</h3>
            <div className="space-y-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>{event.date}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                <span>{event.location}</span>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-primary/10 to-accent/10 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Current Price</span>
              <span className="text-2xl font-bold text-primary">
                ${event.currentPrice}
              </span>
            </div>
            <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
              <TrendingDown className="w-4 h-4" />
              <span>Price drops as auction progresses</span>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="bidAmount">Your Bid ($)</Label>
              <Input
                id="bidAmount"
                type="number"
                placeholder={`Minimum: ${event.currentPrice}`}
                value={bidAmount}
                onChange={(e) => setBidAmount(e.target.value)}
                min={event.currentPrice}
                step="0.01"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="quantity">Number of Tickets</Label>
              <Input
                id="quantity"
                type="number"
                placeholder="1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                min="1"
                max={event.ticketsAvailable}
              />
              <p className="text-xs text-muted-foreground">
                {event.ticketsAvailable} tickets available
              </p>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmitBid}>
            Submit Bid
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
