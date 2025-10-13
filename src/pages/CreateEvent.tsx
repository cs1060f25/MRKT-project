import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { CalendarIcon, ArrowLeft, TrendingUp, DollarSign, Users } from "lucide-react";
import { toast } from "sonner";

export default function CreateEvent() {
  const navigate = useNavigate();
  const [eventData, setEventData] = useState({
    title: "",
    description: "",
    clubName: "",
    eventDate: "",
    eventTime: "",
    venue: "",
    retailPrice: "",
    maxResaleCap: "",
    ticketFormat: "qr",
    listingOpenDate: "",
    listingCloseDate: "",
    resalesEnabled: true,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Event created successfully!", {
      description: `${eventData.title} is now live in the marketplace.`,
    });
    // In real implementation, this would save to database
    setTimeout(() => navigate("/"), 2000);
  };

  const updateField = (field: string, value: string | boolean) => {
    setEventData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen bg-gradient-subtle">
      {/* Header */}
      <header className="border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => navigate("/")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Button>
          <h1 className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Marketprice
          </h1>
          <div className="w-24" /> {/* Spacer for centering */}
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Create New Event</h1>
          <p className="text-muted-foreground">
            Set up a new event in the marketplace for your club members to trade tickets.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Event Details</CardTitle>
              <CardDescription>Basic information about your event</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Event Title *</Label>
                <Input
                  id="title"
                  placeholder="e.g., Canada Club Rodeo Party"
                  value={eventData.title}
                  onChange={(e) => updateField("title", e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  placeholder="Describe what makes this event special..."
                  value={eventData.description}
                  onChange={(e) => updateField("description", e.target.value)}
                  rows={4}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="clubName">Club Name *</Label>
                  <Input
                    id="clubName"
                    placeholder="e.g., Canada Club"
                    value={eventData.clubName}
                    onChange={(e) => updateField("clubName", e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="venue">Venue *</Label>
                  <Input
                    id="venue"
                    placeholder="e.g., Spangler Center"
                    value={eventData.venue}
                    onChange={(e) => updateField("venue", e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="eventDate">Event Date *</Label>
                  <Input
                    id="eventDate"
                    type="date"
                    value={eventData.eventDate}
                    onChange={(e) => updateField("eventDate", e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="eventTime">Event Time *</Label>
                  <Input
                    id="eventTime"
                    type="time"
                    value={eventData.eventTime}
                    onChange={(e) => updateField("eventTime", e.target.value)}
                    required
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pricing */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Pricing Configuration
              </CardTitle>
              <CardDescription>Set retail price and resale parameters</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="retailPrice">Retail Ticket Price *</Label>
                  <Input
                    id="retailPrice"
                    type="number"
                    placeholder="0.00"
                    value={eventData.retailPrice}
                    onChange={(e) => updateField("retailPrice", e.target.value)}
                    required
                    min="0"
                    step="0.01"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="maxResaleCap">Max Resale Cap (Optional)</Label>
                  <Input
                    id="maxResaleCap"
                    type="number"
                    placeholder="Leave empty for no cap"
                    value={eventData.maxResaleCap}
                    onChange={(e) => updateField("maxResaleCap", e.target.value)}
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="ticketFormat">Ticket Upload Format *</Label>
                <Select
                  value={eventData.ticketFormat}
                  onValueChange={(value) => updateField("ticketFormat", value)}
                >
                  <SelectTrigger id="ticketFormat">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="qr">QR Code</SelectItem>
                    <SelectItem value="eventbrite">Eventbrite</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Trading Windows */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarIcon className="h-5 w-5" />
                Trading Windows
              </CardTitle>
              <CardDescription>Control when tickets can be listed and traded</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="listingOpenDate">Listing Opens *</Label>
                  <Input
                    id="listingOpenDate"
                    type="datetime-local"
                    value={eventData.listingOpenDate}
                    onChange={(e) => updateField("listingOpenDate", e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="listingCloseDate">Listing Closes *</Label>
                  <Input
                    id="listingCloseDate"
                    type="datetime-local"
                    value={eventData.listingCloseDate}
                    onChange={(e) => updateField("listingCloseDate", e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                <div className="space-y-0.5">
                  <Label htmlFor="resalesEnabled" className="text-base">Enable Resales</Label>
                  <p className="text-sm text-muted-foreground">
                    Allow tickets to be resold in the marketplace
                  </p>
                </div>
                <Switch
                  id="resalesEnabled"
                  checked={eventData.resalesEnabled}
                  onCheckedChange={(checked) => updateField("resalesEnabled", checked)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Preview Card */}
          <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Event Preview
              </CardTitle>
              <CardDescription>How this event will appear in the marketplace</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 p-4 bg-card rounded-lg border border-border">
                <h3 className="font-semibold text-lg">
                  {eventData.title || "Your Event Title"}
                </h3>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <CalendarIcon className="h-4 w-4" />
                    {eventData.eventDate || "Date TBD"}
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    {eventData.clubName || "Club Name"}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {eventData.description || "Event description will appear here..."}
                </p>
                <div className="flex items-center justify-between pt-2 border-t border-border">
                  <span className="text-xs text-muted-foreground">Retail Price</span>
                  <span className="font-semibold text-primary">
                    ${eventData.retailPrice || "0.00"}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Submit Actions */}
          <div className="flex gap-3 justify-end">
            <Button type="button" variant="outline" onClick={() => navigate("/")}>
              Cancel
            </Button>
            <Button type="submit" size="lg" variant="hero">
              Create Event
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
}
