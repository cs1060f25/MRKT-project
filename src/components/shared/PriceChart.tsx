'use client';

import { LineChart } from '@mui/x-charts/LineChart';
import { Box, Typography } from '@mui/material';

interface PriceDataPoint {
  date: string;
  price: number;
}

interface PriceChartProps {
  data: PriceDataPoint[];
  retailPrice: number;
  height?: number;
}

export default function PriceChart({ data, retailPrice, height = 300 }: PriceChartProps) {
  if (!data || data.length === 0) {
    return (
      <Box
        sx={{
          height,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: 'grey.100',
          borderRadius: 1,
        }}
      >
        <Typography variant="body2" color="text.secondary">
          No price data available
        </Typography>
      </Box>
    );
  }

  // Extract dates and prices
  const dates = data.map((d) => new Date(d.date));
  const prices = data.map((d) => d.price);

  // Calculate min/max for better chart scaling
  const minPrice = Math.min(...prices, retailPrice) * 0.9;
  const maxPrice = Math.max(...prices, retailPrice) * 1.1;

  return (
    <Box sx={{ width: '100%', height }}>
      <LineChart
        xAxis={[
          {
            data: dates,
            scaleType: 'time',
            valueFormatter: (date) => {
              return new Intl.DateTimeFormat('en-US', {
                month: 'short',
                day: 'numeric',
              }).format(date);
            },
          },
        ]}
        yAxis={[
          {
            min: minPrice,
            max: maxPrice,
            valueFormatter: (value) => `$${value.toFixed(0)}`,
          },
        ]}
        series={[
          {
            data: prices,
            label: 'Resale Price',
            color: '#A51C30',
            curve: 'natural',
          },
          {
            data: Array(prices.length).fill(retailPrice),
            label: 'Retail Price',
            color: '#666',
            curve: 'linear',
          },
        ]}
        height={height}
        margin={{ left: 50, right: 10, top: 10, bottom: 30 }}
        slotProps={{
          legend: {
            direction: 'row',
            position: { vertical: 'top', horizontal: 'middle' },
            padding: 0,
          },
        }}
      />
    </Box>
  );
}
