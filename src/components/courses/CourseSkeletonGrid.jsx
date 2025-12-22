import React from 'react';
import { Card, CardContent, Grid, Skeleton, Stack } from '@mui/material';

const CourseSkeletonGrid = ({ count = 6 }) => {
  return (
    <Grid container spacing={2}>
      {Array.from({ length: count }).map((_, index) => (
        <Grid item xs={12} sm={6} md={4} key={index}>
          <Card elevation={0} variant="outlined" sx={{ borderRadius: 2 }}>
            <Skeleton variant="rectangular" height={140} />
            <CardContent>
              <Stack spacing={1}>
                <Skeleton variant="text" width="60%" />
                <Skeleton variant="text" width="40%" />
                <Skeleton variant="text" width="90%" />
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
};

export default CourseSkeletonGrid;
