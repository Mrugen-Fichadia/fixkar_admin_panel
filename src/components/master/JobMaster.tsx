import React, { useState,useEffect, useMemo } from 'react';
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  CircularProgress,
  Alert,
  IconButton,
  TextField,
  InputAdornment,
  Chip,
  Collapse,
  TablePagination,
  Grid,
  Card,
  CardContent,
  Tooltip,
  Snackbar,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Rating,
  Divider,
} from '@mui/material';
import {
  Search as SearchIcon,
  Clear as ClearIcon,
  KeyboardArrowDown as KeyboardArrowDownIcon,
  KeyboardArrowUp as KeyboardArrowUpIcon,
  ContentCopy as ContentCopyIcon,
  OpenInNew as OpenInNewIcon,
  CheckCircle as CheckCircleIcon,
  PendingActions as PendingIcon,
  PlayCircle as PlayIcon,
  Cancel as CancelIcon,
  Handyman as WorkerIcon,
  Person as PersonIcon,
  Payment as PaymentIcon,
  LocationOn as LocationIcon,
  Build as BuildIcon,
  PhotoCamera as PhotoIcon,
  Mic as MicIcon,
  Star as StarIcon,
  UnfoldMore as UnfoldMoreIcon,
  UnfoldLess as UnfoldLessIcon,
  Refresh as RefreshIcon,
  CurrencyRupee as CurrencyRupeeIcon,
} from '@mui/icons-material';
import { useJobs } from '../../hooks/useJobs';
import { useJobCalls, getCallAudioUrl } from '../../hooks/useCalls';
import {
  PhoneInTalk as PhoneInTalkIcon,
  Call as CallIcon,
  Videocam as VideocamIcon,
} from '@mui/icons-material';
import type { JobRequest, UserSummary } from '../../hooks/useJobs';
import { useHeader } from '../layout/DrawerLayout';

// Helper to format Firestore timestamps or Date strings
const formatDateTime = (timestamp: any): string => {
  if (!timestamp) return 'N/A';
  try {
    let date: Date;
    if (timestamp.toDate) {
      date = timestamp.toDate();
    } else if (timestamp.seconds) {
      date = new Date(timestamp.seconds * 1000);
    } else {
      date = new Date(timestamp);
    }
    if (isNaN(date.getTime())) return 'N/A';
    return date.toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return 'N/A';
  }
};

// Color and icon mappings for status
const getStatusConfig = (status?: string) => {
  const s = (status || 'pending').toLowerCase();
  switch (s) {
    case 'completed':
      return {
        label: 'Completed',
        color: '#2e7d32',
        bgColor: '#e8f5e9',
        borderColor: '#a5d6a7',
        icon: <CheckCircleIcon fontSize="small" sx={{ color: '#2e7d32' }} />,
      };
    case 'accepted':
      return {
        label: 'Accepted',
        color: '#0288d1',
        bgColor: '#e1f5fe',
        borderColor: '#81d4fa',
        icon: <PendingIcon fontSize="small" sx={{ color: '#0288d1' }} />,
      };
    case 'started':
      return {
        label: 'Started',
        color: '#7b1fa2',
        bgColor: '#f3e5f5',
        borderColor: '#ce93d8',
        icon: <PlayIcon fontSize="small" sx={{ color: '#7b1fa2' }} />,
      };
    case 'cancelled':
      return {
        label: 'Cancelled',
        color: '#d32f2f',
        bgColor: '#ffebee',
        borderColor: '#ef9a9a',
        icon: <CancelIcon fontSize="small" sx={{ color: '#d32f2f' }} />,
      };
    case 'pending':
    default:
      return {
        label: 'Pending',
        color: '#ed6c02',
        bgColor: '#fff3e0',
        borderColor: '#ffcc80',
        icon: <PendingIcon fontSize="small" sx={{ color: '#ed6c02' }} />,
      };
  }
};

const getPaymentStatusConfig = (paymentStatus?: string, paymentMode?: string) => {
  const status = (paymentStatus || '').toLowerCase();
  const mode = paymentMode ? ` (${paymentMode.toUpperCase()})` : '';

  if (status === 'completed') {
    return {
      label: `Paid${mode}`,
      color: '#2e7d32',
      bgColor: '#e8f5e9',
    };
  }
  if (status === 'failed') {
    return {
      label: `Failed${mode}`,
      color: '#d32f2f',
      bgColor: '#ffebee',
    };
  }
  if (status === 'refunded') {
    return {
      label: `Refunded${mode}`,
      color: '#7b1fa2',
      bgColor: '#f3e5f5',
    };
  }
  return {
    label: status ? `${status.toUpperCase()}${mode}` : (paymentMode ? paymentMode.toUpperCase() : 'Pending'),
    color: '#ed6c02',
    bgColor: '#fff3e0',
  };
};


// Step 6: In-App Call Tracking & Audio Recordings Card
const JobCallsCard: React.FC<{ jobId: string }> = ({ jobId }) => {
  const { calls, loading, error } = useJobCalls(jobId);

  const getCallStatusChip = (status?: string) => {
    const s = (status || '').toLowerCase();
    if (s === 'connected' || s === 'ended') {
      return <Chip label="Connected" size="small" color="success" sx={{ fontWeight: 600, height: 22, fontSize: '0.72rem' }} />;
    }
    if (s === 'missed') {
      return <Chip label="Missed" size="small" color="warning" sx={{ fontWeight: 600, height: 22, fontSize: '0.72rem' }} />;
    }
    if (s === 'declined') {
      return <Chip label="Declined" size="small" color="error" sx={{ fontWeight: 600, height: 22, fontSize: '0.72rem' }} />;
    }
    return <Chip label={status || 'Unknown'} size="small" sx={{ fontWeight: 600, height: 22, fontSize: '0.72rem' }} />;
  };

  return (
    <Card variant="outlined" sx={{ borderRadius: 2 }}>
      <CardContent sx={{ py: 1.5, pb: '12px !important' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <PhoneInTalkIcon color="primary" fontSize="small" />
            <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', letterSpacing: 0.5 }}>
              IN-APP CALL TRACKING & AUDIO RECORDINGS (STEP 6)
            </Typography>
          </Box>
          <Chip
            label={`${calls.length} Call${calls.length === 1 ? '' : 's'}`}
            size="small"
            color={calls.length > 0 ? 'primary' : 'default'}
            sx={{ fontWeight: 600, height: 20, fontSize: '0.7rem' }}
          />
        </Box>
        <Divider sx={{ mb: 1.5 }} />

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
            <CircularProgress size={24} />
          </Box>
        ) : error ? (
          <Alert severity="error" sx={{ py: 0.5 }}>{error}</Alert>
        ) : calls.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            No in-app calls recorded for this Job ID.
          </Typography>
        ) : (
          <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 1.5, overflowX: 'auto' }}>
            <Table size="small">
              <TableHead sx={{ backgroundColor: 'grey.100' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem' }}>Caller</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem' }}>Receiver</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem' }}>Type</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem' }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem' }}>Duration</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem' }}>Date & Time</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', minWidth: 220 }}>Audio Call Recording</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {calls.map((call) => (
                  <TableRow key={call.id} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight={600}>
                        {call.callerName}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {call.callerRole || 'Caller'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight={600}>
                        {call.receiverName}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {call.receiverRole || 'Receiver'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        icon={call.callType === 'video' ? <VideocamIcon sx={{ fontSize: '14px !important' }} /> : <CallIcon sx={{ fontSize: '14px !important' }} />}
                        label={call.callType === 'video' ? 'Video' : 'Audio'}
                        size="small"
                        sx={{
                          height: 22,
                          fontSize: '0.72rem',
                          fontWeight: 600,
                          backgroundColor: call.callType === 'video' ? '#f3e5f5' : '#e3f2fd',
                          color: call.callType === 'video' ? '#7b1fa2' : '#1976d2',
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      {getCallStatusChip(call.status)}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight={600}>
                        {call.durationFormatted || (call.duration ? `${Math.floor(call.duration / 60)}:${(call.duration % 60).toString().padStart(2, '0')}` : '00:00')}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption">
                        {formatDateTime(call.createdAt || call.startedAt)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {(() => {
                        const audioUrl = getCallAudioUrl(call);
                        if (audioUrl) {
                          return (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <audio controls src={audioUrl} style={{ height: 28, width: 200 }}>
                                Your browser does not support the audio element.
                              </audio>
                              <Tooltip title="Open / Download Recording">
                                <IconButton size="small" href={audioUrl} target="_blank" rel="noopener noreferrer">
                                  <OpenInNewIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </Box>
                          );
                        }
                        return (
                          <Typography variant="caption" color="text.secondary">
                            {call.callType === 'video' ? 'Video call (No audio file)' : 'No recording available'}
                          </Typography>
                        );
                      })()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </CardContent>
    </Card>
  );
};

interface JobRowProps {
  job: JobRequest;
  userMap: Record<string, UserSummary>;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onCopy: (text: string, label: string) => void;
  onOpenImage: (url: string) => void;
}

const JobRow: React.FC<JobRowProps> = ({
  job,
  userMap,
  isExpanded,
  onToggleExpand,
  onCopy,
  onOpenImage,
}) => {
  const customer = job.customerUid ? userMap[job.customerUid] : null;
  const worker = job.acceptedWorkerId ? userMap[job.acceptedWorkerId] : null;
  const statusCfg = getStatusConfig(job.status);
  const paymentCfg = getPaymentStatusConfig(job.paymentStatus, job.paymentMode);

  const googleMapsUrl =
    job.latitude && job.longitude
      ? `https://www.google.com/maps?q=${job.latitude},${job.longitude}`
      : null;

  return (
    <>
      {/* Collapsed Brief Summary Row */}
      <TableRow
        hover
        sx={{
          '& > *': { borderBottom: isExpanded ? 'unset' : undefined },
          backgroundColor: isExpanded ? 'rgba(25, 118, 210, 0.04)' : 'inherit',
          transition: 'background-color 0.2s',
          cursor: 'pointer',
        }}
        onClick={onToggleExpand}
      >
        <TableCell width={50} padding="checkbox" onClick={(e) => e.stopPropagation()}>
          <IconButton
            size="small"
            aria-label="expand row"
            onClick={onToggleExpand}
            sx={{ color: isExpanded ? 'primary.main' : 'action.active' }}
          >
            {isExpanded ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
          </IconButton>
        </TableCell>

        {/* First Column: Job Title */}
        <TableCell sx={{ minWidth: 200 }}>
          <Typography
            variant="body2"
            sx={{
              fontWeight: 600,
              color: 'text.primary',
              maxWidth: 240,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
            title={job.jobTitle || 'No Title'}
          >
            {job.jobTitle || 'Untitled Job'}
          </Typography>
        </TableCell>

        {/* Second Column: Service */}
        <TableCell sx={{ minWidth: 130 }}>
          {job.serviceName ? (
            <Chip
              label={job.serviceName}
              size="small"
              sx={{
                fontWeight: 600,
                fontSize: '0.72rem',
                height: 22,
                backgroundColor: '#e3f2fd',
                color: '#1565c0',
              }}
            />
          ) : (
            <Typography variant="caption" color="text.secondary">
              N/A
            </Typography>
          )}
        </TableCell>

        {/* Customer */}
        <TableCell sx={{ minWidth: 160 }}>
          <Tooltip title={`UID: ${job.customerUid || 'N/A'}${customer?.phone ? ` | Phone: ${customer.phone}` : ''}`}>
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 500, color: 'text.primary' }}>
                {customer?.name || 'Customer'}
              </Typography>
              {customer?.phone && (
                <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                  {customer.phone}
                </Typography>
              )}
            </Box>
          </Tooltip>
        </TableCell>

        {/* Assigned Worker */}
        <TableCell sx={{ minWidth: 160 }}>
          {job.acceptedWorkerId ? (
            <Tooltip title={`UID: ${job.acceptedWorkerId}${worker?.phone ? ` | Phone: ${worker.phone}` : ''}`}>
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 500, color: 'success.dark' }}>
                  {worker?.name || 'Assigned Worker'}
                </Typography>
                {worker?.phone && (
                  <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                    {worker.phone}
                  </Typography>
                )}
              </Box>
            </Tooltip>
          ) : (
            <Chip
              label="Unassigned"
              size="small"
              variant="outlined"
              sx={{ color: 'text.secondary', fontSize: '0.72rem', height: 22 }}
            />
          )}
        </TableCell>

        {/* Budget / Price */}
        <TableCell sx={{ minWidth: 120 }}>
          <Box>
            <Typography variant="body2" sx={{ fontWeight: 700, color: 'success.main' }}>
              ₹{job.budget ?? 0}
            </Typography>
            {job.suggestedAmount && job.suggestedAmount !== job.budget && (
              <Typography variant="caption" sx={{ color: 'info.main', display: 'block' }}>
                Sug: ₹{job.suggestedAmount}
              </Typography>
            )}
          </Box>
        </TableCell>

        {/* Status */}
        <TableCell sx={{ minWidth: 130 }}>
          <Box
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 0.5,
              px: 1.2,
              py: 0.4,
              borderRadius: '16px',
              backgroundColor: statusCfg.bgColor,
              border: `1px solid ${statusCfg.borderColor}`,
              color: statusCfg.color,
              fontSize: '0.75rem',
              fontWeight: 700,
            }}
          >
            {statusCfg.icon}
            {statusCfg.label}
          </Box>
        </TableCell>

        {/* Payment */}
        <TableCell sx={{ minWidth: 130 }}>
          <Box
            sx={{
              display: 'inline-block',
              px: 1,
              py: 0.3,
              borderRadius: 1,
              backgroundColor: paymentCfg.bgColor,
              color: paymentCfg.color,
              fontSize: '0.72rem',
              fontWeight: 600,
            }}
          >
            {paymentCfg.label}
          </Box>
        </TableCell>

        {/* Posted At */}
        <TableCell sx={{ minWidth: 150 }}>
          <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.8rem' }}>
            {formatDateTime(job.createdAt)}
          </Typography>
        </TableCell>
      </TableRow>

      {/* Expanded Detailed Information Row */}
      <TableRow sx={{ backgroundColor: 'rgba(25, 118, 210, 0.02)' }}>
        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={9}>
          <Collapse in={isExpanded} timeout="auto" unmountOnExit>
            <Box sx={{ py: 2.5, px: 2 }}>
              {/* Job ID Banner in Expanded View */}
              <Box
                sx={{
                  mb: 2,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: 1.5,
                  p: 1.5,
                  backgroundColor: '#f0f4f8',
                  borderRadius: 2,
                  border: '1px solid #d9e2ec',
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', letterSpacing: 0.5 }}>
                    JOB ID:
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      fontFamily: 'monospace',
                      fontWeight: 700,
                      color: 'primary.main',
                      fontSize: '0.9rem',
                    }}
                  >
                    {job.id}
                  </Typography>
                  <Tooltip title="Copy full Job ID">
                    <IconButton size="small" onClick={() => onCopy(job.id, 'Job ID')} sx={{ p: 0.3 }}>
                      <ContentCopyIcon sx={{ fontSize: 16 }} />
                    </IconButton>
                  </Tooltip>
                </Box>
                {job.serviceName && (
                  <Chip
                    label={`Service: ${job.serviceName}`}
                    size="small"
                    color="primary"
                    variant="outlined"
                    sx={{ fontWeight: 600 }}
                  />
                )}
              </Box>

              <Grid container spacing={2}>
                {/* 1. Job Description & Details */}
                <Grid item xs={12} md={6}>
                  <Card variant="outlined" sx={{ height: '100%', borderRadius: 2 }}>
                    <CardContent sx={{ pb: '16px !important' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                        <BuildIcon color="primary" fontSize="small" />
                        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                          Job Overview & Problem Description
                        </Typography>
                      </Box>
                      <Divider sx={{ mb: 1.5 }} />

                      <Typography variant="caption" color="text.secondary">
                        Job Title:
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                        {job.jobTitle || 'N/A'}
                      </Typography>

                      <Typography variant="caption" color="text.secondary">
                        Description:
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{
                          p: 1.5,
                          mt: 0.5,
                          mb: 1.5,
                          backgroundColor: 'grey.50',
                          borderRadius: 1,
                          border: '1px solid',
                          borderColor: 'grey.200',
                          whiteSpace: 'pre-wrap',
                          lineHeight: 1.5,
                        }}
                      >
                        {job.jobDescription || 'No description provided by customer.'}
                      </Typography>

                      {/* Sub-services */}
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                        Requested Sub-Services:
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.8, mb: 1.5 }}>
                        {job.subServices && job.subServices.length > 0 ? (
                          job.subServices.map((sub, idx) => (
                            <Chip
                              key={idx}
                              label={sub}
                              size="small"
                              variant="outlined"
                              color="primary"
                              sx={{ fontSize: '0.75rem' }}
                            />
                          ))
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            None specified
                          </Typography>
                        )}
                      </Box>

                      {/* Material Responsibility */}
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="caption" color="text.secondary">
                          Material Responsibility:
                        </Typography>
                        <Chip
                          label={
                            job.materialResponsibility === 'customer'
                              ? 'Provided by Customer'
                              : job.materialResponsibility === 'worker'
                              ? 'Provided by Worker'
                              : job.materialResponsibility === 'none'
                              ? 'No Material Required'
                              : job.materialResponsibility || 'Not specified'
                          }
                          size="small"
                          sx={{
                            fontWeight: 600,
                            backgroundColor:
                              job.materialResponsibility === 'customer'
                                ? '#e8f5e9'
                                : job.materialResponsibility === 'worker'
                                ? '#ffebee'
                                : '#f5f5f5',
                            color:
                              job.materialResponsibility === 'customer'
                                ? '#2e7d32'
                                : job.materialResponsibility === 'worker'
                                ? '#c62828'
                                : '#616161',
                          }}
                        />
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>

                {/* 2. Customer & Worker Contact Info */}
                <Grid item xs={12} md={6}>
                  <Card variant="outlined" sx={{ height: '100%', borderRadius: 2 }}>
                    <CardContent sx={{ pb: '16px !important' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                        <PersonIcon color="primary" fontSize="small" />
                        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                          Parties Involved
                        </Typography>
                      </Box>
                      <Divider sx={{ mb: 1.5 }} />

                      {/* Customer Block */}
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="caption" sx={{ fontWeight: 700, color: 'primary.main' }}>
                          CUSTOMER DETAILS
                        </Typography>
                        <Grid container spacing={1} sx={{ mt: 0.2 }}>
                          <Grid item xs={6}>
                            <Typography variant="caption" color="text.secondary">
                              Name:
                            </Typography>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              {customer?.name || 'Customer'}
                            </Typography>
                          </Grid>
                          <Grid item xs={6}>
                            <Typography variant="caption" color="text.secondary">
                              Phone:
                            </Typography>
                            <Typography variant="body2">
                              {customer?.phone || 'N/A'}
                            </Typography>
                          </Grid>
                          <Grid item xs={12}>
                            <Typography variant="caption" color="text.secondary">
                              Customer UID:
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <Typography
                                variant="caption"
                                sx={{ fontFamily: 'monospace', color: 'text.secondary' }}
                              >
                                {job.customerUid}
                              </Typography>
                              <IconButton
                                size="small"
                                onClick={() => onCopy(job.customerUid, 'Customer UID')}
                                sx={{ p: 0.2 }}
                              >
                                <ContentCopyIcon sx={{ fontSize: 13 }} />
                              </IconButton>
                            </Box>
                          </Grid>
                        </Grid>
                      </Box>

                      <Divider sx={{ mb: 2 }} />

                      {/* Worker Block */}
                      <Box>
                        <Typography variant="caption" sx={{ fontWeight: 700, color: 'success.main' }}>
                          ASSIGNED WORKER DETAILS
                        </Typography>
                        {job.acceptedWorkerId ? (
                          <Grid container spacing={1} sx={{ mt: 0.2 }}>
                            <Grid item xs={6}>
                              <Typography variant="caption" color="text.secondary">
                                Name:
                              </Typography>
                              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                {worker?.name || 'Assigned Worker'}
                              </Typography>
                            </Grid>
                            <Grid item xs={6}>
                              <Typography variant="caption" color="text.secondary">
                                Phone:
                              </Typography>
                              <Typography variant="body2">
                                {worker?.phone || 'N/A'}
                              </Typography>
                            </Grid>
                            <Grid item xs={12}>
                              <Typography variant="caption" color="text.secondary">
                                Worker UID:
                              </Typography>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <Typography
                                  variant="caption"
                                  sx={{ fontFamily: 'monospace', color: 'text.secondary' }}
                                >
                                  {job.acceptedWorkerId}
                                </Typography>
                                <IconButton
                                  size="small"
                                  onClick={() => onCopy(job.acceptedWorkerId || '', 'Worker UID')}
                                  sx={{ p: 0.2 }}
                                >
                                  <ContentCopyIcon sx={{ fontSize: 13 }} />
                                </IconButton>
                              </Box>
                            </Grid>
                            {job.acceptedAt && (
                              <Grid item xs={12}>
                                <Typography variant="caption" color="text.secondary">
                                  Accepted On: {formatDateTime(job.acceptedAt)}
                                </Typography>
                              </Grid>
                            )}
                          </Grid>
                        ) : (
                          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, fontStyle: 'italic' }}>
                            No worker has accepted or been assigned to this job yet.
                          </Typography>
                        )}
                      </Box>

                      {/* Ratings & Favourite */}
                      {(job.customerRating !== undefined || job.isFavouriteWorker) && (
                        <Box sx={{ mt: 2, pt: 1.5, borderTop: '1px dashed #e0e0e0' }}>
                          {job.customerRating !== undefined && (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography variant="caption" color="text.secondary">
                                Customer Rating:
                              </Typography>
                              <Rating
                                value={Number(job.customerRating) || 0}
                                precision={0.5}
                                readOnly
                                size="small"
                                emptyIcon={<StarIcon fontSize="inherit" />}
                              />
                              <Typography variant="caption" sx={{ fontWeight: 700 }}>
                                {job.customerRating}/5
                              </Typography>
                            </Box>
                          )}
                          {job.isFavouriteWorker && (
                            <Chip
                              label="Favorite Worker Requested"
                              size="small"
                              color="secondary"
                              sx={{ mt: 0.8, fontSize: '0.7rem' }}
                            />
                          )}
                        </Box>
                      )}
                    </CardContent>
                  </Card>
                </Grid>

                {/* 3. Financial Breakdown & Payment Info */}
                <Grid item xs={12} md={6}>
                  <Card variant="outlined" sx={{ height: '100%', borderRadius: 2 }}>
                    <CardContent sx={{ pb: '16px !important' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                        <PaymentIcon color="primary" fontSize="small" />
                        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                          Financials & Payment Breakdown
                        </Typography>
                      </Box>
                      <Divider sx={{ mb: 1.5 }} />

                      <Grid container spacing={1.5}>
                        <Grid item xs={6} sm={4}>
                          <Typography variant="caption" color="text.secondary">
                            Customer Budget
                          </Typography>
                          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'text.primary' }}>
                            ₹{job.budget ?? 0}
                          </Typography>
                        </Grid>

                        <Grid item xs={6} sm={4}>
                          <Typography variant="caption" color="text.secondary">
                            Suggested Amount
                          </Typography>
                          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'info.main' }}>
                            ₹{job.suggestedAmount ?? 'N/A'}
                          </Typography>
                        </Grid>

                        <Grid item xs={6} sm={4}>
                          <Typography variant="caption" color="text.secondary">
                            Material Cost
                          </Typography>
                          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'text.primary' }}>
                            ₹{job.totalMaterialAmount ?? 0}
                          </Typography>
                        </Grid>

                        <Grid item xs={6} sm={4}>
                          <Typography variant="caption" color="text.secondary">
                            Total With Material
                          </Typography>
                          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'success.main' }}>
                            ₹{job.amountWithMaterial ?? job.paymentAmount ?? 'N/A'}
                          </Typography>
                        </Grid>

                        <Grid item xs={6} sm={4}>
                          <Typography variant="caption" color="text.secondary">
                            Owner Commission
                          </Typography>
                          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'warning.dark' }}>
                            ₹{job.ownerCommission ?? 0}
                          </Typography>
                        </Grid>

                        <Grid item xs={6} sm={4}>
                          <Typography variant="caption" color="text.secondary">
                            Payment Mode
                          </Typography>
                          <Typography variant="subtitle2" sx={{ fontWeight: 600, textTransform: 'uppercase' }}>
                            {job.paymentMode || 'N/A'}
                          </Typography>
                        </Grid>
                      </Grid>

                      <Divider sx={{ my: 1.5 }} />

                      <Grid container spacing={1}>
                        <Grid item xs={12} sm={6}>
                          <Typography variant="caption" color="text.secondary">
                            Payment ID:
                          </Typography>
                          <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
                            {job.paymentId || 'None'}
                          </Typography>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <Typography variant="caption" color="text.secondary">
                            Order ID:
                          </Typography>
                          <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
                            {job.orderId || 'None'}
                          </Typography>
                        </Grid>
                        {job.paymentCompletedAt && (
                          <Grid item xs={12}>
                            <Typography variant="caption" color="text.secondary">
                              Payment Completed At: {formatDateTime(job.paymentCompletedAt)}
                            </Typography>
                          </Grid>
                        )}
                        {job.cancellationReason && (
                          <Grid item xs={12}>
                            <Alert severity="error" sx={{ mt: 1, py: 0.5 }}>
                              <Typography variant="caption" sx={{ fontWeight: 600, display: 'block' }}>
                                Cancellation Reason:
                              </Typography>
                              <Typography variant="body2">{job.cancellationReason}</Typography>
                            </Alert>
                          </Grid>
                        )}
                      </Grid>
                    </CardContent>
                  </Card>
                </Grid>

                {/* 4. Location & Map Coordinates */}
                <Grid item xs={12} md={6}>
                  <Card variant="outlined" sx={{ height: '100%', borderRadius: 2 }}>
                    <CardContent sx={{ pb: '16px !important' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                        <LocationIcon color="primary" fontSize="small" />
                        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                          Location & Address Details
                        </Typography>
                      </Box>
                      <Divider sx={{ mb: 1.5 }} />

                      <Typography variant="caption" color="text.secondary">
                        Address / Location String:
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                        {job.location || job.area || 'Not provided'}
                      </Typography>

                      <Grid container spacing={1} sx={{ mb: 1.5 }}>
                        <Grid item xs={6}>
                          <Typography variant="caption" color="text.secondary">
                            Latitude:
                          </Typography>
                          <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                            {job.latitude ?? 'N/A'}
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="caption" color="text.secondary">
                            Longitude:
                          </Typography>
                          <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                            {job.longitude ?? 'N/A'}
                          </Typography>
                        </Grid>
                      </Grid>

                      {googleMapsUrl ? (
                        <Button
                          variant="outlined"
                          size="small"
                          startIcon={<OpenInNewIcon />}
                          href={googleMapsUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          sx={{ textTransform: 'none', borderRadius: 1.5 }}
                        >
                          Open in Google Maps
                        </Button>
                      ) : (
                        <Typography variant="caption" color="text.secondary">
                          No GPS coordinates available for mapping.
                        </Typography>
                      )}
                    </CardContent>
                  </Card>
                </Grid>

                {/* 5. Materials & Material Suggestions */}
                <Grid item xs={12} md={6}>
                  <Card variant="outlined" sx={{ height: '100%', borderRadius: 2 }}>
                    <CardContent sx={{ pb: '16px !important' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                        <WorkerIcon color="primary" fontSize="small" />
                        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                          Materials & Suggestions ({job.materials?.length || 0})
                        </Typography>
                      </Box>
                      <Divider sx={{ mb: 1.5 }} />

                      {job.materials && job.materials.length > 0 ? (
                        <Box sx={{ mb: 2 }}>
                          <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary' }}>
                            MATERIAL LIST:
                          </Typography>
                          <Box component="ul" sx={{ m: 0, pl: 2, mt: 0.5 }}>
                            {job.materials.map((m, idx) => (
                              <li key={idx}>
                                <Typography variant="body2">
                                  <strong>{m.name || 'Item'}</strong>
                                  {m.quantity ? ` — Quantity: ${m.quantity}` : ''}
                                </Typography>
                              </li>
                            ))}
                          </Box>
                        </Box>
                      ) : (
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                          No specific materials listed.
                        </Typography>
                      )}

                      {job.materialSuggestions && job.materialSuggestions.length > 0 && (
                        <Box>
                          <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary' }}>
                            MATERIAL SUGGESTIONS LOG:
                          </Typography>
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 0.8 }}>
                            {job.materialSuggestions.map((s, idx) => (
                              <Box
                                key={idx}
                                sx={{
                                  p: 1,
                                  backgroundColor: s.fromCustomer ? '#e3f2fd' : '#f1f8e9',
                                  borderRadius: 1,
                                  border: '1px solid',
                                  borderColor: s.fromCustomer ? '#bbdefb' : '#dcedc8',
                                }}
                              >
                                <Typography variant="caption" sx={{ fontWeight: 600 }}>
                                  {s.fromCustomer ? 'Customer Suggestion:' : 'Worker Suggestion:'}
                                </Typography>
                                <Typography variant="body2">{s.message || s.name || 'Suggestion'}</Typography>
                                {s.quantity && (
                                  <Typography variant="caption" color="text.secondary">
                                    Qty: {s.quantity}
                                  </Typography>
                                )}
                              </Box>
                            ))}
                          </Box>
                        </Box>
                      )}
                    </CardContent>
                  </Card>
                </Grid>

                {/* 6. Media & Audio Attachments */}
                <Grid item xs={12} md={6}>
                  <Card variant="outlined" sx={{ height: '100%', borderRadius: 2 }}>
                    <CardContent sx={{ pb: '16px !important' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                        <PhotoIcon color="primary" fontSize="small" />
                        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                          Media Attachments & Audio Notes
                        </Typography>
                      </Box>
                      <Divider sx={{ mb: 1.5 }} />

                      {/* Image previews */}
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.8 }}>
                        Job Images ({job.imageUrls?.length || 0}):
                      </Typography>
                      {job.imageUrls && job.imageUrls.length > 0 ? (
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.2, mb: 2 }}>
                          {job.imageUrls.map((url, idx) => (
                            <Box
                              key={idx}
                              component="img"
                              src={url}
                              alt={`Job attachment ${idx + 1}`}
                              onClick={() => onOpenImage(url)}
                              sx={{
                                width: 72,
                                height: 72,
                                objectFit: 'cover',
                                borderRadius: 1.5,
                                border: '1px solid #e0e0e0',
                                cursor: 'pointer',
                                transition: 'transform 0.2s, box-shadow 0.2s',
                                '&:hover': {
                                  transform: 'scale(1.05)',
                                  boxShadow: 2,
                                },
                              }}
                            />
                          ))}
                        </Box>
                      ) : (
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                          No image attachments.
                        </Typography>
                      )}

                      {/* Audio voice note */}
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                        Voice Note / Audio Note:
                      </Typography>
                      {job.audioUrl ? (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 1, backgroundColor: 'grey.50', borderRadius: 1.5 }}>
                          <MicIcon color="primary" fontSize="small" />
                          <audio controls src={job.audioUrl} style={{ height: 36, width: '100%' }}>
                            Your browser does not support the audio element.
                          </audio>
                        </Box>
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          No audio recording attached.
                        </Typography>
                      )}

                      {/* Videos */}
                      {job.videoUrls && job.videoUrls.length > 0 && (
                        <Box sx={{ mt: 1.5 }}>
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                            Videos ({job.videoUrls.length}):
                          </Typography>
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                            {job.videoUrls.map((vUrl, idx) => (
                              <Button
                                key={idx}
                                variant="outlined"
                                size="small"
                                href={vUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                startIcon={<PlayIcon />}
                                sx={{ textTransform: 'none', borderRadius: 1.5 }}
                              >
                                View Video {idx + 1}
                              </Button>
                            ))}
                          </Box>
                        </Box>
                      )}
                    </CardContent>
                  </Card>
                </Grid>

                {/* Step 6: In-App Call Tracking */}
                <Grid item xs={12}>
                  <JobCallsCard jobId={job.id} />
                </Grid>

                {/* 7. Complete Lifecycle Timestamps */}
                <Grid item xs={12}>
                  <Card variant="outlined" sx={{ borderRadius: 2, backgroundColor: 'grey.50' }}>
                    <CardContent sx={{ py: 1.5, pb: '12px !important' }}>
                      <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', display: 'block', mb: 1 }}>
                        TIMESTAMPS & AUDIT
                      </Typography>
                      <Grid container spacing={2}>
                        <Grid item xs={6} sm={3}>
                          <Typography variant="caption" color="text.secondary">
                            Created:
                          </Typography>
                          <Typography variant="body2">{formatDateTime(job.createdAt)}</Typography>
                        </Grid>
                        <Grid item xs={6} sm={3}>
                          <Typography variant="caption" color="text.secondary">
                            Accepted:
                          </Typography>
                          <Typography variant="body2">{formatDateTime(job.acceptedAt)}</Typography>
                        </Grid>
                        <Grid item xs={6} sm={3}>
                          <Typography variant="caption" color="text.secondary">
                            Completed:
                          </Typography>
                          <Typography variant="body2">{formatDateTime(job.jobCompletedAt)}</Typography>
                        </Grid>
                        <Grid item xs={6} sm={3}>
                          <Typography variant="caption" color="text.secondary">
                            Last Updated:
                          </Typography>
                          <Typography variant="body2">{formatDateTime(job.updatedAt)}</Typography>
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  );
};

export default function JobMaster() {
  const { jobs, userMap, loading, error, refreshUsers } = useJobs();
  const { setHeaderActions } = useHeader();

  // Search state
  const [jobIdSearch, setJobIdSearch] = useState('');

  // Expansion state: Set of open job IDs
  const [expandedRowIds, setExpandedRowIds] = useState<Set<string>>(new Set());

  // Pagination state
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Image Lightbox Dialog
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);

  // Snackbar Notification
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string }>({
    open: false,
    message: '',
  });

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setSnackbar({ open: true, message: `${label} copied to clipboard!` });
  };

  const handleToggleRow = (jobId: string) => {
    setExpandedRowIds((prev) => {
      const next = new Set(prev);
      if (next.has(jobId)) {
        next.delete(jobId);
      } else {
        next.add(jobId);
      }
      return next;
    });
  };

  const handleExpandAll = () => {
    setExpandedRowIds(new Set(filteredJobs.map((j) => j.id)));
  };

  const handleCollapseAll = () => {
    setExpandedRowIds(new Set());
  };

  // Computed metrics: Total Revenue, Completed Jobs, and Cancelled Jobs
  const metrics = useMemo(() => {
    let totalRev = 0;
    let completedCount = 0;
    let cancelledCount = 0;

    jobs.forEach((job) => {
      const s = (job.status || '').toLowerCase();
      if (s === 'completed') {
        completedCount++;
        const amt = Number(
          job.amountWithMaterial ??
          job.paymentAmount ??
          job.suggestedAmount ??
          job.budget ??
          0
        );
        totalRev += isNaN(amt) ? 0 : amt;
      } else if (s === 'cancelled') {
        cancelledCount++;
      }
    });

    return {
      totalRevenue: totalRev,
      completedJobs: completedCount,
      cancelledJobs: cancelledCount,
      totalJobs: jobs.length,
    };
  }, [jobs]);

  // Filter jobs based on search query (Job ID, Title, or Customer Name)
  const filteredJobs = useMemo(() => {
    const query = jobIdSearch.trim().toLowerCase();
    if (!query) return jobs;

    return jobs.filter((job) => {
      const idMatch = job.id.toLowerCase().includes(query);
      const titleMatch = job.jobTitle ? job.jobTitle.toLowerCase().includes(query) : false;
      const customerMatch = job.customerUid ? job.customerUid.toLowerCase().includes(query) : false;
      const customerNameMatch =
        job.customerUid && userMap[job.customerUid]?.name
          ? userMap[job.customerUid].name.toLowerCase().includes(query)
          : false;
      return idMatch || titleMatch || customerMatch || customerNameMatch;
    });
  }, [jobs, jobIdSearch, userMap]);

  // Paginated jobs
  const paginatedJobs = useMemo(() => {
    const start = page * rowsPerPage;
    return filteredJobs.slice(start, start + rowsPerPage);
  }, [filteredJobs, page, rowsPerPage]);

  const handleChangePage = (_: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Inject action buttons into the top header beside the tab name
  useEffect(() => {
    setHeaderActions(
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Button
          variant="outlined"
          size="small"
          startIcon={<RefreshIcon sx={{ fontSize: '1rem !important' }} />}
          onClick={() => refreshUsers()}
          sx={{
            textTransform: 'none',
            py: 0.3,
            px: 1,
            height: 28,
            fontSize: '0.78rem',
            borderColor: 'grey.300',
            color: 'text.primary',
            '&:hover': {
              borderColor: 'primary.main',
              backgroundColor: 'primary.50',
            },
          }}
        >
          Refresh Names
        </Button>
        {expandedRowIds.size > 0 ? (
          <Button
            variant="outlined"
            size="small"
            startIcon={<UnfoldLessIcon sx={{ fontSize: '1rem !important' }} />}
            onClick={handleCollapseAll}
            sx={{
              textTransform: 'none',
              py: 0.3,
              px: 1,
              height: 28,
              fontSize: '0.78rem',
              borderColor: 'grey.300',
              color: 'text.primary',
              '&:hover': {
                borderColor: 'primary.main',
                backgroundColor: 'primary.50',
              },
            }}
          >
            Collapse All
          </Button>
        ) : (
          <Button
            variant="outlined"
            size="small"
            startIcon={<UnfoldMoreIcon sx={{ fontSize: '1rem !important' }} />}
            onClick={handleExpandAll}
            sx={{
              textTransform: 'none',
              py: 0.3,
              px: 1,
              height: 28,
              fontSize: '0.78rem',
              borderColor: 'grey.300',
              color: 'text.primary',
              '&:hover': {
                borderColor: 'primary.main',
                backgroundColor: 'primary.50',
              },
            }}
          >
            Expand All
          </Button>
        )}
      </Box>
    );
    return () => setHeaderActions(null);
  }, [setHeaderActions, expandedRowIds.size, refreshUsers, filteredJobs.length]);

  return (
    <Box sx={{ width: '100%', maxWidth: '100%', minWidth: 0, height: '100%', display: 'flex', flexDirection: 'column', boxSizing: 'border-box' }}>
      {/* Controls: Search Bar + Total Revenue + Completed Jobs Count */}
      <Paper
        elevation={0}
        sx={{
          p: 1.5,
          mb: 2,
          border: '1px solid #e0e0e0',
          borderRadius: 2,
          width: '100%',
          maxWidth: '100%',
          minWidth: 0,
          boxSizing: 'border-box',
        }}
      >
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
          {/* Main Search Bar */}
          <Box sx={{ flex: '1 1 320px', minWidth: { xs: '100%', sm: '260px' } }}>
            <TextField
              fullWidth
              size="small"
              variant="outlined"
              placeholder="Search by Job ID, Title, or Customer..."
              value={jobIdSearch}
              onChange={(e) => {
                setJobIdSearch(e.target.value);
                setPage(0);
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon color="primary" fontSize="small" />
                  </InputAdornment>
                ),
                endAdornment: jobIdSearch ? (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={() => setJobIdSearch('')}>
                      <ClearIcon fontSize="small" />
                    </IconButton>
                  </InputAdornment>
                ) : null,
              }}
            />
          </Box>

          {/* Metric Badges: Total Revenue & Completed Jobs */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
            {/* Total Revenue Card */}
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1.2,
                px: 2,
                py: 0.8,
                backgroundColor: '#e8f5e9',
                borderRadius: 2,
                border: '1px solid #c8e6c9',
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  backgroundColor: '#2e7d32',
                  color: '#fff',
                }}
              >
                <CurrencyRupeeIcon sx={{ fontSize: 18 }} />
              </Box>
              <Box>
                <Typography variant="caption" sx={{ color: '#2e7d32', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', lineHeight: 1.1 }}>
                  Total Revenue
                </Typography>
                <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#1b5e20', lineHeight: 1.2 }}>
                  ₹{metrics.totalRevenue.toLocaleString('en-IN')}
                </Typography>
              </Box>
            </Box>

            {/* Completed Jobs Count Card */}
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1.2,
                px: 2,
                py: 0.8,
                backgroundColor: '#e3f2fd',
                borderRadius: 2,
                border: '1px solid #bbdefb',
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  backgroundColor: '#1976d2',
                  color: '#fff',
                }}
              >
                <CheckCircleIcon sx={{ fontSize: 18 }} />
              </Box>
              <Box>
                <Typography variant="caption" sx={{ color: '#1565c0', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', lineHeight: 1.1 }}>
                  Completed Jobs
                </Typography>
                <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0d47a1', lineHeight: 1.2 }}>
                  {metrics.completedJobs} / {metrics.totalJobs}
                </Typography>
              </Box>
            </Box>

            {/* Cancelled Jobs Count Card */}
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1.2,
                px: 2,
                py: 0.8,
                backgroundColor: '#ffebee',
                borderRadius: 2,
                border: '1px solid #ffcdd2',
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  backgroundColor: '#d32f2f',
                  color: '#fff',
                }}
              >
                <CancelIcon sx={{ fontSize: 18 }} />
              </Box>
              <Box>
                <Typography variant="caption" sx={{ color: '#d32f2f', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', lineHeight: 1.1 }}>
                  Cancelled Jobs
                </Typography>
                <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#b71c1c', lineHeight: 1.2 }}>
                  {metrics.cancelledJobs}
                </Typography>
              </Box>
            </Box>
          </Box>
        </Box>
      </Paper>

      {/* Main Table Container */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flex: 1, minHeight: '300px' }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Box sx={{ p: 2 }}>
          <Alert severity="error">{error}</Alert>
        </Box>
      ) : (
        <Paper
          elevation={0}
          sx={{
            border: '1px solid #e0e0e0',
            borderRadius: 2,
            overflow: 'hidden',
            width: '100%',
            maxWidth: '100%',
            minWidth: 0,
            boxSizing: 'border-box',
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <TableContainer sx={{ maxHeight: 'calc(100vh - 215px)', width: '100%', maxWidth: '100%', overflowX: 'auto', flex: 1 }}>
            <Table stickyHeader aria-label="expandable jobs table">
              <TableHead>
                <TableRow sx={{ '& th': { fontWeight: 700, backgroundColor: '#f8f9fa' } }}>
                  <TableCell width={50} padding="checkbox" />
                  <TableCell>Job Title</TableCell>
                  <TableCell>Service</TableCell>
                  <TableCell>Customer</TableCell>
                  <TableCell>Assigned Worker</TableCell>
                  <TableCell>Budget / Price</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Payment</TableCell>
                  <TableCell>Posted Date</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedJobs.length > 0 ? (
                  paginatedJobs.map((job) => (
                    <JobRow
                      key={job.id}
                      job={job}
                      userMap={userMap}
                      isExpanded={expandedRowIds.has(job.id)}
                      onToggleExpand={() => handleToggleRow(job.id)}
                      onCopy={handleCopy}
                      onOpenImage={(url) => setPreviewImageUrl(url)}
                    />
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={9} align="center" sx={{ py: 6 }}>
                      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                        <Typography variant="h6" color="text.secondary">
                          No jobs found
                        </Typography>
                        <Typography variant="body2" color="text.disabled">
                          {jobIdSearch
                            ? `No job matching "${jobIdSearch}". Try clearing your search.`
                            : 'No jobs available.'}
                        </Typography>
                        {jobIdSearch && (
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() => setJobIdSearch('')}
                            sx={{ mt: 1, textTransform: 'none' }}
                          >
                            Clear Search
                          </Button>
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Table Pagination */}
          <TablePagination
            rowsPerPageOptions={[10, 25, 50, 100]}
            component="div"
            count={filteredJobs.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </Paper>
      )}

      {/* Image Preview Lightbox Dialog */}
      <Dialog
        open={Boolean(previewImageUrl)}
        onClose={() => setPreviewImageUrl(null)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
            Job Media Preview
          </Typography>
          <IconButton size="small" onClick={() => setPreviewImageUrl(null)}>
            <ClearIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ textAlign: 'center', p: 2 }}>
          {previewImageUrl && (
            <Box
              component="img"
              src={previewImageUrl}
              alt="Preview"
              sx={{
                maxWidth: '100%',
                maxHeight: '70vh',
                objectFit: 'contain',
                borderRadius: 1,
              }}
            />
          )}
        </DialogContent>
        <DialogActions>
          {previewImageUrl && (
            <Button
              href={previewImageUrl}
              target="_blank"
              rel="noopener noreferrer"
              startIcon={<OpenInNewIcon />}
              sx={{ textTransform: 'none' }}
            >
              Open Full Resolution
            </Button>
          )}
          <Button onClick={() => setPreviewImageUrl(null)} sx={{ textTransform: 'none' }}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for Copy Confirmation */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={2500}
        onClose={() => setSnackbar({ open: false, message: '' })}
        message={snackbar.message}
      />
    </Box>
  );
}
