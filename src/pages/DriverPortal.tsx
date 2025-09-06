import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, User, PlayCircle, LogIn } from "lucide-react";
import { useNavigate } from "react-router-dom";

const DriverPortal = () => {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loginForm, setLoginForm] = useState({ username: "", password: "" });

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (loginForm.username && loginForm.password) {
      setIsLoggedIn(true);
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setLoginForm({ username: "", password: "" });
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
          // Login Form
          <div className="max-w-md mx-auto">
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
                  <Button type="submit" className="w-full" variant="secondary">
                    Login to Dashboard
                  </Button>
                </form>
              </CardContent>
            </Card>
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
                    <p><strong>Driver ID:</strong> DRV001</p>
                    <p><strong>Name:</strong> {loginForm.username}</p>
                    <p><strong>License:</strong> PB-12345678</p>
                    <p><strong>Status:</strong> <span className="text-secondary font-medium">Active</span></p>
                  </div>
                  <Button variant="secondary" className="w-full">
                    Edit Profile
                  </Button>
                </CardContent>
              </Card>

              {/* Start Journey Card */}
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
                  <Button className="w-full bg-gradient-to-r from-primary to-primary-glow hover:from-primary-glow hover:to-primary">
                    Start Journey
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default DriverPortal;