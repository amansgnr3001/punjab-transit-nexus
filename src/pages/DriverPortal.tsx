import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, User, PlayCircle, LogIn, UserPlus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useBusRoutes } from "@/hooks/useBusRoutes";
import { io } from "socket.io-client";

const DriverPortal = () => {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [loginForm, setLoginForm] = useState({ contactNumber: "", password: "" });
  const [registerForm, setRegisterForm] = useState({ 
    name: "", 
    age: "", 
    contactNumber: "", 
    password: "" 
  });
  const [driverData, setDriverData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showStartJourneyForm, setShowStartJourneyForm] = useState(false);
  const [journeyForm, setJourneyForm] = useState({
    driverName: "",
    driverId: "",
    busNo: "",
    startingPlace: "",
    destination: ""
  });
  const [isJourneyActive, setIsJourneyActive] = useState(false);
  const [activeJourney, setActiveJourney] = useState(null);
  const [locationIntervalId, setLocationIntervalId] = useState(null);
  const [socket, setSocket] = useState(null);
  const [journeyStatus, setJourneyStatus] = useState('0'); // 0 = no journey, 1 = journey active

  // Custom hook for bus routes
  const { startingPlaces, destinations, loading: routesLoading, error: routesError, fetchRoutes, clearRoutes } = useBusRoutes();


  // Check if user is already logged in on component mount
  useEffect(() => {
    const token = localStorage.getItem('driverToken');
    if (token) {
      // Verify token and get driver data
      fetchDriverProfile(token);
    }
    
    // Check journey status from localStorage
    const savedJourneyStatus = localStorage.getItem('driverJourneyStatus');
    if (savedJourneyStatus) {
      setJourneyStatus(savedJourneyStatus);
      if (savedJourneyStatus === '1') {
        // If journey was active, restore the journey state and restart location tracking
        const savedBusNumberPlate = localStorage.getItem('driverBusNumberPlate');
        if (savedBusNumberPlate) {
          console.log('🔄 Restoring active journey after page refresh');
          
          // Set journey as active
          setIsJourneyActive(true);
          
          // Reconnect socket
          const newSocket = io('http://localhost:3001');
          setSocket(newSocket);
          
          // Add socket connection debugging
          newSocket.on('connect', () => {
            console.log('🔌 Socket reconnected with ID:', newSocket.id);
          });
          
          newSocket.on('disconnect', () => {
            console.log('🔌 Socket disconnected');
          });
          
          newSocket.on('connect_error', (error) => {
            console.error('❌ Socket connection error:', error);
          });
          
          // Restart location tracking every 30 seconds
          const intervalId = setInterval(() => {
            console.log('🔄 Location tracking interval triggered (restored)');
            // Get current location and send directly to broadcast event
            if (navigator.geolocation) {
              console.log('📍 Requesting geolocation...');
              navigator.geolocation.getCurrentPosition(
                (position) => {
                  const locationData = {
                    lat: position.coords.latitude,
                    long: position.coords.longitude,
                    busnumberplate: savedBusNumberPlate
                  };
                  
                  console.log('📍 Location received (restored):', locationData);
                  console.log('🔌 Socket connected:', newSocket.connected);
                  
                  // Send location data to backend via broadcast event
                  newSocket.emit('broadcast', locationData);
                  console.log('📡 Location sent via broadcast event (restored):', locationData);
                  console.log('📡 Socket connected status (restored):', newSocket.connected);
                  console.log('📡 Socket ID (restored):', newSocket.id);
                },
                (error) => {
                  console.error('❌ Error getting location:', error);
                }
              );
            } else {
              console.error('❌ Geolocation is not supported by this browser.');
            }
          }, 30000);
          
          setLocationIntervalId(intervalId);
          console.log('✅ Location tracking restored successfully');
        }
      }
    }
  }, []);

  // Cleanup on component unmount
  useEffect(() => {
    return () => {
      // Clear interval if component unmounts
      if (locationIntervalId) {
        clearInterval(locationIntervalId);
      }
      // Disconnect socket if component unmounts
      if (socket) {
        socket.disconnect();
      }
    };
  }, [locationIntervalId, socket]);

  const fetchDriverProfile = async (token: string) => {
    try {
      const response = await fetch('http://localhost:3001/api/driver/profile', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        // Store driver data in localStorage
        localStorage.setItem('driverId', data.driver._id);
        localStorage.setItem('driverName', data.driver.name);
        localStorage.setItem('driverContactNumber', data.driver.contactNumber);
        setDriverData(data.driver);
        setIsLoggedIn(true);
      } else {
        // Token is invalid, remove all driver data
        localStorage.removeItem('driverToken');
        localStorage.removeItem('driverId');
        localStorage.removeItem('driverName');
        localStorage.removeItem('driverContactNumber');
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      localStorage.removeItem('driverToken');
      localStorage.removeItem('driverId');
      localStorage.removeItem('driverName');
      localStorage.removeItem('driverContactNumber');
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch('http://localhost:3001/api/driver/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(loginForm)
      });

      const data = await response.json();

      if (data.success) {
        // Store token and driver data in localStorage
        localStorage.setItem('driverToken', data.token);
        localStorage.setItem('driverId', data.driver.id);
        localStorage.setItem('driverName', data.driver.name);
        localStorage.setItem('driverContactNumber', data.driver.contactNumber);
        setDriverData(data.driver);
        setIsLoggedIn(true);
        setLoginForm({ contactNumber: "", password: "" });
      } else {
        setError(data.message || 'Login failed');
      }
    } catch (error) {
      setError('Network error. Please try again.');
      console.error('Login error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch('http://localhost:3001/api/driver/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(registerForm)
      });

      const data = await response.json();

      if (data.success) {
        // Store token and driver data in localStorage
        localStorage.setItem('driverToken', data.token);
        localStorage.setItem('driverId', data.driver.id);
        localStorage.setItem('driverName', data.driver.name);
        localStorage.setItem('driverContactNumber', data.driver.contactNumber);
        setDriverData(data.driver);
        setIsLoggedIn(true);
        setRegisterForm({ name: "", age: "", contactNumber: "", password: "" });
        setShowRegister(false);
      } else {
        setError(data.message || 'Registration failed');
      }
    } catch (error) {
      setError('Network error. Please try again.');
      console.error('Registration error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStartJourneyClick = () => {
    // Auto-fill driver data from localStorage
    const driverName = localStorage.getItem('driverName') || '';
    const driverId = localStorage.getItem('driverId') || '';
    
    setJourneyForm({
      driverName,
      driverId,
      busNo: "",
      startingPlace: "",
      destination: ""
    });
    clearRoutes(); // Clear any previous routes
    setShowStartJourneyForm(true);
  };

  const handleJourneyFormChange = (field: string, value: string) => {
    setJourneyForm(prev => {
      const newForm = { ...prev, [field]: value };
      
      // If bus number changes, fetch routes and clear other selections
      if (field === 'busNo') {
        fetchRoutes(value);
        // Clear starting place and destination when bus number changes
        newForm.startingPlace = '';
        newForm.destination = '';
      }
      
      return newForm;
    });
  };

  const handleJourneySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Map form data to API expected format
      const apiData = {
        driverName: journeyForm.driverName,
        driverId: journeyForm.driverId,
        busNumber: journeyForm.busNo,  // Map busNo to busNumber
        startingPlace: journeyForm.startingPlace,
        destination: journeyForm.destination
      };

      console.log('Sending data to API:', apiData);

      const response = await fetch('http://localhost:3001/api/driver/start-journey', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(apiData)
      });

      const data = await response.json();

      if (data.success) {
        // Journey started successfully
        console.log('Journey started:', data.activeBus);
        
        // Save bus number plate to localStorage
        localStorage.setItem('driverBusNumberPlate', journeyForm.busNo);
        
        // Set journey as active
        setIsJourneyActive(true);
        setActiveJourney(data.activeBus);
        
        // Set journey status to active in localStorage
        localStorage.setItem('driverJourneyStatus', '1');
        setJourneyStatus('1');
        
        // Initialize socket connection
        const newSocket = io('http://localhost:3001');
        setSocket(newSocket);
        
        // Add socket connection debugging
        newSocket.on('connect', () => {
          console.log('🔌 Socket connected with ID:', newSocket.id);
        });
        
        newSocket.on('disconnect', () => {
          console.log('🔌 Socket disconnected');
        });
        
        newSocket.on('connect_error', (error) => {
          console.error('❌ Socket connection error:', error);
        });
        
        // Start location tracking every 30 seconds
        const intervalId = setInterval(() => {
          console.log('🔄 Location tracking interval triggered');
          // Get current location and send directly to broadcast event
          if (navigator.geolocation) {
            console.log('📍 Requesting geolocation...');
            navigator.geolocation.getCurrentPosition(
              (position) => {
                const locationData = {
                  lat: position.coords.latitude,
                  long: position.coords.longitude,
                  busnumberplate: journeyForm.busNo
                };
                
                console.log('📍 Location received:', locationData);
                console.log('🔌 Socket connected:', newSocket.connected);
                
                // Send location data to backend via broadcast event
                newSocket.emit('broadcast', locationData);
                console.log('📡 Location sent via broadcast event:', locationData);
                console.log('📡 Socket connected status:', newSocket.connected);
                console.log('📡 Socket ID:', newSocket.id);
              },
              (error) => {
                console.error('❌ Error getting location:', error);
              }
            );
          } else {
            console.error('❌ Geolocation is not supported by this browser.');
          }
        }, 30000);
        
        setLocationIntervalId(intervalId);
        
        setShowStartJourneyForm(false);
        // You can add success notification here
        alert('Journey started successfully!');
      } else {
        setError(data.message || 'Failed to start journey');
      }
    } catch (error) {
      setError('Network error. Please try again.');
      console.error('Start journey error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    // Remove all driver data from localStorage
    localStorage.removeItem('driverToken');
    localStorage.removeItem('driverId');
    localStorage.removeItem('driverName');
    localStorage.removeItem('driverContactNumber');
    localStorage.removeItem('driverBusNumberPlate');
    setIsLoggedIn(false);
    setDriverData(null);
    setLoginForm({ contactNumber: "", password: "" });
    setRegisterForm({ name: "", age: "", contactNumber: "", password: "" });
    setShowRegister(false);
    setError("");
    setShowStartJourneyForm(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/5 to-background">
      {/* Header */}
      <header className="border-b bg-white/95 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => navigate('/')}
                className="hover:bg-secondary/10"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Home
              </Button>
              <h1 className="text-2xl font-bold text-secondary">Driver Portal</h1>
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
      <main className="container mx-auto px-4 py-12">
        {!isLoggedIn ? (
          // Login/Register Forms
          <div className="max-w-md mx-auto">
            {!showRegister ? (
              // Login Form
              <Card className="shadow-lg border-2">
                <CardHeader className="text-center">
                  <CardTitle className="flex items-center justify-center gap-2">
                    <LogIn className="w-5 h-5 text-secondary" />
                    Driver Login
                  </CardTitle>
                  <CardDescription>
                    Please login to access your dashboard
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {error && (
                    <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                      {error}
                    </div>
                  )}
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="contactNumber">Contact Number</Label>
                      <Input
                        id="contactNumber"
                        type="text"
                        placeholder="Enter your contact number"
                        value={loginForm.contactNumber}
                        onChange={(e) => setLoginForm(prev => ({ ...prev, contactNumber: e.target.value }))}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password">Password</Label>
                      <Input
                        id="password"
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
                      variant="secondary"
                      disabled={loading}
                    >
                      {loading ? 'Logging in...' : 'Login to Dashboard'}
                    </Button>
                  </form>
                  <div className="mt-4 text-center">
                    <Button
                      type="button"
                      variant="link"
                      onClick={() => setShowRegister(true)}
                      className="text-secondary hover:text-secondary/80"
                    >
                      <UserPlus className="w-4 h-4 mr-2" />
                      Don't have an account? Register here
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              // Register Form
              <Card className="shadow-lg border-2">
                <CardHeader className="text-center">
                  <CardTitle className="flex items-center justify-center gap-2">
                    <UserPlus className="w-5 h-5 text-secondary" />
                    Driver Registration
                  </CardTitle>
                  <CardDescription>
                    Create your driver account
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {error && (
                    <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                      {error}
                    </div>
                  )}
                  <form onSubmit={handleRegister} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="regName">Full Name</Label>
                      <Input
                        id="regName"
                        type="text"
                        placeholder="Enter your full name"
                        value={registerForm.name}
                        onChange={(e) => setRegisterForm(prev => ({ ...prev, name: e.target.value }))}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="regAge">Age</Label>
                      <Input
                        id="regAge"
                        type="number"
                        placeholder="Enter your age"
                        value={registerForm.age}
                        onChange={(e) => setRegisterForm(prev => ({ ...prev, age: e.target.value }))}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="regContactNumber">Contact Number</Label>
                      <Input
                        id="regContactNumber"
                        type="text"
                        placeholder="Enter your contact number"
                        value={registerForm.contactNumber}
                        onChange={(e) => setRegisterForm(prev => ({ ...prev, contactNumber: e.target.value }))}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="regPassword">Password</Label>
                      <Input
                        id="regPassword"
                        type="password"
                        placeholder="Create a password"
                        value={registerForm.password}
                        onChange={(e) => setRegisterForm(prev => ({ ...prev, password: e.target.value }))}
                        required
                      />
                    </div>
                    <Button 
                      type="submit" 
                      className="w-full" 
                      variant="secondary"
                      disabled={loading}
                    >
                      {loading ? 'Creating Account...' : 'Create Account'}
                    </Button>
                  </form>
                  <div className="mt-4 text-center">
                    <Button
                      type="button"
                      variant="link"
                      onClick={() => setShowRegister(false)}
                      className="text-secondary hover:text-secondary/80"
                    >
                      Already have an account? Login here
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        ) : (
          // Dashboard
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-foreground mb-2">
                Driver Dashboard
              </h2>
              <p className="text-muted-foreground">
                Welcome back! Manage your profile and start your journey
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              {/* Your Profile Card */}
              <Card className="group hover:shadow-lg transition-all duration-300 border-2 hover:border-secondary/20">
                <CardHeader className="text-center pb-4">
                  <div className="mx-auto mb-4 p-3 bg-secondary/10 rounded-full w-16 h-16 flex items-center justify-center group-hover:bg-secondary/20 transition-colors">
                    <User className="w-8 h-8 text-secondary" />
                  </div>
                  <CardTitle className="text-xl">Your Profile</CardTitle>
                  <CardDescription>
                    View and manage your driver profile information
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center space-y-2">
                    <p><strong>Driver ID:</strong> {driverData?._id || 'N/A'}</p>
                    <p><strong>Name:</strong> {driverData?.name || 'N/A'}</p>
                    <p><strong>Age:</strong> {driverData?.age || 'N/A'}</p>
                    <p><strong>Contact:</strong> {driverData?.contactNumber || 'N/A'}</p>
                    <p><strong>Status:</strong> <span className="text-secondary font-medium">Active</span></p>
                  </div>
                  <Button variant="secondary" className="w-full">
                    Edit Profile
                  </Button>
                </CardContent>
              </Card>

              {/* Journey Card */}
              {journeyStatus !== '1' ? (
                /* Start Journey Card */
                <Card className="group hover:shadow-lg transition-all duration-300 border-2 hover:border-primary/20">
                  <CardHeader className="text-center pb-4">
                    <div className="mx-auto mb-4 p-3 bg-primary/10 rounded-full w-16 h-16 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                      <PlayCircle className="w-8 h-8 text-primary" />
                    </div>
                    <CardTitle className="text-xl">Start Journey</CardTitle>
                    <CardDescription>
                      Begin your assigned route and track your journey
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="text-center space-y-2">
                      <p><strong>Next Route:</strong> Amritsar - Ludhiana</p>
                      <p><strong>Bus No:</strong> PB-02-A-1234</p>
                      <p><strong>Departure:</strong> 09:00 AM</p>
                      <p><strong>Status:</strong> <span className="text-primary font-medium">Ready</span></p>
                    </div>
                    <Button 
                      className="w-full bg-gradient-to-r from-primary to-primary-glow hover:from-primary-glow hover:to-primary"
                      onClick={handleStartJourneyClick}
                    >
                      Start Journey
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                /* Active Journey Card */
                <Card className="group hover:shadow-lg transition-all duration-300 border-2 hover:border-green-500/20">
                  <CardHeader className="text-center pb-4">
                    <div className="mx-auto mb-4 p-3 bg-green-500/10 rounded-full w-16 h-16 flex items-center justify-center group-hover:bg-green-500/20 transition-colors">
                      <PlayCircle className="w-8 h-8 text-green-500" />
                    </div>
                    <CardTitle className="text-xl">Active Journey</CardTitle>
                    <CardDescription>
                      Your journey is currently in progress
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="text-center space-y-2">
                      <p><strong>Route:</strong> {activeJourney?.startingPlace} - {activeJourney?.destination}</p>
                      <p><strong>Bus No:</strong> {activeJourney?.busNumberPlate}</p>
                      <p><strong>Bus Name:</strong> {activeJourney?.busName}</p>
                      <p><strong>Status:</strong> <span className="text-green-500 font-medium">In Progress</span></p>
                    </div>
                    <Button 
                      className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white"
                      onClick={async () => {
                        try {
                          // Stop the setInterval directly from frontend
                          if (locationIntervalId) {
                            clearInterval(locationIntervalId);
                            setLocationIntervalId(null);
                            console.log('Location tracking stopped');
                          }
                          
                          // Disconnect socket
                          if (socket) {
                            socket.disconnect();
                            setSocket(null);
                          }
                          
                          // Call deactivate bus route
                          const busNumberPlate = localStorage.getItem('driverBusNumberPlate');
                          if (busNumberPlate) {
                            const response = await fetch(`http://localhost:3001/api/driver/deactivate-bus/${busNumberPlate}`, {
                              method: 'POST',
                              headers: {
                                'Content-Type': 'application/json'
                              }
                            });
                            
                            const data = await response.json();
                            if (data.success) {
                              console.log('Bus deactivated successfully:', data.message);
                            } else {
                              console.error('Error deactivating bus:', data.message);
                            }
                          }
                          
                          // Reset journey state
                          alert('Destination reached! Journey completed.');
                          setIsJourneyActive(false);
                          setActiveJourney(null);
                          
                          // Set journey status to inactive in localStorage
                          localStorage.setItem('driverJourneyStatus', '0');
                          setJourneyStatus('0');
                          localStorage.removeItem('driverBusNumberPlate');
                        } catch (error) {
                          console.error('Error in destination reached process:', error);
                          alert('Error completing journey. Please try again.');
                        }
                      }}
                    >
                      Destination Reached
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        )}

        {/* Start Journey Form Modal */}
        {showStartJourneyForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-secondary">Start Journey</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowStartJourneyForm(false);
                    clearRoutes();
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </Button>
              </div>
              
              <form onSubmit={handleJourneySubmit} className="space-y-4">
                {error && (
                  <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                    {error}
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="journeyDriverName">Driver Name</Label>
                  <Input
                    id="journeyDriverName"
                    type="text"
                    value={journeyForm.driverName}
                    onChange={(e) => handleJourneyFormChange('driverName', e.target.value)}
                    disabled
                    className="bg-gray-100"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="journeyDriverId">Driver ID</Label>
                  <Input
                    id="journeyDriverId"
                    type="text"
                    value={journeyForm.driverId}
                    onChange={(e) => handleJourneyFormChange('driverId', e.target.value)}
                    disabled
                    className="bg-gray-100"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="journeyBusNo">Bus Number</Label>
                  <Input
                    id="journeyBusNo"
                    type="text"
                    placeholder="Enter bus number (e.g., PB-02-A-1234)"
                    value={journeyForm.busNo}
                    onChange={(e) => handleJourneyFormChange('busNo', e.target.value)}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="journeyStartingPlace">Starting Place</Label>
                  <Select
                    value={journeyForm.startingPlace}
                    onValueChange={(value) => handleJourneyFormChange('startingPlace', value)}
                    disabled={!journeyForm.busNo || routesLoading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={
                        routesLoading ? "Loading places..." : 
                        !journeyForm.busNo ? "Enter bus number first" :
                        startingPlaces.length === 0 ? "No places found" :
                        "Select starting place"
                      } />
                    </SelectTrigger>
                    <SelectContent>
                      {startingPlaces.map((place, index) => (
                        <SelectItem key={index} value={place}>
                          {place}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {routesError && (
                    <p className="text-sm text-red-600">{routesError}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="journeyDestination">Destination</Label>
                  <Select
                    value={journeyForm.destination}
                    onValueChange={(value) => handleJourneyFormChange('destination', value)}
                    disabled={!journeyForm.busNo || routesLoading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={
                        routesLoading ? "Loading destinations..." : 
                        !journeyForm.busNo ? "Enter bus number first" :
                        destinations.length === 0 ? "No destinations found" :
                        "Select destination"
                      } />
                    </SelectTrigger>
                    <SelectContent>
                      {destinations.map((destination, index) => (
                        <SelectItem key={index} value={destination}>
                          {destination}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {routesError && (
                    <p className="text-sm text-red-600">{routesError}</p>
                  )}
                </div>
                
                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowStartJourneyForm(false);
                      clearRoutes();
                    }}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 bg-gradient-to-r from-primary to-primary-glow hover:from-primary-glow hover:to-primary"
                    disabled={loading}
                  >
                    {loading ? 'Starting Journey...' : 'Submit'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default DriverPortal;