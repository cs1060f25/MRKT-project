'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Button,
  Card,
  CardContent,
  CardActions,
  Grid,
  Typography,
  Chip,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { formatDateTime, formatCurrency } from '@/lib/utils';

interface Event {
  id: string;
  title: string;
  clubName: string;
  eventDateTime: string;
  venue: string;
  retailPrice: number;
  resalesEnabled: boolean;
  _count: {
    listings: number;
  };
}

export default function AdminDashboard() {
  const router = useRouter();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const response = await fetch('/api/events?status=all');
      const data = await response.json();
      if (data.success) {
        setEvents(data.events);
      }
    } catch (error) {
      console.error('Failed to fetch events:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" component="h1">
          Events Dashboard
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => router.push('/admin/events/new')}
        >
          Create Event
        </Button>
      </Box>

      {loading ? (
        <Typography>Loading...</Typography>
      ) : events.length === 0 ? (
        <Card>
          <CardContent>
            <Typography variant="body1" color="text.secondary">
              No events yet. Create your first event to get started.
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <Grid container spacing={3}>
          {events.map((event) => (
            <Grid item xs={12} md={6} lg={4} key={event.id}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    {event.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    {event.clubName}
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    {formatDateTime(event.eventDateTime)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {event.venue}
                  </Typography>
                  <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    <Chip
                      label={formatCurrency(event.retailPrice)}
                      size="small"
                      color="primary"
                    />
                    <Chip
                      label={`${event._count.listings} listings`}
                      size="small"
                      variant="outlined"
                    />
                    {!event.resalesEnabled && (
                      <Chip label="Resales Disabled" size="small" color="error" />
                    )}
                  </Box>
                </CardContent>
                <CardActions>
                  <Button size="small" onClick={() => router.push(`/admin/events/${event.id}/analytics`)}>
                    Analytics
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
}
