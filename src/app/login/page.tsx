'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Container,
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Alert,
  Link as MuiLink,
} from '@mui/material';
import EmailIcon from '@mui/icons-material/Email';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [magicLink, setMagicLink] = useState('');

  const errorParam = searchParams.get('error');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(true);
        if (data.magicLink) {
          setMagicLink(data.magicLink);
        }
      } else {
        setError(data.message || 'Login failed');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Card sx={{ width: '100%' }}>
          <CardContent sx={{ p: 4 }}>
            <Box sx={{ textAlign: 'center', mb: 4 }}>
              <Typography variant="h4" component="h1" gutterBottom>
                MarketPrice
              </Typography>
              <Typography variant="body1" color="text.secondary">
                HBS Ticket Marketplace
              </Typography>
            </Box>

            {errorParam && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {errorParam === 'missing_token' && 'Missing authentication token'}
                {errorParam === 'invalid_token' && 'Invalid or expired token'}
                {errorParam === 'verification_failed' && 'Verification failed'}
              </Alert>
            )}

            {error && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {error}
              </Alert>
            )}

            {success ? (
              <Box>
                <Alert severity="success" sx={{ mb: 3 }}>
                  Magic link sent! Check your email to continue.
                </Alert>
                {magicLink && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Development Mode: Click the link below to sign in
                    </Typography>
                    <MuiLink
                      href={magicLink}
                      sx={{
                        display: 'block',
                        mt: 1,
                        p: 2,
                        bgcolor: 'grey.100',
                        borderRadius: 1,
                        wordBreak: 'break-all',
                      }}
                    >
                      {magicLink}
                    </MuiLink>
                  </Box>
                )}
              </Box>
            ) : (
              <form onSubmit={handleSubmit}>
                <TextField
                  fullWidth
                  type="email"
                  label="Email Address"
                  placeholder="your.email@hbs.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                  InputProps={{
                    startAdornment: <EmailIcon sx={{ mr: 1, color: 'action.active' }} />,
                  }}
                  sx={{ mb: 3 }}
                  helperText="Only @hbs.edu email addresses are allowed"
                />

                <Button
                  fullWidth
                  type="submit"
                  variant="contained"
                  size="large"
                  disabled={loading}
                >
                  {loading ? 'Sending...' : 'Send Magic Link'}
                </Button>

                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mt: 3, textAlign: 'center' }}
                >
                  We'll send you a magic link to sign in without a password.
                </Typography>
              </form>
            )}
          </CardContent>
        </Card>
      </Box>
    </Container>
  );
}
