import React, { useState } from 'react';
import { Alert, Box, Button, Card, CardContent, Stack, TextField, Typography } from '@mui/material';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { ENVIRONMENTS } from '../../config/environment';
import styles from './Login.module.css';

const LoginPage = () => {
  const { login, environment, setEnvironment, isLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = location.state?.from?.pathname || '/dashboard';

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(email, password);
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(err?.message || 'Login failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box className={styles.loginPage}>
      <Card className={styles.card} elevation={1}>
        <CardContent>
          <Stack spacing={2}>
            <div>
              <Typography variant="h5" fontWeight={700}>
                Sign in to Asharvi Admin
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Choose your environment and use your admin credentials to continue.
              </Typography>
            </div>

            <Stack direction="row" spacing={1} alignItems="center" className={styles.envRow}>
              <Typography variant="body2" color="text.secondary">
                Environment:
              </Typography>
              <Button
                size="small"
                variant={environment === ENVIRONMENTS.staging ? 'contained' : 'outlined'}
                onClick={() => setEnvironment(ENVIRONMENTS.staging)}
              >
                Staging
              </Button>
              <Button
                size="small"
                color="error"
                variant={environment === ENVIRONMENTS.production ? 'contained' : 'outlined'}
                onClick={() => setEnvironment(ENVIRONMENTS.production)}
              >
                Production
              </Button>
            </Stack>

            {error && (
              <Alert severity="error" variant="outlined">
                {error}
              </Alert>
            )}

            <form onSubmit={handleSubmit}>
              <Stack spacing={2}>
                <TextField
                  label="Email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={submitting || isLoading}
                />
                <TextField
                  label="Password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={submitting || isLoading}
                />
                <Button type="submit" variant="contained" size="large" disabled={submitting || isLoading}>
                  {submitting ? 'Signing in...' : 'Sign In'}
                </Button>
              </Stack>
            </form>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
};

export default LoginPage;
