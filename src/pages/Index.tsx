import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatCard } from "@/components/Dashboard/StatCard";
import { BidsTable } from "@/components/Dashboard/BidsTable";
import { AsksTable } from "@/components/Dashboard/AsksTable";
import { mockEvents, mockBids, mockAsks } from "@/data/mockData";
import { TrendingUp, TrendingDown, BarChart3, Calendar, LineChart, Smartphone } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const navigate = useNavigate();
  const [selectedEventId, setSelectedEventId] = useState(mockEvents[0].id);
  const selectedEvent = mockEvents.find(e => e.id === selectedEventId);
  
  const eventBids = mockBids.filter(b => b.eventId === selectedEventId);
  const eventAsks = mockAsks.filter(a => a.eventId === selectedEventId);
  
  const activeBids = eventBids.filter(b => b.status === 'active').length;
  const activeAsks = eventAsks.filter(a => a.status === 'active').length;
  
  const avgBidPrice = eventBids.length > 0 
    ? (eventBids.reduce((sum, bid) => sum + bid.pricePerTicket, 0) / eventBids.length).toFixed(2)
    : '0.00';
  
  const avgAskPrice = eventAsks.length > 0
    ? (eventAsks.reduce((sum, ask) => sum + ask.pricePerTicket, 0) / eventAsks.length).toFixed(2)
    : '0.00';

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-gradient-primary shadow-sm">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-primary-foreground">Event Dashboard</h1>
              <p className="text-primary-foreground/80 mt-1">Monitor your ticket trading activity</p>
            </div>
            <div className="flex items-center gap-4">
              <Button 
                variant="outline" 
                className="bg-white/10 border-white/20 text-primary-foreground hover:bg-white/20"
                onClick={() => navigate("/analytics")}
              >
                <LineChart className="mr-2 h-4 w-4" />
                Analytics
              </Button>
              <Button 
                variant="outline" 
                className="bg-white/10 border-white/20 text-primary-foreground hover:bg-white/20"
                onClick={() => navigate("/mobile")}
              >
                <Smartphone className="mr-2 h-4 w-4" />
                Mobile
              </Button>
              <div className="w-72">
                <Select value={selectedEventId} onValueChange={setSelectedEventId}>
                  <SelectTrigger className="bg-white/10 border-white/20 text-primary-foreground backdrop-blur-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {mockEvents.map(event => (
                      <SelectItem key={event.id} value={event.id}>
                        {event.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        {/* Event Info Card */}
        {selectedEvent && (
          <Card className="mb-8 p-6 bg-gradient-card shadow-card border-border/50">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-2">{selectedEvent.name}</h2>
                <div className="flex items-center gap-6 text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>{new Date(selectedEvent.date).toLocaleDateString('en-US', { 
                      month: 'long', 
                      day: 'numeric', 
                      year: 'numeric' 
                    })}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <BarChart3 className="h-4 w-4" />
                    <span>{selectedEvent.venue}</span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Total Capacity</p>
                <p className="text-2xl font-bold text-foreground">{selectedEvent.totalTickets.toLocaleString()}</p>
              </div>
            </div>
          </Card>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Active Bids"
            value={activeBids}
            icon={TrendingUp}
            trend={{ value: "12%", isPositive: true }}
          />
          <StatCard
            title="Active Asks"
            value={activeAsks}
            icon={TrendingDown}
            trend={{ value: "8%", isPositive: false }}
          />
          <StatCard
            title="Avg Bid Price"
            value={`$${avgBidPrice}`}
            icon={BarChart3}
          />
          <StatCard
            title="Avg Ask Price"
            value={`$${avgAskPrice}`}
            icon={BarChart3}
          />
        </div>

        {/* Tables Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Bids Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-foreground">Recent Bids</h3>
              <span className="text-sm text-muted-foreground">{eventBids.length} total</span>
            </div>
            <BidsTable bids={eventBids} />
          </div>

          {/* Asks Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-foreground">Recent Asks</h3>
              <span className="text-sm text-muted-foreground">{eventAsks.length} total</span>
            </div>
            <AsksTable asks={eventAsks} />
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
