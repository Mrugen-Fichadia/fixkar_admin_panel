import React, { useState, useMemo } from 'react';
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
  Tabs,
  Tab,
  Divider,
  Avatar,
  Stack,
  FormControlLabel,
  Switch,
} from '@mui/material';
import {
  Search as SearchIcon,
  Clear as ClearIcon,
  KeyboardArrowDown as KeyboardArrowDownIcon,
  KeyboardArrowUp as KeyboardArrowUpIcon,
  PhoneInTalk as PhoneInTalkIcon,
  Call as CallIcon,
  Videocam as VideocamIcon,
  Mic as MicIcon,
  GraphicEq as GraphicEqIcon,
  OpenInNew as OpenInNewIcon,
  ContentCopy as ContentCopyIcon,
  Delete as DeleteIcon,
  Download as DownloadIcon,
  InfoOutlined as InfoIcon,
  Headset as HeadsetIcon,
  PhoneMissed as PhoneMissedIcon,
  PhoneDisabled as PhoneDisabledIcon,
  CheckCircleOutline as CheckCircleIcon,
  AccessTime as AccessTimeIcon,
  Person as PersonIcon,
  PlayArrow as PlayIcon,
  Pause as PauseIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { useCallRecords, getCallAudioUrl, type CallRecord } from '../../hooks/useCalls';
import { useHeader } from '../layout/DrawerLayout';

// Format timestamps
const formatDateTime = (timestamp: any): string => {
  if (!timestamp) return 'N/A';
  try {
    let date: Date;
    if (timestamp.toDate) {
      date = timestamp.toDate();
    } else if (timestamp.seconds) {
      date = new Date(timestamp.seconds * 1000);
    } else if (timestamp instanceof Date) {
      date = timestamp;
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
      second: '2-digit',
      hour12: true,
    });
  } catch {
    return 'N/A';
  }
};

const formatSeconds = (sec?: number): string => {
  if (!sec || isNaN(sec) || sec <= 0) return '00:00';
  const mins = Math.floor(sec / 60);
  const remainingSecs = Math.floor(sec % 60);
  return `${mins.toString().padStart(2, '0')}:${remainingSecs.toString().padStart(2, '0')}`;
};

// Compact inline audio player widget
const InlineAudioPlayer: React.FC<{ url: string; label?: string }> = ({ url, label }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = React.useRef<HTMLAudioElement | null>(null);

  const togglePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().catch((err) => console.warn('Audio play error:', err));
      setIsPlaying(true);
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        backgroundColor: '#f8fafc',
        borderRadius: 2,
        p: 0.6,
        pr: 1,
        border: '1px solid #e2e8f0',
        maxWidth: 320,
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <audio
        ref={audioRef}
        src={url}
        preload="metadata"
        onEnded={() => setIsPlaying(false)}
        onPause={() => setIsPlaying(false)}
        onPlay={() => setIsPlaying(true)}
      />
      <IconButton
        size="small"
        onClick={togglePlay}
        sx={{
          backgroundColor: isPlaying ? 'secondary.main' : 'primary.main',
          color: '#fff',
          '&:hover': {
            backgroundColor: isPlaying ? 'secondary.dark' : 'primary.dark',
          },
          width: 30,
          height: 30,
        }}
      >
        {isPlaying ? <PauseIcon fontSize="small" /> : <PlayIcon fontSize="small" />}
      </IconButton>

      <Box sx={{ flex: 1, minWidth: 120 }}>
        <Typography variant="caption" noWrap sx={{ fontWeight: 600, display: 'block' }}>
          {label || (isPlaying ? 'Playing Audio...' : 'Audio Recording')}
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.68rem' }}>
          AAC / MP3
        </Typography>
      </Box>

      <Tooltip title="Open in new tab / Download">
        <IconButton size="small" href={url} target="_blank" rel="noopener noreferrer">
          <OpenInNewIcon fontSize="inherit" sx={{ fontSize: 16 }} />
        </IconButton>
      </Tooltip>
    </Box>
  );
};

export default function VoiceAndCallMaster() {
  const { records, loading, error, deleteCallRecord } = useCallRecords();
  useHeader();

  // Filter and pagination states
  const [activeTab, setActiveTab] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [hasAudioOnly, setHasAudioOnly] = useState<boolean>(false);
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});
  const [page, setPage] = useState<number>(0);
  const [rowsPerPage, setRowsPerPage] = useState<number>(10);

  // Modal / Detail state
  const [selectedRecord, setSelectedRecord] = useState<CallRecord | null>(null);
  const [deleteDialogItem, setDeleteDialogItem] = useState<CallRecord | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  // Snackbar notifications
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' | 'info' }>({
    open: false,
    message: '',
    severity: 'success',
  });

  const handleCopy = (text?: string | null, label: string = 'Text', e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!text) return;
    navigator.clipboard.writeText(text);
    setSnackbar({ open: true, message: `${label} copied to clipboard!`, severity: 'info' });
  };

  const toggleRowExpand = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setExpandedRows((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Stats calculation
  const stats = useMemo(() => {
    let total = records.length;
    let withAudio = 0;
    let voiceNotes = 0;
    let connectedCalls = 0;
    let missedOrDeclined = 0;
    let totalDurationSec = 0;

    records.forEach((r) => {
      const audioUrl = getCallAudioUrl(r);
      if (audioUrl) withAudio++;

      const type = (r.callType || '').toLowerCase();
      const status = (r.status || '').toLowerCase();

      if (type === 'voice_note' || status === 'voice_note') {
        voiceNotes++;
      } else if (status === 'connected' || status === 'ended') {
        connectedCalls++;
      } else if (status === 'missed' || status === 'declined') {
        missedOrDeclined++;
      }

      if (r.duration && !isNaN(Number(r.duration))) {
        totalDurationSec += Number(r.duration);
      }
    });

    const hours = Math.floor(totalDurationSec / 3600);
    const mins = Math.floor((totalDurationSec % 3600) / 60);
    const formattedDuration = hours > 0 ? `${hours}h ${mins}m` : `${mins}m ${totalDurationSec % 60}s`;

    return {
      total,
      withAudio,
      voiceNotes,
      connectedCalls,
      missedOrDeclined,
      totalDurationSec,
      formattedDuration,
    };
  }, [records]);

  // Tab & search filtering
  const filteredRecords = useMemo(() => {
    return records.filter((record) => {
      const audioUrl = getCallAudioUrl(record);
      const callType = (record.callType || '').toLowerCase();
      const status = (record.status || '').toLowerCase();

      // Audio only filter
      if (hasAudioOnly && !audioUrl) return false;

      // Tab filter
      if (activeTab === 'recordings') {
        if (!audioUrl) return false;
      } else if (activeTab === 'voice_notes') {
        if (callType !== 'voice_note' && status !== 'voice_note') return false;
      } else if (activeTab === 'video') {
        if (callType !== 'video') return false;
      } else if (activeTab === 'missed_declined') {
        if (status !== 'missed' && status !== 'declined') return false;
      }

      // Status dropdown filter
      if (selectedStatus !== 'all') {
        if (status !== selectedStatus.toLowerCase()) return false;
      }

      // Role filter
      if (selectedRole !== 'all') {
        const callerRole = (record.callerRole || '').toLowerCase();
        const receiverRole = (record.receiverRole || '').toLowerCase();
        if (
          !callerRole.includes(selectedRole.toLowerCase()) &&
          !receiverRole.includes(selectedRole.toLowerCase())
        ) {
          return false;
        }
      }

      // Search term
      if (searchTerm.trim()) {
        const q = searchTerm.trim().toLowerCase();
        const matchJob = record.jobId?.toLowerCase().includes(q);
        const matchCaller = record.callerName?.toLowerCase().includes(q) || record.callerId?.toLowerCase().includes(q);
        const matchReceiver = record.receiverName?.toLowerCase().includes(q) || record.receiverId?.toLowerCase().includes(q);
        const matchId = record.id?.toLowerCase().includes(q);
        return Boolean(matchJob || matchCaller || matchReceiver || matchId);
      }

      return true;
    });
  }, [records, activeTab, searchTerm, selectedStatus, selectedRole, hasAudioOnly]);

  const handleDeleteConfirm = async () => {
    if (!deleteDialogItem) return;
    setIsDeleting(true);
    const res = await deleteCallRecord(deleteDialogItem.id);
    setIsDeleting(false);
    if (res.success) {
      setSnackbar({ open: true, message: 'Record deleted successfully', severity: 'success' });
      setDeleteDialogItem(null);
      if (selectedRecord?.id === deleteDialogItem.id) {
        setSelectedRecord(null);
      }
    } else {
      setSnackbar({ open: true, message: res.error || 'Failed to delete record', severity: 'error' });
    }
  };

  const handleExportCSV = () => {
    if (filteredRecords.length === 0) {
      setSnackbar({ open: true, message: 'No records to export', severity: 'error' });
      return;
    }

    const headers = [
      'Record ID',
      'Job ID',
      'Call Type',
      'Status',
      'Caller Name',
      'Caller Role',
      'Caller ID',
      'Receiver Name',
      'Receiver Role',
      'Receiver ID',
      'Duration (sec)',
      'Duration Formatted',
      'Recording URL',
      'Created At',
    ];

    const rows = filteredRecords.map((r) => [
      `"${r.id || ''}"`,
      `"${r.jobId || ''}"`,
      `"${r.callType || 'audio'}"`,
      `"${r.status || ''}"`,
      `"${r.callerName || ''}"`,
      `"${r.callerRole || ''}"`,
      `"${r.callerId || ''}"`,
      `"${r.receiverName || ''}"`,
      `"${r.receiverRole || ''}"`,
      `"${r.receiverId || ''}"`,
      r.duration || 0,
      `"${r.durationFormatted || formatSeconds(r.duration)}"`,
      `"${getCallAudioUrl(r) || ''}"`,
      `"${formatDateTime(r.createdAt || r.startedAt)}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `fixkar_call_and_voice_records_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getCallTypeChip = (record: CallRecord) => {
    const type = (record.callType || '').toLowerCase();
    const isVoiceNote = type === 'voice_note' || record.status === 'voice_note';

    if (isVoiceNote) {
      return (
        <Chip
          icon={<MicIcon sx={{ fontSize: '15px !important' }} />}
          label="Voice Note"
          size="small"
          sx={{
            fontWeight: 700,
            fontSize: '0.72rem',
            backgroundColor: '#e0f2fe',
            color: '#0369a1',
            border: '1px solid #bae6fd',
          }}
        />
      );
    }

    if (type === 'video') {
      return (
        <Chip
          icon={<VideocamIcon sx={{ fontSize: '15px !important' }} />}
          label="Video Call"
          size="small"
          sx={{
            fontWeight: 700,
            fontSize: '0.72rem',
            backgroundColor: '#f3e8ff',
            color: '#7e22ce',
            border: '1px solid #e9d5ff',
          }}
        />
      );
    }

    return (
      <Chip
        icon={<CallIcon sx={{ fontSize: '15px !important' }} />}
        label="Audio Call"
        size="small"
        sx={{
          fontWeight: 700,
          fontSize: '0.72rem',
          backgroundColor: '#ecfdf5',
          color: '#047857',
          border: '1px solid #a7f3d0',
        }}
      />
    );
  };

  const getCallStatusChip = (status?: string) => {
    const s = (status || '').toLowerCase();
    if (s === 'connected' || s === 'ended') {
      return (
        <Chip
          icon={<CheckCircleIcon sx={{ fontSize: '14px !important' }} />}
          label="Connected"
          size="small"
          color="success"
          sx={{ fontWeight: 600, height: 22, fontSize: '0.72rem' }}
        />
      );
    }
    if (s === 'missed') {
      return (
        <Chip
          icon={<PhoneMissedIcon sx={{ fontSize: '14px !important' }} />}
          label="Missed"
          size="small"
          color="warning"
          sx={{ fontWeight: 600, height: 22, fontSize: '0.72rem' }}
        />
      );
    }
    if (s === 'declined') {
      return (
        <Chip
          icon={<PhoneDisabledIcon sx={{ fontSize: '14px !important' }} />}
          label="Declined"
          size="small"
          color="error"
          sx={{ fontWeight: 600, height: 22, fontSize: '0.72rem' }}
        />
      );
    }
    if (s === 'voice_note') {
      return (
        <Chip
          icon={<MicIcon sx={{ fontSize: '14px !important' }} />}
          label="Voice Note"
          size="small"
          sx={{
            fontWeight: 600,
            height: 22,
            fontSize: '0.72rem',
            backgroundColor: '#ede9fe',
            color: '#6d28d9',
          }}
        />
      );
    }
    return (
      <Chip
        label={status || 'Unknown'}
        size="small"
        sx={{ fontWeight: 600, height: 22, fontSize: '0.72rem' }}
      />
    );
  };

  return (
    <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 2.5 }}>
      {/* 1. Metric Summary Cards */}
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card
            elevation={0}
            sx={{
              p: 2,
              borderRadius: 2.5,
              border: '1px solid #e2e8f0',
              backgroundColor: '#f8fafc',
              height: '100%',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase' }}>
                Total Records
              </Typography>
              <PhoneInTalkIcon color="primary" fontSize="small" />
            </Box>
            <Typography variant="h5" sx={{ fontWeight: 800, color: '#0f172a' }}>
              {stats.total}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Calls & voice notes tracked
            </Typography>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={2.4}>
          <Card
            elevation={0}
            sx={{
              p: 2,
              borderRadius: 2.5,
              border: '1px solid #bae6fd',
              backgroundColor: '#f0f9ff',
              height: '100%',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="caption" sx={{ fontWeight: 700, color: '#0369a1', textTransform: 'uppercase' }}>
                Audio Recordings
              </Typography>
              <HeadsetIcon sx={{ color: '#0284c7' }} fontSize="small" />
            </Box>
            <Typography variant="h5" sx={{ fontWeight: 800, color: '#0369a1' }}>
              {stats.withAudio}
            </Typography>
            <Typography variant="caption" sx={{ color: '#0284c7' }}>
              Playable voice recordings
            </Typography>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={2.4}>
          <Card
            elevation={0}
            sx={{
              p: 2,
              borderRadius: 2.5,
              border: '1px solid #e9d5ff',
              backgroundColor: '#faf5ff',
              height: '100%',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="caption" sx={{ fontWeight: 700, color: '#7e22ce', textTransform: 'uppercase' }}>
                Voice Notes
              </Typography>
              <MicIcon sx={{ color: '#9333ea' }} fontSize="small" />
            </Box>
            <Typography variant="h5" sx={{ fontWeight: 800, color: '#7e22ce' }}>
              {stats.voiceNotes}
            </Typography>
            <Typography variant="caption" sx={{ color: '#9333ea' }}>
              Chat & Job Voice Notes
            </Typography>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={2.4}>
          <Card
            elevation={0}
            sx={{
              p: 2,
              borderRadius: 2.5,
              border: '1px solid #bbf7d0',
              backgroundColor: '#f0fdf4',
              height: '100%',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="caption" sx={{ fontWeight: 700, color: '#15803d', textTransform: 'uppercase' }}>
                Connected Calls
              </Typography>
              <CheckCircleIcon sx={{ color: '#16a34a' }} fontSize="small" />
            </Box>
            <Typography variant="h5" sx={{ fontWeight: 800, color: '#15803d' }}>
              {stats.connectedCalls}
            </Typography>
            <Typography variant="caption" sx={{ color: '#16a34a' }}>
              Completed in-app talks
            </Typography>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={2.4}>
          <Card
            elevation={0}
            sx={{
              p: 2,
              borderRadius: 2.5,
              border: '1px solid #fecdd3',
              backgroundColor: '#fff1f2',
              height: '100%',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="caption" sx={{ fontWeight: 700, color: '#be123c', textTransform: 'uppercase' }}>
                Total Talk Time
              </Typography>
              <AccessTimeIcon sx={{ color: '#e11d48' }} fontSize="small" />
            </Box>
            <Typography variant="h5" sx={{ fontWeight: 800, color: '#be123c' }}>
              {stats.formattedDuration}
            </Typography>
            <Typography variant="caption" sx={{ color: '#e11d48' }}>
              Logged call duration
            </Typography>
          </Card>
        </Grid>
      </Grid>

      {/* 2. Control & Filter Card */}
      <Paper
        elevation={0}
        sx={{
          p: 2,
          borderRadius: 2.5,
          border: '1px solid #e2e8f0',
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
        }}
      >
        {/* Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
          <Tabs
            value={activeTab}
            onChange={(_, val) => {
              setActiveTab(val);
              setPage(0);
            }}
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              minHeight: 42,
              '& .MuiTab-root': {
                minHeight: 42,
                py: 0.5,
                fontWeight: 600,
                fontSize: '0.85rem',
                textTransform: 'none',
              },
            }}
          >
            <Tab label={`All (${records.length})`} value="all" />
            <Tab label={`Call Recordings (${stats.withAudio})`} value="recordings" />
            <Tab label={`Voice Notes (${stats.voiceNotes})`} value="voice_notes" />
            <Tab label="Video Calls" value="video" />
            <Tab label="Missed / Declined" value="missed_declined" />
          </Tabs>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Button
              variant="outlined"
              size="small"
              startIcon={<DownloadIcon fontSize="small" />}
              onClick={handleExportCSV}
              sx={{ textTransform: 'none', fontWeight: 600, fontSize: '0.8rem', borderRadius: 2 }}
            >
              Export CSV
            </Button>
          </Box>
        </Box>

        {/* Filters Row */}
        <Grid container spacing={1.5} alignItems="center">
          <Grid item xs={12} sm={4} md={4}>
            <TextField
              size="small"
              fullWidth
              placeholder="Search by Job ID, Caller or Receiver Name / ID..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(0);
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" color="action" />
                  </InputAdornment>
                ),
                endAdornment: searchTerm ? (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={() => setSearchTerm('')}>
                      <ClearIcon fontSize="small" />
                    </IconButton>
                  </InputAdornment>
                ) : null,
              }}
            />
          </Grid>

          <Grid item xs={6} sm={3} md={2.5}>
            <FormControl size="small" fullWidth>
              <InputLabel id="status-filter-label" sx={{ fontSize: '0.82rem' }}>Status Filter</InputLabel>
              <Select
                labelId="status-filter-label"
                value={selectedStatus}
                label="Status Filter"
                onChange={(e) => {
                  setSelectedStatus(e.target.value);
                  setPage(0);
                }}
                sx={{ fontSize: '0.82rem' }}
              >
                <MenuItem value="all">All Statuses</MenuItem>
                <MenuItem value="connected">Connected / Ended</MenuItem>
                <MenuItem value="missed">Missed</MenuItem>
                <MenuItem value="declined">Declined</MenuItem>
                <MenuItem value="voice_note">Voice Note</MenuItem>
                <MenuItem value="calling">Calling</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={6} sm={3} md={2.5}>
            <FormControl size="small" fullWidth>
              <InputLabel id="role-filter-label" sx={{ fontSize: '0.82rem' }}>Participant Role</InputLabel>
              <Select
                labelId="role-filter-label"
                value={selectedRole}
                label="Participant Role"
                onChange={(e) => {
                  setSelectedRole(e.target.value);
                  setPage(0);
                }}
                sx={{ fontSize: '0.82rem' }}
              >
                <MenuItem value="all">All Roles</MenuItem>
                <MenuItem value="customer">Customer Involved</MenuItem>
                <MenuItem value="worker">Worker / Karigar Involved</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={2} md={3}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: { xs: 'flex-start', sm: 'flex-end' }, gap: 1 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={hasAudioOnly}
                    onChange={(e) => {
                      setHasAudioOnly(e.target.checked);
                      setPage(0);
                    }}
                    size="small"
                  />
                }
                label={<Typography variant="body2" sx={{ fontSize: '0.82rem', fontWeight: 600 }}>Has Audio Only</Typography>}
              />
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* 3. Main Data Table */}
      <Paper elevation={0} sx={{ borderRadius: 2.5, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        {loading ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', py: 8, gap: 2 }}>
            <CircularProgress size={36} />
            <Typography variant="body2" color="text.secondary">
              Loading voice notes & call records from Firestore...
            </Typography>
          </Box>
        ) : error ? (
          <Box sx={{ p: 3 }}>
            <Alert severity="error">{error}</Alert>
          </Box>
        ) : filteredRecords.length === 0 ? (
          <Box sx={{ py: 8, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1.5 }}>
            <GraphicEqIcon sx={{ fontSize: 48, color: 'grey.400' }} />
            <Typography variant="h6" sx={{ fontWeight: 700, color: 'text.secondary' }}>
              No Voice Notes or Call Records Found
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 420 }}>
              {searchTerm || selectedStatus !== 'all' || hasAudioOnly
                ? 'Try clearing your filters or search terms to view all records.'
                : 'When users or Karigars initiate in-app calls or send voice notes, they will automatically appear here in real-time.'}
            </Typography>
            {(searchTerm || selectedStatus !== 'all' || hasAudioOnly || activeTab !== 'all') && (
              <Button
                variant="outlined"
                size="small"
                startIcon={<RefreshIcon />}
                onClick={() => {
                  setSearchTerm('');
                  setSelectedStatus('all');
                  setSelectedRole('all');
                  setHasAudioOnly(false);
                  setActiveTab('all');
                }}
                sx={{ mt: 1, textTransform: 'none', borderRadius: 2 }}
              >
                Reset All Filters
              </Button>
            )}
          </Box>
        ) : (
          <>
            <TableContainer sx={{ maxHeight: 'calc(100vh - 350px)' }}>
              <Table stickyHeader size="small">
                <TableHead>
                  <TableRow sx={{ '& th': { fontWeight: 700, backgroundColor: '#f8fafc', color: '#334155', fontSize: '0.78rem' } }}>
                    <TableCell width={40} />
                    <TableCell>Job ID</TableCell>
                    <TableCell>Caller</TableCell>
                    <TableCell>Receiver</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Duration</TableCell>
                    <TableCell>Date & Time</TableCell>
                    <TableCell sx={{ minWidth: 260 }}>Audio Recording / Voice Note</TableCell>
                    <TableCell align="center" width={90}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredRecords
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((record) => {
                      const audioUrl = getCallAudioUrl(record);
                      const isExpanded = Boolean(expandedRows[record.id]);
                      const durationDisplay =
                        record.durationFormatted ||
                        (record.duration ? formatSeconds(record.duration) : record.callType === 'voice_note' ? 'Voice Note' : '00:00');

                      return (
                        <React.Fragment key={record.id}>
                          <TableRow
                            hover
                            sx={{
                              '& > *': { borderBottom: isExpanded ? 'unset' : undefined },
                              cursor: 'pointer',
                              backgroundColor: isExpanded ? '#f8fafc' : 'inherit',
                            }}
                            onClick={() => toggleRowExpand(record.id)}
                          >
                            {/* Expand Chevron */}
                            <TableCell onClick={(e) => toggleRowExpand(record.id, e)}>
                              <IconButton size="small">
                                {isExpanded ? <KeyboardArrowUpIcon fontSize="small" /> : <KeyboardArrowDownIcon fontSize="small" />}
                              </IconButton>
                            </TableCell>

                            {/* Job ID */}
                            <TableCell>
                              {record.jobId ? (
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                  <Chip
                                    label={`#${(record.jobId || '').slice(0, 8)}...`}
                                    size="small"
                                    onClick={(e) => handleCopy(record.jobId, 'Job ID', e)}
                                    title={`Click to copy: ${record.jobId || ''}`}
                                    sx={{
                                      fontWeight: 600,
                                      fontSize: '0.72rem',
                                      cursor: 'pointer',
                                      backgroundColor: '#f1f5f9',
                                      '&:hover': { backgroundColor: '#e2e8f0' },
                                    }}
                                  />
                                  <Tooltip title="Copy full Job ID">
                                    <IconButton size="small" onClick={(e) => handleCopy(record.jobId, 'Job ID', e)}>
                                      <ContentCopyIcon fontSize="inherit" sx={{ fontSize: 13 }} />
                                    </IconButton>
                                  </Tooltip>
                                </Box>
                              ) : (
                                <Typography variant="caption" color="text.secondary">
                                  Direct / None
                                </Typography>
                              )}
                            </TableCell>

                            {/* Caller */}
                            <TableCell>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Avatar
                                  src={record.callerPhoto || undefined}
                                  sx={{ width: 28, height: 28, fontSize: '0.75rem', bgcolor: 'primary.main' }}
                                >
                                  {record.callerName ? record.callerName.charAt(0).toUpperCase() : <PersonIcon fontSize="small" />}
                                </Avatar>
                                <Box>
                                  <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.82rem', lineHeight: 1.2 }}>
                                    {record.callerName || 'User'}
                                  </Typography>
                                  <Chip
                                    label={record.callerRole || 'Customer'}
                                    size="small"
                                    sx={{
                                      height: 16,
                                      fontSize: '0.62rem',
                                      fontWeight: 600,
                                      backgroundColor: record.callerRole === 'Worker' ? '#ffedd5' : '#e0f2fe',
                                      color: record.callerRole === 'Worker' ? '#c2410c' : '#0369a1',
                                    }}
                                  />
                                </Box>
                              </Box>
                            </TableCell>

                            {/* Receiver */}
                            <TableCell>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Avatar
                                  src={record.receiverPhoto || undefined}
                                  sx={{ width: 28, height: 28, fontSize: '0.75rem', bgcolor: 'secondary.main' }}
                                >
                                  {record.receiverName ? record.receiverName.charAt(0).toUpperCase() : <PersonIcon fontSize="small" />}
                                </Avatar>
                                <Box>
                                  <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.82rem', lineHeight: 1.2 }}>
                                    {record.receiverName || 'User'}
                                  </Typography>
                                  <Chip
                                    label={record.receiverRole || 'Worker'}
                                    size="small"
                                    sx={{
                                      height: 16,
                                      fontSize: '0.62rem',
                                      fontWeight: 600,
                                      backgroundColor: record.receiverRole === 'Worker' ? '#ffedd5' : '#e0f2fe',
                                      color: record.receiverRole === 'Worker' ? '#c2410c' : '#0369a1',
                                    }}
                                  />
                                </Box>
                              </Box>
                            </TableCell>

                            {/* Call Type */}
                            <TableCell>{getCallTypeChip(record)}</TableCell>

                            {/* Status */}
                            <TableCell>{getCallStatusChip(record.status)}</TableCell>

                            {/* Duration */}
                            <TableCell>
                              <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.8rem', fontFamily: 'monospace' }}>
                                {durationDisplay}
                              </Typography>
                            </TableCell>

                            {/* Date & Time */}
                            <TableCell>
                              <Typography variant="caption" sx={{ display: 'block', color: 'text.primary', fontWeight: 500 }}>
                                {formatDateTime(record.createdAt || record.startedAt)}
                              </Typography>
                            </TableCell>

                            {/* Audio Recording Player */}
                            <TableCell onClick={(e) => e.stopPropagation()}>
                              {audioUrl ? (
                                <InlineAudioPlayer url={audioUrl} label={record.callType === 'voice_note' ? 'Voice Note' : 'Call Recording'} />
                              ) : (
                                <Typography variant="caption" color="text.secondary">
                                  {record.callType === 'video'
                                    ? 'Video Call (No Audio File)'
                                    : record.status === 'missed'
                                    ? 'Missed (No recording)'
                                    : 'No recording file'}
                                </Typography>
                              )}
                            </TableCell>

                            {/* Actions */}
                            <TableCell align="center" onClick={(e) => e.stopPropagation()}>
                              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                                <Tooltip title="View Complete Details">
                                  <IconButton
                                    size="small"
                                    color="primary"
                                    onClick={() => setSelectedRecord(record)}
                                  >
                                    <InfoIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title="Delete Record">
                                  <IconButton
                                    size="small"
                                    color="error"
                                    onClick={() => setDeleteDialogItem(record)}
                                  >
                                    <DeleteIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              </Box>
                            </TableCell>
                          </TableRow>

                          {/* Collapsible Row Content */}
                          <TableRow sx={{ backgroundColor: '#f8fafc' }}>
                            <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={10}>
                              <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                                <Box sx={{ py: 2, px: 2 }}>
                                  <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5, color: '#1e293b' }}>
                                    Record Metadata & Participant Details
                                  </Typography>
                                  <Grid container spacing={2}>
                                    <Grid item xs={12} sm={4}>
                                      <Card variant="outlined" sx={{ p: 1.5, borderRadius: 2 }}>
                                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
                                          CALLER INFORMATION
                                        </Typography>
                                        <Divider sx={{ my: 0.8 }} />
                                        <Typography variant="body2"><strong>Name:</strong> {record.callerName || 'N/A'}</Typography>
                                        <Typography variant="body2"><strong>Role:</strong> {record.callerRole || 'Customer'}</Typography>
                                        <Typography variant="caption" sx={{ display: 'block', wordBreak: 'break-all', mt: 0.5 }}>
                                          <strong>UID:</strong> {record.callerId || 'N/A'}
                                        </Typography>
                                      </Card>
                                    </Grid>

                                    <Grid item xs={12} sm={4}>
                                      <Card variant="outlined" sx={{ p: 1.5, borderRadius: 2 }}>
                                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
                                          RECEIVER INFORMATION
                                        </Typography>
                                        <Divider sx={{ my: 0.8 }} />
                                        <Typography variant="body2"><strong>Name:</strong> {record.receiverName || 'N/A'}</Typography>
                                        <Typography variant="body2"><strong>Role:</strong> {record.receiverRole || 'Worker'}</Typography>
                                        <Typography variant="caption" sx={{ display: 'block', wordBreak: 'break-all', mt: 0.5 }}>
                                          <strong>UID:</strong> {record.receiverId || 'N/A'}
                                        </Typography>
                                      </Card>
                                    </Grid>

                                    <Grid item xs={12} sm={4}>
                                      <Card variant="outlined" sx={{ p: 1.5, borderRadius: 2 }}>
                                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
                                          TIMESTAMPS & TECH LOGS
                                        </Typography>
                                        <Divider sx={{ my: 0.8 }} />
                                        <Typography variant="caption" sx={{ display: 'block' }}>
                                          <strong>Created:</strong> {formatDateTime(record.createdAt)}
                                        </Typography>
                                        <Typography variant="caption" sx={{ display: 'block' }}>
                                          <strong>Started:</strong> {formatDateTime(record.startedAt)}
                                        </Typography>
                                        <Typography variant="caption" sx={{ display: 'block' }}>
                                          <strong>Ended:</strong> {formatDateTime(record.endedAt)}
                                        </Typography>
                                        {record.videoPermission && (
                                          <Typography variant="caption" sx={{ display: 'block', mt: 0.5 }}>
                                            <strong>Video Permission:</strong> {record.videoPermission}
                                          </Typography>
                                        )}
                                      </Card>
                                    </Grid>
                                  </Grid>

                                  {audioUrl && (
                                    <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                                      <Typography variant="body2" sx={{ fontWeight: 600 }}>Audio File:</Typography>
                                      <audio controls src={audioUrl} style={{ height: 36, maxWidth: 360 }}>
                                        Your browser does not support audio playback.
                                      </audio>
                                      <Button
                                        size="small"
                                        variant="outlined"
                                        startIcon={<OpenInNewIcon fontSize="small" />}
                                        href={audioUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        sx={{ textTransform: 'none', borderRadius: 2 }}
                                      >
                                        Open Audio File
                                      </Button>
                                    </Box>
                                  )}
                                </Box>
                              </Collapse>
                            </TableCell>
                          </TableRow>
                        </React.Fragment>
                      );
                    })}
                </TableBody>
              </Table>
            </TableContainer>

            <TablePagination
              rowsPerPageOptions={[10, 25, 50, 100]}
              component="div"
              count={filteredRecords.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={(_, newPage) => setPage(newPage)}
              onRowsPerPageChange={(e) => {
                setRowsPerPage(parseInt(e.target.value, 10));
                setPage(0);
              }}
            />
          </>
        )}
      </Paper>

      {/* 4. Complete Details Modal */}
      <Dialog
        open={Boolean(selectedRecord)}
        onClose={() => setSelectedRecord(null)}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <GraphicEqIcon color="primary" />
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Call & Voice Note Details
            </Typography>
          </Box>
          {selectedRecord && getCallTypeChip(selectedRecord)}
        </DialogTitle>
        <Divider />
        <DialogContent sx={{ py: 2.5 }}>
          {selectedRecord && (
            <Stack spacing={2.5}>
              {/* Top Banner */}
              <Box sx={{ p: 2, backgroundColor: '#f8fafc', borderRadius: 2, border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
                    RECORD ID
                  </Typography>
                  <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 600 }}>
                    {selectedRecord.id}
                  </Typography>
                </Box>
                {selectedRecord.jobId && (
                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
                      ASSOCIATED JOB ID
                    </Typography>
                    <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 600 }}>
                      {selectedRecord.jobId}
                    </Typography>
                  </Box>
                )}
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
                    STATUS
                  </Typography>
                  <Box sx={{ mt: 0.5 }}>{getCallStatusChip(selectedRecord.status)}</Box>
                </Box>
              </Box>

              {/* Audio Player if available */}
              {(() => {
                const selectedAudioUrl = getCallAudioUrl(selectedRecord);
                if (!selectedAudioUrl) return null;
                return (
                  <Card variant="outlined" sx={{ p: 2, borderRadius: 2, backgroundColor: '#f0fdf4', borderColor: '#bbf7d0' }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#166534', mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <HeadsetIcon fontSize="small" /> Audio Recording Playback
                    </Typography>
                    <audio controls src={selectedAudioUrl} style={{ width: '100%', height: 40, marginTop: 4 }}>
                      Your browser does not support the audio element.
                    </audio>
                    <Box sx={{ mt: 1, display: 'flex', justifyContent: 'flex-end' }}>
                      <Button
                        size="small"
                        variant="outlined"
                        color="success"
                        startIcon={<DownloadIcon fontSize="small" />}
                        href={selectedAudioUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        sx={{ textTransform: 'none', borderRadius: 1.5 }}
                      >
                        Download Audio
                      </Button>
                    </Box>
                  </Card>
                );
              })()}

              {/* Participants Grid */}
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Card variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                    <Typography variant="caption" color="primary" sx={{ fontWeight: 700, letterSpacing: 0.5 }}>
                      CALLER (INITIATOR)
                    </Typography>
                    <Divider sx={{ my: 1 }} />
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
                      <Avatar src={selectedRecord.callerPhoto} sx={{ width: 42, height: 42, bgcolor: 'primary.main' }}>
                        {selectedRecord.callerName?.charAt(0) || 'C'}
                      </Avatar>
                      <Box>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                          {selectedRecord.callerName || 'User'}
                        </Typography>
                        <Chip
                          label={selectedRecord.callerRole || 'Customer'}
                          size="small"
                          sx={{ height: 18, fontSize: '0.68rem', fontWeight: 600 }}
                        />
                      </Box>
                    </Box>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', wordBreak: 'break-all' }}>
                      <strong>User ID:</strong> {selectedRecord.callerId}
                    </Typography>
                  </Card>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Card variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                    <Typography variant="caption" color="secondary" sx={{ fontWeight: 700, letterSpacing: 0.5 }}>
                      RECEIVER (PARTICIPANT)
                    </Typography>
                    <Divider sx={{ my: 1 }} />
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
                      <Avatar src={selectedRecord.receiverPhoto} sx={{ width: 42, height: 42, bgcolor: 'secondary.main' }}>
                        {selectedRecord.receiverName?.charAt(0) || 'R'}
                      </Avatar>
                      <Box>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                          {selectedRecord.receiverName || 'User'}
                        </Typography>
                        <Chip
                          label={selectedRecord.receiverRole || 'Worker'}
                          size="small"
                          sx={{ height: 18, fontSize: '0.68rem', fontWeight: 600 }}
                        />
                      </Box>
                    </Box>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', wordBreak: 'break-all' }}>
                      <strong>User ID:</strong> {selectedRecord.receiverId}
                    </Typography>
                  </Card>
                </Grid>
              </Grid>

              {/* Call Details & Logs */}
              <Card variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', letterSpacing: 0.5 }}>
                  CALL TIMELINE & DURATION LOGS
                </Typography>
                <Divider sx={{ my: 1 }} />
                <Grid container spacing={2}>
                  <Grid item xs={6} sm={3}>
                    <Typography variant="caption" color="text.secondary">Duration</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>
                      {selectedRecord.durationFormatted || formatSeconds(selectedRecord.duration)}
                    </Typography>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Typography variant="caption" color="text.secondary">Created At</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {formatDateTime(selectedRecord.createdAt)}
                    </Typography>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Typography variant="caption" color="text.secondary">Started At</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {formatDateTime(selectedRecord.startedAt)}
                    </Typography>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Typography variant="caption" color="text.secondary">Ended At</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {formatDateTime(selectedRecord.endedAt)}
                    </Typography>
                  </Grid>
                </Grid>
              </Card>
            </Stack>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setSelectedRecord(null)} variant="outlined" sx={{ textTransform: 'none', borderRadius: 2 }}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* 5. Delete Confirmation Dialog */}
      <Dialog
        open={Boolean(deleteDialogItem)}
        onClose={() => setDeleteDialogItem(null)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ fontWeight: 700 }}>Delete Call Record?</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            Are you sure you want to permanently delete this call / voice note record (ID: <strong>{deleteDialogItem?.id}</strong>)? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDeleteDialogItem(null)} disabled={isDeleting} sx={{ textTransform: 'none' }}>
            Cancel
          </Button>
          <Button
            onClick={handleDeleteConfirm}
            color="error"
            variant="contained"
            disabled={isDeleting}
            sx={{ textTransform: 'none', borderRadius: 2 }}
          >
            {isDeleting ? <CircularProgress size={20} color="inherit" /> : 'Delete Permanently'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar feedback */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3500}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
          severity={snackbar.severity}
          sx={{ width: '100%', borderRadius: 2 }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
