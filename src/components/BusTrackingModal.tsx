import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, MapPin, Clock, Navigation, Wifi } from 'lucide-react';
import BusTrackingMap from './BusTrackingMap';
import { useBusTracking } from '@/hooks/useBusTracking';

interface BusTrackingModalProps {
  isOpen: boolean;
  onClose: () => void;
  busNumberPlate: string;
  busName: string;
  onBusStatusChange?: (busNumberPlate: string, status: 'active' | 'reached' | 'unknown') => void;
}

const BusTrackingModal: React.FC<BusTrackingModalProps> = ({
  isOpen,
  onClose,
  busNumberPlate,
  busName,
  onBusStatusChange
}) => {
  const {
    isTracking,
    activeBus,
    polyline,
    currentLocation,
    markers,
    startTracking,
    stopTracking,
    error,
    busStatus
  } = useBusTracking();

  React.useEffect(() => {
    if (isOpen && busNumberPlate) {
      startTracking(busNumberPlate);
    } else if (!isOpen) {
      stopTracking();
    }
  }, [isOpen, busNumberPlate]);

  // Notify parent component when bus status changes
  React.useEffect(() => {
    if (onBusStatusChange && busNumberPlate) {
      onBusStatusChange(busNumberPlate, busStatus);
    }
  }, [busStatus, busNumberPlate, onBusStatusChange]);

  const formatTime = (timeInSeconds: number): string => {
    const hours = Math.floor(timeInSeconds / 3600);
    const minutes = Math.floor((timeInSeconds % 3600) / 60);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-3">
              <Navigation className="w-5 h-5 text-blue-600" />
              Tracking Bus: {busName} (#{busNumberPlate})
            </DialogTitle>
            <DialogDescription>
              Real-time tracking of bus location and route information
            </DialogDescription>
            <div className="flex items-center gap-2">
              {isTracking && (
                <Badge className="bg-green-100 text-green-800 border-green-200">
                  <Wifi className="w-3 h-3 mr-1" />
                  Live
                </Badge>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="h-8 w-8 p-0"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Bus Reached Destination Message */}
          {busStatus === 'reached' && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                <div className="text-orange-800 font-medium">Bus Reached Destination</div>
              </div>
              <div className="text-orange-600 text-sm mt-1">
                The bus has completed its journey and reached the final destination.
              </div>
            </div>
          )}

          {/* Map */}
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <BusTrackingMap
              markers={markers}
              polyline={polyline}
              currentLocation={currentLocation}
              isTracking={isTracking}
            />
          </div>

          {/* Bus Information */}
          {activeBus && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Current Location */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <MapPin className="w-4 h-4 text-blue-600" />
                  <span className="font-medium text-sm text-gray-700">Current Location</span>
                </div>
                <div className="text-sm text-gray-900">{activeBus.address}</div>
                <div className="text-xs text-gray-500 mt-1">
                  Lat: {activeBus.currLat.toFixed(6)}, Lng: {activeBus.currLong.toFixed(6)}
                </div>
              </div>

              {/* Route */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Navigation className="w-4 h-4 text-green-600" />
                  <span className="font-medium text-sm text-gray-700">Route</span>
                </div>
                <div className="text-sm text-gray-900">
                  {activeBus.startingPlace} → {activeBus.destination}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {activeBus.middlestations.length} stops
                </div>
              </div>

              {/* Timing */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-4 h-4 text-purple-600" />
                  <span className="font-medium text-sm text-gray-700">Timing</span>
                </div>
                <div className="text-sm text-gray-900">
                  End Time: {activeBus.endtime}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Updated in real-time
                </div>
              </div>
            </div>
          )}

          {/* Stops List */}
          {activeBus && activeBus.middlestations.length > 0 && (
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="font-medium text-sm text-gray-700 mb-3">Route Stops</div>
              <div className="space-y-2">
                {activeBus.middlestations.map((stop, index) => (
                  <div key={index} className="flex items-center justify-between py-2 px-3 bg-white rounded border">
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-medium">
                        {index + 1}
                      </div>
                      <span className="text-sm font-medium text-gray-900">{stop.name}</span>
                    </div>
                    <div className="text-sm text-gray-500">
                      {stop.time || 'N/A'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              onClick={onClose}
              className="flex-1"
            >
              Close Tracking
            </Button>
            {busStatus === 'reached' ? (
              <Button
                disabled
                className="flex-1 bg-gray-400 cursor-not-allowed"
              >
                Bus Reached Destination
              </Button>
            ) : isTracking ? (
              <Button
                onClick={stopTracking}
                variant="outline"
                className="flex-1"
              >
                Stop Tracking
              </Button>
            ) : null}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BusTrackingModal;
