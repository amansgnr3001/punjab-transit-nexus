import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, User, LogIn, Bus, Route, Calendar, Plus, X, BarChart3, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const MunicipalityPortal = () => {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loginForm, setLoginForm] = useState({ username: "", password: "" });
  const [activeSection, setActiveSection] = useState("dashboard");
  const [analyticsData, setAnalyticsData] = useState<{[key: string]: number}>({});
  const [isLoadingAnalytics, setIsLoadingAnalytics] = useState(false);
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

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (loginForm.username && loginForm.password) {
      setIsLoggedIn(true);
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setLoginForm({ username: "", password: "" });
    setActiveSection("dashboard");
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
      default:
        return (
          <div className="max-w-md">
            <Card className="shadow-lg border-2 hover:border-government-green/20 transition-all duration-300">
              <CardHeader className="text-center pb-4">
                <div className="mx-auto mb-4 p-3 bg-government-green/10 rounded-full w-16 h-16 flex items-center justify-center">
                  <User className="w-8 h-8 text-government-green" />
                </div>
                <CardTitle className="text-xl">Your Profile</CardTitle>
                <CardDescription>
                  Municipality administrator profile information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center space-y-2">
                  <p><strong>Admin ID:</strong> MUN001</p>
                  <p><strong>Name:</strong> {loginForm.username}</p>
                  <p><strong>Department:</strong> Transportation</p>
                  <p><strong>Status:</strong> <span className="text-government-green font-medium">Active</span></p>
                </div>
                <Button 
                  style={{ backgroundColor: 'hsl(var(--government-green))', color: 'white' }}
                  className="w-full hover:opacity-90"
                >
                  Edit Profile
                </Button>
              </CardContent>
            </Card>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-100">
      {/* Header */}
      <header className="bg-gradient-to-r from-white via-purple-50 to-pink-50 backdrop-blur-md shadow-lg border-b border-purple-200">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <Button 
              variant="outline" 
              size="lg" 
              onClick={() => navigate('/')}
              className="px-6 py-3"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back to Home
            </Button>
            
            {/* Center - Municipality Portal Title */}
            <div className="text-center">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600 bg-clip-text text-transparent">Municipality Portal</h1>
              <p className="text-sm text-gray-600 font-medium">Administrative Dashboard</p>
            </div>
            
            {isLoggedIn ? (
              <Button variant="outline" onClick={handleLogout}>
                Logout
              </Button>
            ) : (
              <div className="w-20"></div> // Spacer to keep center aligned
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {!isLoggedIn ? (
          // Login Form
          <div className="container mx-auto px-4 py-12">
            <div className="max-w-md mx-auto">
              <Card className="shadow-2xl border-0 bg-gradient-to-br from-white to-purple-50 backdrop-blur-sm">
                <CardHeader className="text-center pb-6 pt-8">
                  <CardTitle className="flex items-center justify-center gap-2 text-2xl font-bold text-gray-800">
                    <LogIn className="w-6 h-6 text-purple-600" />
                    Municipality Login
                  </CardTitle>
                  <CardDescription className="text-gray-600 text-base">
                    Please login to access administrative dashboard
                  </CardDescription>
                </CardHeader>
                <CardContent className="pb-8">
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-gray-700 font-medium">Username</label>
                      <Input
                        type="text"
                        placeholder="Enter your username"
                        value={loginForm.username}
                        onChange={(e) => setLoginForm(prev => ({ ...prev, username: e.target.value }))}
                        className="border-purple-200 focus:border-purple-400"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-gray-700 font-medium">Password</label>
                      <Input
                        type="password"
                        placeholder="Enter your password"
                        value={loginForm.password}
                        onChange={(e) => setLoginForm(prev => ({ ...prev, password: e.target.value }))}
                        className="border-purple-200 focus:border-purple-400"
                        required
                      />
                    </div>
                    <Button 
                      type="submit" 
                      className="w-full bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 hover:from-purple-600 hover:via-pink-600 hover:to-orange-600 text-white font-semibold py-3 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                    >
                      Login to Dashboard
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>
        ) : (
          // Dashboard with Sidebar
          <SidebarProvider>
            <div className="flex min-h-screen w-full">
              <Sidebar className="border-r bg-white/95">
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
                              onClick={() => setActiveSection(item.id)}
                              className={`w-full justify-start ${
                                activeSection === item.id 
                                  ? 'bg-government-green/10 text-government-green font-medium' 
                                  : 'hover:bg-government-green/5'
                              }`}
                            >
                              <item.icon className="w-4 h-4 mr-2" />
                              {item.title}
                            </SidebarMenuButton>
                          </SidebarMenuItem>
                        ))}
                      </SidebarMenu>
                    </SidebarGroupContent>
                  </SidebarGroup>
                </SidebarContent>
              </Sidebar>

              <main className="flex-1 p-8">
                <div className="max-w-6xl mx-auto">
                  <div className="mb-8">
                    <h2 className="text-3xl font-bold text-foreground mb-2">
                      Municipality Dashboard
                    </h2>
                    <p className="text-muted-foreground">
                      Administrative control panel for Punjab transportation system
                    </p>
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