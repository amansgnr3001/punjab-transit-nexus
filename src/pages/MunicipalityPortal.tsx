import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, User, LogIn, Bus, Route, Calendar } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";

const MunicipalityPortal = () => {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loginForm, setLoginForm] = useState({ username: "", password: "" });
  const [activeSection, setActiveSection] = useState("dashboard");

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
            <h3 className="text-2xl font-bold mb-4">Bus Management</h3>
            <p className="text-muted-foreground">Manage bus fleet and vehicle information.</p>
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