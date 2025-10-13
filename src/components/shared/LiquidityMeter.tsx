'use client';

import { Box, LinearProgress, Typography, Chip } from '@mui/material';
import { calculateLiquidityScore, getLiquidityLevel } from '@/lib/utils';

interface LiquidityMeterProps {
  listingCount: number;
  targetCount?: number;
}

export default function LiquidityMeter({ listingCount, targetCount = 20 }: LiquidityMeterProps) {
  const score = calculateLiquidityScore(listingCount, targetCount);
  const level = getLiquidityLevel(score);
  const percentage = score * 100;

  // Color based on liquidity level
  const getColor = () => {
    switch (level) {
      case 'high':
        return 'success';
      case 'medium':
        return 'warning';
      case 'low':
        return 'error';
      default:
        return 'primary';
    }
  };

  const getLevelLabel = () => {
    switch (level) {
      case 'high':
        return 'High Liquidity';
      case 'medium':
        return 'Medium Liquidity';
      case 'low':
        return 'Low Liquidity';
      default:
        return 'No Liquidity';
    }
  };

  if (listingCount === 0) {
    return (
      <Box
        sx={{
          p: 2,
          bgcolor: 'grey.100',
          borderRadius: 1,
          textAlign: 'center',
        }}
      >
        <Typography variant="body2" color="text.secondary">
          No listings yet
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Liquidity meter will activate when listings are posted
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
        <Typography variant="body2" sx={{ fontWeight: 500 }}>
          Market Liquidity
        </Typography>
        <Chip label={getLevelLabel()} size="small" color={getColor()} />
      </Box>

      <LinearProgress
        variant="determinate"
        value={Math.min(percentage, 100)}
        color={getColor()}
        sx={{
          height: 10,
          borderRadius: 1,
          mb: 1,
        }}
      />

      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
        <Typography variant="caption" color="text.secondary">
          {listingCount} {listingCount === 1 ? 'listing' : 'listings'} available
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {Math.round(percentage)}%
        </Typography>
      </Box>
    </Box>
  );
}
