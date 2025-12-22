import React from 'react';
import { Alert, Box, Button, Paper, Stack, Typography } from '@mui/material';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  handleReload = () => {
    window.location.reload();
  };

  handleCopy = async () => {
    const payload = this.state.error?.message || 'Unknown error';
    try {
      await navigator.clipboard.writeText(payload);
    } catch (err) {
      // swallow clipboard errors
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <Box sx={{ padding: 4, maxWidth: 640, margin: '80px auto' }}>
          <Paper variant="outlined" sx={{ padding: 3 }}>
            <Stack spacing={2}>
              <Typography variant="h5" fontWeight={700}>
                Something went wrong
              </Typography>
              <Typography variant="body1" color="text.secondary">
                The page failed to render. You can reload the app or copy the error message to share with support.
              </Typography>
              <Alert severity="error" variant="outlined">
                {this.state.error?.message || 'Unexpected error'}
              </Alert>
              <Stack direction="row" spacing={1}>
                <Button variant="contained" onClick={this.handleReload}>
                  Reload
                </Button>
                <Button variant="outlined" onClick={this.handleCopy}>
                  Copy error details
                </Button>
              </Stack>
            </Stack>
          </Paper>
        </Box>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
