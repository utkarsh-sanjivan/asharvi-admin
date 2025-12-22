import React, { useRef, useState } from 'react';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import CloseIcon from '@mui/icons-material/Close';
import { Box, Button, IconButton, LinearProgress, Stack, Typography } from '@mui/material';
import styles from './FileUpload.module.css';

const humanFileSize = (bytes) => {
  if (!bytes) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / 1024 ** exponent;
  return `${value.toFixed(value >= 10 || exponent === 0 ? 0 : 1)} ${units[exponent]}`;
};

const FileUpload = ({
  label,
  description,
  accept,
  allowedExtensions = [],
  maxSize,
  multiple = false,
  disabled = false,
  onFilesSelected,
  onError,
  helperText,
  selectedFiles = [],
  progressMap = {},
  dropLabel = 'Drag & drop files here or click to browse',
  inputRef: inputRefProp,
}) => {
  const internalInputRef = useRef(null);
  const inputRef = inputRefProp || internalInputRef;
  const [dragActive, setDragActive] = useState(false);
  const [localFiles, setLocalFiles] = useState([]);
  const [localError, setLocalError] = useState('');

  const emitError = (message) => {
    setLocalError(message);
    onError?.(message);
  };

  const extensionAllowed = (file) => {
    if (!allowedExtensions.length) return true;
    const ext = file.name?.split('.').pop()?.toLowerCase() || '';
    return allowedExtensions.map((e) => e.toLowerCase()).includes(ext);
  };

  const runValidation = (fileList) => {
    const validFiles = [];
    const errors = [];

    Array.from(fileList).forEach((file) => {
      if (maxSize && file.size > maxSize) {
        errors.push(`${file.name} exceeds ${humanFileSize(maxSize)}`);
        return;
      }
      if (!extensionAllowed(file)) {
        errors.push(`${file.name} has an invalid file type`);
        return;
      }
      validFiles.push(file);
    });

    if (errors.length) {
      emitError(errors.join('; '));
    } else {
      setLocalError('');
    }

    return validFiles;
  };

  const handleFiles = (files) => {
    const valid = runValidation(files);
    if (!valid.length) return;
    setLocalFiles(valid.map((file) => ({ name: file.name, size: file.size })));
    onFilesSelected?.(multiple ? valid : [valid[0]]);
  };

  const onSelectFiles = (event) => {
    event.preventDefault();
    if (disabled) return;
    handleFiles(event.target.files || []);
    event.target.value = '';
  };

  const onDrop = (event) => {
    event.preventDefault();
    event.stopPropagation();
    setDragActive(false);
    if (disabled) return;
    const dtFiles = event.dataTransfer?.files || [];
    handleFiles(dtFiles);
  };

  const displayFiles = selectedFiles.length ? selectedFiles : localFiles;

  return (
    <Stack spacing={1.5}>
      {label && (
        <Typography variant="subtitle2" fontWeight={600}>
          {label}
        </Typography>
      )}
      {description && (
        <Typography variant="body2" color="text.secondary">
          {description}
        </Typography>
      )}
      <Box
        className={`${styles.dropZone} ${dragActive ? styles.active : ''} ${disabled ? styles.disabled : ''}`}
        onDragOver={(e) => {
          e.preventDefault();
          if (disabled) return;
          setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={onDrop}
        onClick={() => !disabled && inputRef.current?.click()}
        role="button"
        tabIndex={0}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={onSelectFiles}
          style={{ display: 'none' }}
        />
        <Stack alignItems="center" spacing={1}>
          <CloudUploadIcon fontSize="large" color="primary" />
          <Typography variant="body2" color="text.secondary" align="center">
            {dropLabel}
          </Typography>
          {helperText && (
            <Typography variant="caption" color="text.secondary">
              {helperText}
            </Typography>
          )}
          <Button variant="outlined" size="small" disabled={disabled} onClick={() => inputRef.current?.click()}>
            Browse files
          </Button>
        </Stack>
      </Box>

      {displayFiles.length > 0 && (
        <Stack spacing={1}>
          {displayFiles.map((file) => {
            const progressValue = file.progress ?? progressMap[file.name];
            return (
              <Box key={file.id || file.name} className={styles.fileItem}>
                <Stack spacing={0.25}>
                  <Typography variant="body2" fontWeight={600}>
                    {file.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {humanFileSize(file.size)}
                  </Typography>
                  {file.error && (
                    <Typography variant="caption" className={styles.error}>
                      {file.error}
                    </Typography>
                  )}
                </Stack>
                <Stack alignItems="flex-end" spacing={0.5} sx={{ minWidth: 140 }}>
                  {typeof progressValue === 'number' && (
                    <LinearProgress variant="determinate" value={progressValue} sx={{ width: '100%' }} />
                  )}
                  {file.status && (
                    <Typography variant="caption" color="text.secondary">
                      {file.status}
                    </Typography>
                  )}
                  {file.removable && (
                    <IconButton size="small" onClick={file.onRemove}>
                      <CloseIcon fontSize="small" />
                    </IconButton>
                  )}
                </Stack>
              </Box>
            );
          })}
        </Stack>
      )}

      {(localError || selectedFiles.some((f) => f.error)) && (
        <Typography variant="caption" className={styles.error}>
          {localError || selectedFiles.find((f) => f.error)?.error}
        </Typography>
      )}
    </Stack>
  );
};

export default FileUpload;
