import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Bus, MapPin, Clock, Route, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

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

const BusListPage: React.FC = () => {
  const navigate = useNavigate();
  const [schedules, setSchedules] = useState<BusSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<{
    totalSchedules: number;
    totalBuses: number;
    activeSchedules: number;
    inactiveSchedules: number;
  } | null>(null);

  useEffect(() => {
    fetchAllSchedules();
  }, []);

  const fetchAllSchedules = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('http://localhost:3000/api/municipality/all-schedules');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data: BusListResponse = await response.json();
      
      if (data.success) {
        setSchedules(data.schedules);
        setStats({
          totalSchedules: data.totalSchedules,
          totalBuses: data.totalBuses,
          activeSchedules: data.activeSchedules,
          inactiveSchedules: data.inactiveSchedules
        });
        console.log('✅ Fetched schedules:', data);
      } else {
        throw new Error('Failed to fetch schedules');
      }
    } catch (error) {
      console.error('❌ Error fetching schedules:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch schedules');
    } finally {
      setLoading(false);
    }
  };

  const handleTrackBus = (schedule: BusSchedule) => {
    // Store schedule data for tracking
    localStorage.setItem(`busDetails_${schedule.busNumberPlate}`, JSON.stringify({
      busName: schedule.busName,
      busNumberPlate: schedule.busNumberPlate,
      startingPlace: schedule.startingPlace,
      destination: schedule.destination,
      schedule: schedule
    }));
    
    // Navigate to tracking page
    navigate(`/track-bus/${schedule.busNumberPlate}`);
  };

  const handleBackToMunicipality = () => {
    navigate('/municipality-portal');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-gray-900"></div>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Loading bus schedules</h3>
          <p className="text-gray-500">Please wait while we fetch all bus data</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Bus className="w-8 h-8 text-red-600" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Error loading schedules</h3>
          <p className="text-gray-500 mb-4">{error}</p>
          <Button onClick={fetchAllSchedules} variant="outline">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Button
                onClick={handleBackToMunicipality}
                variant="outline"
                size="sm"
                className="flex items-center space-x-2"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Municipality</span>
              </Button>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Bus Schedules</h1>
                <p className="text-sm text-gray-500">All bus schedules and tracking</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Statistics Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Card className="bg-white border-gray-200 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Bus className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Total Buses</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.totalBuses}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border-gray-200 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <Route className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Total Schedules</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.totalSchedules}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border-gray-200 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <Eye className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Active</p>
                    <p className="text-2xl font-bold text-green-600">{stats.activeSchedules}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border-gray-200 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                    <EyeOff className="w-5 h-5 text-gray-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Inactive</p>
                    <p className="text-2xl font-bold text-gray-600">{stats.inactiveSchedules}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Bus Schedules List */}
        <div className="space-y-4">
          {schedules.map((schedule) => (
            <Card key={schedule._id} className="bg-white border-gray-200 shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Bus className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg font-semibold text-gray-900">
                        {schedule.busName}
                      </CardTitle>
                      <p className="text-sm text-gray-500">{schedule.busNumberPlate}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge 
                      variant={schedule.isactive ? "default" : "secondary"}
                      className={schedule.isactive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"}
                    >
                      {schedule.isactive ? 'Active' : 'Inactive'}
                    </Badge>
                    {schedule.isactive && (
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    )}
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="pt-0">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                  {/* Route Information */}
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Route className="w-4 h-4 text-blue-600" />
                      <span className="text-sm font-medium text-gray-700">Route</span>
                    </div>
                    <div className="text-sm">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-blue-600">{schedule.startingPlace}</span>
                        <span className="text-gray-400">→</span>
                        <span className="font-medium text-red-600">{schedule.destination}</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {schedule.stops.length} stops
                      </p>
                    </div>
                  </div>

                  {/* Timing Information */}
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Clock className="w-4 h-4 text-orange-600" />
                      <span className="text-sm font-medium text-gray-700">Timing</span>
                    </div>
                    <div className="text-sm">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">{schedule.starttime}</span>
                        <span className="text-gray-400">-</span>
                        <span className="font-medium">{schedule.endtime}</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {schedule.days.join(', ')}
                      </p>
                    </div>
                  </div>

                  {/* Stops Information */}
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <MapPin className="w-4 h-4 text-green-600" />
                      <span className="text-sm font-medium text-gray-700">Stops</span>
                    </div>
                    <div className="text-sm">
                      <p className="font-medium">{schedule.stops.length} stops</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {schedule.stops.slice(0, 2).map(stop => stop.name).join(', ')}
                        {schedule.stops.length > 2 && ` +${schedule.stops.length - 2} more`}
                      </p>
                    </div>
                  </div>

                  {/* Action Button */}
                  <div className="space-y-2">
                    <span className="text-sm font-medium text-gray-700">Actions</span>
                    <div>
                      {schedule.isactive ? (
                        <Button
                          onClick={() => handleTrackBus(schedule)}
                          className="w-full bg-green-600 hover:bg-green-700 text-white"
                        >
                          Track Bus
                        </Button>
                      ) : (
                        <div className="text-sm text-gray-500 text-center py-2">
                          Schedule Only
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {schedules.length === 0 && (
          <Card className="bg-white border-gray-200 shadow-sm">
            <CardContent className="p-12 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Bus className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No schedules found</h3>
              <p className="text-gray-500">There are no bus schedules available at the moment.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default BusListPage;
