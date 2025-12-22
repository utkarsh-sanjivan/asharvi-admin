import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Button, Grid, IconButton, Pagination, Snackbar, Stack, Tooltip, Typography } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import RefreshIcon from '@mui/icons-material/Refresh';
import { useNavigate } from 'react-router-dom';
import styles from '../styles/Page.module.css';
import CourseCard from '../components/courses/CourseCard';
import CourseFilters from '../components/courses/CourseFilters';
import CourseSkeletonGrid from '../components/courses/CourseSkeletonGrid';
import EmptyState from '../components/courses/EmptyState';
import CourseDrawer from '../components/courses/CourseDrawer';
import useCoursesApi from '../hooks/useCoursesApi';
import { mapApiErrorToDisplay } from '../api/errors';
import { RateLimitError } from '../api/request';
import GlobalErrorBanner from '../components/GlobalErrorBanner/GlobalErrorBanner';
import useRateLimitCountdown from '../hooks/useRateLimitCountdown';
import { logEvent } from '../features/diagnostics/diagnosticsStore';
import { ENVIRONMENTS } from '../config/environment';

const CoursesPage = ({ environment }) => {
  const api = useCoursesApi();
  const navigate = useNavigate();
  const [filters, setFilters] = useState({ page: 1, pageSize: 12, search: '', status: undefined, tag: undefined });
  const [courses, setCourses] = useState([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [errorNotice, setErrorNotice] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [rateLimitError, setRateLimitError] = useState(null);
  const [rateLimitToast, setRateLimitToast] = useState(null);
  const rateLimitCountdown = useRateLimitCountdown();

  const loadCourses = async () => {
    setIsLoading(true);
    setErrorNotice(null);
    try {
      const data = await api.listCourses(filters);
      setCourses(data.items || []);
      setTotal(data.total || 0);
      setRateLimitError(null);
      rateLimitCountdown.reset();
    } catch (err) {
      const friendly = mapApiErrorToDisplay(err, { resourceLabel: 'courses' });
      if (err instanceof RateLimitError) {
        setRateLimitError(err);
        rateLimitCountdown.start(err.retryAfterMs);
      } else {
        setErrorNotice(friendly);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCourses();
  }, [filters, environment]);

  const handleCardClick = (course) => {
    setSelected(course);
    setDrawerOpen(true);
  };

  const handleCreate = async () => {
    try {
      const payload = { title: 'Untitled course', status: 'draft', visibility: 'unlisted' };
      const created = await api.createCourse(payload);
      logEvent('COURSE_CREATE', { id: created?.id });
      navigate(`/courses/${created.id}`);
    } catch (err) {
      const friendly = mapApiErrorToDisplay(err, { resourceLabel: 'course creation' });
      if (err instanceof RateLimitError) {
        setRateLimitError(err);
        rateLimitCountdown.start(err.retryAfterMs);
        setRateLimitToast({ message: friendly.description, action: handleCreate });
      } else {
        setErrorNotice(friendly);
      }
    }
  };

  const pageCount = useMemo(() => Math.ceil((total || 0) / (filters.pageSize || 12)), [total, filters.pageSize]);

  const publishSelectedCourse = async () => {
    if (!selected) return;
    const confirmed = window.confirm(
      environment === ENVIRONMENTS.production
        ? 'Publish in production? Students will see this immediately.'
        : 'Publish this course?'
    );
    if (!confirmed) return;
    try {
      await api.publishCourse(selected.id);
      logEvent('COURSE_PUBLISH', { id: selected.id });
      loadCourses();
    } catch (err) {
      const friendly = mapApiErrorToDisplay(err, { resourceLabel: 'publish' });
      if (err instanceof RateLimitError) {
        setRateLimitError(err);
        rateLimitCountdown.start(err.retryAfterMs);
        setRateLimitToast({ message: friendly.description, action: publishSelectedCourse });
      } else {
        setErrorNotice(friendly);
      }
    }
  };

  const archiveSelectedCourse = async () => {
    if (!selected) return;
    const confirmed = window.confirm(
      environment === ENVIRONMENTS.production
        ? 'Archive in production? Active students will lose access.'
        : 'Archive this course?'
    );
    if (!confirmed) return;
    try {
      await api.archiveCourse(selected.id);
      logEvent('COURSE_ARCHIVE', { id: selected.id });
      loadCourses();
    } catch (err) {
      const friendly = mapApiErrorToDisplay(err, { resourceLabel: 'archive' });
      if (err instanceof RateLimitError) {
        setRateLimitError(err);
        rateLimitCountdown.start(err.retryAfterMs);
        setRateLimitToast({ message: friendly.description, action: archiveSelectedCourse });
      } else {
        setErrorNotice(friendly);
      }
    }
  };

  const deleteSelectedCourse = async () => {
    if (!selected) return;
    if (environment === ENVIRONMENTS.production) {
      const typed = window.prompt(
        `Delete in production is irreversible.\nType the slug "${selected.slug}" to confirm deletion.`
      );
      if (typed !== selected.slug) {
        setErrorNotice(
          mapApiErrorToDisplay(new Error('Deletion cancelled. Confirmation text did not match slug.'), {
            resourceLabel: 'delete confirmation',
          })
        );
        return;
      }
    } else {
      const confirmed = window.confirm('Delete this course?');
      if (!confirmed) return;
    }
    try {
      await api.deleteCourse(selected.id);
      logEvent('COURSE_DELETE', { id: selected.id });
      setDrawerOpen(false);
      loadCourses();
    } catch (err) {
      const friendly =
        err?.status === 409
          ? mapApiErrorToDisplay(new Error('Cannot delete published course. Please archive instead.'), {
              resourceLabel: 'delete',
            })
          : mapApiErrorToDisplay(err, { resourceLabel: 'delete' });
      if (err instanceof RateLimitError) {
        setRateLimitError(err);
        rateLimitCountdown.start(err.retryAfterMs);
        setRateLimitToast({ message: friendly.description, action: deleteSelectedCourse });
      } else {
        setErrorNotice(friendly);
      }
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Courses</h1>
          <p className={styles.subtitle}>Manage catalog, pricing, and availability.</p>
        </div>
        <Stack direction="row" spacing={1}>
          <Tooltip title="Refresh">
            <IconButton onClick={loadCourses}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          <Button variant="contained" startIcon={<AddIcon />} onClick={handleCreate}>
            New Course
          </Button>
        </Stack>
      </div>

      <Stack spacing={2} sx={{ marginBottom: 2 }}>
        <CourseFilters
          filters={filters}
          onChange={setFilters}
          onReset={() => setFilters({ page: 1, pageSize: 12, search: '', status: undefined, tag: undefined })}
          onToggleDrawer={() => {
            if (courses.length > 0) {
              setSelected(courses[0]);
              setDrawerOpen(true);
            }
          }}
        />
        <GlobalErrorBanner error={errorNotice} onRetry={loadCourses} onClose={() => setErrorNotice(null)} />
        {rateLimitError && (
          <Alert
            severity="warning"
            action={
              <Button
                color="inherit"
                size="small"
                disabled={!rateLimitCountdown.canRetry}
                onClick={() => {
                  rateLimitCountdown.reset();
                  loadCourses();
                }}
              >
                {rateLimitCountdown.canRetry
                  ? 'Retry now'
                  : `Retry in ${rateLimitCountdown.secondsRemaining || 1}s`}
              </Button>
            }
          >
            {rateLimitError?.message || 'Rate limit reached. Please wait before retrying.'}
          </Alert>
        )}
      </Stack>

      {isLoading ? (
        <CourseSkeletonGrid />
      ) : courses.length === 0 ? (
        <EmptyState onCreate={handleCreate} />
      ) : (
        <>
          <Grid container spacing={2}>
            {courses.map((course) => (
              <Grid item xs={12} sm={6} md={4} key={course.id}>
                <CourseCard course={course} onClick={() => handleCardClick(course)} />
              </Grid>
            ))}
          </Grid>
          <Stack direction="row" justifyContent="flex-end" sx={{ marginTop: 2 }}>
            <Pagination
              page={filters.page}
              count={pageCount || 1}
              onChange={(_, page) => setFilters({ ...filters, page })}
              shape="rounded"
            />
          </Stack>
        </>
      )}

      <CourseDrawer
        open={drawerOpen}
        course={selected}
        onClose={() => setDrawerOpen(false)}
        onEdit={() => selected && navigate(`/courses/${selected.id}`)}
        onPublish={publishSelectedCourse}
        onArchive={archiveSelectedCourse}
        onDelete={deleteSelectedCourse}
      />

      <Snackbar
        open={!!rateLimitToast}
        autoHideDuration={6000}
        onClose={() => setRateLimitToast(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          severity="warning"
          variant="filled"
          action={
            <Button
              color="inherit"
              size="small"
              disabled={!rateLimitCountdown.canRetry}
              onClick={() => {
                const retry = rateLimitToast?.action;
                if (retry && rateLimitCountdown.canRetry) {
                  retry();
                  setRateLimitToast(null);
                }
              }}
            >
              {rateLimitCountdown.canRetry
                ? 'Retry'
                : `Retry in ${rateLimitCountdown.secondsRemaining || 1}s`}
            </Button>
          }
        >
          {rateLimitToast?.message || 'Rate limited. Please retry in a moment.'}
        </Alert>
      </Snackbar>
    </div>
  );
};

export default CoursesPage;
