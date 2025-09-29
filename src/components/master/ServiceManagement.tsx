import { useState, useEffect } from 'react';
import type { SelectChangeEvent } from '@mui/material/Select';
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
  Alert,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Checkbox,
  FormControlLabel,
  Chip,
  IconButton,
  MenuItem,
  Select
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { useUsers } from '../../hooks/useUsers';
import type { User } from '../../hooks/useUsers';

// Define service and subservice types based on the data structure
interface SubServiceData {
  is_all: boolean;
  selectedSubServices: string[];
}

interface ServiceManagementProps {
  workerId: string;
  workerData: User;
}

// Predefined list of available services and subservices
const AVAILABLE_SERVICES = [
  'CCTV',
  'AC',
  'Plumbing',
  'Electrical',
  'Carpentry'
];

const SUBSERVICES: Record<string, string[]> = {
  'CCTV': [
    'CCTV Installation',
    'CCTV Repair',
    'DVR/NVR Setup',
    'Camera Shifting',
    'Camera Servicing'
  ],
  'AC': [
    'AC Installation',
    'AC Repair',
    'AC Gas Refill',
    'AC Servicing',
    'AC Uninstallation'
  ],
  'Plumbing': [
    'Pipe Leakage',
    'Bathroom Fitting',
    'Water Tank Cleaning',
    'Basin/Sink Blockage',
    'Geyser Installation'
  ],
  'Electrical': [
    'Switchboard Repair',
    'Wiring',
    'Fan Installation',
    'Lighting',
    'Inverter/UPS Installation'
  ],
  'Carpentry': [
    'Furniture Repair',
    'Door Repair',
    'Window Repair',
    'Furniture Assembly',
    'Wood Polishing'
  ]
};

export default function ServiceManagement({ workerId, workerData }: ServiceManagementProps) {
  const { updateUser } = useUsers();
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);
  const [selectedService, setSelectedService] = useState<string>('');
  const [isAllSubservices, setIsAllSubservices] = useState<boolean>(false);
  const [selectedSubservices, setSelectedSubservices] = useState<string[]>([]);
  const [services, setServices] = useState<string[]>(workerData.selectedServices || []);
  const [subServices, setSubServices] = useState<Record<string, SubServiceData>>(
    workerData.subServices || {}
  );

  useEffect(() => {
    if (workerData) {
      setServices(workerData.selectedServices || []);
      setSubServices(workerData.subServices || {});
    }
  }, [workerData]);

  const handleServiceChange = (event: SelectChangeEvent) => {
    setSelectedService(event.target.value);
    // Reset subservices when service changes
    setIsAllSubservices(false);
    setSelectedSubservices([]);
  };

  const handleSubserviceToggle = (subservice: string) => {
    setSelectedSubservices(prev => {
      if (prev.includes(subservice)) {
        return prev.filter(item => item !== subservice);
      } else {
        return [...prev, subservice];
      }
    });
  };

  const handleAddService = async () => {
    if (!selectedService) return;

    try {
      setLoading(true);
      setError(null);

      const updatedServices = [...new Set([...services, selectedService])];
      const updatedSubServices = {
        ...subServices,
        [selectedService]: {
          is_all: isAllSubservices,
          selectedSubServices: isAllSubservices 
            ? SUBSERVICES[selectedService] || [] 
            : selectedSubservices
        }
      };

      await updateUser(workerId, {
        selectedServices: updatedServices,
        subServices: updatedSubServices
      });

      setServices(updatedServices);
      setSubServices(updatedSubServices);
      setIsDialogOpen(false);
      resetForm();
    } catch (err) {
      setError('Failed to update services');
      console.error('Error updating services:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveService = async (service: string) => {
    try {
      setLoading(true);
      setError(null);

      const updatedServices = services.filter(s => s !== service);
      const updatedSubServices = { ...subServices };
      delete updatedSubServices[service];

      await updateUser(workerId, {
        selectedServices: updatedServices,
        subServices: updatedSubServices
      });

      setServices(updatedServices);
      setSubServices(updatedSubServices);
    } catch (err) {
      setError('Failed to remove service');
      console.error('Error removing service:', err);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSelectedService('');
    setIsAllSubservices(false);
    setSelectedSubservices([]);
  };

  const availableServices = AVAILABLE_SERVICES.filter(
    service => !services.includes(service)
  );

  return (
    <Box sx={{ width: '100%', mt: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">Worker Services</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setIsDialogOpen(true)}
          disabled={availableServices.length === 0}
        >
          Add Service
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {services.length === 0 ? (
        <Alert severity="info">No services assigned to this worker yet.</Alert>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Service</TableCell>
                <TableCell>Subservices</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {services.map(service => (
                <TableRow key={service}>
                  <TableCell>
                    <Typography fontWeight="medium">{service}</Typography>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {subServices[service]?.is_all ? (
                        <Chip 
                          label="All Subservices" 
                          color="primary" 
                          size="small"
                          variant="outlined"
                        />
                      ) : (
                        subServices[service]?.selectedSubServices?.map(sub => (
                          <Chip 
                            key={sub} 
                            label={sub} 
                            size="small"
                            variant="outlined"
                          />
                        ))
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <IconButton
                      onClick={() => handleRemoveService(service)}
                      color="error"
                      size="small"
                      disabled={loading}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Add Service Dialog */}
      <Dialog open={isDialogOpen} onClose={() => setIsDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Service</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Select
              value={selectedService}
              onChange={handleServiceChange}
              displayEmpty
              fullWidth
              disabled={loading}
            >
              <MenuItem value="">
                <em>Select a service</em>
              </MenuItem>
              {availableServices.map(service => (
                <MenuItem key={service} value={service}>
                  {service}
                </MenuItem>
              ))}
            </Select>

            {selectedService && (
              <>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={isAllSubservices}
                      onChange={(e) => {
                        setIsAllSubservices(e.target.checked);
                        if (e.target.checked) {
                          setSelectedSubservices([]);
                        }
                      }}
                      disabled={loading}
                    />
                  }
                  label="All Subservices"
                />

                {!isAllSubservices && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Select Subservices:
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      {SUBSERVICES[selectedService]?.map(subservice => (
                        <FormControlLabel
                          key={subservice}
                          control={
                            <Checkbox
                              checked={selectedSubservices.includes(subservice)}
                              onChange={() => handleSubserviceToggle(subservice)}
                              disabled={loading}
                            />
                          }
                          label={subservice}
                        />
                      ))}
                    </Box>
                  </Box>
                )}
              </>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setIsDialogOpen(false);
            resetForm();
          }} disabled={loading}>
            Cancel
          </Button>
          <Button 
            onClick={handleAddService} 
            variant="contained" 
            disabled={!selectedService || (loading || (!isAllSubservices && selectedSubservices.length === 0))}
          >
            {loading ? 'Saving...' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
