import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { Truck, Users, Building2, MapPin, Clock, Shield, ArrowRight } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-indigo-100">
      {/* Header */}
      <header className="bg-gradient-to-r from-white via-blue-50 to-cyan-50 backdrop-blur-md shadow-lg border-b border-blue-200">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            {/* Left Side - Logo and Government Text */}
            <div className="flex items-center gap-4">
              {/* Official Punjab Government Logo */}
              <div className="w-16 h-16 flex items-center justify-center">
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
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center" style={{display: 'none'}}>
                  <span className="text-white font-bold text-lg">P</span>
                </div>
              </div>
              
              {/* Government Text */}
              <div className="text-left">
                <p className="text-sm text-gray-700 font-medium">Government of Punjab</p>
                <p className="text-sm text-gray-600 font-medium">ਪੰਜਾਬ ਸਰਕਾਰ</p>
              </div>
            </div>

            {/* Center - Main Title */}
            <div className="text-center">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-cyan-600 to-indigo-600 bg-clip-text text-transparent">Punjab Transit Nexus</h1>
            </div>

            {/* Right Side - Tracking/Road Image */}
            <div className="flex items-center justify-center">
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
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 via-cyan-600 to-indigo-600 text-white relative overflow-hidden">
        <div className="container mx-auto px-4 text-center relative z-10">
          <h2 className="text-5xl font-bold mb-6 leading-tight">
            Modern Transportation
            <span className="block text-cyan-200">Management System</span>
          </h2>
          <p className="text-xl text-blue-100 max-w-3xl mx-auto mb-8 leading-relaxed">
            Experience seamless bus tracking, real-time updates, and efficient route management 
            across Punjab with our state-of-the-art transportation portal.
          </p>
          
          {/* Feature Highlights */}
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto mt-12">
            <div className="flex items-center gap-3 text-left bg-white/20 backdrop-blur-sm rounded-2xl p-4 hover:bg-white/30 transition-all duration-300 border border-white/30">
              <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg">
                <MapPin className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-white">Real-time Tracking</h3>
                <p className="text-sm text-blue-100">Live bus locations</p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-left bg-white/20 backdrop-blur-sm rounded-2xl p-4 hover:bg-white/30 transition-all duration-300 border border-white/30">
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-green-500 rounded-full flex items-center justify-center shadow-lg">
                <Clock className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-white">Accurate Timings</h3>
                <p className="text-sm text-blue-100">Precise arrival times</p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-left bg-white/20 backdrop-blur-sm rounded-2xl p-4 hover:bg-white/30 transition-all duration-300 border border-white/30">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-indigo-500 rounded-full flex items-center justify-center shadow-lg">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-white">Secure & Reliable</h3>
                <p className="text-sm text-blue-100">Government certified</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Decorative Elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute top-10 left-10 w-20 h-20 bg-white/20 rounded-full blur-xl"></div>
          <div className="absolute top-20 right-20 w-32 h-32 bg-cyan-300/30 rounded-full blur-2xl"></div>
          <div className="absolute bottom-20 left-1/4 w-24 h-24 bg-blue-300/30 rounded-full blur-xl"></div>
          <div className="absolute bottom-10 right-10 w-16 h-16 bg-indigo-300/30 rounded-full blur-lg"></div>
        </div>
      </section>

      {/* Portal Selection */}
      <main className="container mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-cyan-600 to-indigo-600 bg-clip-text text-transparent mb-4">
            Access Your Portal
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Choose your role to access the appropriate transportation management interface
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {/* Customer Portal */}
          <Card className="group hover:shadow-2xl transition-all duration-500 border-0 bg-gradient-to-br from-blue-50 to-cyan-50 backdrop-blur-sm hover:from-blue-100 hover:to-cyan-100 hover:scale-105 shadow-lg border border-blue-200">
            <CardHeader className="text-center pb-6 pt-8">
              <div className="mx-auto mb-6 p-4 bg-gradient-to-br from-blue-500 via-cyan-500 to-teal-500 rounded-2xl w-20 h-20 flex items-center justify-center group-hover:from-blue-600 group-hover:to-teal-600 transition-all duration-300 shadow-xl">
                <Users className="w-10 h-10 text-white" />
              </div>
              <CardTitle className="text-2xl font-bold text-gray-800 mb-3">Customer Portal</CardTitle>
              <CardDescription className="text-gray-600 text-base leading-relaxed">
                Plan your journey, track buses in real-time, and get accurate arrival times for seamless travel across Punjab
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center pb-8">
              <Button 
                onClick={() => navigate('/customer')}
                className="w-full bg-gradient-to-r from-blue-500 via-cyan-500 to-teal-500 hover:from-blue-600 hover:via-cyan-600 hover:to-teal-600 text-white font-semibold py-3 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 group"
              >
                Access Customer Portal
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </CardContent>
          </Card>

          {/* Driver Portal */}
          <Card className="group hover:shadow-2xl transition-all duration-500 border-0 bg-gradient-to-br from-emerald-50 to-green-50 backdrop-blur-sm hover:from-emerald-100 hover:to-green-100 hover:scale-105 shadow-lg border border-emerald-200">
            <CardHeader className="text-center pb-6 pt-8">
              <div className="mx-auto mb-6 p-4 bg-gradient-to-br from-emerald-500 via-green-500 to-lime-500 rounded-2xl w-20 h-20 flex items-center justify-center group-hover:from-emerald-600 group-hover:to-lime-600 transition-all duration-300 shadow-xl">
                <Truck className="w-10 h-10 text-white" />
              </div>
              <CardTitle className="text-2xl font-bold text-gray-800 mb-3">Driver Portal</CardTitle>
              <CardDescription className="text-gray-600 text-base leading-relaxed">
                Start journeys, share real-time location updates, and manage your bus routes efficiently
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center pb-8">
              <Button 
                onClick={() => navigate('/driver')}
                className="w-full bg-gradient-to-r from-emerald-500 via-green-500 to-lime-500 hover:from-emerald-600 hover:via-green-600 hover:to-lime-600 text-white font-semibold py-3 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 group"
              >
                Access Driver Portal
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </CardContent>
          </Card>

          {/* Municipality Portal */}
          <Card className="group hover:shadow-2xl transition-all duration-500 border-0 bg-gradient-to-br from-purple-50 to-indigo-50 backdrop-blur-sm hover:from-purple-100 hover:to-indigo-100 hover:scale-105 shadow-lg border border-purple-200">
            <CardHeader className="text-center pb-6 pt-8">
              <div className="mx-auto mb-6 p-4 bg-gradient-to-br from-indigo-500 via-purple-500 to-violet-500 rounded-2xl w-20 h-20 flex items-center justify-center group-hover:from-indigo-600 group-hover:to-violet-600 transition-all duration-300 shadow-xl">
                <Building2 className="w-10 h-10 text-white" />
              </div>
              <CardTitle className="text-2xl font-bold text-gray-800 mb-3">Municipality Portal</CardTitle>
              <CardDescription className="text-gray-600 text-base leading-relaxed">
                Manage bus routes, schedules, and administrative functions for efficient transportation operations
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center pb-8">
              <Button 
                onClick={() => navigate('/municipality')}
                className="w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-violet-500 hover:from-indigo-600 hover:via-purple-600 hover:to-violet-600 text-white font-semibold py-3 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 group"
              >
                Access Municipality Portal
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gradient-to-r from-blue-600 via-cyan-600 to-indigo-600 text-white py-8 mt-20">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <p className="text-blue-100 text-sm">
              © 2024 Government of Punjab. All rights reserved. | 
              <span className="text-white font-semibold ml-1">Punjab Transit Nexus</span>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;