import React from 'react';
import { GoogleMap, useJsApiLoader, Marker, Polyline } from '@react-google-maps/api';
import { decode } from '@googlemaps/polyline-codec';

interface BusTrackingMapProps {
  markers: Array<{
    position: { lat: number; lng: number };
    label: string;
    title: string;
  }>;
  polyline: string | null;
  currentLocation: { lat: number; lng: number } | null;
  isTracking: boolean;
}

const mapContainerStyle = {
  width: '100%',
  height: '400px'
};

const defaultCenter = {
  lat: 23.0225,
  lng: 72.5714
};

const BusTrackingMap: React.FC<BusTrackingMapProps> = ({
  markers,
  polyline,
  currentLocation,
  isTracking
}) => {
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || 'AIzaSyAzttkphjYlfyEbUoe-5NtAVexKsOI7924',
    libraries: ['geometry', 'drawing']
  });

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
          fullscreenControl: false
        }}
      >
        {/* Render markers */}
        {markers.map((marker, index) => {
          console.log(`🗺️ Rendering marker ${index}:`, marker);
          return (
            <Marker
              key={index}
              position={marker.position}
              label={marker.label}
              title={marker.title}
            />
          );
        })}

        {/* Render polyline if available */}
        {(() => {
          const polylinePath = getPolylinePath();
          console.log('🗺️ Rendering polyline with', polylinePath.length, 'points');
          return polylinePath.length > 0 && (
            <Polyline
              path={polylinePath}
              options={{
                strokeColor: '#3B82F6',
                strokeOpacity: 1.0,
                strokeWeight: 4,
                geodesic: true
              }}
            />
          );
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
