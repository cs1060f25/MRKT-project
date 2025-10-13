'use client';

import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
} from '@mui/material';
import EventIcon from '@mui/icons-material/Event';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import ConfirmationNumberIcon from '@mui/icons-material/ConfirmationNumber';
import { formatDateTime, formatCurrency } from '@/lib/utils';

interface EventCardProps {
  event: {
    id: string;
    title: string;
    description: string;
    clubName: string;
    eventDateTime: string;
    venue: string;
    retailPrice: number;
    resalesEnabled: boolean;
    ticketFormat: string;
    _count?: {
      listings: number;
    };
  };
  compact?: boolean;
  onClick?: () => void;
}

export default function EventCard({ event, compact = false, onClick }: EventCardProps) {
  return (
    <Card
      sx={{
        height: '100%',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': onClick
          ? {
              transform: 'translateY(-4px)',
              boxShadow: 4,
            }
          : {},
      }}
      onClick={onClick}
    >
      <CardContent>
        <Typography variant={compact ? 'subtitle1' : 'h6'} gutterBottom sx={{ fontWeight: 600 }}>
          {event.title}
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <Typography variant="body2" color="primary.main" sx={{ fontWeight: 500 }}>
            {event.clubName}
          </Typography>
        </Box>

        {!compact && (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              mb: 2,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {event.description}
          </Typography>
        )}

        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <EventIcon sx={{ fontSize: 16, mr: 0.5, color: 'text.secondary' }} />
          <Typography variant="body2" color="text.secondary">
            {formatDateTime(event.eventDateTime)}
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <LocationOnIcon sx={{ fontSize: 16, mr: 0.5, color: 'text.secondary' }} />
          <Typography variant="body2" color="text.secondary">
            {event.venue}
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
          <Chip
            icon={<ConfirmationNumberIcon />}
            label={formatCurrency(event.retailPrice)}
            size="small"
            color="primary"
            sx={{ fontWeight: 600 }}
          />

          {event._count && event._count.listings > 0 && (
            <Chip
              label={`${event._count.listings} ${event._count.listings === 1 ? 'listing' : 'listings'}`}
              size="small"
              variant="outlined"
            />
          )}

          {!event.resalesEnabled && (
            <Chip label="No Resales" size="small" color="error" variant="outlined" />
          )}

          <Chip
            label={event.ticketFormat === 'QR_CODE' ? 'QR Code' : 'Eventbrite'}
            size="small"
            variant="outlined"
          />
        </Box>
      </CardContent>
    </Card>
  );
}
