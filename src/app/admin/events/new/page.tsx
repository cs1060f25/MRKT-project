'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Grid,
  Paper,
  Typography,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  FormControlLabel,
  Switch,
  Button,
  Alert,
  InputAdornment,
} from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SaveIcon from '@mui/icons-material/Save';
import PreviewPanel from '@/components/admin/PreviewPanel';

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

export default function NewEventPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState<EventFormData>({
    title: '',
    description: '',
    clubName: '',
    eventDateTime: null,
    venue: '',
    retailPrice: '',
    maxResaleCap: '',
    ticketFormat: 'QR_CODE',
    listingOpenTime: null,
    listingCloseTime: null,
    resalesEnabled: true,
  });

  const handleChange = (field: keyof EventFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear validation error for this field
    if (validationErrors[field]) {
      setValidationErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setValidationErrors({});
    setLoading(true);

    try {
      const payload = {
        ...formData,
        retailPrice: parseFloat(formData.retailPrice),
        maxResaleCap: formData.maxResaleCap ? parseFloat(formData.maxResaleCap) : null,
      };

      const response = await fetch('/api/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(true);
        setTimeout(() => {
          router.push('/admin');
        }, 1500);
      } else {
        if (data.errors) {
          // Map Zod errors to field names
          const errors: Record<string, string> = {};
          data.errors.forEach((err: any) => {
            const field = err.path[0];
            errors[field] = err.message;
          });
          setValidationErrors(errors);
        } else {
          setError(data.message || 'Failed to create event');
        }
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => router.push('/admin')}
            sx={{ mr: 2 }}
          >
            Back
          </Button>
          <Typography variant="h4" component="h1">
            Create New Event
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 3 }}>
            Event created successfully! Redirecting...
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            {/* Form Section */}
            <Grid item xs={12} lg={7}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Event Details
                </Typography>

                <TextField
                  fullWidth
                  label="Event Title"
                  value={formData.title}
                  onChange={(e) => handleChange('title', e.target.value)}
                  error={!!validationErrors.title}
                  helperText={validationErrors.title}
                  required
                  sx={{ mb: 3 }}
                />

                <TextField
                  fullWidth
                  label="Description"
                  value={formData.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  error={!!validationErrors.description}
                  helperText={validationErrors.description}
                  required
                  multiline
                  rows={4}
                  sx={{ mb: 3 }}
                />

                <TextField
                  fullWidth
                  label="Club Name"
                  value={formData.clubName}
                  onChange={(e) => handleChange('clubName', e.target.value)}
                  error={!!validationErrors.clubName}
                  helperText={validationErrors.clubName}
                  required
                  sx={{ mb: 3 }}
                />

                <DateTimePicker
                  label="Event Date & Time"
                  value={formData.eventDateTime}
                  onChange={(newValue) => handleChange('eventDateTime', newValue)}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      required: true,
                      error: !!validationErrors.eventDateTime,
                      helperText: validationErrors.eventDateTime,
                      sx: { mb: 3 },
                    },
                  }}
                />

                <TextField
                  fullWidth
                  label="Venue"
                  value={formData.venue}
                  onChange={(e) => handleChange('venue', e.target.value)}
                  error={!!validationErrors.venue}
                  helperText={validationErrors.venue}
                  required
                  sx={{ mb: 3 }}
                />

                <Typography variant="h6" gutterBottom sx={{ mt: 4 }}>
                  Pricing & Tickets
                </Typography>

                <TextField
                  fullWidth
                  label="Retail Ticket Price"
                  type="number"
                  value={formData.retailPrice}
                  onChange={(e) => handleChange('retailPrice', e.target.value)}
                  error={!!validationErrors.retailPrice}
                  helperText={validationErrors.retailPrice}
                  required
                  InputProps={{
                    startAdornment: <InputAdornment position="start">$</InputAdornment>,
                  }}
                  inputProps={{
                    min: 0,
                    step: 0.01,
                  }}
                  sx={{ mb: 3 }}
                />

                <TextField
                  fullWidth
                  label="Max Resale Cap (Optional)"
                  type="number"
                  value={formData.maxResaleCap}
                  onChange={(e) => handleChange('maxResaleCap', e.target.value)}
                  error={!!validationErrors.maxResaleCap}
                  helperText={validationErrors.maxResaleCap || 'Percentage (e.g., 125 for 125%)'}
                  InputProps={{
                    endAdornment: <InputAdornment position="end">%</InputAdornment>,
                  }}
                  inputProps={{
                    min: 100,
                    step: 1,
                  }}
                  sx={{ mb: 3 }}
                />

                <FormControl fullWidth sx={{ mb: 3 }}>
                  <InputLabel>Ticket Format</InputLabel>
                  <Select
                    value={formData.ticketFormat}
                    onChange={(e) => handleChange('ticketFormat', e.target.value)}
                    label="Ticket Format"
                  >
                    <MenuItem value="QR_CODE">QR Code</MenuItem>
                    <MenuItem value="EVENTBRITE_LINK">Eventbrite Link</MenuItem>
                  </Select>
                </FormControl>

                <Typography variant="h6" gutterBottom sx={{ mt: 4 }}>
                  Listing Window
                </Typography>

                <DateTimePicker
                  label="Listing Open Time"
                  value={formData.listingOpenTime}
                  onChange={(newValue) => handleChange('listingOpenTime', newValue)}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      required: true,
                      error: !!validationErrors.listingOpenTime,
                      helperText: validationErrors.listingOpenTime,
                      sx: { mb: 3 },
                    },
                  }}
                />

                <DateTimePicker
                  label="Listing Close Time"
                  value={formData.listingCloseTime}
                  onChange={(newValue) => handleChange('listingCloseTime', newValue)}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      required: true,
                      error: !!validationErrors.listingCloseTime,
                      helperText: validationErrors.listingCloseTime,
                      sx: { mb: 3 },
                    },
                  }}
                />

                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.resalesEnabled}
                      onChange={(e) => handleChange('resalesEnabled', e.target.checked)}
                    />
                  }
                  label="Enable Resales"
                />

                <Box sx={{ mt: 4, display: 'flex', gap: 2 }}>
                  <Button
                    type="submit"
                    variant="contained"
                    size="large"
                    startIcon={<SaveIcon />}
                    disabled={loading}
                  >
                    {loading ? 'Creating...' : 'Create Event'}
                  </Button>
                  <Button
                    variant="outlined"
                    size="large"
                    onClick={() => router.push('/admin')}
                    disabled={loading}
                  >
                    Cancel
                  </Button>
                </Box>
              </Paper>
            </Grid>

            {/* Preview Section */}
            <Grid item xs={12} lg={5}>
              <PreviewPanel eventData={formData} />
            </Grid>
          </Grid>
        </form>
      </Box>
    </LocalizationProvider>
  );
}
