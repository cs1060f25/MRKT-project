import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Area, AreaChart } from "recharts";
import { mockEvents, salesVolumeData, bidAskSpreadData } from "@/data/mockData";

const Analytics = () => {
  const navigate = useNavigate();
  const [selectedEventId, setSelectedEventId] = useState(mockEvents[0].id);
  const selectedEvent = mockEvents.find((e) => e.id === selectedEventId);

  // Filter data for selected event
  const volumeData = salesVolumeData.filter((d) => d.eventId === selectedEventId);
  const spreadData = bidAskSpreadData.filter((d) => d.eventId === selectedEventId);

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" onClick={() => navigate("/")}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Event Analytics</h1>
              <p className="text-muted-foreground">Sales volume and market spread insights</p>
            </div>
          </div>
          <Select value={selectedEventId} onValueChange={setSelectedEventId}>
            <SelectTrigger className="w-[280px]">
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

        {/* Event Info */}
        {selectedEvent && (
          <Card>
            <CardHeader>
              <CardTitle>{selectedEvent.name}</CardTitle>
              <CardDescription>
                {selectedEvent.venue} • {new Date(selectedEvent.date).toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </CardDescription>
            </CardHeader>
          </Card>
        )}

        {/* Sales Volume Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Daily Sales Volume</CardTitle>
            <CardDescription>Total ticket sales volume per day leading up to the event</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[400px] w-full">
              <BarChart data={volumeData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="date" 
                  className="text-xs"
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis 
                  className="text-xs"
                  tickLine={false}
                  axisLine={false}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar 
                  dataKey="volume" 
                  fill="var(--color-volume)" 
                  radius={[8, 8, 0, 0]}
                />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Bid/Ask Spread Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Bid/Ask Spread</CardTitle>
            <CardDescription>Market spread between highest bid and lowest ask prices over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[400px] w-full">
              <AreaChart data={spreadData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="time" 
                  className="text-xs"
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis 
                  className="text-xs"
                  tickLine={false}
                  axisLine={false}
                  domain={[100, 150]}
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
      </div>
    </div>
  );
};

export default Analytics;
