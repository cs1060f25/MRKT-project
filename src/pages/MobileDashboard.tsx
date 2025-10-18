import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Area, AreaChart } from "recharts";
import { mockEvents, mockBids, mockAsks, salesVolumeData, bidAskSpreadData } from "@/data/mockData";
import { TrendingUp, TrendingDown, BarChart3, DollarSign, Users, Activity } from "lucide-react";
import { Bid, Ask } from "@/types/ticket";

const MobileDashboard = () => {
  const [selectedEventId, setSelectedEventId] = useState(mockEvents[0].id);
  const selectedEvent = mockEvents.find((e) => e.id === selectedEventId);
  
  const eventBids = mockBids.filter((b) => b.eventId === selectedEventId);
  const eventAsks = mockAsks.filter((a) => a.eventId === selectedEventId);
  const volumeData = salesVolumeData.filter((d) => d.eventId === selectedEventId);
  const spreadData = bidAskSpreadData.filter((d) => d.eventId === selectedEventId);
  
  const activeBids = eventBids.filter((b) => b.status === "active").length;
  const activeAsks = eventAsks.filter((a) => a.status === "active").length;
  
  const avgBidPrice = eventBids.length > 0 
    ? (eventBids.reduce((sum, bid) => sum + bid.pricePerTicket, 0) / eventBids.length).toFixed(2)
    : "0.00";
  
  const avgAskPrice = eventAsks.length > 0
    ? (eventAsks.reduce((sum, ask) => sum + ask.pricePerTicket, 0) / eventAsks.length).toFixed(2)
    : "0.00";

  const totalVolume = volumeData.reduce((sum, d) => sum + d.volume, 0);

  const chartConfig = {
    volume: {
      label: "Sales Volume",
      color: "hsl(var(--primary))",
    },
    bid: {
      label: "Highest Bid",
      color: "hsl(var(--success))",
    },
    ask: {
      label: "Lowest Ask",
      color: "hsl(var(--warning))",
    },
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
  };

  const getStatusBadge = (status: Bid["status"] | Ask["status"]) => {
    const variants = {
      active: "default",
      filled: "secondary",
      cancelled: "outline",
    } as const;

    return <Badge variant={variants[status]} className="text-xs">{status}</Badge>;
  };

  return (
    <div className="min-h-screen bg-background pb-6">
      {/* Sticky Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-gradient-primary shadow-md">
        <div className="px-4 py-4">
          <h1 className="text-xl font-bold text-primary-foreground mb-3">Ticket Dashboard</h1>
          <Select value={selectedEventId} onValueChange={setSelectedEventId}>
            <SelectTrigger className="bg-white/10 border-white/20 text-primary-foreground backdrop-blur-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {mockEvents.map((event) => (
                <SelectItem key={event.id} value={event.id}>
                  {event.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </header>

      <main className="px-4 space-y-4 mt-4">
        {/* Event Info */}
        {selectedEvent && (
          <Card className="shadow-card border-border/50 animate-fade-in">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg leading-tight">{selectedEvent.name}</CardTitle>
              <p className="text-sm text-muted-foreground">
                {new Date(selectedEvent.date).toLocaleDateString("en-US", { 
                  month: "short", 
                  day: "numeric", 
                  year: "numeric" 
                })} • {selectedEvent.venue}
              </p>
            </CardHeader>
          </Card>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3 animate-fade-in" style={{ animationDelay: "0.1s" }}>
          <Card className="shadow-card">
            <CardContent className="pt-4 pb-3 px-3">
              <div className="flex items-center justify-between mb-1">
                <TrendingUp className="h-4 w-4 text-success" />
                <span className="text-xs text-success font-medium">+12%</span>
              </div>
              <div className="text-2xl font-bold">{activeBids}</div>
              <div className="text-xs text-muted-foreground">Active Bids</div>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardContent className="pt-4 pb-3 px-3">
              <div className="flex items-center justify-between mb-1">
                <TrendingDown className="h-4 w-4 text-warning" />
                <span className="text-xs text-warning font-medium">-8%</span>
              </div>
              <div className="text-2xl font-bold">{activeAsks}</div>
              <div className="text-xs text-muted-foreground">Active Asks</div>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardContent className="pt-4 pb-3 px-3">
              <DollarSign className="h-4 w-4 text-success mb-1" />
              <div className="text-2xl font-bold">${avgBidPrice}</div>
              <div className="text-xs text-muted-foreground">Avg Bid Price</div>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardContent className="pt-4 pb-3 px-3">
              <DollarSign className="h-4 w-4 text-warning mb-1" />
              <div className="text-2xl font-bold">${avgAskPrice}</div>
              <div className="text-xs text-muted-foreground">Avg Ask Price</div>
            </CardContent>
          </Card>
        </div>

        {/* Sales Volume Chart */}
        <Card className="shadow-card animate-fade-in" style={{ animationDelay: "0.2s" }}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Sales Volume</CardTitle>
                <p className="text-xs text-muted-foreground mt-1">Daily ticket sales</p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold">{totalVolume}</div>
                <div className="text-xs text-muted-foreground">Total</div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="px-2">
            <ChartContainer config={chartConfig} className="h-[200px] w-full">
              <BarChart data={volumeData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" vertical={false} />
                <XAxis 
                  dataKey="date" 
                  className="text-[10px]"
                  tickLine={false}
                  axisLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis 
                  className="text-[10px]"
                  tickLine={false}
                  axisLine={false}
                  width={30}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar 
                  dataKey="volume" 
                  fill="var(--color-volume)" 
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Bid/Ask Spread Chart */}
        <Card className="shadow-card animate-fade-in" style={{ animationDelay: "0.3s" }}>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Market Spread</CardTitle>
            <p className="text-xs text-muted-foreground mt-1">Bid vs Ask prices</p>
          </CardHeader>
          <CardContent className="px-2">
            <ChartContainer config={chartConfig} className="h-[200px] w-full">
              <AreaChart data={spreadData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" vertical={false} />
                <XAxis 
                  dataKey="time" 
                  className="text-[10px]"
                  tickLine={false}
                  axisLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis 
                  className="text-[10px]"
                  tickLine={false}
                  axisLine={false}
                  width={35}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area 
                  type="monotone" 
                  dataKey="ask" 
                  stackId="1"
                  stroke="var(--color-ask)" 
                  fill="var(--color-ask)"
                  fillOpacity={0.6}
                />
                <Area 
                  type="monotone" 
                  dataKey="bid" 
                  stackId="1"
                  stroke="var(--color-bid)" 
                  fill="var(--color-bid)"
                  fillOpacity={0.6}
                />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Recent Bids */}
        <Card className="shadow-card animate-fade-in" style={{ animationDelay: "0.4s" }}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Recent Bids</CardTitle>
              <Badge variant="outline" className="text-xs">{eventBids.length} total</Badge>
            </div>
          </CardHeader>
          <CardContent className="px-0">
            <div className="space-y-3">
              {eventBids.slice(0, 5).map((bid) => (
                <div key={bid.id} className="px-4 py-2 hover:bg-muted/30 transition-colors">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-sm">{bid.buyerName}</span>
                    {getStatusBadge(bid.status)}
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{bid.quantity} tickets @ ${bid.pricePerTicket.toFixed(2)}</span>
                    <span>{formatTime(bid.timestamp)}</span>
                  </div>
                  <div className="text-sm font-bold text-success mt-1">
                    ${bid.totalPrice.toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Asks */}
        <Card className="shadow-card animate-fade-in" style={{ animationDelay: "0.5s" }}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Recent Asks</CardTitle>
              <Badge variant="outline" className="text-xs">{eventAsks.length} total</Badge>
            </div>
          </CardHeader>
          <CardContent className="px-0">
            <div className="space-y-3">
              {eventAsks.slice(0, 5).map((ask) => (
                <div key={ask.id} className="px-4 py-2 hover:bg-muted/30 transition-colors">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-sm">{ask.sellerName}</span>
                    {getStatusBadge(ask.status)}
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{ask.quantity} tickets @ ${ask.pricePerTicket.toFixed(2)}</span>
                    <span>{formatTime(ask.timestamp)}</span>
                  </div>
                  <div className="text-sm font-bold text-warning mt-1">
                    ${ask.totalPrice.toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default MobileDashboard;
