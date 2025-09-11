import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, AlertTriangle, Bus, MapPin, Clock, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface EmergencyAlert {
  id: string;
  type: string;
  message: string;
  busNumberPlate: string;
  startingPlace: string;
  originalDestination: string;
  currentDestination: string;
  timestamp: string;
  driverId: string;
  driverName: string;
}

const EmergenciesPage = () => {
  const navigate = useNavigate();
  const [emergencyAlerts, setEmergencyAlerts] = useState<EmergencyAlert[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load emergency alerts from localStorage
    const loadEmergencyAlerts = () => {
      try {
        const storedAlerts = localStorage.getItem('emergencyAlerts');
        if (storedAlerts) {
          const alerts = JSON.parse(storedAlerts);
          // Sort by timestamp (newest first)
          const sortedAlerts = alerts.sort((a: EmergencyAlert, b: EmergencyAlert) => 
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
          );
          setEmergencyAlerts(sortedAlerts);
        }
      } catch (error) {
        console.error('Error loading emergency alerts:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadEmergencyAlerts();
  }, []);

  const clearAllEmergencies = () => {
    localStorage.removeItem('emergencyAlerts');
    setEmergencyAlerts([]);
  };

  const clearEmergency = (alertId: string) => {
    const updatedAlerts = emergencyAlerts.filter(alert => alert.id !== alertId);
    setEmergencyAlerts(updatedAlerts);
    localStorage.setItem('emergencyAlerts', JSON.stringify(updatedAlerts));
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return {
      time: date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
      }),
      date: date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    };
  };

  const isRecentEmergency = (timestamp: string) => {
    const alertTime = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - alertTime.getTime()) / (1000 * 60 * 60);
    return diffInHours < 24; // Consider recent if within 24 hours
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50/30 to-white">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading emergency alerts...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50/30 to-white">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-200/50 shadow-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                onClick={() => navigate('/municipality-portal')}
                className="hover:bg-gray-50/80 rounded-xl"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Municipality Portal
              </Button>
              <div className="h-6 w-px bg-gray-300"></div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                  <AlertTriangle className="w-4 h-4 text-red-600" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">Recent Emergencies</h1>
                  <p className="text-sm text-gray-600">Emergency alerts and SOS notifications</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="destructive" className="px-3 py-1">
                {emergencyAlerts.length} Active
              </Badge>
              {emergencyAlerts.length > 0 && (
                <Button
                  variant="outline"
                  onClick={clearAllEmergencies}
                  className="text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300"
                >
                  Clear All
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {emergencyAlerts.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Emergency Alerts</h3>
            <p className="text-gray-600">No emergency alerts have been received yet.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Live Status Indicator */}
            <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-red-800">
                Live Emergency Monitoring Active
              </span>
            </div>

            {/* Emergency Alerts Grid */}
            <div className="grid gap-6">
              {emergencyAlerts.map((alert) => {
                const { time, date } = formatTimestamp(alert.timestamp);
                const isRecent = isRecentEmergency(alert.timestamp);
                
                return (
                  <Card 
                    key={alert.id} 
                    className="bg-white rounded-xl border border-gray-200 hover:border-red-200 hover:shadow-lg hover:shadow-red-100 transition-all duration-300 ease-in-out transform hover:-translate-y-1 hover:scale-[1.02] cursor-pointer group"
                  >
                    <CardHeader className="pb-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center group-hover:bg-red-200 transition-colors duration-300">
                            <AlertTriangle className="w-5 h-5 text-red-600 group-hover:text-red-700 transition-colors duration-300" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="text-lg font-semibold text-gray-900 group-hover:text-red-900 transition-colors duration-300">
                                Emergency Alert
                              </h3>
                              {isRecent && (
                                <Badge variant="destructive" className="text-xs px-2 py-0.5 group-hover:bg-red-600 transition-colors duration-300">
                                  NEW
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-gray-500 group-hover:text-red-500 transition-colors duration-300">
                              {time} • {date}
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => clearEmergency(alert.id)}
                          className="text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                        >
                          ×
                        </Button>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="space-y-4">
                      {/* Emergency Message */}
                      <div className="p-4 bg-red-50 rounded-lg border border-red-100 group-hover:bg-red-100 transition-colors duration-300">
                        <p className="text-red-800 font-medium group-hover:text-red-900 transition-colors duration-300">
                          {alert.message}
                        </p>
                      </div>

                      {/* Bus Information */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg group-hover:bg-blue-50 transition-colors duration-300">
                          <Bus className="w-4 h-4 text-gray-600 group-hover:text-blue-600 transition-colors duration-300" />
                          <div>
                            <p className="text-xs text-gray-500 uppercase tracking-wide group-hover:text-blue-500 transition-colors duration-300">Bus Number</p>
                            <p className="font-medium text-gray-900 group-hover:text-blue-900 transition-colors duration-300">{alert.busNumberPlate}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg group-hover:bg-green-50 transition-colors duration-300">
                          <User className="w-4 h-4 text-gray-600 group-hover:text-green-600 transition-colors duration-300" />
                          <div>
                            <p className="text-xs text-gray-500 uppercase tracking-wide group-hover:text-green-500 transition-colors duration-300">Driver</p>
                            <p className="font-medium text-gray-900 group-hover:text-green-900 transition-colors duration-300">{alert.driverName}</p>
                          </div>
                        </div>
                      </div>

                      {/* Route Information */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg group-hover:bg-purple-50 transition-colors duration-300">
                          <MapPin className="w-4 h-4 text-gray-600 group-hover:text-purple-600 transition-colors duration-300" />
                          <div>
                            <p className="text-xs text-gray-500 uppercase tracking-wide group-hover:text-purple-500 transition-colors duration-300">From</p>
                            <p className="font-medium text-gray-900 group-hover:text-purple-900 transition-colors duration-300">{alert.startingPlace}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg group-hover:bg-orange-50 transition-colors duration-300">
                          <MapPin className="w-4 h-4 text-gray-600 group-hover:text-orange-600 transition-colors duration-300" />
                          <div>
                            <p className="text-xs text-gray-500 uppercase tracking-wide group-hover:text-orange-500 transition-colors duration-300">To</p>
                            <p className="font-medium text-gray-900 group-hover:text-orange-900 transition-colors duration-300">{alert.originalDestination}</p>
                          </div>
                        </div>
                      </div>

                      {/* Status Information */}
                      <div className="border-t border-gray-100 pt-4 group-hover:border-red-200 transition-colors duration-300">
                        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg group-hover:bg-red-50 transition-colors duration-300">
                          <Clock className="w-4 h-4 text-gray-600 group-hover:text-red-600 transition-colors duration-300" />
                          <div>
                            <p className="text-xs text-gray-500 uppercase tracking-wide group-hover:text-red-500 transition-colors duration-300">Current Status</p>
                            <p className="font-medium text-gray-900 group-hover:text-red-900 transition-colors duration-300">
                              Bus is stuck - {alert.currentDestination}
                            </p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmergenciesPage;
