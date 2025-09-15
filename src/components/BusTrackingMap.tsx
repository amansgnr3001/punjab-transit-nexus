import React from 'react';
import { GoogleMap, useJsApiLoader, Marker, Polyline } from '@react-google-maps/api';
import { decode } from '@googlemaps/polyline-codec';

interface BusTrackingMapProps {
  markers: Array<{
    position: { lat: number; lng: number };
    label: string | {
      text: string;
      color: string;
      fontSize: string;
      fontWeight: string;
      className?: string;
    };
    title: string;
    type?: 'scheduled' | 'realtime' | 'current';
    icon?: {
      url: string;
      scaledSize: any;
      anchor: any;
    };
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
  polyline: string | null;
  currentLocation: { lat: number; lng: number } | null;
  isTracking: boolean;
}

const mapContainerStyle = {
  width: '100%',
  height: '600px'
};

const defaultCenter = {
  lat: 23.0225,
  lng: 72.5714
};

const BusTrackingMap: React.FC<BusTrackingMapProps> = ({
  markers,
  scheduledMarkers,
  polyline,
  currentLocation,
  isTracking
}) => {
  console.log('🗺️ BusTrackingMap props:', {
    markersCount: markers.length,
    scheduledMarkersCount: scheduledMarkers.length,
    polyline: polyline ? 'present' : 'null',
    currentLocation,
    isTracking
  });
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || 'AIzaSyAzttkphjYlfyEbUoe-5NtAVexKsOI7924',
    libraries: ['geometry', 'drawing']
  });

  console.log('🗺️ Map loading status:', { isLoaded, loadError });
  console.log('🗺️ Google Maps API Key:', import.meta.env.VITE_GOOGLE_MAPS_API_KEY || 'Using fallback key');

  if (loadError) {
    return (
      <div className="flex items-center justify-center h-96 bg-gray-100 rounded-lg">
        <div className="text-center">
          <div className="text-red-500 text-lg font-medium mb-2">Map Error</div>
          <div className="text-gray-600 mb-2">Failed to load Google Maps</div>
          <div className="text-sm text-gray-500">
            Error: {loadError.message || 'API key not activated or invalid'}
          </div>
          <div className="text-xs text-gray-400 mt-2">
            Please check your Google Maps API key configuration
          </div>
        </div>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center h-96 bg-gray-100 rounded-lg">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <div className="text-gray-600">Loading map...</div>
        </div>
      </div>
    );
  }

  // Fallback for when Google Maps API is not available
  if (loadError && loadError.message?.includes('ApiNotActivatedMapError')) {
    return (
      <div className="h-96 bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-500 text-lg font-medium mb-2">Map Preview</div>
          <div className="text-gray-400 text-sm mb-4">
            Google Maps API not activated. Showing mock data:
          </div>
          <div className="space-y-2 text-left">
            {markers.map((marker, index) => (
              <div key={index} className="bg-white p-2 rounded border text-xs">
                <div className="font-medium">{marker.label}</div>
                <div className="text-gray-500">
                  Lat: {marker.position.lat.toFixed(4)}, Lng: {marker.position.lng.toFixed(4)}
                </div>
                <div className="text-gray-400">{marker.title}</div>
              </div>
            ))}
          </div>
          {isTracking && (
            <div className="mt-4 text-green-600 text-sm font-medium">
              🚌 Live Tracking Active
            </div>
          )}
        </div>
      </div>
    );
  }

  // Calculate map center based on markers or current location
  const getMapCenter = () => {
    if (currentLocation) {
      return currentLocation;
    }
    if (markers.length > 0) {
      return markers[0].position;
    }
    return defaultCenter;
  };

  // Decode polyline for display
  const getPolylinePath = () => {
    console.log('🗺️ getPolylinePath called with polyline:', polyline ? 'Present' : 'Null');
    console.log('🗺️ Polyline length:', polyline?.length || 0);
    
    if (!polyline) {
      console.log('🗺️ No polyline data available');
      return [];
    }
    
    try {
      console.log('🗺️ Decoding polyline:', polyline.substring(0, 50) + '...');
      const decodedPath = decode(polyline);
      console.log('🗺️ Decoded polyline path:', decodedPath.length, 'points');
      return decodedPath.map(point => ({
        lat: point[0],
        lng: point[1]
      }));
    } catch (error) {
      console.error('❌ Error decoding polyline:', error);
      return [];
    }
  };

  return (
    <div className="w-full">
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={getMapCenter()}
        zoom={12}
        options={{
          streetViewControl: false,
          mapTypeControl: false,
          fullscreenControl: false,
          styles: [
            {
              featureType: "all",
              elementType: "labels.text.fill",
              stylers: [{ color: "#666666" }]
            },
            {
              featureType: "all",
              elementType: "labels.text.stroke",
              stylers: [{ color: "#ffffff" }]
            },
            {
              featureType: "road",
              elementType: "geometry",
              stylers: [{ color: "#f0f0f0" }]
            },
            {
              featureType: "road.highway",
              elementType: "geometry",
              stylers: [{ color: "#e0e0e0" }]
            },
            {
              featureType: "road.arterial",
              elementType: "geometry",
              stylers: [{ color: "#f0f0f0" }]
            },
            {
              featureType: "road.local",
              elementType: "geometry",
              stylers: [{ color: "#f8f8f8" }]
            },
            {
              featureType: "road.local",
              elementType: "labels",
              stylers: [{ visibility: "off" }]
            },
            {
              featureType: "road.arterial",
              elementType: "labels",
              stylers: [{ visibility: "off" }]
            },
            {
              featureType: "road.highway",
              elementType: "labels",
              stylers: [{ visibility: "off" }]
            },
            {
              featureType: "poi",
              stylers: [{ visibility: "off" }]
            },
            {
              featureType: "transit",
              stylers: [{ visibility: "off" }]
            },
            {
              featureType: "administrative",
              stylers: [{ visibility: "off" }]
            },
            {
              featureType: "landscape",
              elementType: "geometry",
              stylers: [{ color: "#ffffff" }]
            },
            {
              featureType: "water",
              elementType: "geometry",
              stylers: [{ color: "#e6f3ff" }]
            },
            {
              featureType: "water",
              elementType: "labels",
              stylers: [{ visibility: "simplified" }]
            }
          ]
        }}
      >
        {/* Render scheduled markers (GREEN) */}
        {scheduledMarkers.map((marker, index) => {
          console.log(`📅 Rendering scheduled marker ${index}:`, marker);
          console.log(`📅 Marker position:`, marker.position);
          console.log(`📅 Marker label:`, marker.label);
          console.log(`📅 Marker icon:`, marker.icon);
          
          return (
            <Marker
              key={`scheduled-${index}`}
              position={marker.position}
              label={marker.label}
              title={marker.title}
              icon={marker.icon}
            />
          );
        })}

        {/* Render real-time markers (BLUE/RED) */}
        {markers.map((marker, index) => {
          console.log(`🎯 Rendering real-time marker ${index}:`, marker);
          
          // Custom icon for bus location (white car with red accents)
          const isBusLocation = typeof marker.label === 'string' && marker.label === '🚌';
          const customIcon = isBusLocation ? {
            path: 'M5,6L19,6L19,18L5,18L5,6M7,8L17,8L17,16L7,16L7,8M6,10L8,10L8,14L6,14L6,10M16,10L18,10L18,14L16,14L16,10M5,18L7,20L17,20L19,18L5,18Z',
            fillColor: '#ffffff',
            fillOpacity: 1,
            strokeColor: '#ff0000',
            strokeWeight: 2,
            scale: 1.8,
            anchor: { x: 12, y: 12 }
          } : marker.icon;

          return (
            <Marker
              key={`realtime-${index}`}
              position={marker.position}
              label={marker.label}
              title={marker.title}
              icon={customIcon}
            />
          );
        })}

        {/* Render polyline if available */}
        {(() => {
          const polylinePath = getPolylinePath();
          console.log('🗺️ Rendering polyline with', polylinePath.length, 'points');
          console.log('🗺️ Polyline path sample:', polylinePath.slice(0, 3));
          
          if (polylinePath.length > 0) {
            console.log('✅ Rendering polyline component');
            return (
              <Polyline
                path={polylinePath}
                options={{
                  strokeColor: '#000000',
                  strokeOpacity: 1.0,
                  strokeWeight: 6,
                  geodesic: true
                }}
              />
            );
          } else {
            console.log('❌ Not rendering polyline - no path points');
            return null;
          }
        })()}

        {/* Show tracking status */}
        {isTracking && (
          <div className="absolute top-4 left-4 bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium">
            🚌 Live Tracking
          </div>
        )}
      </GoogleMap>
    </div>
  );
};

export default BusTrackingMap;
