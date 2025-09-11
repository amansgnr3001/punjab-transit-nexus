import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, User, LogIn, Bus, Route, Calendar, Plus, X, BarChart3, Loader2, AlertTriangle, X as CloseIcon, MessageSquare, CheckCircle, Clock, MapPin } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { io, Socket } from 'socket.io-client';
import { useComplaints } from '@/hooks/useComplaints';

const MunicipalityPortal = () => {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loginForm, setLoginForm] = useState({ name: "", password: "" });
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [activeSection, setActiveSection] = useState("dashboard");
  const [analyticsData, setAnalyticsData] = useState<{[key: string]: number}>({});
  const [isLoadingAnalytics, setIsLoadingAnalytics] = useState(false);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [emergencyAlerts, setEmergencyAlerts] = useState<Array<{
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
  }>>([]);
  const [showEmergencyAlert, setShowEmergencyAlert] = useState(false);
  const [currentEmergency, setCurrentEmergency] = useState<any>(null);
  
  // Use complaints hook to get new complaints count
  const { newComplaintsCount } = useComplaints();

  // Debug socket connection status
  useEffect(() => {
    if (socket) {
      console.log('🔍 Socket status:', socket.connected ? 'Connected' : 'Disconnected');
      console.log('🔍 Socket ID:', socket.id);
    }
  }, [socket]);
  const [busForm, setBusForm] = useState({
    Bus_number_plate: "",
    busName: "",
    schedules: [{
      starttime: "",
      endtime: "",
      startingPlace: "",
      destination: "",
      startLocation: {
        lat: 0,
        long: 0
      },
      destinationLocation: {
        lat: 0,
        long: 0
      },
      stops: [{ name: "" }],
      days: [""]
    }]
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loginForm.name && loginForm.password) {
      setIsLoggingIn(true);
      try {
        // Call login API
        const response = await fetch('http://localhost:3000/api/municipality/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: loginForm.name,
            password: loginForm.password
          })
        });

        const data = await response.json();

        if (data.success) {
      setIsLoggedIn(true);
          console.log('✅ Municipality login successful');
          
          // Initialize Socket.IO connection
          initializeSocket();
          
          // Retrieve stored emergency messages
          const storedMessages = retrieveEmergencyMessages();
          if (storedMessages.length > 0) {
            console.log('📥 Found stored emergency messages:', storedMessages.length);
            setEmergencyAlerts(storedMessages);
            
            // Show the most recent emergency if any
            if (storedMessages.length > 0) {
              setCurrentEmergency(storedMessages[0]);
              setShowEmergencyAlert(true);
              
              // Auto-hide after 10 seconds
              setTimeout(() => {
                setShowEmergencyAlert(false);
              }, 10000);
            }
          }
        } else {
          alert('Login failed: ' + data.error);
        }
      } catch (error) {
        console.error('❌ Login error:', error);
        alert('Login failed. Please try again.');
      } finally {
        setIsLoggingIn(false);
      }
    }
  };

  // localStorage functions for emergency messages
  const saveEmergencyMessage = (message: any) => {
    try {
      const storedMessages = JSON.parse(localStorage.getItem('municipality_emergency_messages') || '[]');
      const newMessage = {
        id: Date.now().toString(),
        ...message,
        storedAt: new Date().toISOString()
      };
      
      const updatedMessages = [newMessage, ...storedMessages];
      localStorage.setItem('municipality_emergency_messages', JSON.stringify(updatedMessages));
      console.log('💾 Emergency message saved to localStorage');
    } catch (error) {
      console.error('❌ Error saving emergency message to localStorage:', error);
    }
  };

  const retrieveEmergencyMessages = () => {
    try {
      const storedMessages = JSON.parse(localStorage.getItem('municipality_emergency_messages') || '[]');
      console.log('📥 Retrieved emergency messages from localStorage:', storedMessages.length);
      return storedMessages;
    } catch (error) {
      console.error('❌ Error retrieving emergency messages from localStorage:', error);
      return [];
    }
  };

  const clearEmergencyMessages = () => {
    try {
      localStorage.removeItem('municipality_emergency_messages');
      console.log('🗑️ Emergency messages cleared from localStorage');
    } catch (error) {
      console.error('❌ Error clearing emergency messages from localStorage:', error);
    }
  };

  const initializeSocket = () => {
    try {
      // Clean up existing socket if any
      if (socket) {
        console.log('🔄 Cleaning up existing socket connection...');
        socket.disconnect();
      }
      
      console.log('🔌 Initializing Socket.IO connection...');
      const newSocket = io('http://localhost:3001');
      
      newSocket.on('connect', () => {
        console.log('✅ Connected to Socket.IO server');
        console.log('🔍 Socket ID:', newSocket.id);
        
        // Subscribe to emergency room
        newSocket.emit('subscribe_emergency', {});
        console.log('🚨 Emitted subscribe_emergency event');
      });

      newSocket.on('emergency_subscribed', (data) => {
        console.log('✅ Emergency subscription confirmed:', data);
      });

      newSocket.on('emergency_alert', (data) => {
        console.log('🚨 Emergency alert received:', data);
        console.log('🔍 Current login status:', isLoggedIn);
        
        // Always save to localStorage (whether logged in or out)
        saveEmergencyMessage(data);
        
        // Add to emergency alerts list
        const alertId = Date.now().toString();
        const newAlert = {
          id: alertId,
          ...data
        };
        
        setEmergencyAlerts(prev => [newAlert, ...prev]);
        
        // Only show alert if logged in
        if (isLoggedIn) {
          console.log('📱 Municipality is logged in - showing alert');
          setCurrentEmergency(newAlert);
          setShowEmergencyAlert(true);
          
          // Auto-hide alert after 10 seconds
          setTimeout(() => {
            setShowEmergencyAlert(false);
          }, 10000);
        } else {
          console.log('📱 Municipality is logged out - message stored for later');
        }
      });

      newSocket.on('disconnect', () => {
        console.log('❌ Socket disconnected');
      });

      newSocket.on('error', (error) => {
        console.error('❌ Socket error:', error);
      });

      setSocket(newSocket);
    } catch (error) {
      console.error('❌ Socket initialization error:', error);
    }
  };

  const handleLogout = () => {
    // Don't disconnect socket - keep it connected for emergency room
    // Just hide UI and mark as logged out
    console.log('🚪 Municipality logged out - keeping socket connected for emergency room');
    
    setIsLoggedIn(false);
    setLoginForm({ name: "", password: "" });
    setActiveSection("dashboard");
    // Don't clear emergency alerts - keep them for when they log back in
    setShowEmergencyAlert(false);
    setCurrentEmergency(null);
  };


  const fetchAnalyticsData = async () => {
    setIsLoadingAnalytics(true);
    try {
      const response = await fetch('http://localhost:3000/api/municipality/bus-location-count');
      if (response.ok) {
        const data = await response.json();
        setAnalyticsData(data);
      } else {
        console.error('Failed to fetch analytics data');
      }
    } catch (error) {
      console.error('Error fetching analytics data:', error);
    } finally {
      setIsLoadingAnalytics(false);
    }
  };

  // Fetch analytics data when analytics section is selected
  useEffect(() => {
    if (activeSection === 'analytics' && isLoggedIn) {
      fetchAnalyticsData();
    }
  }, [activeSection, isLoggedIn]);

  // Cleanup socket only on component unmount (page close/refresh)
  useEffect(() => {
    return () => {
      if (socket) {
        socket.disconnect();
        console.log('🔌 Socket disconnected on component unmount (page close)');
      }
    };
  }, [socket]);

  const handleAddBus = () => {
    setActiveSection("addBus");
  };

  const handleBusFormChange = (field: string, value: any, scheduleIndex?: number, stopIndex?: number, dayIndex?: number) => {
    if (field === 'Bus_number_plate' || field === 'busName') {
      setBusForm(prev => ({ ...prev, [field]: value }));
    } else if (scheduleIndex !== undefined) {
      if (field === 'name' && stopIndex !== undefined) {
        const newSchedules = [...busForm.schedules];
        newSchedules[scheduleIndex].stops[stopIndex] = { ...newSchedules[scheduleIndex].stops[stopIndex], name: value };
        setBusForm(prev => ({ ...prev, schedules: newSchedules }));
      } else if (field === 'days' && dayIndex !== undefined) {
        const newSchedules = [...busForm.schedules];
        newSchedules[scheduleIndex].days[dayIndex] = value;
        setBusForm(prev => ({ ...prev, schedules: newSchedules }));
      } else {
        const newSchedules = [...busForm.schedules];
        newSchedules[scheduleIndex] = { ...newSchedules[scheduleIndex], [field]: value };
        setBusForm(prev => ({ ...prev, schedules: newSchedules }));
      }
    }
  };

  const addStop = (scheduleIndex: number) => {
    const newSchedules = [...busForm.schedules];
    newSchedules[scheduleIndex].stops.push({ name: "" });
    setBusForm(prev => ({ ...prev, schedules: newSchedules }));
  };

  const removeStop = (scheduleIndex: number, stopIndex: number) => {
    const newSchedules = [...busForm.schedules];
    newSchedules[scheduleIndex].stops.splice(stopIndex, 1);
    setBusForm(prev => ({ ...prev, schedules: newSchedules }));
  };

  const addDay = (scheduleIndex: number) => {
    const newSchedules = [...busForm.schedules];
    newSchedules[scheduleIndex].days.push("");
    setBusForm(prev => ({ ...prev, schedules: newSchedules }));
  };

  const removeDay = (scheduleIndex: number, dayIndex: number) => {
    const newSchedules = [...busForm.schedules];
    newSchedules[scheduleIndex].days.splice(dayIndex, 1);
    setBusForm(prev => ({ ...prev, schedules: newSchedules }));
  };

  const addSchedule = () => {
    setBusForm(prev => ({
      ...prev,
      schedules: [...prev.schedules, {
        starttime: "",
        endtime: "",
        startingPlace: "",
        destination: "",
        startLocation: {
          lat: 0,
          long: 0
        },
        destinationLocation: {
          lat: 0,
          long: 0
        },
        stops: [{ name: "" }],
        days: [""]
      }]
    }));
  };

  const removeSchedule = (scheduleIndex: number) => {
    const newSchedules = busForm.schedules.filter((_, index) => index !== scheduleIndex);
    setBusForm(prev => ({ ...prev, schedules: newSchedules }));
  };

  const updateSchedule = (scheduleIndex: number, field: string, value: string) => {
    const newSchedules = [...busForm.schedules];
    newSchedules[scheduleIndex] = { ...newSchedules[scheduleIndex], [field]: value };
    setBusForm(prev => ({ ...prev, schedules: newSchedules }));
  };

  const updateStop = (scheduleIndex: number, stopIndex: number, value: string) => {
    const newSchedules = [...busForm.schedules];
    newSchedules[scheduleIndex].stops[stopIndex] = { ...newSchedules[scheduleIndex].stops[stopIndex], name: value };
    setBusForm(prev => ({ ...prev, schedules: newSchedules }));
  };

  const updateDay = (scheduleIndex: number, dayIndex: number, value: string) => {
    const newSchedules = [...busForm.schedules];
    newSchedules[scheduleIndex].days[dayIndex] = value;
    setBusForm(prev => ({ ...prev, schedules: newSchedules }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Prepare data for submission - set lat, long, time as 0 for each stop
    const submitData = {
      ...busForm,
      schedules: busForm.schedules.map(schedule => ({
        ...schedule,
        startLocation: {
          lat: 0,
          long: 0
        },
        destinationLocation: {
          lat: 0,
          long: 0
        },
        stops: schedule.stops.map(stop => ({
          ...stop,
          lat: 0,
          long: 0,
          time: 0
        }))
      }))
    };

    try {
      const response = await fetch('http://localhost:3000/api/municipality/buses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData),
      });

      if (response.ok) {
        console.log('Bus added successfully');
        setBusForm({
          Bus_number_plate: "",
          busName: "",
          schedules: [{
            starttime: "",
            endtime: "",
            startingPlace: "",
            destination: "",
            startLocation: {
              lat: 0,
              long: 0
            },
            destinationLocation: {
              lat: 0,
              long: 0
            },
            stops: [{ name: "" }],
            days: [""]
          }]
        });
        setActiveSection("bus");
      } else {
        console.error('Failed to add bus');
      }
    } catch (error) {
      console.error('Error adding bus:', error);
    }
  };


  const sidebarItems = [
    { id: "bus", title: "Bus", icon: Bus },
    { id: "addBus", title: "Add Bus", icon: Plus },
    { id: "route", title: "Route", icon: Route },
    { id: "addRoute", title: "Add Route", icon: Plus },
    { id: "schedule", title: "Schedule", icon: Calendar },
    { id: "analytics", title: "View Analytics", icon: BarChart3 },
    { id: "complaintRegister", title: "Complaint Register", icon: MessageSquare },
    { id: "emergencies", title: "Recent Emergencies", icon: AlertTriangle },
    { id: "emergencySos", title: "Emergency SOS", icon: AlertTriangle },
  ];

  const renderDashboardContent = () => {
    switch (activeSection) {
      case "bus":
        return (
          <div>
            <div className="mb-6">
                <h3 className="text-2xl font-bold mb-2">Bus Management</h3>
                <p className="text-muted-foreground">Manage bus fleet and vehicle information.</p>
              </div>
          </div>
        );
      case "route":
        return (
          <div>
            <h3 className="text-2xl font-bold mb-4">Route Management</h3>
            <p className="text-muted-foreground">Configure and manage bus routes across Punjab.</p>
          </div>
        );
      case "addRoute":
        return (
          <div>
            <h3 className="text-2xl font-bold mb-4">Add New Route</h3>
            <p className="text-muted-foreground">Create and configure new bus routes for Punjab transportation system.</p>
            <div className="mt-6">
              <Card className="p-6">
                <CardContent>
                  <p className="text-center text-gray-500">Add Route functionality coming soon...</p>
                </CardContent>
              </Card>
            </div>
          </div>
        );
      case "schedule":
        return (
          <div>
            <h3 className="text-2xl font-bold mb-4">Schedule Management</h3>
            <p className="text-muted-foreground">Set up and modify bus schedules and timetables.</p>
          </div>
        );
      case "addBus":
        return (
          <div>
            <div className="mb-6">
              <h3 className="text-2xl font-bold mb-2">Add New Bus</h3>
              <p className="text-muted-foreground">Fill in the bus information and schedules to add a new bus to the fleet.</p>
            </div>

              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>Add New Bus</CardTitle>
                  <CardDescription>Fill in the bus information and schedules</CardDescription>
                </CardHeader>
                <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <Label htmlFor="busNumberPlate">Bus Number Plate</Label>
                        <Input
                          id="busNumberPlate"
                          value={busForm.Bus_number_plate}
                        onChange={(e) => setBusForm(prev => ({ ...prev, Bus_number_plate: e.target.value }))}
                        placeholder="e.g., PB-01-AB-1234"
                          required
                        />
                      </div>
                    <div>
                        <Label htmlFor="busName">Bus Name</Label>
                        <Input
                          id="busName"
                          value={busForm.busName}
                        onChange={(e) => setBusForm(prev => ({ ...prev, busName: e.target.value }))}
                        placeholder="e.g., City Express"
                          required
                        />
                      </div>
                    </div>

                  <div>
                    <div className="flex justify-between items-center mb-4">
                        <h4 className="text-lg font-semibold">Schedules</h4>
                        <Button type="button" onClick={addSchedule} variant="outline" size="sm">
                          <Plus className="w-4 h-4 mr-2" />
                          Add Schedule
                        </Button>
                      </div>

                      {busForm.schedules.map((schedule, scheduleIndex) => (
                      <Card key={scheduleIndex} className="mb-4 p-4">
                          <div className="flex justify-between items-center mb-4">
                            <h5 className="font-medium">Schedule {scheduleIndex + 1}</h5>
                            {busForm.schedules.length > 1 && (
                              <Button
                                type="button"
                                onClick={() => removeSchedule(scheduleIndex)}
                                variant="outline"
                                size="sm"
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            )}
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <div>
                            <Label htmlFor={`startTime-${scheduleIndex}`}>Start Time</Label>
                              <Input
                              id={`startTime-${scheduleIndex}`}
                                type="time"
                                value={schedule.starttime}
                              onChange={(e) => updateSchedule(scheduleIndex, 'starttime', e.target.value)}
                                required
                              />
                            </div>
                          <div>
                            <Label htmlFor={`endTime-${scheduleIndex}`}>End Time</Label>
                              <Input
                              id={`endTime-${scheduleIndex}`}
                                type="time"
                                value={schedule.endtime}
                              onChange={(e) => updateSchedule(scheduleIndex, 'endtime', e.target.value)}
                                required
                              />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <div>
                            <Label htmlFor={`startingPlace-${scheduleIndex}`}>Starting Place</Label>
                              <Input
                              id={`startingPlace-${scheduleIndex}`}
                                value={schedule.startingPlace}
                              onChange={(e) => updateSchedule(scheduleIndex, 'startingPlace', e.target.value)}
                              placeholder="e.g., Chandigarh"
                                required
                              />
                            </div>
                          <div>
                            <Label htmlFor={`destination-${scheduleIndex}`}>Destination</Label>
                              <Input
                              id={`destination-${scheduleIndex}`}
                                value={schedule.destination}
                              onChange={(e) => updateSchedule(scheduleIndex, 'destination', e.target.value)}
                              placeholder="e.g., Amritsar"
                                required
                              />
                            </div>
                          </div>

                        <div className="mb-4">
                          <div className="flex justify-between items-center mb-2">
                              <Label>Stops</Label>
                            <Button type="button" onClick={() => addStop(scheduleIndex)} variant="outline" size="sm">
                                <Plus className="w-4 h-4 mr-2" />
                                Add Stop
                              </Button>
                            </div>
                            {schedule.stops.map((stop, stopIndex) => (
                            <div key={stopIndex} className="flex gap-2 mb-2">
                                <Input
                                  value={stop.name}
                                onChange={(e) => updateStop(scheduleIndex, stopIndex, e.target.value)}
                                  placeholder="Stop name"
                                  required
                                />
                                {schedule.stops.length > 1 && (
                                  <Button
                                    type="button"
                                    onClick={() => removeStop(scheduleIndex, stopIndex)}
                                    variant="outline"
                                    size="sm"
                                  >
                                    <X className="w-4 h-4" />
                                  </Button>
                                )}
                              </div>
                            ))}
                          </div>

                        <div>
                          <div className="flex justify-between items-center mb-2">
                            <Label>Days of Operation</Label>
                            <Button type="button" onClick={() => addDay(scheduleIndex)} variant="outline" size="sm">
                                <Plus className="w-4 h-4 mr-2" />
                                Add Day
                              </Button>
                            </div>
                          <div className="flex flex-wrap gap-2">
                            {schedule.days.map((day, dayIndex) => (
                              <div key={dayIndex} className="flex gap-2">
                                <Input
                                  value={day}
                                  onChange={(e) => updateDay(scheduleIndex, dayIndex, e.target.value)}
                                  placeholder="e.g., Monday"
                                  required
                                />
                                {schedule.days.length > 1 && (
                                  <Button
                                    type="button"
                                    onClick={() => removeDay(scheduleIndex, dayIndex)}
                                    variant="outline"
                                    size="sm"
                                  >
                                    <X className="w-4 h-4" />
                                  </Button>
                                )}
                              </div>
                            ))}
                          </div>
                          </div>
                        </Card>
                      ))}

                    <div className="flex gap-4">
                      <Button type="submit" style={{ backgroundColor: 'hsl(var(--government-green))', color: 'white' }}>
                        Add Bus
                      </Button>
                      <Button type="button" variant="outline" onClick={() => setActiveSection("bus")}>
                        Cancel
                      </Button>
                    </div>
                    </div>
                  </form>
                </CardContent>
              </Card>
          </div>
        );
      case "analytics":
        // Transform analytics data for bar chart
        const chartData = Object.entries(analyticsData).map(([name, value]) => ({
          name,
          count: value,
        })).sort((a, b) => b.count - a.count); // Sort by count descending

        return (
          <div>
            <h3 className="text-2xl font-bold mb-4">Analytics Dashboard</h3>
            <p className="text-muted-foreground">View comprehensive analytics and insights for Punjab transportation system.</p>
            
            <div className="mt-6">
              <Card className="p-6">
                <CardHeader className="pb-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <BarChart3 className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <CardTitle className="text-xl font-bold text-gray-800">Bus Route Analytics</CardTitle>
                      <CardDescription className="text-gray-600 font-medium">Distribution of bus routes across different locations</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {isLoadingAnalytics ? (
                    <div className="flex items-center justify-center h-64">
                      <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                      <span className="ml-2 text-gray-600">Loading analytics data...</span>
                    </div>
                  ) : chartData.length > 0 ? (
                    <>
                      <div className="h-[500px] bg-gradient-to-br from-slate-50 to-blue-50/30 rounded-lg p-4">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={chartData}
                            margin={{
                              top: 30,
                              right: 40,
                              left: 50,
                              bottom: 80,
                            }}
                          >
                            <defs>
                              <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#3B82F6" />
                                <stop offset="100%" stopColor="#1D4ED8" />
                              </linearGradient>
                              <linearGradient id="gridGradient" x1="0" y1="0" x2="1" y2="0">
                                <stop offset="0%" stopColor="#f1f5f9" />
                                <stop offset="100%" stopColor="#e2e8f0" />
                              </linearGradient>
                            </defs>
                            <CartesianGrid 
                              strokeDasharray="2 4" 
                              stroke="url(#gridGradient)"
                              strokeWidth={1}
                              opacity={0.6}
                            />
                            <XAxis 
                              dataKey="name" 
                              angle={-45}
                              textAnchor="end"
                              height={100}
                              fontSize={11}
                              fontWeight={500}
                              stroke="#475569"
                              tick={{ fill: '#64748b' }}
                              axisLine={{ stroke: '#cbd5e1', strokeWidth: 1 }}
                              tickLine={{ stroke: '#cbd5e1' }}
                            />
                            <YAxis 
                              label={{ 
                                value: 'Number of Bus Routes', 
                                angle: -90, 
                                position: 'insideLeft',
                                style: { textAnchor: 'middle', fill: '#475569', fontSize: '12px', fontWeight: '600' }
                              }}
                              stroke="#475569"
                              fontSize={11}
                              fontWeight={500}
                              tick={{ fill: '#64748b' }}
                              axisLine={{ stroke: '#cbd5e1', strokeWidth: 1 }}
                              tickLine={{ stroke: '#cbd5e1' }}
                              tickCount={6}
                              tickFormatter={(value) => Math.round(value).toString()}
                            />
                            <Tooltip 
                              formatter={(value: number) => [
                                <span key="value" className="font-semibold text-blue-600">{value}</span>, 
                                <span key="label" className="text-gray-600">Bus Routes</span>
                              ]}
                              labelStyle={{ 
                                color: '#1e293b', 
                                fontWeight: '600',
                                fontSize: '13px'
                              }}
                              contentStyle={{
                                backgroundColor: '#ffffff',
                                border: '1px solid #e2e8f0',
                                borderRadius: '12px',
                                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                                padding: '12px 16px',
                                fontSize: '13px'
                              }}
                              cursor={{ fill: '#f1f5f9' }}
                            />
                            <Legend 
                              formatter={(value) => (
                                <span style={{ 
                                  color: '#475569', 
                                  fontWeight: '600',
                                  fontSize: '13px'
                                }}>
                                  Bus Route Distribution
                                </span>
                              )}
                              wrapperStyle={{
                                paddingTop: '20px',
                                fontSize: '13px'
                              }}
                            />
                            <Bar 
                              dataKey="count" 
                              fill="url(#barGradient)"
                              radius={[6, 6, 0, 0]}
                              name="Bus Routes"
                              stroke="#1e40af"
                              strokeWidth={0.5}
                              maxBarSize={60}
                            />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                      
                      {/* Summary Table */}
                      <div className="mt-6">
                        <div className="bg-gradient-to-r from-gray-50 to-blue-50/30 rounded-lg p-4 border border-gray-200">
                          <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            Location Summary
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {chartData.map((item, index) => (
                              <div 
                                key={item.name}
                                className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200"
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                    <div 
                                      className="w-4 h-4 rounded-full"
                                      style={{ 
                                        backgroundColor: `hsl(${200 + (index * 40) % 160}, 70%, 50%)` 
                                      }}
                                    ></div>
                                    <span className="font-medium text-gray-800 text-sm">
                                      {item.name}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-2xl font-bold text-blue-600">
                                      {item.count}
                                    </span>
                                    <span className="text-xs text-gray-500 font-medium">
                                      {item.count === 1 ? 'route' : 'routes'}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-12">
                      <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500 text-lg">No analytics data available</p>
                      <p className="text-gray-400 text-sm">Add some buses to see location distribution analytics</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        );
      case "complaintRegister":
        return (
          <div>
            <h3 className="text-2xl font-bold mb-4">Complaint Register</h3>
            <p className="text-muted-foreground mb-6">View and manage passenger complaints submitted through the system.</p>
            
            <Card className="p-6">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <MessageSquare className="w-5 h-5 text-orange-600" />
                  </div>
                  <div>
                    <CardTitle className="text-xl font-bold text-gray-800">Complaint Management</CardTitle>
                    <CardDescription className="text-gray-600">
                      Track and respond to passenger feedback and complaints
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h4 className="text-lg font-semibold text-gray-600 mb-2">Complaint Register</h4>
                  <p className="text-gray-500 mb-4">
                    This feature will display all submitted complaints from passengers.
                  </p>
                  <p className="text-sm text-gray-400">
                    Functionality coming soon...
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        );
      default:
        return (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
            {/* Profile Card */}
            <Card className="bg-white rounded-2xl border-0 shadow-xl shadow-gray-200/50 hover:shadow-2xl hover:shadow-gray-200/60 transition-all duration-300 transform hover:-translate-y-1">
              <CardHeader className="text-center pb-6 pt-8">
                <div className="mx-auto mb-6 p-4 bg-gradient-to-br from-gray-900 to-gray-700 rounded-2xl w-20 h-20 flex items-center justify-center shadow-lg">
                  <User className="w-10 h-10 text-white" />
                </div>
                <CardTitle className="text-2xl font-bold text-gray-900 mb-2">Your Profile</CardTitle>
                <CardDescription className="text-gray-600 text-base">
                  Municipality administrator profile information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 px-8 pb-8">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                    <span className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Admin ID</span>
                    <span className="font-bold text-gray-900">MUN001</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                    <span className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Name</span>
                    <span className="font-bold text-gray-900">{loginForm.name}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                    <span className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Department</span>
                    <span className="font-bold text-gray-900">Transportation</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-xl">
                    <span className="text-sm font-semibold text-green-600 uppercase tracking-wide">Status</span>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="font-bold text-green-700">Active</span>
                    </div>
                  </div>
                </div>
                <Button 
                  className="w-full h-12 bg-gradient-to-r from-gray-900 to-gray-800 hover:from-gray-800 hover:to-gray-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98]"
                >
                  <User className="w-4 h-4 mr-2" />
                  Edit Profile
                </Button>
              </CardContent>
            </Card>

            {/* Quick Stats Card */}
            <Card className="bg-white rounded-2xl border-0 shadow-xl shadow-gray-200/50 hover:shadow-2xl hover:shadow-gray-200/60 transition-all duration-300 transform hover:-translate-y-1">
              <CardHeader className="pb-6 pt-8">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                    <BarChart3 className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-xl font-bold text-gray-900">Quick Stats</CardTitle>
                    <CardDescription className="text-gray-600">System overview</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 px-8 pb-8">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-xl">
                    <div className="text-2xl font-bold text-blue-600">12</div>
                    <div className="text-sm text-blue-500 font-medium">Active Buses</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-xl">
                    <div className="text-2xl font-bold text-green-600">8</div>
                    <div className="text-sm text-green-500 font-medium">Routes</div>
                  </div>
                  <div className="text-center p-4 bg-orange-50 rounded-xl">
                    <div className="text-2xl font-bold text-orange-600">24</div>
                    <div className="text-sm text-orange-500 font-medium">Schedules</div>
                  </div>
                  <div className="text-center p-4 bg-red-50 rounded-xl">
                    <div className="text-2xl font-bold text-red-600">{newComplaintsCount}</div>
                    <div className="text-sm text-red-500 font-medium">New Complaints</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity Card */}
            <Card className="bg-white rounded-2xl border-0 shadow-xl shadow-gray-200/50 hover:shadow-2xl hover:shadow-gray-200/60 transition-all duration-300 transform hover:-translate-y-1">
              <CardHeader className="pb-6 pt-8">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                    <Calendar className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-xl font-bold text-gray-900">Recent Activity</CardTitle>
                    <CardDescription className="text-gray-600">Latest system updates</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 px-8 pb-8">
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">New bus added to fleet</p>
                      <p className="text-xs text-gray-500">2 hours ago</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">Route updated successfully</p>
                      <p className="text-xs text-gray-500">4 hours ago</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                    <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">Schedule modified</p>
                      <p className="text-xs text-gray-500">6 hours ago</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-200/50 shadow-sm sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
              <Button 
              variant="ghost" 
              size="sm" 
                onClick={() => navigate('/')}
              className="text-gray-600 hover:text-gray-900 hover:bg-gray-50/80 px-4 py-2.5 rounded-xl transition-all duration-200 group"
            >
              <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform duration-200" />
              Back to Home
            </Button>
            
            {/* Center - Municipality Portal Title */}
            <div className="text-center">
              <div className="flex items-center justify-center gap-3 mb-1">
                <div className="w-8 h-8 bg-gradient-to-br from-gray-900 to-gray-700 rounded-lg flex items-center justify-center">
                  <LogIn className="w-4 h-4 text-white" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900">Municipality Portal</h1>
              </div>
              <p className="text-sm text-gray-500 font-medium">Administrative Dashboard</p>
            </div>
            
            {isLoggedIn ? (
              <Button 
                variant="ghost" 
                onClick={handleLogout}
                className="text-gray-600 hover:text-gray-900 hover:bg-gray-50/80 px-4 py-2.5 rounded-xl transition-all duration-200 group"
              >
                <div className="w-2 h-2 bg-red-500 rounded-full mr-2 group-hover:bg-red-600 transition-colors duration-200"></div>
                Logout
              </Button>
            ) : (
              <div className="w-20"></div> // Spacer to keep center aligned
            )}
          </div>
        </div>
      </header>

      {/* Emergency Alert Modal */}
      {showEmergencyAlert && currentEmergency && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-[200px] h-[200px] transform animate-in zoom-in-95 duration-300 border-4 border-red-500 flex flex-col">
            {/* Header */}
            <div className="bg-gradient-to-r from-red-500 to-red-600 text-white p-3 rounded-t-3xl flex items-center justify-center">
              <div className="text-center">
                <div className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center mx-auto mb-2 animate-pulse">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold">🚨 SOS ALERT 🚨</h3>
              </div>
            </div>
            
            {/* Content */}
            <div className="flex-1 p-4 flex flex-col justify-center items-center text-center">
              <div className="space-y-2 mb-4">
                <p className="text-red-600 font-bold text-xs">
                  {currentEmergency.message}
                </p>
                <div className="text-xs text-gray-600">
                  <p><strong>Bus:</strong> {currentEmergency.busNumberPlate}</p>
                  <p><strong>Driver:</strong> {currentEmergency.driverName}</p>
                  <p><strong>Route:</strong> {currentEmergency.startingPlace} → {currentEmergency.originalDestination}</p>
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="flex space-x-2 w-full">
                <Button
                  onClick={() => setShowEmergencyAlert(false)}
                  className="flex-1 h-8 bg-green-600 hover:bg-green-700 text-white text-xs font-bold rounded-lg"
                >
                  <CheckCircle className="w-3 h-3 mr-1" />
                  OK
                </Button>
                <Button
                  onClick={() => setShowEmergencyAlert(false)}
                  variant="outline"
                  className="flex-1 h-8 border border-gray-300 text-gray-700 text-xs font-semibold rounded-lg"
                >
                  <CloseIcon className="w-3 h-3 mr-1" />
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}


      {/* Main Content */}
      <main className="flex-1">
        {!isLoggedIn ? (
          // Login Form
          <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center px-4 py-12">
            <div className="w-full max-w-md">
              {/* Header */}
              <div className="text-center mb-10">
                <div className="relative">
                  <div className="w-20 h-20 bg-gradient-to-br from-gray-900 to-gray-700 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                    <LogIn className="w-10 h-10 text-white" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  </div>
                </div>
                <h1 className="text-3xl font-bold text-gray-900 mb-3">Municipality Portal</h1>
                <p className="text-gray-600 text-lg">Access administrative dashboard</p>
              </div>

              {/* Login Card */}
              <Card className="bg-white rounded-2xl border-0 shadow-xl shadow-gray-200/50 backdrop-blur-sm">
                <CardContent className="p-10">
                  <form onSubmit={handleLogin} className="space-y-8">
                    <div className="space-y-3">
                      <label className="text-sm font-semibold text-gray-800 uppercase tracking-wide">Username</label>
                      <div className="relative">
                        <Input
                          type="text"
                          placeholder="Enter your username"
                          value={loginForm.name}
                          onChange={(e) => setLoginForm(prev => ({ ...prev, name: e.target.value }))}
                          className="h-12 border-2 border-gray-200 focus:border-gray-400 focus:ring-0 rounded-xl text-base pl-4 pr-4 transition-all duration-200"
                          required
                        />
                        <div className="absolute inset-y-0 right-0 flex items-center pr-4">
                          <User className="w-5 h-5 text-gray-400" />
                        </div>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <label className="text-sm font-semibold text-gray-800 uppercase tracking-wide">Password</label>
                      <div className="relative">
                        <Input
                          type="password"
                          placeholder="Enter your password"
                          value={loginForm.password}
                          onChange={(e) => setLoginForm(prev => ({ ...prev, password: e.target.value }))}
                          className="h-12 border-2 border-gray-200 focus:border-gray-400 focus:ring-0 rounded-xl text-base pl-4 pr-4 transition-all duration-200"
                          required
                        />
                        <div className="absolute inset-y-0 right-0 flex items-center pr-4">
                          <div className="w-5 h-5 border-2 border-gray-400 rounded-sm"></div>
                        </div>
                      </div>
                    </div>
                    <Button 
                      type="submit" 
                      disabled={isLoggingIn}
                      className="w-full h-12 bg-gradient-to-r from-gray-900 to-gray-800 hover:from-gray-800 hover:to-gray-700 text-white font-semibold text-base rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98]"
                    >
                      {isLoggingIn ? (
                        <>
                          <Loader2 className="w-5 h-5 mr-3 animate-spin" />
                          Signing In...
                        </>
                      ) : (
                        <>
                          <LogIn className="w-5 h-5 mr-3" />
                          Sign In
                        </>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {/* Footer */}
              <div className="text-center mt-10">
                <div className="flex items-center justify-center gap-2 mb-4">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <p className="text-sm font-medium text-gray-600">Secure Connection</p>
                </div>
                <p className="text-sm text-gray-500">
                  Municipal transportation management system
                </p>
              </div>
            </div>
          </div>
        ) : (
          // Dashboard with Sidebar
          <SidebarProvider>
            <div className="flex min-h-screen w-full">
              <Sidebar className="border-r border-gray-200/50 bg-white/80 backdrop-blur-md shadow-sm">
                <SidebarContent>
                  <div className="p-4">
                    <SidebarTrigger />
                  </div>
                  <SidebarGroup>
                    <SidebarGroupContent>
                      <SidebarMenu>
                        {sidebarItems.map((item) => (
                          <SidebarMenuItem key={item.id}>
                            <SidebarMenuButton 
                              onClick={() => {
                                if (item.id === "bus") {
                                  navigate('/bus-list');
                                } else if (item.id === "complaintRegister") {
                                  navigate('/municipality-portal/complaints');
                                } else if (item.id === "emergencies") {
                                  navigate('/municipality-portal/emergencies');
                                } else if (item.id === "emergencySos") {
                                  alert('Emergency SOS button clicked - This is a dummy function for now!');
                                } else {
                                  setActiveSection(item.id);
                                }
                              }}
                              className={`w-full justify-start px-4 py-3 rounded-xl transition-all duration-200 group ${
                                activeSection === item.id 
                                  ? 'bg-gradient-to-r from-gray-900 to-gray-800 text-white shadow-lg' 
                                  : 'hover:bg-gray-50 text-gray-700 hover:text-gray-900 hover:shadow-sm'
                              }`}
                            >
                              <item.icon className="w-4 h-4 mr-2" />
                              {item.title}
                              {item.id === "complaintRegister" && newComplaintsCount > 0 && (
                                <span className="ml-auto bg-red-500 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center">
                                  {newComplaintsCount}
                                </span>
                              )}
                            </SidebarMenuButton>
                          </SidebarMenuItem>
                        ))}
                      </SidebarMenu>
                    </SidebarGroupContent>
                  </SidebarGroup>
                </SidebarContent>
              </Sidebar>

              <main className="flex-1 p-8 bg-gradient-to-br from-gray-50/30 to-white">
                <div className="max-w-6xl mx-auto">
                  <div className="mb-10">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-gray-900 to-gray-700 rounded-xl flex items-center justify-center shadow-lg">
                        <BarChart3 className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h2 className="text-3xl font-bold text-gray-900 mb-1">
                          Municipality Dashboard
                        </h2>
                        <p className="text-gray-600 text-lg font-medium">
                          Administrative control panel for Punjab transportation system
                        </p>
                      </div>
                    </div>
                  </div>

                  {renderDashboardContent()}
                </div>
              </main>
            </div>
          </SidebarProvider>
        )}
      </main>
    </div>
  );
};

export default MunicipalityPortal;