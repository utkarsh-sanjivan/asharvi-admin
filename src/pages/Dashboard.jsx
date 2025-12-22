import React from 'react';
import { Card, CardContent, Grid, Typography } from '@mui/material';
import { getApiBaseUrl } from '../config/environment';
import styles from '../styles/Page.module.css';

const DashboardPage = ({ environment }) => {
  const activeBaseUrl = getApiBaseUrl(environment);

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Dashboard</h1>
          <p className={styles.subtitle}>High-level overview and quick links.</p>
        </div>
      </div>
      <div className={styles.placeholder}>
        <Typography variant="body1" sx={{ marginBottom: 2 }}>
          This is a placeholder dashboard for Asharvi Admin. Future iterations will surface key metrics,
          quick actions, and alerts relevant to the selected environment.
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Card elevation={0} variant="outlined">
              <CardContent>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Active Environment
                </Typography>
                <Typography variant="h6">{environment === 'production' ? 'Production' : 'Staging'}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card elevation={0} variant="outlined">
              <CardContent>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  API Base URL
                </Typography>
                <Typography variant="body2" color="text.primary">
                  {activeBaseUrl || 'Not configured'}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </div>
    </div>
  );
};

export default DashboardPage;
