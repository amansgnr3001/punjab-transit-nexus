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
    type?: 'scheduled' | 'realtime' | 'current';
  }>;
  scheduledMarkers: Array<{
    position: { lat: number; lng: number };
    label: string | {
      text: string;
      color: string;
      fontSize: string;
      fontWeight: string;
      className?: string;
    };
    title: string;
    icon?: {
      url: string;
      scaledSize: any;
      anchor: any;
    };
  }>;
  startTracking: (busNumberPlate: string, schedule?: any) => void;
  stopTracking: () => void;
  error: string | null;
  busStatus: 'active' | 'reached' | 'unknown';
  currentSpeed: number | null;
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
    type?: 'scheduled' | 'realtime' | 'current';
  }>>([]);
  const [scheduledMarkers, setScheduledMarkers] = useState<Array<{
    position: { lat: number; lng: number };
    label: string | {
      text: string;
      color: string;
      fontSize: string;
      fontWeight: string;
      className?: string;
    };
    title: string;
    icon?: {
      url: string;
      scaledSize: any;
      anchor: any;
    };
  }>>([]);
  const [error, setError] = useState<string | null>(null);
  const [busStatus, setBusStatus] = useState<'active' | 'reached' | 'unknown'>('unknown');
  const [currentSpeed, setCurrentSpeed] = useState<number | null>(null);
  const socketRef = useRef<Socket | null>(null);

  const formatTime = (timeInSeconds: number): string => {
    const hours = Math.floor(timeInSeconds / 3600);
    const minutes = Math.floor((timeInSeconds % 3600) / 60);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  };

  // Calculate distance between two points using Haversine formula
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c; // Distance in kilometers
  };

  // Calculate speed in km/h
  const calculateSpeed = (currentLat: number, currentLon: number, lastLat: number, lastLon: number): number => {
    const distance = calculateDistance(lastLat, lastLon, currentLat, currentLon);
    const timeInHours = 30 / 3600; // 30 seconds in hours
    return distance / timeInHours; // Speed in km/h
  };

  // Helper functions for localStorage persistence
  const saveMarkerDataToStorage = (activeBusDoc: ActiveBusDoc, polylineData: string, markersData: any[], currentLoc: any, lastLocation?: any, speed?: number | null) => {
    try {
      const markerData = {
        activeBus: activeBusDoc,
        polyline: polylineData,
        timestamp: Date.now(),
        markers: markersData,
        currentLocation: currentLoc,
        lastLocation: lastLocation || null,
        currentSpeed: speed || null
      };
      localStorage.setItem('busTrackingData', JSON.stringify(markerData));
      console.log('💾 Saved marker data to localStorage');
    } catch (error) {
      console.error('❌ Error saving to localStorage:', error);
    }
  };

  const restoreMarkerDataFromStorage = () => {
    try {
      const storedData = localStorage.getItem('busTrackingData');
      console.log('🔍 Checking localStorage for stored data:', storedData ? 'Found' : 'Not found');
      
      if (storedData) {
        const markerData = JSON.parse(storedData);
        console.log('🔄 Restoring marker data from localStorage:', markerData);
        console.log('🔄 Markers count:', markerData.markers?.length || 0);
        console.log('🔄 Active bus:', markerData.activeBus);
        
        // Check if data is not too old (e.g., less than 5 minutes)
        const dataAge = Date.now() - markerData.timestamp;
        console.log('🔄 Data age (minutes):', Math.round(dataAge / (1000 * 60)));
        
        if (dataAge < 5 * 60 * 1000) { // 5 minutes
          setActiveBus(markerData.activeBus);
          setPolyline(markerData.polyline);
          setMarkers(markerData.markers || []);
          setCurrentLocation(markerData.currentLocation);
          setCurrentSpeed(markerData.currentSpeed || null);
          console.log('✅ Restored marker data from localStorage');
          return true;
        } else {
          console.log('⏰ Stored data is too old, clearing localStorage');
          localStorage.removeItem('busTrackingData');
        }
      } else {
        console.log('❌ No stored data found in localStorage');
      }
    } catch (error) {
      console.error('❌ Error restoring from localStorage:', error);
      localStorage.removeItem('busTrackingData');
    }
    return false;
  };

  const clearMarkerDataFromStorage = () => {
    try {
      localStorage.removeItem('busTrackingData');
      console.log('🗑️ Cleared marker data from localStorage');
    } catch (error) {
      console.error('❌ Error clearing localStorage:', error);
    }
  };

  const createScheduledMarkers = React.useCallback((schedule: any) => {
    console.log('📅 Creating scheduled markers for schedule:', schedule);
    console.log('📅 Schedule type:', typeof schedule);
    console.log('📅 Schedule keys:', schedule ? Object.keys(schedule) : 'No schedule');
    console.log('📅 Schedule startLocation:', schedule?.startLocation);
    console.log('📅 Schedule destinationLocation:', schedule?.destinationLocation);
    console.log('📅 Schedule stops:', schedule?.stops);
    
    const newScheduledMarkers = [];
    
    // Offset distance in degrees (approximately 200-300 meters for clear separation)
    const OFFSET_DISTANCE = 0.002; // ~200 meters - much larger for clear separation
    
    // Function to calculate perpendicular offset for road-side placement
    const getPerpendicularOffset = (lat: number, lng: number, isScheduled: boolean) => {
      // For scheduled markers, offset to one side of the road
      // For real-time markers, offset to the other side of the road
      const sideMultiplier = isScheduled ? 1 : -1;
      return {
        lat: lat + (OFFSET_DISTANCE * sideMultiplier),
        lng: lng + (OFFSET_DISTANCE * sideMultiplier * 0.8) // Larger lng offset for better visual separation
      };
    };
    
    // Add starting place marker (GREEN for scheduled)
    // Check if we have location data, otherwise use stops data
    if (schedule.startLocation && schedule.startLocation.lat && schedule.startLocation.long) {
      console.log('📅 Using startLocation for starting place marker');
      console.log('📅 Start location data:', schedule.startLocation);
      const startingPlaceOffset = getPerpendicularOffset(schedule.startLocation.lat, schedule.startLocation.long, true);
      const startingPlaceMarker = {
        position: startingPlaceOffset,
        label: {
          text: `${schedule.startingPlace}\n${schedule.starttime}`,
          color: '#000000',
          fontSize: '14px',
          fontWeight: 'bold',
          className: 'marker-label-scheduled'
        },
        title: `${schedule.startingPlace} - Scheduled Start: ${schedule.starttime}`,
        icon: {
          url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
            <svg width="28" height="28" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="#16a34a"/>
              <circle cx="12" cy="9" r="3" fill="#ffffff"/>
            </svg>
          `),
          scaledSize: { width: 28, height: 28 },
          anchor: { x: 14, y: 14 }
        }
      };
      newScheduledMarkers.push(startingPlaceMarker);
      console.log('✅ Added starting place marker:', startingPlaceMarker);
    } else if (schedule.stops && schedule.stops.length > 0) {
      console.log('📅 Using first stop for starting place marker');
      const firstStop = schedule.stops[0];
      console.log('📅 First stop data:', firstStop);
      const startingPlaceOffset = getPerpendicularOffset(firstStop.lat, firstStop.long, true);
      const startingPlaceMarker = {
        position: startingPlaceOffset,
        label: {
          text: `${schedule.startingPlace}\n${schedule.starttime}`,
          color: '#000000',
          fontSize: '14px',
          fontWeight: 'bold',
          className: 'marker-label-scheduled'
        },
        title: `${schedule.startingPlace} - Scheduled Start: ${schedule.starttime}`,
        icon: {
          url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
            <svg width="28" height="28" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="#16a34a"/>
              <circle cx="12" cy="9" r="3" fill="#ffffff"/>
            </svg>
          `),
          scaledSize: { width: 28, height: 28 },
          anchor: { x: 14, y: 14 }
        }
      };
      newScheduledMarkers.push(startingPlaceMarker);
      console.log('✅ Added starting place marker from first stop:', startingPlaceMarker);
    } else {
      console.log('❌ No location data available for starting place');
    }
    
    // Add destination marker (GREEN for scheduled)
    if (schedule.destinationLocation && schedule.destinationLocation.lat && schedule.destinationLocation.long) {
      console.log('📅 Using destinationLocation for destination marker');
      const destinationOffset = getPerpendicularOffset(schedule.destinationLocation.lat, schedule.destinationLocation.long, true);
      const destinationMarker = {
        position: destinationOffset,
        label: {
          text: `${schedule.destination}\n${schedule.endtime}`,
          color: '#000000',
          fontSize: '14px',
          fontWeight: 'bold',
          className: 'marker-label-scheduled'
        },
        title: `${schedule.destination} - Scheduled Arrival: ${schedule.endtime}`,
        icon: {
          url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
            <svg width="28" height="28" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="#16a34a"/>
              <circle cx="12" cy="9" r="3" fill="#ffffff"/>
            </svg>
          `),
          scaledSize: { width: 28, height: 28 },
          anchor: { x: 14, y: 14 }
        }
      };
      newScheduledMarkers.push(destinationMarker);
    } else if (schedule.stops && schedule.stops.length > 0) {
      console.log('📅 Using last stop for destination marker');
      const lastStop = schedule.stops[schedule.stops.length - 1];
      const destinationOffset = getPerpendicularOffset(lastStop.lat, lastStop.long, true);
      const destinationMarker = {
        position: destinationOffset,
        label: {
          text: `${schedule.destination}\n${schedule.endtime}`,
          color: '#000000',
          fontSize: '14px',
          fontWeight: 'bold',
          className: 'marker-label-scheduled'
        },
        title: `${schedule.destination} - Scheduled Arrival: ${schedule.endtime}`,
        icon: {
          url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
            <svg width="28" height="28" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="#16a34a"/>
              <circle cx="12" cy="9" r="3" fill="#ffffff"/>
            </svg>
          `),
          scaledSize: { width: 28, height: 28 },
          anchor: { x: 14, y: 14 }
        }
      };
      newScheduledMarkers.push(destinationMarker);
    } else {
      console.log('❌ No location data available for destination');
    }
    
    // Add middle station markers (GREEN for scheduled)
    if (schedule.stops && Array.isArray(schedule.stops)) {
      console.log('📅 Processing middle stations:', schedule.stops.length);
      schedule.stops.forEach((stop: any, index: number) => {
        console.log(`📅 Processing stop ${index}:`, stop);
        if (stop && stop.lat && stop.long && stop.name) {
          const scheduledTime = stop.time ? formatTime(stop.time) : 'N/A';
          const stationOffset = getPerpendicularOffset(stop.lat, stop.long, true);
          const marker = {
            position: stationOffset,
            label: {
              text: `${stop.name}\n${scheduledTime}`,
              color: '#000000',
              fontSize: '14px',
              fontWeight: 'bold',
              className: 'marker-label-scheduled'
            },
            title: `${stop.name} - Scheduled: ${scheduledTime}`,
            icon: {
              url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                <svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="#16a34a"/>
                  <circle cx="12" cy="9" r="2" fill="#ffffff"/>
                </svg>
              `),
          scaledSize: { width: 24, height: 24 },
          anchor: { x: 12, y: 12 }
            }
          };
          newScheduledMarkers.push(marker);
          console.log(`✅ Added scheduled marker for stop ${index}:`, stop.name);
        } else {
          console.log(`❌ Invalid stop data ${index}:`, stop);
        }
      });
    } else {
      console.log('❌ No stops found or invalid stops data');
    }
    
    console.log('📅 Created scheduled markers:', newScheduledMarkers.length);
    console.log('📅 Scheduled markers details:', newScheduledMarkers);
    
    setScheduledMarkers(newScheduledMarkers);
  }, []);

  const createMarkers = React.useCallback((activeBusDoc: ActiveBusDoc, schedule?: any) => {
    console.log('🎯 Creating markers for activeBusDoc:', activeBusDoc);
    console.log('🎯 Middle stations:', activeBusDoc.middlestations);
    console.log('🎯 Current location:', activeBusDoc.currLat, activeBusDoc.currLong);
    console.log('🎯 Schedule provided:', schedule);
    
    const newMarkers = [];
    
    // Helper function to find scheduled time for a station
    const findScheduledTime = (stationName: string) => {
      if (!schedule || !schedule.stops) return null;
      
      // Check middle stations
      const middleStation = schedule.stops.find((stop: any) => 
        stop.name && stop.name.toLowerCase().includes(stationName.toLowerCase())
      );
      if (middleStation && middleStation.time) {
        return formatTime(middleStation.time);
      }
      
      // Check starting place
      if (schedule.startingPlace && schedule.startingPlace.toLowerCase().includes(stationName.toLowerCase())) {
        return schedule.starttime;
      }
      
      // Check destination
      if (schedule.destination && schedule.destination.toLowerCase().includes(stationName.toLowerCase())) {
        return schedule.endtime;
      }
      
      return null;
    };
    
    // Offset distance in degrees (approximately 200-300 meters for clear separation)
    const OFFSET_DISTANCE = 0.002; // ~200 meters - much larger for clear separation
    
    // Function to calculate perpendicular offset for road-side placement
    const getPerpendicularOffset = (lat: number, lng: number, isScheduled: boolean) => {
      // For scheduled markers, offset to one side of the road
      // For real-time markers, offset to the other side of the road
      const sideMultiplier = isScheduled ? 1 : -1;
      return {
        lat: lat + (OFFSET_DISTANCE * sideMultiplier),
        lng: lng + (OFFSET_DISTANCE * sideMultiplier * 0.8) // Larger lng offset for better visual separation
      };
    };
    
    // Add starting place marker (COMBINED)
    if (activeBusDoc.startingPlaceLocation && activeBusDoc.startingPlaceLocation.lat && activeBusDoc.startingPlaceLocation.long) {
      console.log('🎯 Adding starting place marker');
      const startingPlaceOffset = getPerpendicularOffset(activeBusDoc.startingPlaceLocation.lat, activeBusDoc.startingPlaceLocation.long, false);
      const scheduledTime = findScheduledTime(activeBusDoc.startingPlace);
      const realTime = 'N/A'; // Start time not available in real-time data
      
      const labelText = scheduledTime 
        ? `${activeBusDoc.startingPlace}\n🟢 ${scheduledTime} | 🔴 ${realTime}`
        : `${activeBusDoc.startingPlace}\n🔴 ${realTime}`;
      
      const startingPlaceMarker = {
        position: startingPlaceOffset,
        label: {
          text: labelText,
          color: '#000000',
          fontSize: '14px',
          fontWeight: 'bold',
          className: 'marker-label-combined'
        },
        title: `${activeBusDoc.startingPlace} - Starting Point`,
        type: 'combined' as const,
        icon: {
          url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
            <svg width="32" height="32" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="#dc2626"/>
              <circle cx="12" cy="9" r="3" fill="#ffffff"/>
            </svg>
          `),
          scaledSize: { width: 32, height: 32 },
          anchor: { x: 16, y: 16 }
        }
      };
      newMarkers.push(startingPlaceMarker);
      console.log('✅ Added starting place marker:', startingPlaceMarker);
    } else {
      console.log('❌ No starting place location data available');
    }
    
    // Add destination marker (COMBINED)
    if (activeBusDoc.destinationLocation && activeBusDoc.destinationLocation.lat && activeBusDoc.destinationLocation.long) {
      console.log('🎯 Adding destination marker');
      const destinationOffset = getPerpendicularOffset(activeBusDoc.destinationLocation.lat, activeBusDoc.destinationLocation.long, false);
      const scheduledTime = findScheduledTime(activeBusDoc.destination);
      const realTime = activeBusDoc.endtime || 'N/A';
      
      const labelText = scheduledTime 
        ? `${activeBusDoc.destination}\n🟢 ${scheduledTime} | 🔴 ${realTime}`
        : `${activeBusDoc.destination}\n🔴 ${realTime}`;
      
      const destinationMarker = {
        position: destinationOffset,
        label: {
          text: labelText,
          color: '#000000',
          fontSize: '14px',
          fontWeight: 'bold',
          className: 'marker-label-combined'
        },
        title: `${activeBusDoc.destination} - Arrival: ${realTime}`,
        type: 'combined' as const,
        icon: {
          url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
            <svg width="32" height="32" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="#dc2626"/>
              <circle cx="12" cy="9" r="3" fill="#ffffff"/>
            </svg>
          `),
          scaledSize: { width: 32, height: 32 },
          anchor: { x: 16, y: 16 }
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
          const stationOffset = getPerpendicularOffset(station.lat, station.long, false);
          const scheduledTime = findScheduledTime(station.name);
          const realTime = station.time || 'N/A';
          
          const labelText = scheduledTime 
            ? `${station.name}\n🟢 ${scheduledTime} | 🔴 ${realTime}`
            : `${station.name}\n🔴 ${realTime}`;
          
          const marker = {
            position: stationOffset,
            label: {
              text: labelText,
              color: '#000000',
              fontSize: '14px',
              fontWeight: 'bold',
              className: 'marker-label-combined'
            },
            title: `${station.name} - Arrival: ${realTime}`,
            type: 'combined' as const,
            icon: {
              url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                <svg width="32" height="32" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="#2563eb"/>
                  <circle cx="12" cy="9" r="3" fill="#ffffff"/>
                </svg>
              `),
          scaledSize: { width: 32, height: 32 },
          anchor: { x: 16, y: 16 }
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
        type: 'current' as const,
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
          scaledSize: { width: 48, height: 48 },
          anchor: { x: 12, y: 24 }
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
    
    // Calculate speed if we have previous location
    let speed = null;
    const currentLoc = {
      lat: activeBusDoc.currLat,
      lng: activeBusDoc.currLong
    };

    // Try to get last location from localStorage
    try {
      const storedData = localStorage.getItem('busTrackingData');
      if (storedData) {
        const markerData = JSON.parse(storedData);
        if (markerData.currentLocation && markerData.currentLocation.lat && markerData.currentLocation.lng) {
          const lastLoc = markerData.currentLocation;
          speed = calculateSpeed(
            activeBusDoc.currLat, 
            activeBusDoc.currLong, 
            lastLoc.lat, 
            lastLoc.lng
          );
          console.log('🚀 Calculated speed:', speed, 'km/h');
        }
      }
    } catch (error) {
      console.error('❌ Error calculating speed:', error);
    }

    setCurrentSpeed(speed);
    
    // Save marker data to localStorage for persistence
    saveMarkerDataToStorage(activeBusDoc, polyline || '', newMarkers, currentLoc, currentLoc, speed);
  }, []);

  const startTracking = React.useCallback((busNumberPlate: string, schedule?: any) => {
    try {
      setError(null);
      
      console.log('🚀 Starting tracking for bus:', busNumberPlate);
      console.log('📅 Schedule provided:', schedule);
      console.log('📅 Schedule type:', typeof schedule);
      
      // Schedule will be used in combined markers when real-time data arrives
      if (schedule) {
        console.log('📅 Schedule provided, will be used in combined markers');
      } else {
        console.log('❌ No schedule provided for combined markers');
      }
      
      // Test marker removed - scheduled markers should be displayed instead
      
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
          
          console.log('🎯 Creating combined markers for:', data.activeBus.middlestations?.length || 0, 'stations');
          createMarkers(data.activeBus, schedule);
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
    
    // Clear localStorage
    clearMarkerDataFromStorage();
    
    setIsTracking(false);
    setActiveBus(null);
    setPolyline(null);
    setCurrentLocation(null);
    setMarkers([]);
    setScheduledMarkers([]);
    setError(null);
    setBusStatus('unknown');
  }, []);

  // Restore data from localStorage on component mount
  useEffect(() => {
    const restored = restoreMarkerDataFromStorage();
    if (restored) {
      console.log('🔄 Restored markers from localStorage on mount');
    }
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
    scheduledMarkers,
    startTracking,
    stopTracking,
    error,
    busStatus,
    currentSpeed
  };
};
