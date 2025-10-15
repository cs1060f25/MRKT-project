import { Calendar, MapPin, TrendingDown, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export interface Event {
  id: string;
  name: string;
  date: string;
  location: string;
  ticketsAvailable: number;
  currentPrice: number;
  startingPrice: number;
  totalBids: number;
  imageUrl: string;
}

interface EventCardProps {
  event: Event;
  onBid: (event: Event) => void;
}

export const EventCard = ({ event, onBid }: EventCardProps) => {
  const priceDropPercent = Math.round(
    ((event.startingPrice - event.currentPrice) / event.startingPrice) * 100
  );

  return (
    <Card className="overflow-hidden transition-all duration-300 hover:shadow-[var(--shadow-hover)] group">
      <div className="aspect-video overflow-hidden bg-muted">
        <img
          src={event.imageUrl}
          alt={event.name}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
      </div>
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-3">
          <h3 className="font-semibold text-lg leading-tight">{event.name}</h3>
          {priceDropPercent > 0 && (
            <Badge variant="secondary" className="ml-2 flex items-center gap-1">
              <TrendingDown className="w-3 h-3" />
              {priceDropPercent}%
            </Badge>
          )}
        </div>
        
        <div className="space-y-2 text-sm text-muted-foreground mb-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            <span>{event.date}</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            <span>{event.location}</span>
          </div>
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            <span>{event.ticketsAvailable} tickets available</span>
          </div>
        </div>

        <div className="bg-gradient-to-r from-primary/5 to-accent/5 rounded-lg p-4 space-y-2">
          <div className="flex items-baseline justify-between">
            <span className="text-sm text-muted-foreground">Current Price</span>
            <span className="text-2xl font-bold text-primary">
              ${event.currentPrice}
            </span>
          </div>
          {event.totalBids > 0 && (
            <div className="text-xs text-muted-foreground">
              {event.totalBids} active bids
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="p-6 pt-0">
        <Button
          onClick={() => onBid(event)}
          className="w-full"
          size="lg"
        >
          Place Bid
        </Button>
      </CardFooter>
    </Card>
  );
};
