import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Tabs,
  Tab,
  TextField,
  Button,
  Switch,
  FormControlLabel,
  Card,
  CardContent,
  Grid,
  Divider,
  CircularProgress,
  Snackbar,
  Alert,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  LinearProgress,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
  InputAdornment,
  Tooltip,
} from '@mui/material';
import {
  Phone as PhoneIcon,
  WhatsApp as WhatsAppIcon,
  VideoLibrary as VideoIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  PlayCircle as PlayIcon,
  Save as SaveIcon,
  CloudUpload as UploadIcon,
  CheckCircle as CheckCircleIcon,
  Close as CloseIcon,
  Search as SearchIcon,
  OpenInNew as OpenInNewIcon,
  SupportAgent as SupportAgentIcon,
  Person as PersonIcon,
  Build as BuildIcon,
  People as PeopleIcon,
} from '@mui/icons-material';
import { useSupportSettings, type SupportSettings } from '../../hooks/useSupportSettings';
import { useTutorialVideos, type TutorialVideo, type VideoCategory } from '../../hooks/useTutorialVideos';
import { useHeader } from '../layout/DrawerLayout';

export default function HelpSupportMaster() {
  const { setHeaderActions } = useHeader();
  const [currentTab, setCurrentTab] = useState(0);

  // Hook for Support Helpline and WhatsApp
  const {
    settings: supportSettings,
    loading: settingsLoading,
    saving: settingsSaving,
    saveSettings,
  } = useSupportSettings();

  // Hook for Tutorial Videos
  const {
    videos,
    loading: videosLoading,
    uploadFile,
    addVideo,
    updateVideo,
    deleteVideo,
    toggleVideoStatus,
  } = useTutorialVideos();

  // Local state for Support Settings form
  const [formData, setFormData] = useState<SupportSettings>(supportSettings);

  useEffect(() => {
    setFormData(supportSettings);
  }, [supportSettings]);

  // Snackbar notifications
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  });

  // Video Management State
  const [categoryFilter, setCategoryFilter] = useState<'All' | 'Worker' | 'Customer'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [videoModalOpen, setVideoModalOpen] = useState(false);
  const [editingVideo, setEditingVideo] = useState<TutorialVideo | null>(null);

  // Video form state
  const [videoForm, setVideoForm] = useState({
    title: '',
    category: 'Worker' as VideoCategory,
    videoUrl: '',
    thumbnailUrl: '',
    order: 0,
    isActive: true,
  });

  // Uploading state for video form
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [videoUploadProgress, setVideoUploadProgress] = useState<number | null>(null);
  const [thumbUploadProgress, setThumbUploadProgress] = useState<number | null>(null);
  const [isSubmittingVideo, setIsSubmittingVideo] = useState(false);

  // Preview video dialog
  const [previewVideoUrl, setPreviewVideoUrl] = useState<string | null>(null);

  // Delete confirmation dialog
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Set top header actions
  useEffect(() => {
    if (currentTab === 1) {
      setHeaderActions(
        <Button
          variant="contained"
          size="small"
          startIcon={<AddIcon />}
          onClick={handleOpenAddVideoModal}
          sx={{ textTransform: 'none', fontWeight: 600, borderRadius: '8px' }}
        >
          Add Tutorial Video
        </Button>
      );
    } else {
      setHeaderActions(null);
    }
    return () => setHeaderActions(null);
  }, [currentTab]);

  // Handle support settings form submission
  const handleSaveSupportSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await saveSettings(formData);
      setSnackbar({
        open: true,
        message: 'Support Helpline and WhatsApp settings saved successfully!',
        severity: 'success',
      });
    } catch (err: any) {
      setSnackbar({
        open: true,
        message: err.message || 'Failed to save settings',
        severity: 'error',
      });
    }
  };

  // Video Modal Handlers
  function handleOpenAddVideoModal() {
    setEditingVideo(null);
    setVideoForm({
      title: '',
      category: categoryFilter === 'Worker' ? 'Worker' : 'Customer',
      videoUrl: '',
      thumbnailUrl: '',
      order: videos.length + 1,
      isActive: true,
    });
    setVideoFile(null);
    setThumbnailFile(null);
    setVideoUploadProgress(null);
    setThumbUploadProgress(null);
    setVideoModalOpen(true);
  }

  function handleOpenEditVideoModal(video: TutorialVideo) {
    setEditingVideo(video);
    setVideoForm({
      title: video.title,
      category: video.category,
      videoUrl: video.videoUrl,
      thumbnailUrl: video.thumbnailUrl,
      order: video.order,
      isActive: video.isActive,
    });
    setVideoFile(null);
    setThumbnailFile(null);
    setVideoUploadProgress(null);
    setThumbUploadProgress(null);
    setVideoModalOpen(true);
  }

  const handleSaveVideo = async () => {
    if (!videoForm.title.trim()) {
      setSnackbar({ open: true, message: 'Please enter a video title', severity: 'error' });
      return;
    }

    let finalVideoUrl = videoForm.videoUrl;
    let finalThumbUrl = videoForm.thumbnailUrl;

    if (!finalVideoUrl && !videoFile) {
      setSnackbar({ open: true, message: 'Please provide a video file or video URL', severity: 'error' });
      return;
    }

    setIsSubmittingVideo(true);

    try {
      // Upload video if file selected
      if (videoFile) {
        finalVideoUrl = await uploadFile(videoFile, 'videos', (pct) => setVideoUploadProgress(pct));
      }

      // Upload thumbnail if file selected
      if (thumbnailFile) {
        finalThumbUrl = await uploadFile(thumbnailFile, 'thumbnails', (pct) => setThumbUploadProgress(pct));
      }

      if (editingVideo) {
        await updateVideo(editingVideo.id, {
          title: videoForm.title.trim(),
          category: videoForm.category,
          videoUrl: finalVideoUrl,
          thumbnailUrl: finalThumbUrl,
          order: Number(videoForm.order) || 0,
          isActive: videoForm.isActive,
        });
        setSnackbar({ open: true, message: 'Tutorial video updated successfully!', severity: 'success' });
      } else {
        await addVideo({
          title: videoForm.title.trim(),
          category: videoForm.category,
          videoUrl: finalVideoUrl,
          thumbnailUrl: finalThumbUrl,
          order: Number(videoForm.order) || 0,
          isActive: videoForm.isActive,
        });
        setSnackbar({ open: true, message: 'Tutorial video added successfully!', severity: 'success' });
      }

      setVideoModalOpen(false);
    } catch (err: any) {
      console.error(err);
      setSnackbar({ open: true, message: err.message || 'Failed to save tutorial video', severity: 'error' });
    } finally {
      setIsSubmittingVideo(false);
      setVideoUploadProgress(null);
      setThumbUploadProgress(null);
    }
  };

  const handleDeleteVideo = async () => {
    if (!deleteConfirmId) return;
    try {
      await deleteVideo(deleteConfirmId);
      setSnackbar({ open: true, message: 'Tutorial video deleted', severity: 'success' });
      setDeleteConfirmId(null);
    } catch (err: any) {
      setSnackbar({ open: true, message: err.message || 'Failed to delete video', severity: 'error' });
    }
  };

  // Filtered tutorial videos
  const filteredVideos = videos.filter((vid) => {
    const matchesCategory =
      categoryFilter === 'All' || vid.category === categoryFilter || vid.category === 'Both';
    const matchesSearch =
      vid.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vid.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <Box sx={{ width: '100%', minHeight: '100%', p: { xs: 1, sm: 2 }, pb: 8 }}>
      {/* Modern High-Clarity Tab Switcher Bar */}
      <Paper
        elevation={0}
        sx={{
          p: 1,
          mb: 3,
          borderRadius: 2.5,
          border: '1px solid',
          borderColor: 'divider',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 2,
          background: (theme) =>
            theme.palette.mode === 'dark' ? 'rgba(30, 41, 59, 0.6)' : '#ffffff',
          boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
        }}
      >
        {/* Segmented Pill Tabs */}
        <Box
          sx={{
            display: 'inline-flex',
            bgcolor: (theme) =>
              theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : '#F1F5F9',
            p: 0.6,
            borderRadius: '12px',
          }}
        >
          <Tabs
            value={currentTab}
            onChange={(_, val) => setCurrentTab(val)}
            sx={{
              minHeight: 44,
              '& .MuiTabs-indicator': {
                height: '100%',
                borderRadius: '9px',
                backgroundColor: 'primary.main',
                boxShadow: '0 2px 8px rgba(0, 102, 102, 0.35)',
                zIndex: 1,
              },
              '& .MuiTab-root': {
                textTransform: 'none',
                fontWeight: 700,
                fontSize: { xs: '0.85rem', sm: '0.92rem' },
                minHeight: 40,
                minWidth: { xs: 'auto', sm: 220 },
                borderRadius: '9px',
                px: { xs: 1.5, sm: 2.5 },
                py: 0.8,
                zIndex: 2,
                color: 'text.secondary',
                transition: 'all 0.2s ease',
                '&:hover': {
                  color: 'primary.main',
                },
                '&.Mui-selected': {
                  color: '#ffffff !important',
                },
              },
            }}
          >
            <Tab
              icon={<PhoneIcon sx={{ fontSize: 19 }} />}
              iconPosition="start"
              label="Helpline & WhatsApp Support"
            />
            <Tab
              icon={<VideoIcon sx={{ fontSize: 19 }} />}
              iconPosition="start"
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <span>Tutorial Videos</span>
                  <Chip
                    label={videos.length}
                    size="small"
                    sx={{
                      height: 20,
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      bgcolor: currentTab === 1 ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.08)',
                      color: currentTab === 1 ? '#ffffff' : 'text.primary',
                    }}
                  />
                </Box>
              }
            />
          </Tabs>
        </Box>

        {/* Quick Context Action Beside Tabs */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, pr: 1 }}>
          {currentTab === 0 ? (
            <Chip
              icon={<CheckCircleIcon sx={{ fontSize: '16px !important' }} />}
              label={
                formData.isCallingActive || formData.isWhatsappActive
                  ? 'Direct Support Active'
                  : 'Direct Support Inactive'
              }
              color={formData.isCallingActive || formData.isWhatsappActive ? 'success' : 'default'}
              size="small"
              variant="outlined"
              sx={{ fontWeight: 600, fontSize: '0.82rem' }}
            />
          ) : (
            <Button
              variant="contained"
              size="small"
              startIcon={<AddIcon />}
              onClick={handleOpenAddVideoModal}
              sx={{ textTransform: 'none', fontWeight: 600, borderRadius: '8px', px: 2 }}
            >
              Add Tutorial Video
            </Button>
          )}
        </Box>
      </Paper>

      {/* TAB 0: Helpline & WhatsApp Settings */}
      {currentTab === 0 && (
        <Grid container spacing={3}>
          {/* Settings Form Column */}
          <Grid item xs={12} lg={7}>
            <Paper elevation={0} sx={{ p: 3, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
              <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>
                Support Helpline & WhatsApp Configuration
              </Typography>
              <Divider sx={{ mb: 3 }} />

              {settingsLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                  <CircularProgress />
                </Box>
              ) : (
                <form onSubmit={handleSaveSupportSettings}>
                  {/* Helpline Card */}
                  <Card
                    variant="outlined"
                    sx={{
                      mb: 3,
                      borderRadius: 2,
                      borderColor: '#1976D2',
                      background: 'rgba(25, 118, 210, 0.02)',
                    }}
                  >
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <PhoneIcon sx={{ color: '#1976D2' }} />
                          <Typography variant="subtitle1" fontWeight={700} sx={{ color: '#1976D2' }}>
                            Call Helpline Configuration
                          </Typography>
                        </Box>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={formData.isCallingActive}
                              onChange={(e) => setFormData({ ...formData, isCallingActive: e.target.checked })}
                              color="primary"
                            />
                          }
                          label={formData.isCallingActive ? 'Active' : 'Disabled'}
                        />
                      </Box>

                      <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            fullWidth
                            label="Helpline Button Title"
                            value={formData.callingTitle}
                            onChange={(e) => setFormData({ ...formData, callingTitle: e.target.value })}
                            placeholder="Call Helpline"
                            size="small"
                            helperText="Display title on the mobile screen card"
                          />
                        </Grid>

                        <Grid item xs={12} sm={6}>
                          <TextField
                            fullWidth
                            label="Working Hours / Subtitle"
                            value={formData.callingHours}
                            onChange={(e) => setFormData({ ...formData, callingHours: e.target.value })}
                            placeholder="10 AM - 7 PM"
                            size="small"
                            helperText="Availability timing shown on mobile card"
                          />
                        </Grid>

                        <Grid item xs={12}>
                          <TextField
                            fullWidth
                            label="Calling Phone Number"
                            value={formData.callingNumber}
                            onChange={(e) => setFormData({ ...formData, callingNumber: e.target.value })}
                            placeholder="+91 98765 43210 or 1800123456"
                            size="small"
                            required
                            helperText="When tapped, this number will open directly in the mobile device's phone dialer"
                            InputProps={{
                              startAdornment: (
                                <InputAdornment position="start">
                                  <PhoneIcon fontSize="small" color="action" />
                                </InputAdornment>
                              ),
                            }}
                          />
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>

                  {/* WhatsApp Card */}
                  <Card
                    variant="outlined"
                    sx={{
                      mb: 3,
                      borderRadius: 2,
                      borderColor: '#25D366',
                      background: 'rgba(37, 211, 102, 0.02)',
                    }}
                  >
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <WhatsAppIcon sx={{ color: '#25D366' }} />
                          <Typography variant="subtitle1" fontWeight={700} sx={{ color: '#1B5E20' }}>
                            WhatsApp Support Configuration
                          </Typography>
                        </Box>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={formData.isWhatsappActive}
                              onChange={(e) => setFormData({ ...formData, isWhatsappActive: e.target.checked })}
                              color="success"
                            />
                          }
                          label={formData.isWhatsappActive ? 'Active' : 'Disabled'}
                        />
                      </Box>

                      <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            fullWidth
                            label="WhatsApp Button Title"
                            value={formData.whatsappTitle}
                            onChange={(e) => setFormData({ ...formData, whatsappTitle: e.target.value })}
                            placeholder="Chat on WhatsApp"
                            size="small"
                            helperText="Display title on the mobile screen card"
                          />
                        </Grid>

                        <Grid item xs={12} sm={6}>
                          <TextField
                            fullWidth
                            label="Response Subtitle"
                            value={formData.whatsappSubtitle}
                            onChange={(e) => setFormData({ ...formData, whatsappSubtitle: e.target.value })}
                            placeholder="Instant Reply"
                            size="small"
                            helperText="Status / response text shown on mobile card"
                          />
                        </Grid>

                        <Grid item xs={12}>
                          <TextField
                            fullWidth
                            label="WhatsApp Phone Number (with Country Code)"
                            value={formData.whatsappNumber}
                            onChange={(e) => setFormData({ ...formData, whatsappNumber: e.target.value })}
                            placeholder="+919876543210 (without spaces or dashes)"
                            size="small"
                            required
                            helperText="Number used to start direct WhatsApp conversation (e.g. +919876543210)"
                            InputProps={{
                              startAdornment: (
                                <InputAdornment position="start">
                                  <WhatsAppIcon fontSize="small" sx={{ color: '#25D366' }} />
                                </InputAdornment>
                              ),
                            }}
                          />
                        </Grid>

                        <Grid item xs={12}>
                          <TextField
                            fullWidth
                            label="Default Greeting Message"
                            value={formData.whatsappDefaultMessage}
                            onChange={(e) => setFormData({ ...formData, whatsappDefaultMessage: e.target.value })}
                            placeholder="Hello Fixkar Support, I need assistance with..."
                            size="small"
                            multiline
                            rows={2}
                            helperText="Pre-filled text in the WhatsApp chat when user taps 'Chat on WhatsApp'"
                          />
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>

                  <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <Button
                      type="submit"
                      variant="contained"
                      size="large"
                      startIcon={settingsSaving ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
                      disabled={settingsSaving}
                      sx={{
                        textTransform: 'none',
                        fontWeight: 700,
                        px: 4,
                        py: 1.2,
                        borderRadius: 2,
                        fontSize: '0.95rem',
                      }}
                    >
                      {settingsSaving ? 'Saving Changes...' : 'Save Support Configuration'}
                    </Button>
                  </Box>
                </form>
              )}
            </Paper>
          </Grid>

          {/* Live Mobile Screen Preview Column */}
          <Grid item xs={12} lg={5}>
            <Paper
              elevation={0}
              sx={{
                p: 3,
                borderRadius: 2,
                border: '1px solid',
                borderColor: 'divider',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
              }}
            >
              <Typography variant="subtitle2" fontWeight={700} color="text.secondary" sx={{ mb: 2 }}>
                LIVE MOBILE APP PREVIEW
              </Typography>

              {/* Smartphone Frame */}
              <Box
                sx={{
                  width: 320,
                  height: 580,
                  bgcolor: '#F8FAFC',
                  borderRadius: '32px',
                  border: '10px solid #1E293B',
                  boxShadow: '0 20px 30px -10px rgba(0,0,0,0.3)',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  position: 'relative',
                }}
              >
                {/* Phone Notch/Speaker */}
                <Box
                  sx={{
                    height: 18,
                    bgcolor: '#1E293B',
                    width: 120,
                    mx: 'auto',
                    borderBottomLeftRadius: 10,
                    borderBottomRightRadius: 10,
                    position: 'absolute',
                    top: 0,
                    left: 'calc(50% - 60px)',
                    zIndex: 10,
                  }}
                />

                {/* Mobile App Bar */}
                <Box
                  sx={{
                    bgcolor: '#00897B',
                    color: '#fff',
                    pt: 3,
                    pb: 1.5,
                    px: 2,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5,
                  }}
                >
                  <Typography variant="body1" sx={{ fontWeight: 700, cursor: 'default' }}>
                    &larr;
                  </Typography>
                  <Typography variant="subtitle1" fontWeight={700} sx={{ fontSize: '1.05rem' }}>
                    Help & Support
                  </Typography>
                </Box>

                {/* Mobile Content */}
                <Box sx={{ p: 2, flex: 1, overflowY: 'auto' }}>
                  <Typography variant="subtitle2" fontWeight={800} sx={{ color: '#0F172A', mb: 1.5 }}>
                    Direct Support
                  </Typography>

                  {/* WhatsApp Card */}
                  {formData.isWhatsappActive && (
                    <Box
                      sx={{
                        background: 'linear-gradient(135deg, #25D366 0%, #1EBE5D 100%)',
                        borderRadius: '12px',
                        p: 1.5,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1.5,
                        color: '#fff',
                        mb: 1.5,
                        boxShadow: '0 4px 10px rgba(37, 211, 102, 0.3)',
                      }}
                    >
                      <Box
                        sx={{
                          width: 38,
                          height: 38,
                          borderRadius: '50%',
                          bgcolor: 'rgba(255,255,255,0.2)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <WhatsAppIcon sx={{ color: '#fff', fontSize: 24 }} />
                      </Box>
                      <Box>
                        <Typography variant="body2" fontWeight={800} sx={{ fontSize: '0.9rem' }}>
                          {formData.whatsappTitle || 'Chat on WhatsApp'}
                        </Typography>
                        <Typography variant="caption" sx={{ opacity: 0.9, fontSize: '0.75rem' }}>
                          {formData.whatsappSubtitle || 'Instant Reply'}
                        </Typography>
                      </Box>
                    </Box>
                  )}

                  {/* Helpline Card */}
                  {formData.isCallingActive && (
                    <Box
                      sx={{
                        background: 'linear-gradient(135deg, #1976D2 0%, #1565C0 100%)',
                        borderRadius: '12px',
                        p: 1.5,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1.5,
                        color: '#fff',
                        mb: 2,
                        boxShadow: '0 4px 10px rgba(25, 118, 210, 0.3)',
                      }}
                    >
                      <Box
                        sx={{
                          width: 38,
                          height: 38,
                          borderRadius: '50%',
                          bgcolor: 'rgba(255,255,255,0.2)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <PhoneIcon sx={{ color: '#fff', fontSize: 22 }} />
                      </Box>
                      <Box>
                        <Typography variant="body2" fontWeight={800} sx={{ fontSize: '0.9rem' }}>
                          {formData.callingTitle || 'Call Helpline'}
                        </Typography>
                        <Typography variant="caption" sx={{ opacity: 0.9, fontSize: '0.75rem' }}>
                          {formData.callingHours || '10 AM - 7 PM'}
                        </Typography>
                      </Box>
                    </Box>
                  )}

                  <Divider sx={{ my: 1.5 }} />

                  {/* Video Tutorials Header */}
                  <Typography variant="subtitle2" fontWeight={800} sx={{ color: '#0F172A', mb: 1.5 }}>
                    Video Tutorials
                  </Typography>

                  {/* Sample Preview Tutorial Cards */}
                  {videos.length > 0 ? (
                    videos.slice(0, 2).map((vid) => (
                      <Box
                        key={vid.id}
                        sx={{
                          bgcolor: '#2D3748',
                          color: '#fff',
                          borderRadius: '10px',
                          p: 1,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1.2,
                          mb: 1.2,
                        }}
                      >
                        <Box
                          sx={{
                            width: 60,
                            height: 42,
                            borderRadius: '6px',
                            bgcolor: '#1A202C',
                            overflow: 'hidden',
                            position: 'relative',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundImage: vid.thumbnailUrl ? `url(${vid.thumbnailUrl})` : undefined,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                          }}
                        >
                          <PlayIcon sx={{ color: '#fff', fontSize: 20 }} />
                        </Box>
                        <Typography
                          variant="caption"
                          fontWeight={700}
                          sx={{
                            fontSize: '0.78rem',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                          }}
                        >
                          {vid.title}
                        </Typography>
                      </Box>
                    ))
                  ) : (
                    <Box
                      sx={{
                        bgcolor: '#2D3748',
                        color: '#fff',
                        borderRadius: '10px',
                        p: 1,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1.2,
                        mb: 1,
                      }}
                    >
                      <Box
                        sx={{
                          width: 60,
                          height: 42,
                          borderRadius: '6px',
                          bgcolor: '#1A202C',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <PlayIcon sx={{ color: '#fff', fontSize: 20 }} />
                      </Box>
                      <Typography variant="caption" fontWeight={700} sx={{ fontSize: '0.78rem' }}>
                        How to Accept a Commission Job?
                      </Typography>
                    </Box>
                  )}
                </Box>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      )}

      {/* TAB 1: Tutorial Videos Management */}
      {currentTab === 1 && (
        <Paper elevation={0} sx={{ p: 3, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
          {/* Filter & Action Toolbar */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 2,
              mb: 3,
            }}
          >
            {/* Category Filter Buttons */}
            <Box sx={{ display: 'flex', gap: 1 }}>
              {[
                { key: 'All' as const, label: 'All Roles', count: videos.length },
                {
                  key: 'Customer' as const,
                  label: 'Customer App',
                  count: videos.filter((v) => v.category === 'Customer' || v.category === 'Both').length,
                },
                {
                  key: 'Worker' as const,
                  label: 'Worker App',
                  count: videos.filter((v) => v.category === 'Worker' || v.category === 'Both').length,
                },
              ].map((cat) => (
                <Button
                  key={cat.key}
                  variant={categoryFilter === cat.key ? 'contained' : 'outlined'}
                  size="small"
                  onClick={() => setCategoryFilter(cat.key)}
                  sx={{
                    textTransform: 'none',
                    fontWeight: 700,
                    borderRadius: '20px',
                    px: 2,
                  }}
                >
                  {cat.label} ({cat.count})
                </Button>
              ))}
            </Box>

            {/* Search Input & Add Button */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flex: { xs: 1, sm: 'none' } }}>
              <TextField
                size="small"
                placeholder="Search tutorial videos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon fontSize="small" color="action" />
                    </InputAdornment>
                  ),
                }}
                sx={{ width: { xs: '100%', sm: 260 } }}
              />

              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleOpenAddVideoModal}
                sx={{ textTransform: 'none', fontWeight: 600, borderRadius: '8px', whiteSpace: 'nowrap' }}
              >
                Add Video
              </Button>
            </Box>
          </Box>

          {/* Videos Table */}
          {videosLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          ) : filteredVideos.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 6, color: 'text.secondary' }}>
              <VideoIcon sx={{ fontSize: 48, color: 'grey.400', mb: 1 }} />
              <Typography variant="subtitle1" fontWeight={600}>
                No Tutorial Videos Found
              </Typography>
              <Typography variant="body2" sx={{ mb: 2 }}>
                Upload or add tutorial videos for workers and customers to assist them in the mobile app.
              </Typography>
              <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={handleOpenAddVideoModal}>
                Add First Video
              </Button>
            </Box>
          ) : (
            <TableContainer sx={{ borderRadius: 1.5, border: '1px solid', borderColor: 'divider' }}>
              <Table size="medium">
                <TableHead sx={{ bgcolor: 'grey.50' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700, width: 80 }}>Order</TableCell>
                    <TableCell sx={{ fontWeight: 700, width: 120 }}>Thumbnail</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Title & Description</TableCell>
                    <TableCell sx={{ fontWeight: 700, width: 140 }}>Target Role</TableCell>
                    <TableCell sx={{ fontWeight: 700, width: 110 }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 700, width: 140, textAlign: 'right' }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredVideos.map((video) => (
                    <TableRow key={video.id} hover>
                      <TableCell>
                        <Chip label={`#${video.order}`} size="small" variant="outlined" />
                      </TableCell>

                      <TableCell>
                        <Box
                          sx={{
                            width: 80,
                            height: 50,
                            borderRadius: '6px',
                            bgcolor: '#1E293B',
                            overflow: 'hidden',
                            position: 'relative',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: video.videoUrl ? 'pointer' : 'default',
                            backgroundImage: video.thumbnailUrl ? `url(${video.thumbnailUrl})` : undefined,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                          }}
                          onClick={() => {
                            if (video.videoUrl) setPreviewVideoUrl(video.videoUrl);
                          }}
                        >
                          <PlayIcon sx={{ color: '#fff', fontSize: 28, filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))' }} />
                        </Box>
                      </TableCell>

                      <TableCell>
                        <Typography variant="subtitle2" fontWeight={700}>
                          {video.title}
                        </Typography>
                        {video.videoUrl && (
                          <Typography
                            variant="caption"
                            sx={{
                              color: 'primary.main',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 0.5,
                              cursor: 'pointer',
                            }}
                            onClick={() => setPreviewVideoUrl(video.videoUrl)}
                          >
                            <PlayIcon sx={{ fontSize: 14 }} /> Play Video
                          </Typography>
                        )}
                      </TableCell>

                      <TableCell>
                        <Chip
                          label={video.category}
                          size="small"
                          color={
                            video.category === 'Worker'
                              ? 'success'
                              : video.category === 'Customer'
                              ? 'primary'
                              : 'secondary'
                          }
                          sx={{ fontWeight: 600 }}
                        />
                      </TableCell>

                      <TableCell>
                        <FormControlLabel
                          control={
                            <Switch
                              size="small"
                              checked={video.isActive}
                              onChange={() => toggleVideoStatus(video.id, video.isActive)}
                            />
                          }
                          label={
                            <Typography variant="caption" fontWeight={600} color={video.isActive ? 'success.main' : 'text.disabled'}>
                              {video.isActive ? 'Active' : 'Inactive'}
                            </Typography>
                          }
                        />
                      </TableCell>

                      <TableCell align="right">
                        <Tooltip title="Preview Video">
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => setPreviewVideoUrl(video.videoUrl)}
                            disabled={!video.videoUrl}
                          >
                            <PlayIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>

                        <Tooltip title="Edit">
                          <IconButton size="small" color="info" onClick={() => handleOpenEditVideoModal(video)}>
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>

                        <Tooltip title="Delete">
                          <IconButton size="small" color="error" onClick={() => setDeleteConfirmId(video.id)}>
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Paper>
      )}

      {/* ADD / EDIT VIDEO MODAL */}
      <Dialog open={videoModalOpen} onClose={() => !isSubmittingVideo && setVideoModalOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>
          {editingVideo ? 'Edit Tutorial Video' : 'Add New Tutorial Video'}
        </DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2.5} sx={{ mt: 0.2 }}>
            <Grid item xs={12}>
              <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>
                Target Role Category *
              </Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1.5 }}>
                {[
                  {
                    value: 'Customer' as VideoCategory,
                    label: 'Customer',
                    subtitle: 'Customer App only',
                    icon: <PersonIcon />,
                    color: '#1976D2',
                  },
                  {
                    value: 'Worker' as VideoCategory,
                    label: 'Worker / Karigar',
                    subtitle: 'Worker App only',
                    icon: <BuildIcon />,
                    color: '#2E7D32',
                  },
                  {
                    value: 'Both' as VideoCategory,
                    label: 'Both Roles',
                    subtitle: 'Visible to everyone',
                    icon: <PeopleIcon />,
                    color: '#7B1FA2',
                  },
                ].map((item) => {
                  const isSelected = videoForm.category === item.value;
                  return (
                    <Paper
                      key={item.value}
                      elevation={0}
                      onClick={() => setVideoForm({ ...videoForm, category: item.value })}
                      sx={{
                        p: 1.5,
                        cursor: 'pointer',
                        borderRadius: 2,
                        border: '2px solid',
                        borderColor: isSelected ? item.color : 'divider',
                        bgcolor: isSelected ? `${item.color}0F` : 'transparent',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        textAlign: 'center',
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          borderColor: item.color,
                          bgcolor: `${item.color}0A`,
                        },
                      }}
                    >
                      <Box sx={{ color: item.color, mb: 0.5, display: 'flex' }}>
                        {item.icon}
                      </Box>
                      <Typography variant="subtitle2" fontWeight={700} sx={{ color: isSelected ? item.color : 'text.primary', fontSize: '0.88rem' }}>
                        {item.label}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                        {item.subtitle}
                      </Typography>
                    </Paper>
                  );
                })}
              </Box>
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Video Title *"
                placeholder="e.g. How to Accept a Commission Job?"
                value={videoForm.title}
                onChange={(e) => setVideoForm({ ...videoForm, title: e.target.value })}
                size="small"
                required
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="number"
                label="Display Order (Sequence)"
                value={videoForm.order}
                onChange={(e) => setVideoForm({ ...videoForm, order: Number(e.target.value) })}
                size="small"
                helperText="Lower numbers appear first"
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={videoForm.isActive}
                    onChange={(e) => setVideoForm({ ...videoForm, isActive: e.target.checked })}
                  />
                }
                label="Active / Visible in App"
                sx={{ mt: 1 }}
              />
            </Grid>

            {/* Video Source */}
            <Grid item xs={12}>
              <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>
                Video File / Link *
              </Typography>
              <Paper variant="outlined" sx={{ p: 2, borderRadius: 1.5 }}>
                <Button
                  variant="outlined"
                  component="label"
                  startIcon={<UploadIcon />}
                  size="small"
                  sx={{ mb: 1, textTransform: 'none' }}
                >
                  Upload Video File (MP4, WebM, MOV)
                  <input
                    type="file"
                    accept="video/mp4,video/webm,video/quicktime"
                    hidden
                    onChange={(e) => {
                      if (e.target.files?.[0]) {
                        setVideoFile(e.target.files[0]);
                      }
                    }}
                  />
                </Button>
                {videoFile && (
                  <Typography variant="caption" sx={{ display: 'block', color: 'success.main', fontWeight: 600, mb: 1 }}>
                    Selected file: {videoFile.name} ({(videoFile.size / (1024 * 1024)).toFixed(1)} MB)
                  </Typography>
                )}

                {videoUploadProgress !== null && (
                  <Box sx={{ width: '100%', mb: 1 }}>
                    <Typography variant="caption">Uploading Video: {videoUploadProgress}%</Typography>
                    <LinearProgress variant="determinate" value={videoUploadProgress} />
                  </Box>
                )}

                <TextField
                  fullWidth
                  size="small"
                  label="Or Direct Video URL"
                  placeholder="https://.../video.mp4 or YouTube link"
                  value={videoForm.videoUrl}
                  onChange={(e) => setVideoForm({ ...videoForm, videoUrl: e.target.value })}
                  helperText="Direct storage download URL or video URL"
                />
              </Paper>
            </Grid>

            {/* Thumbnail Image Source */}
            <Grid item xs={12}>
              <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>
                Video Thumbnail Image (Optional)
              </Typography>
              <Paper variant="outlined" sx={{ p: 2, borderRadius: 1.5 }}>
                <Button
                  variant="outlined"
                  component="label"
                  startIcon={<UploadIcon />}
                  size="small"
                  sx={{ mb: 1, textTransform: 'none' }}
                >
                  Upload Thumbnail (JPG, PNG)
                  <input
                    type="file"
                    accept="image/*"
                    hidden
                    onChange={(e) => {
                      if (e.target.files?.[0]) {
                        setThumbnailFile(e.target.files[0]);
                      }
                    }}
                  />
                </Button>
                {thumbnailFile && (
                  <Typography variant="caption" sx={{ display: 'block', color: 'success.main', fontWeight: 600, mb: 1 }}>
                    Selected thumbnail: {thumbnailFile.name}
                  </Typography>
                )}

                {thumbUploadProgress !== null && (
                  <Box sx={{ width: '100%', mb: 1 }}>
                    <Typography variant="caption">Uploading Thumbnail: {thumbUploadProgress}%</Typography>
                    <LinearProgress variant="determinate" value={thumbUploadProgress} />
                  </Box>
                )}

                <TextField
                  fullWidth
                  size="small"
                  label="Or Direct Thumbnail URL"
                  placeholder="https://.../thumbnail.jpg"
                  value={videoForm.thumbnailUrl}
                  onChange={(e) => setVideoForm({ ...videoForm, thumbnailUrl: e.target.value })}
                />
              </Paper>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setVideoModalOpen(false)} disabled={isSubmittingVideo} sx={{ textTransform: 'none' }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSaveVideo}
            disabled={isSubmittingVideo}
            startIcon={isSubmittingVideo ? <CircularProgress size={18} color="inherit" /> : <SaveIcon />}
            sx={{ textTransform: 'none', fontWeight: 700 }}
          >
            {isSubmittingVideo ? 'Saving & Uploading...' : editingVideo ? 'Update Video' : 'Add Video'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* VIDEO PREVIEW DIALOG */}
      <Dialog open={!!previewVideoUrl} onClose={() => setPreviewVideoUrl(null)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="subtitle1" fontWeight={700}>
            Video Player Preview
          </Typography>
          <IconButton onClick={() => setPreviewVideoUrl(null)} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 2, bgcolor: '#000', display: 'flex', justifyContent: 'center' }}>
          {previewVideoUrl && (
            <video
              src={previewVideoUrl}
              controls
              autoPlay
              style={{ maxWidth: '100%', maxHeight: '65vh', borderRadius: '8px' }}
            >
              Your browser does not support the video tag.
            </video>
          )}
        </DialogContent>
      </Dialog>

      {/* DELETE CONFIRMATION DIALOG */}
      <Dialog open={!!deleteConfirmId} onClose={() => setDeleteConfirmId(null)}>
        <DialogTitle sx={{ fontWeight: 700 }}>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            Are you sure you want to delete this tutorial video? It will immediately be removed from the mobile app for users.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDeleteConfirmId(null)} sx={{ textTransform: 'none' }}>
            Cancel
          </Button>
          <Button variant="contained" color="error" onClick={handleDeleteVideo} sx={{ textTransform: 'none', fontWeight: 700 }}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* SNACKBAR NOTIFICATIONS */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={5000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: '100%', fontWeight: 600 }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
