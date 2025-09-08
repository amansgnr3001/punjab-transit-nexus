import React, { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

interface MiddleStation {
  name: string;
  lat: number;
  long: number;
  time: number;
}

interface ActiveBusDoc {
  driverName: string;
  driverId: string;
  busNumberPlate: string;
  busName: string;
  middlestations: MiddleStation[];
  startingPlace: string;
  destination: string;
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
    
    // Create markers for middle stations
    if (activeBusDoc.middlestations && Array.isArray(activeBusDoc.middlestations)) {
      console.log('🎯 Processing middle stations:', activeBusDoc.middlestations.length);
      
      activeBusDoc.middlestations.forEach((station, index) => {
        console.log(`🎯 Station ${index}:`, station);
        
        // Validate station data
        if (station && station.lat && station.long && station.name) {
          const marker = {
            position: { lat: parseFloat(station.lat), lng: parseFloat(station.long) },
            label: `${station.name} (${station.time ? formatTime(station.time) : 'N/A'})`,
            title: `${station.name} - Arrival: ${station.time ? formatTime(station.time) : 'N/A'}`
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
        position: { lat: parseFloat(activeBusDoc.currLat), lng: parseFloat(activeBusDoc.currLong) },
        label: '🚌',
        title: `Current Location - ${activeBusDoc.address || 'Unknown Address'}`
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
    error
  };
};
