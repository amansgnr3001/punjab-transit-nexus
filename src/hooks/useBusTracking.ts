import React, { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

interface MiddleStation {
  name: string;
  lat: number;
  long: number;
  time: string;
}

interface MarkerLabel {
  text: string;
  color: string;
  fontSize: string;
  fontWeight: string;
}

interface MarkerIcon {
  url: string;
  scaledSize: any;
  anchor: any;
}

interface ActiveBusDoc {
  driverName: string;
  driverId: string;
  busNumberPlate: string;
  busName: string;
  middlestations: MiddleStation[];
  startingPlace: string;
  destination: string;
  startingPlaceLocation: {
    lat: number;
    long: number;
  };
  destinationLocation: {
    lat: number;
    long: number;
  };
  currLat: number;
  currLong: number;
  address: string;
  endtime: string;
  isactive: boolean;
}

interface BroadcastResponse {
  success: boolean;
  activeBus: ActiveBusDoc;
  polyline: string;
}

interface UseBusTrackingReturn {
  isTracking: boolean;
  activeBus: ActiveBusDoc | null;
  polyline: string | null;
  currentLocation: { lat: number; lng: number } | null;
  markers: Array<{
    position: { lat: number; lng: number };
    label: string;
    title: string;
  }>;
  startTracking: (busNumberPlate: string) => void;
  stopTracking: () => void;
  error: string | null;
  busStatus: 'active' | 'reached' | 'unknown';
}

export const useBusTracking = (): UseBusTrackingReturn => {
  const [isTracking, setIsTracking] = useState(false);
  const [activeBus, setActiveBus] = useState<ActiveBusDoc | null>(null);
  const [polyline, setPolyline] = useState<string | null>(null);
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [markers, setMarkers] = useState<Array<{
    position: { lat: number; lng: number };
    label: string;
    title: string;
  }>>([]);
  const [error, setError] = useState<string | null>(null);
  const [busStatus, setBusStatus] = useState<'active' | 'reached' | 'unknown'>('unknown');
  const socketRef = useRef<Socket | null>(null);

  const formatTime = (timeInSeconds: number): string => {
    const hours = Math.floor(timeInSeconds / 3600);
    const minutes = Math.floor((timeInSeconds % 3600) / 60);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  };

  const createMarkers = React.useCallback((activeBusDoc: ActiveBusDoc) => {
    console.log('🎯 Creating markers for activeBusDoc:', activeBusDoc);
    console.log('🎯 Middle stations:', activeBusDoc.middlestations);
    console.log('🎯 Current location:', activeBusDoc.currLat, activeBusDoc.currLong);
    
    const newMarkers = [];
    
    // Add starting place marker (RED)
    if (activeBusDoc.startingPlaceLocation && activeBusDoc.startingPlaceLocation.lat && activeBusDoc.startingPlaceLocation.long) {
      console.log('🎯 Adding starting place marker');
      const startingPlaceMarker = {
        position: { lat: activeBusDoc.startingPlaceLocation.lat, lng: activeBusDoc.startingPlaceLocation.long },
        label: {
          text: activeBusDoc.startingPlace,
          color: '#000000',
          fontSize: '16px',
          fontWeight: 'bold',
          className: 'custom-marker-label'
        },
        title: `${activeBusDoc.startingPlace} - Starting Point`,
        icon: {
          url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
            <svg width="32" height="32" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="#dc2626"/>
              <circle cx="12" cy="9" r="3" fill="#ffffff"/>
            </svg>
          `),
          scaledSize: new google.maps.Size(32, 32),
          anchor: new google.maps.Point(16, 16)
        }
      };
      newMarkers.push(startingPlaceMarker);
      console.log('✅ Added starting place marker:', startingPlaceMarker);
    } else {
      console.log('❌ No starting place location data available');
    }
    
    // Add destination marker (RED)
    if (activeBusDoc.destinationLocation && activeBusDoc.destinationLocation.lat && activeBusDoc.destinationLocation.long) {
      console.log('🎯 Adding destination marker');
      const destinationMarker = {
        position: { lat: activeBusDoc.destinationLocation.lat, lng: activeBusDoc.destinationLocation.long },
        label: {
          text: `${activeBusDoc.destination} (${activeBusDoc.endtime || 'N/A'})`,
          color: '#000000',
          fontSize: '16px',
          fontWeight: 'bold',
          className: 'custom-marker-label'
        },
        title: `${activeBusDoc.destination} - Arrival: ${activeBusDoc.endtime || 'N/A'}`,
        icon: {
          url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
            <svg width="32" height="32" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="#dc2626"/>
              <circle cx="12" cy="9" r="3" fill="#ffffff"/>
            </svg>
          `),
          scaledSize: new google.maps.Size(32, 32),
          anchor: new google.maps.Point(16, 16)
        }
      };
      newMarkers.push(destinationMarker);
      console.log('✅ Added destination marker:', destinationMarker);
    } else {
      console.log('❌ No destination location data available');
    }
    
    // Create markers for middle stations
    if (activeBusDoc.middlestations && Array.isArray(activeBusDoc.middlestations)) {
      console.log('🎯 Processing middle stations:', activeBusDoc.middlestations.length);
      
      activeBusDoc.middlestations.forEach((station, index) => {
        console.log(`🎯 Station ${index}:`, station);
        
        // Validate station data
        if (station && station.lat && station.long && station.name) {
          const marker = {
            position: { lat: station.lat, lng: station.long },
            label: {
              text: `${station.name} (${station.time || 'N/A'})`,
              color: '#000000',
              fontSize: '16px',
              fontWeight: 'bold',
              className: 'custom-marker-label'
            },
            title: `${station.name} - Arrival: ${station.time || 'N/A'}`,
            icon: {
              url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                <svg width="32" height="32" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="#2563eb"/>
                  <circle cx="12" cy="9" r="3" fill="#ffffff"/>
                </svg>
              `),
              scaledSize: new google.maps.Size(32, 32),
              anchor: new google.maps.Point(16, 16)
            }
          };
          newMarkers.push(marker);
          console.log(`✅ Added station marker ${index}:`, marker);
        } else {
          console.log(`❌ Invalid station data ${index}:`, station);
        }
      });
    } else {
      console.log('❌ No middle stations found or invalid data');
    }

    // Add current location marker
    if (activeBusDoc.currLat && activeBusDoc.currLong) {
      console.log('🎯 Adding current location marker');
      const currentLocationMarker = {
        position: { lat: activeBusDoc.currLat, lng: activeBusDoc.currLong },
        title: `Current Location - ${activeBusDoc.address || 'Unknown Address'}`,
        icon: {
          url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
            <svg width="48" height="48" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <!-- Map pin background -->
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="#000000"/>
              <!-- White circle for bus icon -->
              <circle cx="12" cy="9" r="6" fill="#ffffff"/>
              <!-- Bus silhouette -->
              <path d="M8 7h8c1.1 0 2 .9 2 2v3c0 .55-.45 1-1 1h-1v1c0 .55-.45 1-1 1h-1c-.55 0-1-.45-1-1v-1H9v1c0 .55-.45 1-1 1H7c-.55 0-1-.45-1-1v-1H5c-.55 0-1-.45-1-1V9c0-1.1.9-2 2-2z" fill="#000000"/>
              <!-- Bus windows -->
              <rect x="7" y="8" width="2" height="1.5" fill="#ffffff"/>
              <rect x="10" y="8" width="2" height="1.5" fill="#ffffff"/>
              <rect x="13" y="8" width="2" height="1.5" fill="#ffffff"/>
              <!-- Bus door -->
              <rect x="9.5" y="8" width="1" height="2" fill="#ffffff"/>
            </svg>
          `),
          scaledSize: new google.maps.Size(48, 48),
          anchor: new google.maps.Point(12, 24)
        }
      };
      newMarkers.push(currentLocationMarker);
      console.log('✅ Added current location marker:', currentLocationMarker);
    } else {
      console.log('❌ No current location data available');
    }

    console.log('🎯 Final markers array:', newMarkers);
    console.log('🎯 Total markers created:', newMarkers.length);
    setMarkers(newMarkers);
  }, []);

  const startTracking = React.useCallback((busNumberPlate: string) => {
    try {
      setError(null);
      
      // Connect to Driver API socket
      const socket = io('http://localhost:3001');
      socketRef.current = socket;

      // Handle connection
      socket.on('connect', () => {
        console.log('Connected to tracking socket:', socket.id);
        
        // Join the bus room
        socket.emit('businfo', { busnumberplate: busNumberPlate });
        console.log('Joined bus room:', busNumberPlate);
      });

      // Handle disconnection
      socket.on('disconnect', () => {
        console.log('Disconnected from tracking socket');
        setIsTracking(false);
      });

      // Handle connection errors
      socket.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
        setError('Failed to connect to tracking service');
        setIsTracking(false);
        setBusStatus('unknown');
      });

      // Listen for businfo_response to check bus status
      socket.on('businfo_response', (data) => {
        console.log('🎯 BUSINFO RESPONSE RECEIVED:', data);
        
        if (data.message === 'bus already reached destination') {
          console.log('❌ Bus has already reached destination');
          setBusStatus('reached');
          setError('Bus has already reached its destination');
          setIsTracking(false);
        } else if (data.success) {
          console.log('✅ Bus is active, can start tracking');
          setBusStatus('active');
          setError(null);
        } else {
          console.log('❌ Bus info error:', data.message);
          setBusStatus('unknown');
          setError(data.message || 'Error checking bus status');
          setIsTracking(false);
        }
      });

      // Listen for real-time bus updates
      socket.on('broadcast_response', (data: BroadcastResponse) => {
        console.log('🎯 RECEIVED BUS UPDATE:', data);
        console.log('🎯 Data success:', data.success);
        console.log('🎯 Active bus data:', data.activeBus);
        console.log('🎯 Polyline data:', data.polyline);
        
        if (data.success && data.activeBus) {
          console.log('✅ Processing bus update...');
          setActiveBus(data.activeBus);
          setPolyline(data.polyline);
          setCurrentLocation({
            lat: data.activeBus.currLat,
            lng: data.activeBus.currLong
          });
          
          console.log('🎯 Creating markers for:', data.activeBus.middlestations?.length || 0, 'stations');
          createMarkers(data.activeBus);
          setIsTracking(true);
          console.log('✅ Bus update processed successfully');
        } else {
          console.log('❌ Invalid bus update data:', data);
        }
      });

      // Handle errors
      socket.on('error', (error) => {
        console.error('Socket error:', error);
        setError(error.message || 'Tracking error occurred');
      });

    } catch (error) {
      console.error('Error starting tracking:', error);
      setError('Failed to start tracking');
    }
  }, [createMarkers]);

  const stopTracking = React.useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    
    setIsTracking(false);
    setActiveBus(null);
    setPolyline(null);
    setCurrentLocation(null);
    setMarkers([]);
    setError(null);
    setBusStatus('unknown');
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  return {
    isTracking,
    activeBus,
    polyline,
    currentLocation,
    markers,
    startTracking,
    stopTracking,
    error,
    busStatus
  };
};
