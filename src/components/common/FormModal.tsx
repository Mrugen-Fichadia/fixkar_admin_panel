import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Box, CircularProgress } from '@mui/material';
import type { DialogProps } from '@mui/material';

interface FormModalProps extends Omit<DialogProps, 'onClose' | 'onSubmit' | 'title' | 'open'> {
  open: boolean;
  onClose: () => void;
  title: React.ReactNode;
  children: React.ReactNode;
  onSave: (data?: any) => void | Promise<void>;
  saveButtonText?: string;
  cancelButtonText?: string;
  loading?: boolean;
}

export default function FormModal({
  open,
  onClose,
  title,
  children,
  onSave,
  saveButtonText = 'Save',
  cancelButtonText = 'Cancel',
  loading = false,
  ...props
}: FormModalProps) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth {...props}>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent dividers>
        <Box sx={{ pt: 1 }}>{children}</Box>
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button 
          onClick={onClose} 
          variant="outlined"
          disabled={loading}
        >
          {cancelButtonText}
        </Button>
        <Button 
          onClick={onSave} 
          variant="contained" 
          color="primary"
          disabled={loading}
          startIcon={loading ? <CircularProgress size={20} color="inherit" /> : null}
        >
          {loading ? 'Processing...' : saveButtonText}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
