import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Bus, Clock, MapPin, Calendar, Loader2, Navigation } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface BusSchedule {
  _id: string;
  busNumberPlate: string;
  busName: string;
  starttime: string;
  endtime: string;
  startingPlace: string;
  destination: string;
  stops: Array<{
    name: string;
    time: string;
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
  isactive: boolean;
}

interface BusListResponse {
  success: boolean;
  totalSchedules: number;
  totalBuses: number;
  activeSchedules: number;
  inactiveSchedules: number;
  schedules: BusSchedule[];
}

const CustomerBusListPage = () => {
  const navigate = useNavigate();
  const [schedules, setSchedules] = useState<BusSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAllSchedules();
  }, []);

  const fetchAllSchedules = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('http://localhost:3002/api/passenger/all-schedules');
      const data: BusListResponse = await response.json();
      
      if (data.success) {
        setSchedules(data.schedules);
        console.log('✅ Fetched schedules:', data);
      } else {
        setError('Failed to fetch bus schedules');
      }
    } catch (error) {
      console.error('❌ Error fetching schedules:', error);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleTrackBus = (schedule: BusSchedule) => {
    // Navigate to bus tracking page with schedule details
    navigate('/bus-tracking', {
      state: {
        schedule,
        busDetails: {
          busNumberPlate: schedule.busNumberPlate,
          busName: schedule.busName,
          startingPlace: schedule.startingPlace,
          destination: schedule.destination
        }
      }
    });
  };

  const formatTime = (time: string) => {
    // Convert 24-hour format to 12-hour format
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const getDaysString = (days: string[]) => {
    if (days.length === 7) return 'Daily';
    if (days.length === 5 && !days.includes('Saturday') && !days.includes('Sunday')) return 'Weekdays';
    if (days.length === 2 && days.includes('Saturday') && days.includes('Sunday')) return 'Weekends';
    return days.join(', ');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-indigo-100">
      {/* Header */}
      <header className="bg-gradient-to-r from-white via-blue-50 to-cyan-50 backdrop-blur-md shadow-lg border-b border-blue-200">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <Button 
              variant="outline" 
              size="lg" 
              onClick={() => navigate('/customer-portal')}
              className="px-6 py-3"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back to Customer Portal
            </Button>
            
            {/* Center - Government of Punjab */}
            <div className="flex items-center gap-3">
              {/* Punjab Government Official Logo */}
              <div className="w-24 h-24 flex items-center justify-center">
                <img 
                  src="https://observenow.com/wp-content/uploads/2024/04/1706080895-6787-pb.png" 
                  alt="Government of Punjab Logo" 
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    console.log('Logo failed to load, using fallback');
                    e.currentTarget.style.display = 'none';
                  }}
                />
                {/* Fallback logo if image fails to load */}
                <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center" style={{display: 'none'}}>
                  <span className="text-white font-bold text-2xl">P</span>
                </div>
              </div>
              <div className="text-center">
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 via-cyan-600 to-indigo-600 bg-clip-text text-transparent">PUNJAB TRANSPORT</h1>
                <p className="text-sm text-gray-600 font-medium">All Buses</p>
              </div>
              {/* PUNBUS Logo */}
              <div className="w-24 h-24 flex items-center justify-center">
                <img 
                  src="https://upload.wikimedia.org/wikipedia/commons/d/da/Logo_of_PUNBUS.svg" 
                  alt="PUNBUS Logo" 
                  className="w-full h-full object-contain rounded-xl shadow-lg border-2 border-blue-200"
                  onError={(e) => {
                    console.log('PUNBUS logo failed to load, using fallback');
                    e.currentTarget.style.display = 'none';
                  }}
                />
                {/* Fallback icon if image fails to load */}
                <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-xl flex items-center justify-center border-2 border-blue-200 shadow-lg" style={{display: 'none'}}>
                  <MapPin className="w-12 h-12 text-blue-600" />
                </div>
              </div>
            </div>
            
            {/* Right Side - Spacer for balance */}
            <div className="w-32"></div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto">
          {/* Page Title */}
          <div className="text-center mb-8">
            <h2 className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-cyan-600 to-indigo-600 bg-clip-text text-transparent mb-2">
              All Bus Schedules
            </h2>
            <p className="text-xl text-gray-600">
              View all available bus routes and schedules
            </p>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="flex justify-center items-center py-12">
              <div className="text-center">
                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
                <p className="text-gray-600">Loading bus schedules...</p>
              </div>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="text-center py-12">
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg max-w-md mx-auto">
                {error}
              </div>
              <Button 
                onClick={fetchAllSchedules}
                className="mt-4"
                variant="outline"
              >
                Try Again
              </Button>
            </div>
          )}

          {/* Bus Schedules Grid */}
          {!loading && !error && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {schedules.map((schedule) => (
                <Card key={schedule._id} className="shadow-lg border-0 bg-white/80 backdrop-blur-sm hover:shadow-xl transition-all duration-300">
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg font-bold text-gray-800 flex items-center gap-2">
                          <Bus className="w-5 h-5 text-blue-600" />
                          {schedule.busName}
                        </CardTitle>
                        <CardDescription className="text-sm text-gray-600 mt-1">
                          {schedule.busNumberPlate}
                        </CardDescription>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        schedule.isactive 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {schedule.isactive ? 'Active' : 'Inactive'}
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    {/* Route Information */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin className="w-4 h-4 text-blue-600" />
                        <span className="font-medium">Route:</span>
                        <span className="text-gray-600">
                          {schedule.startingPlace} → {schedule.destination}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="w-4 h-4 text-blue-600" />
                        <span className="font-medium">Timing:</span>
                        <span className="text-gray-600">
                          {formatTime(schedule.starttime)} - {formatTime(schedule.endtime)}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="w-4 h-4 text-blue-600" />
                        <span className="font-medium">Days:</span>
                        <span className="text-gray-600">
                          {getDaysString(schedule.days)}
                        </span>
                      </div>
                    </div>

                    {/* Stops Count */}
                    <div className="text-sm text-gray-600">
                      <span className="font-medium">Stops:</span> {schedule.stops.length} intermediate stops
                    </div>

                    {/* Action Button */}
                    <div className="pt-4 border-t border-gray-200">
                      {schedule.isactive ? (
                        <Button 
                          onClick={() => handleTrackBus(schedule)}
                          className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white"
                        >
                          <Navigation className="w-4 h-4 mr-2" />
                          Track Bus
                        </Button>
                      ) : (
                        <div className="w-full py-2 px-4 bg-gray-100 text-gray-600 rounded-lg text-center text-sm font-medium">
                          Schedule Only
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* No Schedules Found */}
          {!loading && !error && schedules.length === 0 && (
            <div className="text-center py-12">
              <Bus className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">No Bus Schedules Found</h3>
              <p className="text-gray-500">There are currently no bus schedules available.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default CustomerBusListPage;
