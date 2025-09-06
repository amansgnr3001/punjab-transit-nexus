import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, User, LogIn, Bus, Route, Calendar, Plus, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";

const MunicipalityPortal = () => {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loginForm, setLoginForm] = useState({ username: "", password: "" });
  const [activeSection, setActiveSection] = useState("dashboard");
  const [showAddBusForm, setShowAddBusForm] = useState(false);
  const [busForm, setBusForm] = useState({
    Bus_number_plate: "",
    busName: "",
    schedules: [{
      starttime: "",
      endtime: "",
      startingPlace: "",
      destination: "",
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

  const handleAddBus = () => {
    setShowAddBusForm(true);
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
        stops: [{ name: "" }],
        days: [""]
      }]
    }));
  };

  const removeSchedule = (scheduleIndex: number) => {
    const newSchedules = busForm.schedules.filter((_, index) => index !== scheduleIndex);
    setBusForm(prev => ({ ...prev, schedules: newSchedules }));
  };

  const handleSubmitBus = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Prepare data for submission - set lat, long, time as 0 for each stop
    const submitData = {
      ...busForm,
      schedules: busForm.schedules.map(schedule => ({
        ...schedule,
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
        setShowAddBusForm(false);
        setBusForm({
          Bus_number_plate: "",
          busName: "",
          schedules: [{
            starttime: "",
            endtime: "",
            startingPlace: "",
            destination: "",
            stops: [{ name: "" }],
            days: [""]
          }]
        });
      } else {
        console.error('Failed to add bus');
      }
    } catch (error) {
      console.error('Error adding bus:', error);
    }
  };

  const sidebarItems = [
    { id: "bus", title: "Bus", icon: Bus },
    { id: "route", title: "Route", icon: Route },
    { id: "schedule", title: "Schedule", icon: Calendar },
  ];

  const renderDashboardContent = () => {
    switch (activeSection) {
      case "bus":
        return (
          <div>
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-2xl font-bold mb-2">Bus Management</h3>
                <p className="text-muted-foreground">Manage bus fleet and vehicle information.</p>
              </div>
              <Button 
                onClick={handleAddBus}
                style={{ backgroundColor: 'hsl(var(--government-green))', color: 'white' }}
                className="hover:opacity-90"
              >
                Add Bus
              </Button>
            </div>

            {showAddBusForm && (
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>Add New Bus</CardTitle>
                  <CardDescription>Fill in the bus information and schedules</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmitBus} className="space-y-6">
                    {/* Basic Bus Information */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="busNumberPlate">Bus Number Plate</Label>
                        <Input
                          id="busNumberPlate"
                          value={busForm.Bus_number_plate}
                          onChange={(e) => handleBusFormChange('Bus_number_plate', e.target.value)}
                          placeholder="e.g., PB-01-A-1234"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="busName">Bus Name</Label>
                        <Input
                          id="busName"
                          value={busForm.busName}
                          onChange={(e) => handleBusFormChange('busName', e.target.value)}
                          placeholder="e.g., Express Bus 1"
                          required
                        />
                      </div>
                    </div>

                    {/* Schedules */}
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <h4 className="text-lg font-semibold">Schedules</h4>
                        <Button type="button" onClick={addSchedule} variant="outline" size="sm">
                          <Plus className="w-4 h-4 mr-2" />
                          Add Schedule
                        </Button>
                      </div>

                      {busForm.schedules.map((schedule, scheduleIndex) => (
                        <Card key={scheduleIndex} className="p-4">
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
                            <div className="space-y-2">
                              <Label>Start Time</Label>
                              <Input
                                type="time"
                                value={schedule.starttime}
                                onChange={(e) => handleBusFormChange('starttime', e.target.value, scheduleIndex)}
                                required
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>End Time</Label>
                              <Input
                                type="time"
                                value={schedule.endtime}
                                onChange={(e) => handleBusFormChange('endtime', e.target.value, scheduleIndex)}
                                required
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Starting Place</Label>
                              <Input
                                value={schedule.startingPlace}
                                onChange={(e) => handleBusFormChange('startingPlace', e.target.value, scheduleIndex)}
                                placeholder="e.g., Amritsar"
                                required
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Destination</Label>
                              <Input
                                value={schedule.destination}
                                onChange={(e) => handleBusFormChange('destination', e.target.value, scheduleIndex)}
                                placeholder="e.g., Ludhiana"
                                required
                              />
                            </div>
                          </div>

                          {/* Stops */}
                          <div className="space-y-2 mb-4">
                            <div className="flex justify-between items-center">
                              <Label>Stops</Label>
                              <Button
                                type="button"
                                onClick={() => addStop(scheduleIndex)}
                                variant="outline"
                                size="sm"
                              >
                                <Plus className="w-4 h-4 mr-2" />
                                Add Stop
                              </Button>
                            </div>
                            {schedule.stops.map((stop, stopIndex) => (
                              <div key={stopIndex} className="flex gap-2">
                                <Input
                                  value={stop.name}
                                  onChange={(e) => handleBusFormChange('name', e.target.value, scheduleIndex, stopIndex)}
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

                          {/* Days */}
                          <div className="space-y-2">
                            <div className="flex justify-between items-center">
                              <Label>Operating Days</Label>
                              <Button
                                type="button"
                                onClick={() => addDay(scheduleIndex)}
                                variant="outline"
                                size="sm"
                              >
                                <Plus className="w-4 h-4 mr-2" />
                                Add Day
                              </Button>
                            </div>
                            {schedule.days.map((day, dayIndex) => (
                              <div key={dayIndex} className="flex gap-2">
                                <Input
                                  value={day}
                                  onChange={(e) => handleBusFormChange('days', e.target.value, scheduleIndex, undefined, dayIndex)}
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
                        </Card>
                      ))}
                    </div>

                    {/* Form Actions */}
                    <div className="flex justify-end gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowAddBusForm(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        style={{ backgroundColor: 'hsl(var(--government-green))', color: 'white' }}
                      >
                        Submit
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}
          </div>
        );
      case "route":
        return (
          <div>
            <h3 className="text-2xl font-bold mb-4">Route Management</h3>
            <p className="text-muted-foreground">Configure and manage bus routes across Punjab.</p>
          </div>
        );
      case "schedule":
        return (
          <div>
            <h3 className="text-2xl font-bold mb-4">Schedule Management</h3>
            <p className="text-muted-foreground">Set up and modify bus schedules and timetables.</p>
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
    <div className="min-h-screen bg-gradient-to-br from-background via-government-green/5 to-background">
      {/* Header */}
      <header className="border-b bg-white/95 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => navigate('/')}
                className="hover:bg-government-green/10"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Home
              </Button>
              <h1 className="text-2xl font-bold text-government-green">Municipality Portal</h1>
            </div>
            {isLoggedIn && (
              <Button variant="outline" onClick={handleLogout}>
                Logout
              </Button>
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
              <Card className="shadow-lg border-2">
                <CardHeader className="text-center">
                  <CardTitle className="flex items-center justify-center gap-2">
                    <LogIn className="w-5 h-5 text-government-green" />
                    Municipality Login
                  </CardTitle>
                  <CardDescription>
                    Please login to access administrative dashboard
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Username</label>
                      <Input
                        type="text"
                        placeholder="Enter your username"
                        value={loginForm.username}
                        onChange={(e) => setLoginForm(prev => ({ ...prev, username: e.target.value }))}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Password</label>
                      <Input
                        type="password"
                        placeholder="Enter your password"
                        value={loginForm.password}
                        onChange={(e) => setLoginForm(prev => ({ ...prev, password: e.target.value }))}
                        required
                      />
                    </div>
                    <Button 
                      type="submit" 
                      className="w-full"
                      style={{ backgroundColor: 'hsl(var(--government-green))', color: 'white' }}
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