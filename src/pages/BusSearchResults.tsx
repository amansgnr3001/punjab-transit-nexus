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

interface MultiHopRoute {
  middleStation: string;
  totalETA: number;
  firstLeg: BusSearchResult[];
  secondLeg: BusSearchResult[];
}

interface BusSearchResponse {
  success: boolean;
  message: string;
  buses: BusSearchResult[];
  routeType: 'direct' | 'multi-hop' | 'none';
  multiHopRoute?: MultiHopRoute;
}

const BusSearchResults = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchResponse, setSearchResponse] = useState<BusSearchResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busStatuses, setBusStatuses] = useState<Record<string, 'active' | 'reached' | 'unknown'>>({});

  // Get search parameters from location state
  const searchParams = location.state?.searchParams || {};

  useEffect(() => {
    if (location.state?.searchResponse) {
      setSearchResponse(location.state.searchResponse);
      setLoading(false);
    } else {
      // If no search response passed, redirect back to search
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

  const formatETA = (etaSeconds: number) => {
    const hours = Math.floor(etaSeconds / 3600);
    const minutes = Math.floor((etaSeconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  };

  // Get all buses from the search response
  const getAllBuses = (): BusSearchResult[] => {
    if (!searchResponse) return [];
    
    if (searchResponse.routeType === 'direct') {
      return searchResponse.buses;
    } else if (searchResponse.routeType === 'multi-hop' && searchResponse.multiHopRoute) {
      return [...searchResponse.multiHopRoute.firstLeg, ...searchResponse.multiHopRoute.secondLeg];
    }
    
    return [];
  };

  const buses = getAllBuses();

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-gray-900"></div>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Loading search results</h3>
          <p className="text-gray-500">Please wait while we find the best routes for you</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center shadow-sm max-w-md">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
              <span className="text-red-600 font-bold text-lg">!</span>
            </div>
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-3">Something went wrong</h3>
          <p className="text-gray-500 mb-8">{error}</p>
          <Button 
            onClick={() => navigate('/customer-portal')} 
            className="bg-gray-900 hover:bg-gray-800 text-white px-8 py-3 rounded-lg font-semibold"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Search
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => navigate('/customer-portal')}
                className="text-gray-600 hover:text-gray-900 hover:bg-gray-50 px-3 py-2 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Search
              </Button>
              <div className="h-8 w-px bg-gray-200"></div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Search Results</h1>
                <p className="text-sm text-gray-500 mt-1">Find your perfect bus route</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-lg font-semibold text-gray-900">{buses.length}</div>
              <div className="text-sm text-gray-500">result{buses.length !== 1 ? 's' : ''} found</div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-12">
        {/* Search Summary */}
        <div className="mb-10">
          <div className="bg-white rounded-xl border border-gray-200 p-8 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-8">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                    <Clock className="w-5 h-5 text-gray-600" />
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Travel Date</div>
                    <div className="font-semibold text-gray-900">{searchParams.day}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-gray-600" />
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">From</div>
                    <div className="font-semibold text-gray-900">{searchParams.startingPoint}</div>
                  </div>
                </div>
                <div className="text-gray-300 text-2xl">→</div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                    <Navigation className="w-5 h-5 text-gray-600" />
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">To</div>
                    <div className="font-semibold text-gray-900">{searchParams.destination}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Multi-hop Route Information */}
        {searchResponse?.routeType === 'multi-hop' && searchResponse.multiHopRoute && (
          <div className="mb-8">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200 p-8 shadow-sm">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Navigation className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Multi-hop Route Found</h2>
                  <p className="text-blue-600 font-medium">
                    Via {searchResponse.multiHopRoute.middleStation} • 
                    Total ETA: {formatETA(searchResponse.multiHopRoute.totalETA)}
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* First Leg */}
                <div className="bg-white rounded-lg p-6 border border-blue-100">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">1</div>
                    <h3 className="font-semibold text-gray-900">First Leg</h3>
                  </div>
                  <div className="space-y-2">
                    <div className="text-sm text-gray-600">
                      From <span className="font-medium text-gray-900">{searchParams.startingPoint}</span>
                    </div>
                    <div className="text-sm text-gray-600">
                      To <span className="font-medium text-gray-900">{searchResponse.multiHopRoute.middleStation}</span>
                    </div>
                    <div className="text-sm text-blue-600 font-medium">
                      {searchResponse.multiHopRoute.firstLeg.length} bus(es) available
                    </div>
                  </div>
                </div>
                
                {/* Second Leg */}
                <div className="bg-white rounded-lg p-6 border border-blue-100">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">2</div>
                    <h3 className="font-semibold text-gray-900">Second Leg</h3>
                  </div>
                  <div className="space-y-2">
                    <div className="text-sm text-gray-600">
                      From <span className="font-medium text-gray-900">{searchResponse.multiHopRoute.middleStation}</span>
                    </div>
                    <div className="text-sm text-gray-600">
                      To <span className="font-medium text-gray-900">{searchParams.destination}</span>
                    </div>
                    <div className="text-sm text-blue-600 font-medium">
                      {searchResponse.multiHopRoute.secondLeg.length} bus(es) available
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Bus Results */}
        {buses.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-16 text-center shadow-sm">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Bus className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">No buses found</h3>
            <p className="text-gray-500 mb-8 max-w-md mx-auto">
              We couldn't find any buses for your selected route and day. Try adjusting your search criteria.
            </p>
            <Button 
              onClick={() => navigate('/customer-portal')}
              className="bg-gray-900 hover:bg-gray-800 text-white px-8 py-3 rounded-lg font-semibold transition-colors"
            >
              Try Different Search
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {buses.map((bus, index) => {
              // Determine which leg this bus belongs to for multi-hop routes
              const isFirstLeg = searchResponse?.routeType === 'multi-hop' && 
                searchResponse.multiHopRoute?.firstLeg.some(b => b._id === bus._id);
              const isSecondLeg = searchResponse?.routeType === 'multi-hop' && 
                searchResponse.multiHopRoute?.secondLeg.some(b => b._id === bus._id);
              
              return (
              <div 
                key={bus._id} 
                className="bg-white rounded-xl border border-gray-200 transition-all hover:shadow-lg hover:border-gray-300 shadow-sm"
              >
                <div className="p-8">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                        <Bus className="w-6 h-6 text-gray-600" />
                      </div>
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <h3 className="text-xl font-bold text-gray-900">{bus.busName}</h3>
                          {/* Leg indicator for multi-hop routes */}
                          {isFirstLeg && (
                            <div className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full">
                              Leg 1
                            </div>
                          )}
                          {isSecondLeg && (
                            <div className="px-2 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
                              Leg 2
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-500">Bus #{bus.Bus_number_plate}</span>
                          <div className="w-1 h-1 bg-gray-300 rounded-full"></div>
                          <span className="text-sm text-gray-500">Route ID: {bus._id.slice(-6)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className={`px-3 py-1.5 rounded-full text-sm font-semibold ${
                        bus.isactive 
                          ? 'bg-gray-900 text-white' 
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {bus.isactive ? 'Active' : 'Inactive'}
                      </div>
                      {bus.isactive && (
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 text-gray-700 rounded-full text-sm font-medium">
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></div>
                          Live Tracking
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Route */}
                    <div className="bg-gray-50 rounded-lg p-6">
                      <div className="flex items-center gap-2 mb-4">
                        <MapPin className="w-5 h-5 text-gray-600" />
                        <h4 className="font-semibold text-gray-900">Route</h4>
                      </div>
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <div className="w-3 h-3 bg-gray-900 rounded-full"></div>
                          <span className="font-medium text-gray-900">{bus.schedule.startingPlace}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                          <span className="font-medium text-gray-900">{bus.schedule.destination}</span>
                        </div>
                      </div>
                    </div>

                    {/* Timing */}
                    <div className="bg-gray-50 rounded-lg p-6">
                      <div className="flex items-center gap-2 mb-4">
                        <Clock className="w-5 h-5 text-gray-600" />
                        <h4 className="font-semibold text-gray-900">Schedule</h4>
                      </div>
                      <div className="space-y-2">
                        <div className="text-lg font-bold text-gray-900">
                          {formatTime(bus.schedule.starttime)} - {formatTime(bus.schedule.endtime)}
                        </div>
                        <div className="text-sm text-gray-500">
                          Duration: {formatDuration(bus.schedule.starttime, bus.schedule.endtime)}
                        </div>
                      </div>
                    </div>

                    {/* Stops */}
                    <div className="bg-gray-50 rounded-lg p-6">
                      <div className="flex items-center gap-2 mb-4">
                        <Users className="w-5 h-5 text-gray-600" />
                        <h4 className="font-semibold text-gray-900">
                          Stops ({bus.schedule.stops?.length || 0})
                        </h4>
                      </div>
                      <div className="text-sm text-gray-600">
                        {bus.schedule.stops && bus.schedule.stops.length > 0 ? (
                          <div className="space-y-1">
                            {bus.schedule.stops.slice(0, 3).map((stop, index) => (
                              <div key={index} className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 bg-gray-400 rounded-full"></div>
                                <span className="text-gray-700">{stop.name}</span>
                              </div>
                            ))}
                            {bus.schedule.stops.length > 3 && (
                              <div className="text-gray-500 text-xs mt-2">
                                +{bus.schedule.stops.length - 3} more stops
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-400">No stops available</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Track Button - Only show for active buses */}
                  {bus.isactive ? (
                    <div className="mt-8 pt-6 border-t border-gray-200">
                      <Button 
                        className={`w-full py-4 text-lg font-semibold rounded-lg transition-all ${
                          busStatuses[bus.Bus_number_plate] === 'reached' 
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                            : 'bg-gray-900 hover:bg-gray-800 text-white hover:shadow-lg'
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
                        <Navigation className="w-5 h-5 mr-3" />
                        {busStatuses[bus.Bus_number_plate] === 'reached' ? 'Bus Reached Destination' : 'Track This Bus'}
                      </Button>
                    </div>
                  ) : (
                    <div className="mt-8 pt-6 border-t border-gray-200">
                      <div className="w-full py-4 text-lg font-semibold rounded-lg bg-gray-100 text-gray-500 text-center">
                        <Bus className="w-5 h-5 mr-3 inline" />
                        Bus Not Available for Tracking
                      </div>
                    </div>
                  )}
                </div>
              </div>
              );
            })}
          </div>
        )}

      </main>
    </div>
  );
};

export default BusSearchResults;
