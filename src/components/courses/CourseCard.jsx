import React from 'react';
import {
  Avatar,
  Box,
  Card,
  CardActionArea,
  CardContent,
  Chip,
  Stack,
  Typography,
} from '@mui/material';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import styles from './CourseCard.module.css';

const statusColor = {
  draft: 'default',
  published: 'success',
  archived: 'warning',
};

const CourseCard = ({ course, onClick }) => {
  return (
    <Card className={styles.card} elevation={0} variant="outlined">
      <CardActionArea onClick={onClick} className={styles.action}>
        <Box className={styles.thumbWrapper}>
          {course.thumbnailUrl ? (
            <img src={course.thumbnailUrl} alt={course.title} className={styles.thumbnail} />
          ) : (
            <div className={styles.placeholder}>No thumbnail</div>
          )}
          <Chip
            label={course.status}
            color={statusColor[course.status] || 'default'}
            size="small"
            className={styles.statusChip}
          />
        </Box>
        <CardContent className={styles.content}>
          <Stack direction="row" spacing={1} alignItems="center" className={styles.titleRow}>
            <Avatar sx={{ width: 32, height: 32 }}>{course.title?.slice(0, 1) || '?'}</Avatar>
            <Box>
              <Typography variant="subtitle1" className={styles.title} noWrap>
                {course.title || 'Untitled course'}
              </Typography>
              <Typography variant="body2" color="text.secondary" noWrap>
                {course.slug || 'no-slug'}
              </Typography>
            </Box>
          </Stack>
          <Typography variant="body2" color="text.secondary" className={styles.description} noWrap>
            {course.description || 'No description yet.'}
          </Typography>
          <Stack direction="row" spacing={1} className={styles.meta}>
            <Chip size="small" icon={<AccessTimeIcon fontSize="inherit" />} label={`${course.durationMinutes || 0}m`} />
            <Chip
              size="small"
              icon={<CalendarTodayIcon fontSize="inherit" />}
              label={course.publishedAt ? 'Published' : 'Unpublished'}
              variant="outlined"
            />
          </Stack>
        </CardContent>
      </CardActionArea>
    </Card>
  );
};

export default CourseCard;
