import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Clock, Route, Wifi, Gauge } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import BusTrackingMap from '@/components/BusTrackingMap';
import { useBusTracking } from '@/hooks/useBusTracking';

const BusTrackingPage: React.FC = () => {
  const { busNumberPlate } = useParams<{ busNumberPlate: string }>();
  const navigate = useNavigate();
  
  // Helper function to filter middle stations only
  const getMiddleStations = () => {
    if (!busDetails) return [];
    
    return markers.filter(marker => {
      if (typeof marker.label !== 'object') return false;
      const markerText = marker.label.text;
      const stationName = markerText.split('\n')[0].trim(); // Get just the station name
      
      console.log('🔍 Checking marker:', stationName);
      console.log('🔍 Starting place:', busDetails.startingPlace);
      console.log('🔍 Destination:', busDetails.destination);
      console.log('🔍 Marker type:', marker.type);
      
      // Filter out bus icon and check if it's a middle station
      return markerText !== '🚌' && 
             marker.type === 'combined' &&
             stationName !== busDetails.startingPlace && 
             stationName !== busDetails.destination;
    });
  };
  const [busDetails, setBusDetails] = useState<{
    busName: string;
    busNumberPlate: string;
    startingPlace: string;
    destination: string;
    schedule?: {
      _id: string;
      starttime: string;
      endtime: string;
      startingPlace: string;
      destination: string;
      stops: Array<{
        name: string;
        lat: number;
        long: number;
        time: number;
      }>;
      days: string[];
      startLocation: {
        lat: number;
        long: number;
      };
      destinationLocation: {
        lat: number;
        long: number;
      };
    };
  } | null>(null);

  const {
    isTracking,
    markers,
    scheduledMarkers,
    polyline,
    currentLocation,
    busStatus,
    startTracking,
    stopTracking,
    currentSpeed
  } = useBusTracking();

  useEffect(() => {
    if (busNumberPlate) {
      // Extract bus details from localStorage or API
      const storedBusDetails = localStorage.getItem(`busDetails_${busNumberPlate}`);
      if (storedBusDetails) {
        const parsedDetails = JSON.parse(storedBusDetails);
        setBusDetails(parsedDetails);
        
        // Start tracking with schedule if available
        startTracking(busNumberPlate, parsedDetails.schedule);
      }
    }

    return () => {
      // Cleanup when component unmounts
      stopTracking();
    };
  }, [busNumberPlate, startTracking, stopTracking]);

  const handleBack = () => {
    stopTracking();
    navigate(-1); // Go back to previous page
  };

  const handleStopTracking = () => {
    stopTracking();
    navigate(-1); // Go back to previous page
  };

  if (!busDetails) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <div className="text-gray-600">Loading bus details...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-300">
      {/* Add custom styles for marker labels */}
      <style>{`
        .marker-label-scheduled {
          transform: translate(-50%, -120%) !important;
          background: rgba(255, 255, 255, 0.9) !important;
          padding: 4px 8px !important;
          border-radius: 4px !important;
          border: 2px solid #16a34a !important;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2) !important;
          white-space: nowrap !important;
          font-size: 12px !important;
          font-weight: bold !important;
          color: #000000 !important;
        }
        .marker-label-realtime {
          transform: translate(-50%, 20%) !important;
          background: rgba(255, 255, 255, 0.9) !important;
          padding: 4px 8px !important;
          border-radius: 4px !important;
          border: 2px solid #2563eb !important;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2) !important;
          white-space: nowrap !important;
          font-size: 12px !important;
          font-weight: bold !important;
          color: #000000 !important;
        }
        .marker-label-combined {
          transform: translate(-50%, -50%) !important;
          background: #ffffff !important;
          color: #000000 !important;
          padding: 8px 12px !important;
          border-radius: 8px !important;
          box-shadow: 0 4px 12px rgba(0,0,0,0.3) !important;
          white-space: nowrap !important;
          font-size: 13px !important;
          font-weight: bold !important;
          text-align: center !important;
          min-width: 120px !important;
          max-width: 300px !important;
          width: fit-content !important;
          border: 2px solid #000000 !important;
        }
      `}</style>
      
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBack}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back</span>
              </Button>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  Tracking Bus: {busDetails.busName} (#{busDetails.busNumberPlate})
                </h1>
                <p className="text-sm text-gray-500">
                  Real-time tracking of bus location and route information
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Badge variant="outline" className="flex items-center space-x-1 border-green-200 text-green-700 bg-green-50">
                <Wifi className="h-3 w-3" />
                <span>Live</span>
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Map Section - Large at top */}
        <div className="mb-6">
          <Card className="bg-gray-50 border-gray-200 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center space-x-2 text-gray-800">
                <MapPin className="h-5 w-5 text-blue-600" />
                <span>Live Map</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="relative">
            <BusTrackingMap
              markers={markers}
              scheduledMarkers={scheduledMarkers}
              polyline={polyline}
              currentLocation={currentLocation}
              isTracking={isTracking}
            />
                {isTracking && (
                  <div className="absolute top-4 left-4">
                    <Badge className="bg-green-500 text-white flex items-center space-x-1">
                      <Wifi className="h-3 w-3" />
                      <span>Live Tracking</span>
                    </Badge>
                  </div>
                )}
                
                {/* Map Legend */}
                <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg p-3 text-sm">
                  <div className="font-semibold text-gray-800 mb-2">Map Legend</div>
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full"></div>
                      <span className="text-gray-700">Combined ETAs</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                      <span className="text-gray-700">Start/End Points</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-black rounded-full"></div>
                      <span className="text-gray-700">Current Bus</span>
                    </div>
                    <div className="text-xs text-gray-500 mt-2">
                      🟢 = Estimated ETA | 🔴 = Real-time ETA
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Information Cards - Bottom section */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Current Location */}
          <Card className="bg-gray-50 border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center space-x-2 text-gray-800 text-sm">
                <MapPin className="h-4 w-4 text-blue-600" />
                <span>Current Location</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {currentLocation ? (
                <div className="space-y-2">
                  <div className="text-sm text-gray-600">
                    Lat: {currentLocation.lat.toFixed(6)}
                  </div>
                  <div className="text-sm text-gray-600">
                    Lng: {currentLocation.lng.toFixed(6)}
                  </div>
                  <div className="text-xs text-gray-500">
                    Updated in real-time
                  </div>
                </div>
              ) : (
                <div className="text-sm text-gray-500">
                  Waiting for location data...
                </div>
              )}
            </CardContent>
          </Card>

          {/* Current Speed */}
          <Card className="bg-gray-50 border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center space-x-2 text-gray-800 text-sm">
                <Gauge className="h-4 w-4 text-purple-600" />
                <span>Current Speed</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {currentSpeed !== null ? (
                <div className="space-y-2">
                  <div className="text-2xl font-bold text-purple-600">
                    {Math.round(currentSpeed)} km/h
                  </div>
                  <div className="text-xs text-gray-500">
                    Updated every 30 seconds
                  </div>
                </div>
              ) : (
                <div className="text-sm text-gray-500">
                  Calculating speed...
                </div>
              )}
            </CardContent>
          </Card>

          {/* Route Information */}
          <Card className="bg-gray-50 border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center space-x-2 text-gray-800 text-sm">
                <Route className="h-4 w-4 text-green-600" />
                <span>Route</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-2">
                <div className="text-sm">
                  <div className="flex flex-wrap items-center gap-1">
                    {/* Starting Place */}
                    <span className="font-medium text-blue-600">{busDetails.startingPlace}</span>
                    
                    {/* Middle Stations */}
                    {getMiddleStations().map((marker, index) => (
                      <React.Fragment key={index}>
                        <span className="text-gray-400">→</span>
                        <span className="font-medium text-green-600">
                          {typeof marker.label === 'object' ? marker.label.text.split('\n')[0] : marker.label}
                        </span>
                      </React.Fragment>
                    ))}
                    
                    {/* Destination */}
                    <span className="text-gray-400">→</span>
                    <span className="font-medium text-red-600">{busDetails.destination}</span>
                  </div>
                </div>
                <div className="text-xs text-gray-500">
                  {getMiddleStations().length > 0 ? `${getMiddleStations().length} stops` : 'Direct route'}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Timing Information */}
          <Card className="bg-gray-50 border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center space-x-2 text-gray-800 text-sm">
                <Clock className="h-4 w-4 text-orange-600" />
                <span>Timing</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-2">
                <div className="text-sm text-gray-600">
                  Status: {busStatus === 'active' ? 'Active' : busStatus === 'reached' ? 'Reached Destination' : 'Unknown'}
                </div>
                <div className="text-xs text-gray-500">
                  Updated in real-time
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <Card className="bg-gray-50 border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-gray-800">Actions</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {busStatus === 'reached' ? (
                <Button 
                  disabled 
                  className="w-full"
                  variant="outline"
                >
                  Bus Reached Destination
                </Button>
              ) : (
                <Button 
                  onClick={handleStopTracking}
                  variant="outline"
                  className="w-full"
                >
                  Stop Tracking
                </Button>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Route Stops Section */}
        <Card className="mt-6 bg-gray-50 border-gray-200 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-gray-800">Route Stops</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2">
              {/* Starting Place */}
              <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200 shadow-sm">
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                    1
                  </div>
                  <span className="text-sm font-medium text-blue-600">
                    {busDetails.startingPlace}
                  </span>
                </div>
              </div>
              
              {/* Middle Stations */}
              {(() => {
                const middleStations = getMiddleStations();
                console.log('🔍 All markers:', markers);
                console.log('🔍 Middle stations found:', middleStations);
                console.log('🔍 Bus details:', busDetails);
                
                // If no middle stations found, show all markers for debugging
                if (middleStations.length === 0 && markers.length > 0) {
                  console.log('⚠️ No middle stations found, showing all markers for debugging');
                  return markers.filter(marker => typeof marker.label === 'object' && marker.label.text !== '🚌').map((marker, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg border border-yellow-200 shadow-sm">
                      <div className="flex items-center space-x-3">
                        <div className="w-6 h-6 bg-yellow-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                          {index + 1}
                        </div>
                        <span className="text-sm font-medium text-yellow-700">
                          {typeof marker.label === 'object' ? marker.label.text.split('\n')[0] : marker.label}
                        </span>
                        <span className="text-xs text-yellow-600">(Debug)</span>
                      </div>
                    </div>
                  ));
                }
                
                return middleStations.map((marker, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200 shadow-sm">
                    <div className="flex items-center space-x-3">
                      <div className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                        {index + 2}
                      </div>
                      <span className="text-sm font-medium text-green-600">
                        {typeof marker.label === 'object' ? marker.label.text.split('\n')[0] : marker.label}
                      </span>
                    </div>
                  </div>
                ));
              })()}
              
              {/* Destination */}
              <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200 shadow-sm">
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                    {getMiddleStations().length + 2}
                  </div>
                  <span className="text-sm font-medium text-red-600">
                    {busDetails.destination}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default BusTrackingPage;
