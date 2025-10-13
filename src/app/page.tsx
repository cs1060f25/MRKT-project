'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Container,
  Box,
  Typography,
  Grid,
  AppBar,
  Toolbar,
  Button,
  IconButton,
  Tabs,
  Tab,
  CircularProgress,
} from '@mui/material';
import LogoutIcon from '@mui/icons-material/Logout';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import EventCard from '@/components/shared/EventCard';

interface Event {
  id: string;
  title: string;
  description: string;
  clubName: string;
  eventDateTime: string;
  venue: string;
  retailPrice: number;
  resalesEnabled: boolean;
  ticketFormat: string;
  _count: {
    listings: number;
  };
}

interface User {
  userId: string;
  email: string;
  role: string;
}

export default function MarketplacePage() {
  const router = useRouter();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [tab, setTab] = useState(0);

  useEffect(() => {
    fetchUser();
    fetchEvents('upcoming');
  }, []);

  const fetchUser = async () => {
    try {
      const response = await fetch('/api/auth/me');
      const data = await response.json();
      if (data.success) {
        setUser(data.user);
      }
    } catch (error) {
      console.error('Failed to fetch user:', error);
    }
  };

  const fetchEvents = async (status: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/events?status=${status}`);
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

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTab(newValue);
    const status = newValue === 0 ? 'upcoming' : 'past';
    fetchEvents(status);
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            MarketPrice
          </Typography>
          {user?.role === 'ADMIN' && (
            <Button
              color="inherit"
              startIcon={<AdminPanelSettingsIcon />}
              onClick={() => router.push('/admin')}
              sx={{ mr: 2 }}
            >
              Admin
            </Button>
          )}
          <IconButton color="inherit" onClick={handleLogout}>
            <LogoutIcon />
          </IconButton>
        </Toolbar>
      </AppBar>

      <Container maxWidth="xl" sx={{ mt: 4, mb: 4, flexGrow: 1 }}>
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Event Marketplace
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Browse and discover upcoming events at Harvard Business School
          </Typography>
        </Box>

        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 4 }}>
          <Tabs value={tab} onChange={handleTabChange}>
            <Tab label="Upcoming Events" />
            <Tab label="Past Events" />
          </Tabs>
        </Box>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress />
          </Box>
        ) : events.length === 0 ? (
          <Box
            sx={{
              textAlign: 'center',
              py: 8,
              bgcolor: 'grey.50',
              borderRadius: 2,
            }}
          >
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No events found
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {tab === 0
                ? 'There are no upcoming events at this time.'
                : 'There are no past events to display.'}
            </Typography>
          </Box>
        ) : (
          <Grid container spacing={3}>
            {events.map((event) => (
              <Grid item xs={12} sm={6} md={4} key={event.id}>
                <EventCard
                  event={event}
                  onClick={() => router.push(`/events/${event.id}`)}
                />
              </Grid>
            ))}
          </Grid>
        )}
      </Container>

      <Box
        component="footer"
        sx={{
          py: 3,
          px: 2,
          mt: 'auto',
          backgroundColor: 'grey.100',
        }}
      >
        <Container maxWidth="xl">
          <Typography variant="body2" color="text.secondary" align="center">
            MarketPrice - Harvard Business School Ticket Marketplace
          </Typography>
        </Container>
      </Box>
    </Box>
  );
}
