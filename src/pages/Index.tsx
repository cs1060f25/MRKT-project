import { useState, useMemo } from "react";
import { EventCard, Event } from "@/components/EventCard";
import { BidDialog } from "@/components/BidDialog";
import { generateMockEvents } from "@/data/mockEvents";
import { TrendingDown, Gavel, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const Index = () => {
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [bidDialogOpen, setBidDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("price-low");
  
  const events = useMemo(() => generateMockEvents(), []);

  const filteredAndSortedEvents = useMemo(() => {
    let filtered = events.filter((event) =>
      event.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    switch (sortBy) {
      case "price-low":
        filtered.sort((a, b) => a.currentPrice - b.currentPrice);
        break;
      case "price-high":
        filtered.sort((a, b) => b.currentPrice - a.currentPrice);
        break;
      case "date":
        filtered.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        break;
      case "tickets":
        filtered.sort((a, b) => b.ticketsAvailable - a.ticketsAvailable);
        break;
    }

    return filtered;
  }, [events, searchQuery, sortBy]);

  const handleBidClick = (event: Event) => {
    setSelectedEvent(event);
    setBidDialogOpen(true);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-primary to-primary/90 text-primary-foreground">
        <div className="container mx-auto px-4 py-16 md:py-24">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 mb-6 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full">
              <Gavel className="w-5 h-5" />
              <span className="text-sm font-medium">Modified Dutch Auction</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
              Harvard Business School Event Marketplace
            </h1>
            <p className="text-xl md:text-2xl text-primary-foreground/90 mb-8">
              Bid on exclusive HBS event tickets with dynamic pricing. The earlier you bid, the better your chances.
            </p>
            <div className="flex flex-wrap gap-4 text-sm md:text-base">
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-lg">
                <TrendingDown className="w-5 h-5" />
                <span>Prices drop over time</span>
              </div>
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-lg">
                <Gavel className="w-5 h-5" />
                <span>Competitive bidding</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters Section */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="Search events..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="price-low">Price: Low to High</SelectItem>
                <SelectItem value="price-high">Price: High to Low</SelectItem>
                <SelectItem value="date">Date</SelectItem>
                <SelectItem value="tickets">Tickets Available</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Events Grid */}
      <div className="container mx-auto px-4 py-12">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">Available Events</h2>
          <p className="text-muted-foreground">
            Browse and bid on {filteredAndSortedEvents.length} upcoming HBS events
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAndSortedEvents.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              onBid={handleBidClick}
            />
          ))}
        </div>
      </div>

      <BidDialog
        event={selectedEvent}
        open={bidDialogOpen}
        onOpenChange={setBidDialogOpen}
      />
    </div>
  );
};

export default Index;
