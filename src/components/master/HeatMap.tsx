import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, useTheme, CircularProgress } from '@mui/material';
import L from 'leaflet';
import 'leaflet.heat';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { useUsers } from '../../hooks/useUsers';
import { useKarigars } from '../../hooks/useKarigars';

// Fix for default marker icons in React
const DefaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

// Extend the Leaflet types to include the heatLayer method
declare module 'leaflet' {
  namespace TileLayer {
    function tileLayer(urlTemplate: string, options?: any): any;
  }
  
  function heatLayer(
    latlngs: [number, number, number][], 
    options?: any
  ): any;
}

// No need for FilterState interface since we're not using filters in this simplified version

// Fix for default marker icons in React
if (typeof window !== 'undefined') {
  // @ts-ignore
  delete L.Icon.Default.prototype._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  });
}

// Custom marker icons
const createCustomIcon = (color: string) => {
  return L.divIcon({
    className: 'custom-marker',
    html: `<svg width="24" height="40" viewBox="0 0 24 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 0C5.37258 0 0 5.37258 0 12C0 20.25 12 40 12 40C12 40 24 20.25 24 12C24 5.37258 18.6274 0 12 0Z" fill="${color}"/>
      <circle cx="12" cy="12" r="6" fill="white"/>
    </svg>`,
    iconSize: [24, 40],
    iconAnchor: [12, 40],
    popupAnchor: [0, -40]
  });
};

const UserMarker = ({ user }: { user: any }) => {
  const lat = user.location?.latitude;
  const lng = user.location?.longitude;
  
  if (lat === undefined || lng === undefined) return null;
  
  return (
    <Marker 
      position={[lat, lng]}
      icon={createCustomIcon('#FF0000')}
    >
      <Popup>
        <div>
          <strong>{user.name}</strong><br />
          {user.email}<br />
          Role: {user.role}
        </div>
      </Popup>
    </Marker>
  );
};

const KarigarMarker = ({ karigar }: { karigar: any }) => {
  const lat = karigar.location?.latitude;
  const lng = karigar.location?.longitude;
  
  if (lat === undefined || lng === undefined) return null;
  
  return (
    <Marker 
      position={[lat, lng]}
      icon={createCustomIcon('#1E90FF')}
    >
      <Popup>
        <div>
          <strong>{karigar.name}</strong><br />
          Skill: {karigar.skill}<br />
          Experience: {karigar.experience}
        </div>
      </Popup>
    </Marker>
  );
};

// Remove CustomMapContainer since we'll use MapContainer directly

// Legend component
const MapLegend = () => {
  const theme = useTheme();
  
  return (
    <Paper 
      elevation={3} 
      sx={{ 
        position: 'absolute', 
        bottom: 20, 
        right: 20, 
        backgroundColor: 'background.paper',
        padding: '12px 16px',
        borderRadius: '8px',
        boxShadow: theme.shadows[3],
        zIndex: 1000,
        minWidth: '150px'
      }}
    >
      <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1, borderBottom: '1px solid', borderColor: 'divider', pb: 0.5 }}>
        Legend
      </Typography>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
        <Box sx={{ 
          width: 16, 
          height: 16, 
          borderRadius: '50%', 
          bgcolor: '#FF0000', 
          mr: 1.5,
          flexShrink: 0
        }} />
        <Typography variant="body2">Users</Typography>
      </Box>
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <Box sx={{ 
          width: 16, 
          height: 16, 
          borderRadius: '50%', 
          bgcolor: '#1E90FF', 
          mr: 1.5,
          flexShrink: 0
        }} />
        <Typography variant="body2">Karigars</Typography>
      </Box>
    </Paper>
  );
};

// Simple error boundary component
const ErrorBoundary: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [hasError, setHasError] = React.useState(false);

  React.useEffect(() => {
    const errorHandler = (error: ErrorEvent) => {
      console.error('Map Error:', error);
      setHasError(true);
    };

    window.addEventListener('error', errorHandler);
    return () => window.removeEventListener('error', errorHandler);
  }, []);

  if (hasError) {
    return <div>Error loading map. Please check the console for details.</div>;
  }

  return <>{children}</>;
};

const HeatMap = () => {
  const { users, loading: usersLoading } = useUsers();
  const { karigars, loading: karigarsLoading } = useKarigars();
  
  // Default center for the map (center of India)
  const mapCenter: [number, number] = [20.5937, 78.9629];
  const [mapLoaded, setMapLoaded] = useState(false);
  
  // Calculate bounds to fit all markers
  const calculateBounds = () => {
    const allLocations: [number, number][] = [];
    
    users.forEach(user => {
      if (user.location?.latitude !== undefined && user.location?.longitude !== undefined) {
        allLocations.push([user.location.latitude, user.location.longitude]);
      }
    });
    
    karigars.forEach(karigar => {
      if (karigar.location?.latitude !== undefined && karigar.location?.longitude !== undefined) {
        allLocations.push([karigar.location.latitude, karigar.location.longitude]);
      }
    });
    
    if (allLocations.length === 0) return null;
    
    return L.latLngBounds(allLocations);
  };
  
  const bounds = calculateBounds();

  // Ensure CSS is loaded
  useEffect(() => {
    // Check if Leaflet CSS is loaded
    const leafletCss = Array.from(document.styleSheets).some(
      (sheet) => sheet.href && sheet.href.includes('leaflet')
    );
    
    if (!leafletCss) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      link.integrity = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=';
      link.crossOrigin = '';
      document.head.appendChild(link);
    }
    
    setMapLoaded(true);
    
    return () => {
      // Cleanup if needed
    };
  }, []);

  if (!mapLoaded || usersLoading || karigarsLoading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100%',
        width: '100%'
      }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ 
      height: '100%',
      width: '100%',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      position: 'relative'
    }}>
      <ErrorBoundary>
        <Box sx={{ 
          p: 3,
          pb: 2,
          width: '100%',
          backgroundColor: 'background.paper',
          borderBottom: '1px solid',
          borderColor: 'divider',
          zIndex: 1,
          flexShrink: 0
        }}>
          <Typography variant="h5" sx={{ fontWeight: 'bold' }}>User & Karigar Locations</Typography>
          <Typography variant="body2" color="text.secondary">
            {users.filter(u => u.location).length} users and {karigars.filter(k => k.location).length} karigars with location data
          </Typography>
        </Box>

        <Box sx={{
          flex: 1,
          width: '100%',
          position: 'relative',
          overflow: 'hidden',
          '& .leaflet-container': {
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            width: '100%',
            height: '100%',
            minHeight: '100%'
          },
          '& .custom-marker': {
            background: 'transparent',
            border: 'none'
          }
        }}>
          <MapContainer
            center={mapCenter}
            {...(bounds ? { bounds, boundsOptions: { padding: [50, 50] } } : { zoom: 5 })}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              width: '100%',
              height: '100%'
            }}
            zoom={5}
            zoomControl={true}
            doubleClickZoom={true}
            scrollWheelZoom={true}
            attributionControl={true}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            
            {/* User Markers */}
            {users.map((user, index) => (
              <UserMarker key={`user-${user.id || index}`} user={user} />
            ))}
            
            {/* Karigar Markers */}
            {karigars.map((karigar, index) => (
              <KarigarMarker key={`karigar-${karigar.id || index}`} karigar={karigar} />
            ))}
            
            <MapLegend />
          </MapContainer>
        </Box>
      </ErrorBoundary>
    </Box>
  );
};

export default HeatMap;
