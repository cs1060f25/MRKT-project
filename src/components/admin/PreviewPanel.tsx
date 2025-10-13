'use client';

import { useEffect, useState } from 'react';
import { Paper, Typography, Box, Divider } from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import EventCard from '@/components/shared/EventCard';
import PriceChart from '@/components/shared/PriceChart';
import LiquidityMeter from '@/components/shared/LiquidityMeter';

interface EventFormData {
  title: string;
  description: string;
  clubName: string;
  eventDateTime: Date | null;
  venue: string;
  retailPrice: string;
  maxResaleCap: string;
  ticketFormat: 'QR_CODE' | 'EVENTBRITE_LINK';
  listingOpenTime: Date | null;
  listingCloseTime: Date | null;
  resalesEnabled: boolean;
}

interface PreviewPanelProps {
  eventData: EventFormData;
}

export default function PreviewPanel({ eventData }: PreviewPanelProps) {
  const [mockListingCount, setMockListingCount] = useState(8);

  // Simulate some reactivity - in a real scenario, we might fetch preview data from an API
  useEffect(() => {
    // Generate mock listing count based on retail price
    const price = parseFloat(eventData.retailPrice) || 0;
    const count = Math.floor(Math.random() * 10) + 5; // 5-15 listings
    setMockListingCount(count);
  }, [eventData.retailPrice, eventData.title]);

  // Generate mock price data for the chart
  const generateMockPriceData = () => {
    if (!eventData.retailPrice) return [];

    const basePrice = parseFloat(eventData.retailPrice);
    if (isNaN(basePrice) || basePrice <= 0) return [];

    const data = [];
    const today = new Date();

    // Generate 10 data points over the last 10 days
    for (let i = 9; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);

      // Price varies +/- 15% around retail
      const variation = (Math.random() - 0.5) * 0.3;
      const price = basePrice * (1 + variation);

      data.push({
        date: date.toISOString().split('T')[0],
        price: Math.round(price * 100) / 100,
      });
    }

    return data;
  };

  const priceData = generateMockPriceData();
  const retailPrice = parseFloat(eventData.retailPrice) || 0;

  return (
    <Paper
      sx={{
        p: 3,
        position: 'sticky',
        top: 16,
        maxHeight: 'calc(100vh - 32px)',
        overflowY: 'auto',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <VisibilityIcon sx={{ mr: 1, color: 'primary.main' }} />
        <Typography variant="h6">Live Preview</Typography>
      </Box>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        This is how your event will appear in the marketplace feed.
      </Typography>

      {/* Event Card Preview */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600 }}>
          Event Card
        </Typography>
        <EventCard
          event={{
            id: 'preview',
            title: eventData.title || 'Event Title',
            description: eventData.description || 'Event description will appear here...',
            clubName: eventData.clubName || 'Club Name',
            eventDateTime: eventData.eventDateTime?.toISOString() || new Date().toISOString(),
            venue: eventData.venue || 'Venue',
            retailPrice: retailPrice,
            resalesEnabled: eventData.resalesEnabled,
            ticketFormat: eventData.ticketFormat,
            _count: { listings: mockListingCount },
          }}
          compact
        />
      </Box>

      <Divider sx={{ my: 3 }} />

      {/* Price Chart Preview */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600 }}>
          Price Chart
        </Typography>
        {priceData.length > 0 ? (
          <PriceChart data={priceData} retailPrice={retailPrice} height={200} />
        ) : (
          <Box
            sx={{
              height: 200,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: 'grey.100',
              borderRadius: 1,
            }}
          >
            <Typography variant="body2" color="text.secondary">
              Enter a retail price to see the chart
            </Typography>
          </Box>
        )}
        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
          Shows simulated resale price trends
        </Typography>
      </Box>

      <Divider sx={{ my: 3 }} />

      {/* Liquidity Meter Preview */}
      <Box>
        <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600 }}>
          Liquidity Meter
        </Typography>
        <LiquidityMeter listingCount={mockListingCount} targetCount={20} />
        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
          Activates when listings exist (simulated: {mockListingCount} listings)
        </Typography>
      </Box>
    </Paper>
  );
}
