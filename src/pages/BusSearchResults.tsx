import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Bus, Clock, MapPin, Navigation, Users, Wifi } from "lucide-react";

interface BusSearchResult {
  _id: string;
  Bus_number_plate: string;
  busName: string;
  schedule: {
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
  };
  isactive: boolean;
}

const BusSearchResults = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [buses, setBuses] = useState<BusSearchResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busStatuses, setBusStatuses] = useState<Record<string, 'active' | 'reached' | 'unknown'>>({});

  // Get search parameters from location state
  const searchParams = location.state?.searchParams || {};

  useEffect(() => {
    if (location.state?.buses) {
      setBuses(location.state.buses);
      setLoading(false);
    } else {
      // If no buses passed, redirect back to search
      navigate('/customer-portal');
    }
  }, [location.state, navigate]);

  const formatTime = (timeString: string) => {
    return timeString || 'N/A';
  };

  const formatDuration = (startTime: string, endTime: string) => {
    if (!startTime || !endTime) return 'N/A';
    
    const start = new Date(`2000-01-01 ${startTime}`);
    const end = new Date(`2000-01-01 ${endTime}`);
    const diffMs = end.getTime() - start.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${diffHours}h ${diffMinutes}m`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-accent/20 to-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading search results...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-accent/20 to-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-red-600">Error</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate('/customer-portal')} className="w-full">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Search
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => navigate('/customer-portal')}
                className="text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <div className="h-6 w-px bg-gray-300"></div>
              <h1 className="text-xl font-semibold text-gray-900">Search Results</h1>
            </div>
            <div className="text-sm text-gray-500">
              {buses.length} result{buses.length !== 1 ? 's' : ''} found
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        {/* Search Summary */}
        <div className="mb-8">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center gap-6 text-sm">
              <div className="flex items-center gap-2 text-gray-600">
                <Clock className="w-4 h-4" />
                <span className="font-medium">{searchParams.day}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <MapPin className="w-4 h-4" />
                <span className="font-medium">{searchParams.startingPoint}</span>
              </div>
              <div className="text-gray-400">→</div>
              <div className="flex items-center gap-2 text-gray-600">
                <Navigation className="w-4 h-4" />
                <span className="font-medium">{searchParams.destination}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bus Results */}
        {buses.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <Bus className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No buses found</h3>
            <p className="text-gray-500 mb-6">
              We couldn't find any buses for your selected route and day.
            </p>
            <Button 
              onClick={() => navigate('/customer-portal')}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Try Different Search
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {buses.map((bus) => (
              <div 
                key={bus._id} 
                className={`bg-white rounded-lg border transition-all hover:shadow-sm ${
                  bus.isactive ? 'border-green-200 bg-green-50/30' : 'border-gray-200'
                }`}
              >
                <div className="p-6">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <Bus className="w-5 h-5 text-gray-600" />
                        <h3 className="text-lg font-semibold text-gray-900">{bus.busName}</h3>
                        <span className="text-sm text-gray-500">#{bus.Bus_number_plate}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                        bus.isactive 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {bus.isactive ? 'Active' : 'Inactive'}
                      </div>
                      {bus.isactive && (
                        <div className="flex items-center gap-1 px-2 py-1 bg-green-50 text-green-700 rounded-full text-xs">
                          <Wifi className="w-3 h-3" />
                          Live
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Route */}
                    <div>
                      <div className="text-sm font-medium text-gray-500 mb-2">Route</div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm">
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          <span className="text-gray-900">{bus.schedule.startingPlace}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span className="text-gray-900">{bus.schedule.destination}</span>
                        </div>
                      </div>
                    </div>

                    {/* Timing */}
                    <div>
                      <div className="text-sm font-medium text-gray-500 mb-2">Timing</div>
                      <div className="space-y-1">
                        <div className="text-sm text-gray-900">
                          {formatTime(bus.schedule.starttime)} - {formatTime(bus.schedule.endtime)}
                        </div>
                        <div className="text-xs text-gray-500">
                          Duration: {formatDuration(bus.schedule.starttime, bus.schedule.endtime)}
                        </div>
                      </div>
                    </div>

                    {/* Stops */}
                    <div>
                      <div className="text-sm font-medium text-gray-500 mb-2">
                        Stops ({bus.schedule.stops?.length || 0})
                      </div>
                      <div className="text-sm text-gray-600">
                        {bus.schedule.stops && bus.schedule.stops.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {bus.schedule.stops.map((stop, index) => (
                              <span key={index}>
                                {stop.name}
                                {index < bus.schedule.stops.length - 1 && (
                                  <span className="text-gray-400 mx-1">→</span>
                                )}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-gray-400">No stops available</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Track Button for Active Buses */}
                  {bus.isactive && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <Button 
                        className={`w-full text-white ${
                          busStatuses[bus.Bus_number_plate] === 'reached' 
                            ? 'bg-gray-400 cursor-not-allowed' 
                            : 'bg-green-600 hover:bg-green-700'
                        }`}
                        disabled={busStatuses[bus.Bus_number_plate] === 'reached'}
                        onClick={async () => {
                          if (busStatuses[bus.Bus_number_plate] !== 'reached') {
                            try {
                              // First fetch the detailed schedule
                              // Note: We need to get the schedule ID from the bus data
                              console.log('🚌 Bus data:', bus);
                              console.log('📅 Schedule data:', bus.schedule);
                              
                              // For now, let's use a placeholder schedule ID or skip the API call
                              // and use the schedule data we already have
                              const scheduleData = {
                                success: true,
                                schedule: bus.schedule
                              };
                              
                              console.log('📅 Using existing schedule data:', scheduleData.schedule);
                              
                              // Store bus details and schedule in localStorage for the tracking page
                              localStorage.setItem(`busDetails_${bus.Bus_number_plate}`, JSON.stringify({
                                busName: bus.busName,
                                busNumberPlate: bus.Bus_number_plate,
                                startingPlace: bus.schedule.startingPlace,
                                destination: bus.schedule.destination,
                                schedule: scheduleData.schedule // Store the schedule data
                              }));
                              
                              // Navigate to the tracking page
                              navigate(`/track-bus/${bus.Bus_number_plate}`);
                            } catch (error) {
                              console.error('Error processing schedule:', error);
                              // Fallback to basic tracking
                              localStorage.setItem(`busDetails_${bus.Bus_number_plate}`, JSON.stringify({
                                busName: bus.busName,
                                busNumberPlate: bus.Bus_number_plate,
                                startingPlace: bus.schedule.startingPlace,
                                destination: bus.schedule.destination
                              }));
                              navigate(`/track-bus/${bus.Bus_number_plate}`);
                            }
                          }
                        }}
                      >
                        <Navigation className="w-4 h-4 mr-2" />
                        {busStatuses[bus.Bus_number_plate] === 'reached' ? 'Bus Reached Destination' : 'Track Bus'}
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

      </main>
    </div>
  );
};

export default BusSearchResults;
