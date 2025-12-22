import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  Divider,
  Grid,
  IconButton,
  MenuItem,
  Stack,
  Tab,
  Tabs,
  TextField,
  Tooltip,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Select,
  InputLabel,
  FormControl,
  List,
  ListItem,
  ListItemText,
  CircularProgress,
  LinearProgress,
  Paper,
  Snackbar,
} from '@mui/material';
import { useBlocker, useNavigate, useParams } from 'react-router-dom';
import SaveIcon from '@mui/icons-material/Save';
import PublishIcon from '@mui/icons-material/Publish';
import ArchiveIcon from '@mui/icons-material/Archive';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import RefreshIcon from '@mui/icons-material/Refresh';
import InsertDriveFileOutlinedIcon from '@mui/icons-material/InsertDriveFileOutlined';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import styles from '../styles/Page.module.css';
import useCoursesApi from '../hooks/useCoursesApi';
import { applyReplication, normalizeCourse, slugIsValid } from '../utils/courses';
import { deepEqual } from '../utils/form';
import { createApiClient } from '../api/apiClientFactory';
import { getApiBaseUrl, ENVIRONMENTS } from '../config/environment';
import { getAuthConfig } from '../config/auth';
import { getCookie } from '../utils/cookies';
import { createCoursesApi } from '../api/courses';
import { useAuth } from '../auth/AuthContext';
import FileUpload from '../components/FileUpload/FileUpload';
import GlobalErrorBanner from '../components/GlobalErrorBanner/GlobalErrorBanner';
import { mapApiErrorToDisplay } from '../api/errors';
import { RateLimitError } from '../api/request';
import useRateLimitCountdown from '../hooks/useRateLimitCountdown';
import { logEvent } from '../features/diagnostics/diagnosticsStore';
import {
  ALLOWED_ATTACHMENT_EXTENSIONS,
  ATTACHMENT_MAX_BYTES,
  THUMBNAIL_MAX_BYTES,
  formatBytes,
  normalizeUploadError,
  uploadAttachment,
  uploadThumbnail,
} from '../features/uploads/uploadApi';

const TabPanel = ({ value, index, children }) => {
  if (value !== index) return null;
  return <Box sx={{ paddingTop: 2 }}>{children}</Box>;
};

const isValidUrl = (value) => {
  if (!value) return false;
  try {
    // eslint-disable-next-line no-new
    new URL(value);
    return true;
  } catch (err) {
    return false;
  }
};

const computeVideoErrors = (course) => {
  const errors = {};
  (course?.modules || []).forEach((mod) => {
    (mod.lessons || []).forEach((lesson) => {
      if (lesson.type === 'video') {
        const url = (lesson.content || '').trim();
        if (!url) {
          errors[lesson.id] = 'Video URL is required';
        } else if (!isValidUrl(url)) {
          errors[lesson.id] = 'Enter a valid video URL';
        }
      }
    });
  });
  return errors;
};

const updateLessonInCourseData = (course, lessonId, updater) => {
  if (!course) return course;
  return {
    ...course,
    modules: (course.modules || []).map((mod) => ({
      ...mod,
      lessons: (mod.lessons || []).map((lesson) => (lesson.id === lessonId ? updater(lesson) : lesson)),
    })),
  };
};

const findLessonInCourse = (course, lessonId) => {
  if (!course) return null;
  for (const mod of course.modules || []) {
    for (const lesson of mod.lessons || []) {
      if (lesson.id === lessonId) {
        return lesson;
      }
    }
  }
  return null;
};

const BasicsTab = ({ course, onChange, slugError, onThumbnailUpload, onRemoveThumbnail, thumbnailUpload }) => {
  const thumbnailInputRef = useRef(null);

  return (
    <Grid container spacing={2}>
      <Grid item xs={12} md={6}>
        <TextField
          label="Title"
          fullWidth
          value={course.title || ''}
          onChange={(e) => onChange({ ...course, title: e.target.value })}
        />
      </Grid>
      <Grid item xs={12} md={6}>
        <TextField
          label="Slug"
          fullWidth
          value={course.slug || ''}
          error={!!slugError}
          helperText={slugError || 'Use lowercase letters, numbers, and hyphens'}
          onChange={(e) => onChange({ ...course, slug: e.target.value })}
        />
      </Grid>
      <Grid item xs={12}>
        <TextField
          label="Description"
          fullWidth
          multiline
          minRows={3}
          value={course.description || ''}
          onChange={(e) => onChange({ ...course, description: e.target.value })}
        />
      </Grid>
      <Grid item xs={12} md={6}>
        <TextField
          label="Category"
          fullWidth
          value={course.category || ''}
          onChange={(e) => onChange({ ...course, category: e.target.value })}
        />
      </Grid>
      <Grid item xs={12} md={6}>
        <Stack spacing={1.5}>
          <Typography variant="subtitle1" fontWeight={600}>
            Thumbnail
          </Typography>
          <Paper variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden', position: 'relative' }}>
            {course.thumbnailUrl ? (
              <Box
                component="img"
                src={course.thumbnailUrl}
                alt="Course thumbnail"
                sx={{ width: '100%', height: 220, objectFit: 'cover' }}
              />
            ) : (
              <Stack alignItems="center" justifyContent="center" sx={{ height: 220, bgcolor: '#f8fafc' }} spacing={1}>
                <InsertDriveFileOutlinedIcon color="action" />
                <Typography variant="body2" color="text.secondary">
                  No thumbnail uploaded yet
                </Typography>
              </Stack>
            )}
            {thumbnailUpload?.status === 'uploading' && (
              <Box sx={{ position: 'absolute', bottom: 0, left: 0, right: 0 }}>
                <LinearProgress value={thumbnailUpload.progress || 0} variant="determinate" />
              </Box>
            )}
          </Paper>
          <Stack direction="row" spacing={1}>
            <Button
              variant="outlined"
              size="small"
              onClick={() => thumbnailInputRef.current?.click()}
              startIcon={<CloudUploadIcon />}
            >
              Upload Thumbnail
            </Button>
            {course.thumbnailUrl && (
              <Button variant="text" color="error" size="small" onClick={onRemoveThumbnail}>
                Remove
              </Button>
            )}
          </Stack>
          <FileUpload
            accept="image/*"
            allowedExtensions={['png', 'jpg', 'jpeg', 'webp']}
            maxSize={THUMBNAIL_MAX_BYTES}
            multiple={false}
            onFilesSelected={(files) => files[0] && onThumbnailUpload?.(files[0])}
            helperText={`PNG, JPG up to ${formatBytes(THUMBNAIL_MAX_BYTES)}`}
            dropLabel="Drag an image here or click to upload"
            inputRef={thumbnailInputRef}
            selectedFiles={
              thumbnailUpload?.status && thumbnailUpload.status !== 'idle'
                ? [
                    {
                      name: course.thumbnailUrl ? 'Thumbnail' : 'New thumbnail',
                      progress: thumbnailUpload.progress,
                      status: thumbnailUpload.status,
                      error: thumbnailUpload.error,
                    },
                  ]
                : []
            }
          />
        </Stack>
      </Grid>
    </Grid>
  );
};

const PricingTab = ({ course, onChange }) => (
  <Grid container spacing={2}>
    <Grid item xs={12} md={6}>
      <TextField
        label="Price (cents)"
        type="number"
        fullWidth
        value={course.priceCents || 0}
        onChange={(e) => onChange({ ...course, priceCents: Number(e.target.value) })}
      />
    </Grid>
    <Grid item xs={12} md={6}>
      <FormControl fullWidth>
        <InputLabel id="currency-label">Currency</InputLabel>
        <Select
          labelId="currency-label"
          label="Currency"
          value={course.currency || 'USD'}
          onChange={(e) => onChange({ ...course, currency: e.target.value })}
        >
          <MenuItem value="USD">USD</MenuItem>
          <MenuItem value="EUR">EUR</MenuItem>
        </Select>
      </FormControl>
    </Grid>
  </Grid>
);

const SeoTab = ({ course, onChange }) => (
  <Grid container spacing={2}>
    <Grid item xs={12}>
      <TextField
        label="Meta title"
        fullWidth
        value={course.seo?.metaTitle || ''}
        onChange={(e) => onChange({ ...course, seo: { ...course.seo, metaTitle: e.target.value } })}
      />
    </Grid>
    <Grid item xs={12}>
      <TextField
        label="Meta description"
        fullWidth
        multiline
        minRows={2}
        value={course.seo?.metaDescription || ''}
        onChange={(e) => onChange({ ...course, seo: { ...course.seo, metaDescription: e.target.value } })}
      />
    </Grid>
  </Grid>
);

const PublishingTab = ({ course }) => (
  <Stack spacing={2}>
    <Typography variant="body2" color="text.secondary">
      Status: <strong>{course.status}</strong>
    </Typography>
    <Typography variant="body2" color="text.secondary">
      Visibility: {course.visibility || 'unlisted'}
    </Typography>
    <Typography variant="body2" color="text.secondary">
      Published at: {course.publishedAt || 'not published'}
    </Typography>
  </Stack>
);

const LessonRow = ({
  lesson,
  onChange,
  onDelete,
  onMove,
  onUploadAttachments,
  onRemoveAttachment,
  attachmentUploads = [],
  videoError,
}) => {
  const isDownload = lesson.type === 'download';
  const isVideo = lesson.type === 'video';
  const attachments = lesson.attachments || [];

  return (
    <Stack spacing={1.5} sx={{ border: '1px solid #e5e7eb', borderRadius: 1, padding: 1.5 }}>
      <Stack direction="row" spacing={1} alignItems="center">
        <Typography variant="subtitle2">{lesson.title || 'Lesson'}</Typography>
        <Chip label={lesson.type} size="small" />
        <Box sx={{ flex: 1 }} />
        <Button size="small" onClick={() => onMove(-1)}>
          Up
        </Button>
        <Button size="small" onClick={() => onMove(1)}>
          Down
        </Button>
        <Button size="small" color="error" onClick={onDelete}>
          Delete
        </Button>
      </Stack>
      <TextField
        label="Lesson title"
        fullWidth
        value={lesson.title || ''}
        onChange={(e) => onChange({ ...lesson, title: e.target.value })}
      />
      <FormControl fullWidth>
        <InputLabel id={`type-${lesson.id}`}>Type</InputLabel>
        <Select
          labelId={`type-${lesson.id}`}
          label="Type"
          value={lesson.type || 'video'}
          onChange={(e) => onChange({ ...lesson, type: e.target.value })}
        >
          <MenuItem value="video">Video</MenuItem>
          <MenuItem value="article">Article</MenuItem>
          <MenuItem value="quiz">Quiz</MenuItem>
          <MenuItem value="download">Download</MenuItem>
        </Select>
      </FormControl>
      {isVideo ? (
        <TextField
          label="Video URL"
          fullWidth
          value={lesson.content || ''}
          onChange={(e) => onChange({ ...lesson, content: e.target.value })}
          error={!!videoError}
          helperText={videoError || 'Provide a valid video URL'}
        />
      ) : (
        <TextField
          label={isDownload ? 'Resource description / URL' : 'Content / URL'}
          fullWidth
          value={lesson.content || ''}
          onChange={(e) => onChange({ ...lesson, content: e.target.value })}
          helperText={isDownload ? 'Optional description or reference link for this download' : ''}
        />
      )}
      {isDownload && (
        <Stack spacing={1}>
          <Typography variant="subtitle2">Attachments</Typography>
          <Stack spacing={1}>
            {attachments.map((url) => (
              <Paper key={url} variant="outlined" sx={{ padding: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                <InsertDriveFileOutlinedIcon fontSize="small" color="action" />
                <Typography variant="body2" sx={{ flex: 1 }} noWrap title={url}>
                  {url}
                </Typography>
                <IconButton edge="end" size="small" onClick={() => onRemoveAttachment(url)}>
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Paper>
            ))}
            {attachments.length === 0 && (
              <Typography variant="body2" color="text.secondary">
                No attachments yet.
              </Typography>
            )}
          </Stack>
          <FileUpload
            label="Upload attachments"
            accept={ALLOWED_ATTACHMENT_EXTENSIONS.map((ext) => `.${ext}`).join(',')}
            allowedExtensions={ALLOWED_ATTACHMENT_EXTENSIONS}
            maxSize={ATTACHMENT_MAX_BYTES}
            multiple
            helperText={`PDF, DOC, PPT, XLS, ZIP, PNG, JPG up to ${formatBytes(ATTACHMENT_MAX_BYTES)}`}
            onFilesSelected={(files) => onUploadAttachments(files)}
          />
          {attachmentUploads.length > 0 && (
            <Stack spacing={0.5}>
              {attachmentUploads.map((upload) => (
                <Stack key={upload.id} spacing={0.25}>
                  <Stack direction="row" alignItems="center" justifyContent="space-between">
                    <Typography variant="body2">{upload.name}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {upload.status === 'error' ? 'Failed' : upload.status === 'success' ? 'Uploaded' : 'Uploading'}
                    </Typography>
                  </Stack>
                  <LinearProgress
                    variant={upload.status === 'error' ? 'determinate' : 'determinate'}
                    value={upload.status === 'error' ? 0 : upload.progress || 0}
                  />
                  {upload.error && (
                    <Typography variant="caption" color="error">
                      {upload.error}
                    </Typography>
                  )}
                </Stack>
              ))}
            </Stack>
          )}
        </Stack>
      )}
    </Stack>
  );
};

const ModuleCard = ({
  module,
  onChange,
  onDelete,
  onAddLesson,
  onMoveModule,
  onMoveLesson,
  onUploadAttachments,
  onRemoveAttachment,
  attachmentUploads,
  videoErrors,
}) => (
  <Stack spacing={1.5} sx={{ border: '1px solid #e2e8f0', borderRadius: 2, padding: 2, background: '#f8fafc' }}>
    <Stack direction="row" alignItems="center" spacing={1}>
      <Typography variant="h6">{module.title || 'Module'}</Typography>
      <Box sx={{ flex: 1 }} />
      <Button size="small" onClick={() => onMoveModule(-1)}>
        Up
      </Button>
      <Button size="small" onClick={() => onMoveModule(1)}>
        Down
      </Button>
      <Button size="small" color="error" onClick={onDelete}>
        Remove
      </Button>
    </Stack>
    <TextField
      label="Module title"
      fullWidth
      value={module.title || ''}
      onChange={(e) => onChange({ ...module, title: e.target.value })}
    />
    <TextField
      label="Summary"
      fullWidth
      multiline
      minRows={2}
      value={module.summary || ''}
      onChange={(e) => onChange({ ...module, summary: e.target.value })}
    />
    <Divider />
    <Stack spacing={1}>
      <Stack direction="row" alignItems="center" spacing={1}>
        <Typography variant="subtitle2">Lessons</Typography>
        <Button size="small" startIcon={<AddIcon />} onClick={onAddLesson}>
          Add lesson
        </Button>
      </Stack>
      <Stack spacing={1}>
        {module.lessons?.map((lesson, idx) => (
          <LessonRow
            key={lesson.id || idx}
            lesson={lesson}
            onChange={(updated) => onChange({ ...module, lessons: module.lessons.map((l, i) => (i === idx ? updated : l)) })}
            onDelete={() => onChange({ ...module, lessons: module.lessons.filter((_, i) => i !== idx) })}
            onMove={(delta) => onMoveLesson(idx, delta)}
            onUploadAttachments={(files) => onUploadAttachments(lesson.id, files)}
            onRemoveAttachment={(url) => onRemoveAttachment(lesson.id, url)}
            attachmentUploads={attachmentUploads?.[lesson.id] || []}
            videoError={videoErrors?.[lesson.id]}
          />
        ))}
      </Stack>
    </Stack>
  </Stack>
);

const CurriculumTab = ({ course, onChange, onUploadAttachments, onRemoveAttachment, attachmentUploads, videoErrors }) => {
  const modules = course.modules || [];

  const addModule = () => {
    const next = [...modules, { id: `m-${Date.now()}`, title: 'New module', lessons: [], order: modules.length + 1 }];
    onChange({ ...course, modules: next });
  };

  const updateModule = (index, mod) => {
    const next = modules.map((m, i) => (i === index ? { ...mod } : m));
    onChange({ ...course, modules: next });
  };

  const removeModule = (index) => {
    const next = modules.filter((_, i) => i !== index);
    onChange({ ...course, modules: next });
  };

  const moveModule = (index, delta) => {
    const newIndex = index + delta;
    if (newIndex < 0 || newIndex >= modules.length) return;
    const reordered = [...modules];
    const [item] = reordered.splice(index, 1);
    reordered.splice(newIndex, 0, item);
    onChange({ ...course, modules: reordered });
  };

  const moveLesson = (moduleIndex, lessonIndex, delta) => {
    const mod = modules[moduleIndex];
    const newIndex = lessonIndex + delta;
    if (newIndex < 0 || newIndex >= mod.lessons.length) return;
    const lessons = [...mod.lessons];
    const [item] = lessons.splice(lessonIndex, 1);
    lessons.splice(newIndex, 0, item);
    updateModule(moduleIndex, { ...mod, lessons });
  };

  return (
    <Stack spacing={2}>
      <Button variant="outlined" startIcon={<AddIcon />} onClick={addModule}>
        Add module
      </Button>
      <Stack spacing={2}>
        {modules.map((mod, idx) => (
          <ModuleCard
            key={mod.id || idx}
            module={mod}
            onChange={(m) => updateModule(idx, m)}
            onDelete={() => removeModule(idx)}
            onAddLesson={() =>
              updateModule(idx, {
                ...mod,
                lessons: [
                  ...(mod.lessons || []),
                  {
                    id: `l-${Date.now()}`,
                    title: 'New lesson',
                    type: 'video',
                    order: (mod.lessons?.length || 0) + 1,
                    attachments: [],
                    content: '',
                  },
                ],
              })
            }
            onMoveModule={(delta) => moveModule(idx, delta)}
            onMoveLesson={(lessonIndex, delta) => moveLesson(idx, lessonIndex, delta)}
            onUploadAttachments={onUploadAttachments}
            onRemoveAttachment={onRemoveAttachment}
            attachmentUploads={attachmentUploads}
            videoErrors={videoErrors}
          />
        ))}
      </Stack>
    </Stack>
  );
};

const ReplicateDialog = ({ open, onClose, onSelect, isLoading, courses, sourceEnv, onEnvChange, onSearch }) => (
  <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
    <DialogTitle>Replicate from environment</DialogTitle>
    <DialogContent dividers>
      <Stack spacing={2}>
        <FormControl fullWidth>
          <InputLabel id="source-env">Source environment</InputLabel>
          <Select
            labelId="source-env"
            label="Source environment"
            value={sourceEnv}
            onChange={(e) => onEnvChange(e.target.value)}
          >
            <MenuItem value={ENVIRONMENTS.staging}>Staging</MenuItem>
            <MenuItem value={ENVIRONMENTS.production}>Production</MenuItem>
          </Select>
        </FormControl>
        <TextField placeholder="Search course" fullWidth onChange={(e) => onSearch(e.target.value)} />
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
            <CircularProgress size={24} />
          </Box>
        ) : (
          <List dense>
            {courses.map((course) => (
              <ListItem button key={course.id} onClick={() => onSelect(course)}>
                <ListItemText primary={course.title || 'Untitled'} secondary={course.slug} />
              </ListItem>
            ))}
            {courses.length === 0 && (
              <Typography variant="body2" color="text.secondary">
                No courses found
              </Typography>
            )}
          </List>
        )}
      </Stack>
    </DialogContent>
    <DialogActions>
      <Button onClick={onClose}>Close</Button>
    </DialogActions>
  </Dialog>
);

const CourseEditorPage = ({ environment }) => {
  const { courseId } = useParams();
  const api = useCoursesApi();
  const { apiClient } = useAuth();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [initialCourse, setInitialCourse] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [errorNotice, setErrorNotice] = useState(null);
  const [saveState, setSaveState] = useState('idle');
  const [dirty, setDirty] = useState(false);
  const [replicateOpen, setReplicateOpen] = useState(false);
  const [replicateEnv, setReplicateEnv] = useState(ENVIRONMENTS.staging);
  const [replicateList, setReplicateList] = useState([]);
  const [isReplicateLoading, setIsReplicateLoading] = useState(false);
  const [replicateSearch, setReplicateSearch] = useState('');
  const [videoErrors, setVideoErrors] = useState({});
  const [thumbnailUpload, setThumbnailUpload] = useState({ status: 'idle', progress: 0, error: '' });
  const [attachmentUploads, setAttachmentUploads] = useState({});
  const [toast, setToast] = useState({ open: false, message: '', severity: 'info' });
  const saveTimeoutRef = useRef();
  const [rateLimitError, setRateLimitError] = useState(null);
  const [rateLimitToast, setRateLimitToast] = useState(null);
  const rateLimitCountdown = useRateLimitCountdown();

  const resetRateLimit = () => {
    setRateLimitError(null);
    rateLimitCountdown.reset();
  };

  const handleApiError = (err, resourceLabel, retryAction) => {
    const friendly = mapApiErrorToDisplay(err, { resourceLabel });
    if (err instanceof RateLimitError || err?.status === 429) {
      setRateLimitError(err);
      rateLimitCountdown.start(err?.retryAfterMs);
      if (retryAction) {
        setRateLimitToast({ message: friendly.description, action: retryAction });
      }
    } else {
      setErrorNotice(friendly);
    }
    return friendly;
  };

  const refreshDirtyState = (nextCourse, initialOverride) => {
    const errors = computeVideoErrors(nextCourse);
    setVideoErrors(errors);
    const baseInitial = initialOverride || initialCourse;
    setDirty(baseInitial ? !deepEqual(baseInitial, nextCourse) : true);
  };

  const updateCourseState = (nextCourse) => {
    setCourse(nextCourse);
    refreshDirtyState(nextCourse);
  };

  const updateCourseWithInitial = (nextCourse, nextInitial) => {
    setCourse(nextCourse);
    if (nextInitial) {
      setInitialCourse(nextInitial);
    }
    refreshDirtyState(nextCourse, nextInitial);
  };

  const showToast = (message, severity = 'info') => setToast({ open: true, message, severity });

  const loadCourse = async () => {
    setErrorNotice(null);
    try {
      const data = await api.getCourse(courseId);
      const normalized = normalizeCourse(data);
      updateCourseWithInitial(normalized, normalized);
      setSaveState('idle');
      setAttachmentUploads({});
      setThumbnailUpload({ status: 'idle', progress: 0, error: '' });
      resetRateLimit();
    } catch (err) {
      handleApiError(err, 'course', loadCourse);
    }
  };

  useEffect(() => {
    loadCourse();
  }, [courseId, environment]);

  useEffect(() => {
    const handler = (e) => {
      if (dirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [dirty]);

  const isSlugValid = course ? slugIsValid(course.slug) : true;

  const triggerSave = async (payload) => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    if (!dirty) return true;
    const candidate = payload || course;
    const videoIssues = computeVideoErrors(candidate);
    if (Object.keys(videoIssues).length > 0) {
      setVideoErrors(videoIssues);
      setErrorNotice(
        mapApiErrorToDisplay(new Error('Please fix video URL validation errors before saving.'), {
          resourceLabel: 'validation',
        })
      );
      setSaveState('error');
      return false;
    }
    if (!isSlugValid) {
      setSaveState('error');
      return false;
    }
    setSaveState('saving');
    try {
      const saved = await api.updateCourse(courseId, candidate);
      const normalized = normalizeCourse(saved);
      updateCourseWithInitial(normalized, normalized);
      setSaveState('saved');
      return true;
    } catch (err) {
      handleApiError(err, 'save', () => triggerSave(candidate));
      setSaveState('error');
      return false;
    }
  };

  const handleChange = (updated) => {
    updateCourseState(updated);
  };

  useEffect(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    if (dirty && isSlugValid && Object.keys(videoErrors || {}).length === 0) {
      saveTimeoutRef.current = setTimeout(() => triggerSave(), 800);
    }
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, [course, dirty, isSlugValid, videoErrors]);

  const navigationBlocker = useBlocker(() => dirty);
  useEffect(() => {
    if (navigationBlocker.state === 'blocked') {
      const confirmed = window.confirm('You have unsaved changes. Leave this page?');
      if (confirmed) {
        navigationBlocker.proceed();
      } else {
        navigationBlocker.reset();
      }
    }
  }, [navigationBlocker]);

  if (!course) {
    return (
      <div className={styles.page}>
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>Course editor</h1>
            <p className={styles.subtitle}>Edit course details and curriculum.</p>
          </div>
        </div>
        {errorNotice ? (
          <Stack spacing={2}>
            <GlobalErrorBanner error={errorNotice} onRetry={loadCourse} onClose={() => setErrorNotice(null)} />
          </Stack>
        ) : (
          <Typography variant="h6">Loading course...</Typography>
        )}
      </div>
    );
  }

  const manualSave = () => triggerSave();

  const handlePublish = async () => {
    const confirmed = window.confirm(
      environment === ENVIRONMENTS.production
        ? 'Publish in production? Students will see this immediately.'
        : 'Publish this course?'
    );
    if (!confirmed) return;
    const saved = await triggerSave();
    if (saved === false) return;
    try {
      await api.publishCourse(courseId);
      logEvent('COURSE_PUBLISH', { id: courseId });
      loadCourse();
    } catch (err) {
      handleApiError(err, 'publish', handlePublish);
    }
  };

  const handleArchive = async () => {
    const confirmed = window.confirm(
      environment === ENVIRONMENTS.production
        ? 'Archive in production? Active students will lose access.'
        : 'Archive this course?'
    );
    if (!confirmed) return;
    const saved = await triggerSave();
    if (saved === false) return;
    try {
      await api.archiveCourse(courseId);
      logEvent('COURSE_ARCHIVE', { id: courseId });
      loadCourse();
    } catch (err) {
      handleApiError(err, 'archive', handleArchive);
    }
  };

  const handleDelete = async () => {
    if (environment === ENVIRONMENTS.production) {
      const typed = window.prompt(`Delete is irreversible. Type the slug "${course?.slug}" to confirm deletion.`);
      if (typed !== course?.slug) {
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
      await api.deleteCourse(courseId);
      logEvent('COURSE_DELETE', { id: courseId });
      navigate('/courses');
    } catch (err) {
      handleApiError(err, 'delete', handleDelete);
    }
  };

  const handleThumbnailUpload = async (file) => {
    if (!file) return;
    logEvent('UPLOAD_START', { type: 'thumbnail', name: file.name });
    setThumbnailUpload({ status: 'uploading', progress: 0, error: '' });
    try {
      const { url } = await uploadThumbnail(file, {
        environment,
        apiClient,
        onProgress: (progress) => setThumbnailUpload((prev) => ({ ...prev, progress })),
      });

      let nextCourseState = course;
      setCourse((prev) => {
        const base = prev || {};
        nextCourseState = { ...base, thumbnailUrl: url };
        return nextCourseState;
      });
      refreshDirtyState(nextCourseState);

      try {
        await api.patchCourse(courseId, { thumbnailUrl: url });
        const nextInitial = initialCourse ? { ...initialCourse, thumbnailUrl: url } : null;
        if (nextInitial) {
          updateCourseWithInitial(nextCourseState, nextInitial);
        }
      } catch (persistError) {
        handleApiError(persistError, 'thumbnail update');
      }

      setThumbnailUpload({ status: 'success', progress: 100, error: '' });
      logEvent('UPLOAD_SUCCESS', { type: 'thumbnail' });
      showToast('Thumbnail uploaded', 'success');
    } catch (err) {
      const normalized = normalizeUploadError(err, THUMBNAIL_MAX_BYTES);
      const message = normalized.message;
      setThumbnailUpload({ status: 'error', progress: 0, error: message });
      if (err?.status === 429) {
        handleApiError(err, 'thumbnail upload', () => handleThumbnailUpload(file));
      } else {
        setErrorNotice(mapApiErrorToDisplay(normalized, { resourceLabel: 'thumbnail upload' }));
      }
      logEvent('UPLOAD_FAIL', { type: 'thumbnail', status: err?.status });
      showToast(message, 'error');
    }
  };

  const handleRemoveThumbnail = async () => {
    let nextCourseState = course;
    setCourse((prev) => {
      const base = prev || {};
      nextCourseState = { ...base, thumbnailUrl: '' };
      return nextCourseState;
    });
    refreshDirtyState(nextCourseState);
    try {
      await api.patchCourse(courseId, { thumbnailUrl: '' });
      const nextInitial = initialCourse ? { ...initialCourse, thumbnailUrl: '' } : null;
      if (nextInitial) {
        updateCourseWithInitial(nextCourseState, nextInitial);
      }
      showToast('Thumbnail removed', 'info');
    } catch (err) {
      setErrorNotice(mapApiErrorToDisplay(err, { resourceLabel: 'remove thumbnail' }));
      showToast(err.message || 'Failed to remove thumbnail', 'error');
    }
  };

  const updateAttachmentUpload = (lessonId, uploadId, attrs) => {
    setAttachmentUploads((prev) => ({
      ...prev,
      [lessonId]: (prev[lessonId] || []).map((item) => (item.id === uploadId ? { ...item, ...attrs } : item)),
    }));
  };

  const handleUploadAttachments = async (lessonId, files = []) => {
    for (const file of files) {
      const uploadId = `${lessonId}-${Date.now()}-${file.name}`;
      setAttachmentUploads((prev) => ({
        ...prev,
        [lessonId]: [...(prev[lessonId] || []), { id: uploadId, name: file.name, progress: 0, status: 'uploading' }],
      }));
      logEvent('UPLOAD_START', { type: 'attachment', name: file.name });
      try {
        const { url } = await uploadAttachment(file, {
          environment,
          apiClient,
          onProgress: (progress) => updateAttachmentUpload(lessonId, uploadId, { progress }),
        });

        let nextCourseState = course;
        setCourse((prev) => {
          const base = prev || { modules: [] };
          nextCourseState = updateLessonInCourseData(base, lessonId, (lesson) => ({
            ...lesson,
            attachments: [...(lesson.attachments || []), url],
          }));
          return nextCourseState;
        });
        refreshDirtyState(nextCourseState);

        const updatedLesson = findLessonInCourse(nextCourseState, lessonId);
        try {
          await api.updateLesson(lessonId, updatedLesson);
          if (initialCourse) {
            const nextInitial = updateLessonInCourseData(initialCourse, lessonId, (lesson) => ({
              ...lesson,
              attachments: [...(lesson.attachments || []), url],
            }));
            updateCourseWithInitial(nextCourseState, nextInitial);
          }
        } catch (persistError) {
          setErrorNotice(mapApiErrorToDisplay(persistError, { resourceLabel: 'attachment save' }));
          showToast(persistError.message || 'Failed to save attachment to lesson', 'error');
        }

        updateAttachmentUpload(lessonId, uploadId, { status: 'success', progress: 100 });
        logEvent('UPLOAD_SUCCESS', { type: 'attachment', name: file.name });
        showToast('Attachment uploaded', 'success');
      } catch (err) {
        const normalized = normalizeUploadError(err, ATTACHMENT_MAX_BYTES);
        const message = normalized.message;
        updateAttachmentUpload(lessonId, uploadId, { status: 'error', error: message, progress: 0 });
        if (err?.status === 429) {
          handleApiError(err, 'attachment upload', () => handleUploadAttachments(lessonId, [file]));
        } else {
          setErrorNotice(mapApiErrorToDisplay(normalized, { resourceLabel: 'attachment upload' }));
        }
        logEvent('UPLOAD_FAIL', { type: 'attachment', name: file.name, status: err?.status });
        showToast(message, 'error');
      }
    }
  };

  const handleRemoveAttachment = async (lessonId, url) => {
    let nextCourseState = course;
    setCourse((prev) => {
      const base = prev || { modules: [] };
      nextCourseState = updateLessonInCourseData(base, lessonId, (lesson) => ({
        ...lesson,
        attachments: (lesson.attachments || []).filter((item) => item !== url),
      }));
      return nextCourseState;
    });
    refreshDirtyState(nextCourseState);

    const updatedLesson = findLessonInCourse(nextCourseState, lessonId);
    try {
      await api.updateLesson(lessonId, updatedLesson);
      if (initialCourse) {
        const nextInitial = updateLessonInCourseData(initialCourse, lessonId, (lesson) => ({
          ...lesson,
          attachments: (lesson.attachments || []).filter((item) => item !== url),
        }));
        updateCourseWithInitial(nextCourseState, nextInitial);
      }
      showToast('Attachment removed', 'info');
    } catch (err) {
      setErrorNotice(mapApiErrorToDisplay(err, { resourceLabel: 'remove attachment' }));
      showToast(err.message || 'Failed to remove attachment', 'error');
    }
  };

  const fetchReplicate = async (env, search) => {
    setIsReplicateLoading(true);
    try {
      const client = createApiClient({
        baseUrl: getApiBaseUrl(env),
        getAccessToken: () => getCookie('access_token'),
        authPaths: getAuthConfig(),
        onAuthFailure: () => {},
        environment: env,
      });
      const list = await createCoursesApi(client).listCourses({ page: 1, pageSize: 20, search });
      setReplicateList(list.items || []);
      resetRateLimit();
    } catch (err) {
      handleApiError(err, 'replication list', () => fetchReplicate(env, search));
    } finally {
      setIsReplicateLoading(false);
    }
  };

  useEffect(() => {
    if (replicateOpen) {
      fetchReplicate(replicateEnv, replicateSearch);
    }
  }, [replicateOpen, replicateEnv, replicateSearch]);

  const handleSelectReplicate = (sourceCourse) => {
    const transformed = applyReplication(sourceCourse);
    const merged = { ...course, ...transformed, id: course.id };
    updateCourseState(merged);
    logEvent('COURSE_REPLICATE', { sourceId: sourceCourse?.id, sourceEnv: replicateEnv, targetId: course?.id });
    setReplicateOpen(false);
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>{course.title || 'Course editor'}</h1>
          <p className={styles.subtitle}>Edit course details and curriculum.</p>
        </div>
        <Stack direction="row" spacing={1} alignItems="center">
          <Chip label={dirty ? 'Unsaved changes' : 'Saved'} color={dirty ? 'warning' : 'success'} />
          <Tooltip title="Refresh course">
            <IconButton onClick={loadCourse}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          <Button startIcon={<SaveIcon />} onClick={manualSave} variant="outlined">
            Save
          </Button>
          <Button startIcon={<PublishIcon />} onClick={handlePublish}>
            Publish
          </Button>
          <Button startIcon={<ArchiveIcon />} onClick={handleArchive}>
            Archive
          </Button>
          <Button startIcon={<DeleteIcon />} color="error" onClick={handleDelete}>
            Delete
          </Button>
        </Stack>
      </div>

      {errorNotice && (
        <GlobalErrorBanner error={errorNotice} onRetry={loadCourse} onClose={() => setErrorNotice(null)} />
      )}
      {rateLimitError && (
        <Alert
          severity="warning"
          sx={{ mb: 2 }}
          action={
            <Button
              color="inherit"
              size="small"
              disabled={!rateLimitCountdown.canRetry}
              onClick={() => {
                if (rateLimitCountdown.canRetry) {
                  resetRateLimit();
                  loadCourse();
                }
              }}
            >
              {rateLimitCountdown.canRetry
                ? 'Retry now'
                : `Retry in ${rateLimitCountdown.secondsRemaining || 1}s`}
            </Button>
          }
        >
          {rateLimitError?.message || 'Rate limited. Please retry shortly.'}
        </Alert>
      )}

      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
        <Typography variant="body2" color="text.secondary">
          Save status: {saveState}
        </Typography>
        <Chip label={`Env: ${environment}`} size="small" />
        <Button size="small" variant="text" onClick={() => setReplicateOpen(true)}>
          Replicate from environment
        </Button>
      </Stack>

      <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)} variant="scrollable">
        <Tab label="Basics" />
        <Tab label="Curriculum" />
        <Tab label="Pricing" />
        <Tab label="SEO" />
        <Tab label="Publishing" />
      </Tabs>

      <TabPanel value={activeTab} index={0}>
        <BasicsTab
          course={course}
          onChange={handleChange}
          slugError={isSlugValid ? '' : 'Invalid slug'}
          onThumbnailUpload={handleThumbnailUpload}
          onRemoveThumbnail={handleRemoveThumbnail}
          thumbnailUpload={thumbnailUpload}
        />
      </TabPanel>
      <TabPanel value={activeTab} index={1}>
        <CurriculumTab
          course={course}
          onChange={handleChange}
          onUploadAttachments={handleUploadAttachments}
          onRemoveAttachment={handleRemoveAttachment}
          attachmentUploads={attachmentUploads}
          videoErrors={videoErrors}
        />
      </TabPanel>
      <TabPanel value={activeTab} index={2}>
        <PricingTab course={course} onChange={handleChange} />
      </TabPanel>
      <TabPanel value={activeTab} index={3}>
        <SeoTab course={course} onChange={handleChange} />
      </TabPanel>
      <TabPanel value={activeTab} index={4}>
        <PublishingTab course={course} />
      </TabPanel>

      <ReplicateDialog
        open={replicateOpen}
        onClose={() => setReplicateOpen(false)}
        onSelect={handleSelectReplicate}
        isLoading={isReplicateLoading}
        courses={replicateList}
        sourceEnv={replicateEnv}
        onEnvChange={setReplicateEnv}
        onSearch={setReplicateSearch}
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

      <Snackbar
        open={toast.open}
        autoHideDuration={4000}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        onClose={(_, reason) => {
          if (reason === 'clickaway') return;
          setToast((prev) => ({ ...prev, open: false }));
        }}
      >
        <Alert severity={toast.severity} onClose={() => setToast((prev) => ({ ...prev, open: false }))}>
          {toast.message}
        </Alert>
      </Snackbar>
    </div>
  );
};

export default CourseEditorPage;
