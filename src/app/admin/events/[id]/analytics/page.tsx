'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  CircularProgress,
  Divider,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import { BarChart } from '@mui/x-charts/BarChart';
import { LineChart } from '@mui/x-charts/LineChart';
import { formatCurrency, formatDate } from '@/lib/utils';

interface AnalyticsData {
  event: {
    id: string;
    title: string;
    retailPrice: number;
    eventDateTime: string;
  };
  metrics: {
    totalListings: number;
    totalTrades: number;
    completedListings: number;
    sellThroughRate: number;
    avgResalePrice: number;
    minPrice: number;
    maxPrice: number;
  };
  priceDistribution: Array<{
    label: string;
    count: number;
  }>;
  timeSeries: Array<{
    date: string;
    count: number;
    totalVolume: number;
    avgPrice: number;
  }>;
}

export default function AnalyticsPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchAnalytics();
  }, [id]);

  const fetchAnalytics = async () => {
    try {
      const response = await fetch(`/api/events/${id}/analytics`);
      const result = await response.json();

      if (result.success) {
        setData(result.analytics);
      } else {
        setError(result.message || 'Failed to fetch analytics');
      }
    } catch (err) {
      setError('An error occurred while fetching analytics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !data) {
    return (
      <Box>
        <Button startIcon={<ArrowBackIcon />} onClick={() => router.push('/admin')}>
          Back to Dashboard
        </Button>
        <Paper sx={{ p: 4, mt: 3, textAlign: 'center' }}>
          <Typography color="error">{error || 'No data available'}</Typography>
        </Paper>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => router.push('/admin')}
          sx={{ mr: 2 }}
        >
          Back
        </Button>
        <Box>
          <Typography variant="h4" component="h1">
            Event Analytics
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {data.event.title}
          </Typography>
        </Box>
      </Box>

      {/* Key Metrics */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <ShowChartIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="body2" color="text.secondary">
                  Total Trades
                </Typography>
              </Box>
              <Typography variant="h4">{data.metrics.totalTrades}</Typography>
              <Typography variant="caption" color="text.secondary">
                {data.metrics.totalListings} total listings
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <AttachMoneyIcon color="success" sx={{ mr: 1 }} />
                <Typography variant="body2" color="text.secondary">
                  Avg Resale Price
                </Typography>
              </Box>
              <Typography variant="h4">{formatCurrency(data.metrics.avgResalePrice)}</Typography>
              <Typography variant="caption" color="text.secondary">
                Retail: {formatCurrency(data.event.retailPrice)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <TrendingUpIcon color="info" sx={{ mr: 1 }} />
                <Typography variant="body2" color="text.secondary">
                  Sell-Through Rate
                </Typography>
              </Box>
              <Typography variant="h4">{data.metrics.sellThroughRate.toFixed(1)}%</Typography>
              <Typography variant="caption" color="text.secondary">
                {data.metrics.completedListings} / {data.metrics.totalListings} sold
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <AttachMoneyIcon color="warning" sx={{ mr: 1 }} />
                <Typography variant="body2" color="text.secondary">
                  Price Range
                </Typography>
              </Box>
              <Typography variant="h6">
                {formatCurrency(data.metrics.minPrice)} - {formatCurrency(data.metrics.maxPrice)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Min - Max resale prices
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Charts */}
      <Grid container spacing={3}>
        {/* Price Distribution */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Price Distribution
            </Typography>
            <Divider sx={{ mb: 2 }} />
            {data.priceDistribution.length > 0 ? (
              <BarChart
                xAxis={[
                  {
                    data: data.priceDistribution.map((d) => d.label),
                    scaleType: 'band',
                  },
                ]}
                series={[
                  {
                    data: data.priceDistribution.map((d) => d.count),
                    label: 'Number of Trades',
                    color: '#A51C30',
                  },
                ]}
                height={300}
              />
            ) : (
              <Box
                sx={{
                  height: 300,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Typography color="text.secondary">No trade data available</Typography>
              </Box>
            )}
          </Paper>
        </Grid>

        {/* Time Series */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Average Price Over Time
            </Typography>
            <Divider sx={{ mb: 2 }} />
            {data.timeSeries.length > 0 ? (
              <LineChart
                xAxis={[
                  {
                    data: data.timeSeries.map((d) => new Date(d.date)),
                    scaleType: 'time',
                    valueFormatter: (date) =>
                      new Intl.DateTimeFormat('en-US', {
                        month: 'short',
                        day: 'numeric',
                      }).format(date),
                  },
                ]}
                series={[
                  {
                    data: data.timeSeries.map((d) => d.avgPrice),
                    label: 'Avg Price',
                    color: '#A51C30',
                    curve: 'natural',
                  },
                  {
                    data: Array(data.timeSeries.length).fill(data.event.retailPrice),
                    label: 'Retail Price',
                    color: '#666',
                  },
                ]}
                height={300}
                yAxis={[
                  {
                    valueFormatter: (value) => `$${value.toFixed(0)}`,
                  },
                ]}
              />
            ) : (
              <Box
                sx={{
                  height: 300,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Typography color="text.secondary">No time series data available</Typography>
              </Box>
            )}
          </Paper>
        </Grid>

        {/* Trade Volume */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Trade Volume Over Time
            </Typography>
            <Divider sx={{ mb: 2 }} />
            {data.timeSeries.length > 0 ? (
              <BarChart
                xAxis={[
                  {
                    data: data.timeSeries.map((d) => new Date(d.date)),
                    scaleType: 'time',
                    valueFormatter: (date) =>
                      new Intl.DateTimeFormat('en-US', {
                        month: 'short',
                        day: 'numeric',
                      }).format(date),
                  },
                ]}
                series={[
                  {
                    data: data.timeSeries.map((d) => d.count),
                    label: 'Number of Trades',
                    color: '#A51C30',
                  },
                ]}
                height={300}
              />
            ) : (
              <Box
                sx={{
                  height: 300,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Typography color="text.secondary">No volume data available</Typography>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* Summary */}
      <Paper sx={{ p: 3, mt: 3 }}>
        <Typography variant="h6" gutterBottom>
          Summary
        </Typography>
        <Divider sx={{ mb: 2 }} />
        <Typography variant="body2" color="text.secondary" paragraph>
          Event Date: {formatDate(data.event.eventDateTime)}
        </Typography>
        <Typography variant="body2" paragraph>
          This event had <strong>{data.metrics.totalListings}</strong> listings with{' '}
          <strong>{data.metrics.totalTrades}</strong> completed trades, resulting in a{' '}
          <strong>{data.metrics.sellThroughRate.toFixed(1)}%</strong> sell-through rate.
        </Typography>
        <Typography variant="body2" paragraph>
          The average resale price was <strong>{formatCurrency(data.metrics.avgResalePrice)}</strong>,
          compared to the retail price of <strong>{formatCurrency(data.event.retailPrice)}</strong>
          {data.metrics.avgResalePrice > data.event.retailPrice
            ? ` (${(((data.metrics.avgResalePrice - data.event.retailPrice) / data.event.retailPrice) * 100).toFixed(1)}% above retail)`
            : data.metrics.avgResalePrice < data.event.retailPrice
            ? ` (${(((data.event.retailPrice - data.metrics.avgResalePrice) / data.event.retailPrice) * 100).toFixed(1)}% below retail)`
            : ' (at retail price)'}
          .
        </Typography>
      </Paper>
    </Box>
  );
}
