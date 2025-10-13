import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { TrendingUp, Shield, Zap, BarChart3, Clock, Users } from "lucide-react";
import heroImage from "@/assets/hero-bg.jpg";

export default function Index() {
  const navigate = useNavigate();

  const features = [
    {
      icon: TrendingUp,
      title: "Market-Driven Pricing",
      description: "Hourly Dutch auctions match buyers and sellers at fair prices based on real demand.",
    },
    {
      icon: Shield,
      title: "Anonymous & Safe",
      description: "HBS-verified community with fraud detection. Trade without social pressure.",
    },
    {
      icon: Zap,
      title: "Fast Matching",
      description: "Get matched in hours with automated clearing and instant QR delivery.",
    },
    {
      icon: BarChart3,
      title: "Demand Analytics",
      description: "Clubs gain insights into pricing elasticity for better event planning.",
    },
  ];

  const howItWorks = [
    {
      step: "1",
      title: "Browse Events",
      description: "See upcoming events with live pricing and liquidity indicators.",
    },
    {
      step: "2",
      title: "Bid or List",
      description: "Buyers place bids with saved cards. Sellers upload redacted QR codes with price floors.",
    },
    {
      step: "3",
      title: "Auto-Match",
      description: "Hourly auctions clear at optimal prices. Cards charge only when matched.",
    },
    {
      step: "4",
      title: "Receive Tickets",
      description: "Verified QR codes delivered instantly. Add to Apple Wallet or Google Wallet.",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Marketprice
          </h1>
          <div className="flex items-center gap-3">
            <Button variant="ghost">Sign In</Button>
            <Button variant="hero" onClick={() => navigate("/create-event")}>
              Create Event
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div 
          className="absolute inset-0 z-0 opacity-20"
          style={{
            backgroundImage: `url(${heroImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/50 via-background/80 to-background z-0" />
        
        <div className="container mx-auto px-4 py-24 md:py-32 relative z-10">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <Badge variant="secondary" className="mb-4">
              For HBS Community
            </Badge>
            <h2 className="text-5xl md:text-6xl font-bold leading-tight">
              The Transparent
              <span className="bg-gradient-primary bg-clip-text text-transparent"> Market </span>
              for Event Tickets
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Anonymous Dutch auctions that match buyers and sellers at fair prices. 
              No haggling, no social pressure—just efficient markets.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Button size="xl" variant="hero">
                Browse Events
              </Button>
              <Button size="xl" variant="glass">
                How It Works
              </Button>
            </div>
            <div className="flex items-center justify-center gap-8 pt-6 text-sm text-muted-foreground">
              <span className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Matches in hours
              </span>
              <span className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                HBS-verified only
              </span>
              <span className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Community-first
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gradient-subtle">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h3 className="text-3xl md:text-4xl font-bold mb-4">
              Built for Fairness and Speed
            </h3>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Market-driven pricing that works for buyers, sellers, and clubs.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <Card key={index} className="border-border hover:shadow-primary transition-all duration-300">
                <CardHeader>
                  <div className="h-12 w-12 rounded-lg bg-gradient-primary flex items-center justify-center mb-3">
                    <feature.icon className="h-6 w-6 text-primary-foreground" />
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h3 className="text-3xl md:text-4xl font-bold mb-4">
              Simple, Fast, Transparent
            </h3>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              From bid to ticket in four easy steps.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
            {howItWorks.map((item, index) => (
              <div key={index} className="relative">
                <div className="text-center space-y-4">
                  <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-gradient-primary text-2xl font-bold text-primary-foreground shadow-glow">
                    {item.step}
                  </div>
                  <h4 className="text-xl font-semibold">{item.title}</h4>
                  <p className="text-muted-foreground">{item.description}</p>
                </div>
                {index < howItWorks.length - 1 && (
                  <div className="hidden lg:block absolute top-8 left-[calc(50%+2rem)] w-[calc(100%-4rem)] h-0.5 bg-gradient-to-r from-primary to-accent" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-primary relative overflow-hidden">
        <div className="absolute inset-0 opacity-10" 
          style={{
            backgroundImage: `url(${heroImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto text-center text-primary-foreground space-y-6">
            <h3 className="text-3xl md:text-4xl font-bold">
              Ready to Join the Marketplace?
            </h3>
            <p className="text-lg opacity-90">
              Start trading tickets with confidence. Anonymous, safe, and powered by real market data.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Button size="xl" variant="glass" className="text-primary-foreground border-primary-foreground/30">
                Get Started
              </Button>
              <Button 
                size="xl" 
                variant="outline" 
                className="bg-primary-foreground text-primary hover:bg-primary-foreground/90"
                onClick={() => navigate("/create-event")}
              >
                Create Your Event
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-12 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-center md:text-left">
              <h4 className="font-bold text-lg bg-gradient-primary bg-clip-text text-transparent mb-2">
                Marketprice
              </h4>
              <p className="text-sm text-muted-foreground">
                Fair markets for HBS events.
              </p>
            </div>
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <a href="#" className="hover:text-primary transition-colors">About</a>
              <a href="#" className="hover:text-primary transition-colors">Privacy</a>
              <a href="#" className="hover:text-primary transition-colors">Terms</a>
              <a href="#" className="hover:text-primary transition-colors">Support</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
