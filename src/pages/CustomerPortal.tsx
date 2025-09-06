import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Calendar, MapPin, Navigation } from "lucide-react";
import { useNavigate } from "react-router-dom";

const CustomerPortal = () => {
  const navigate = useNavigate();
  const [selectedDay, setSelectedDay] = useState("");
  const [startingPoint, setStartingPoint] = useState("");
  const [destination, setDestination] = useState("");

  const daysOfWeek = [
    "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"
  ];

  const locations = [
    "Amritsar", "Ludhiana", "Jalandhar", "Patiala", "Bathinda", 
    "Mohali", "Pathankot", "Hoshiarpur", "Kapurthala", "Moga"
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent/20 to-background">
      {/* Header */}
      <header className="border-b bg-white/95 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigate('/')}
              className="hover:bg-primary/10"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
            <h1 className="text-2xl font-bold text-primary">Customer Portal</h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-foreground mb-2">
              Plan Your Journey
            </h2>
            <p className="text-muted-foreground">
              Select your travel preferences to find the best bus routes
            </p>
          </div>

          <Card className="shadow-lg border-2">
            <CardHeader className="text-center">
              <CardTitle className="flex items-center justify-center gap-2">
                <Navigation className="w-5 h-5 text-primary" />
                Journey Planner
              </CardTitle>
              <CardDescription>
                Choose your day and route preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Day Selection */}
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-primary" />
                  Day of the Week
                </label>
                <Select value={selectedDay} onValueChange={setSelectedDay}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a day" />
                  </SelectTrigger>
                  <SelectContent>
                    {daysOfWeek.map((day) => (
                      <SelectItem key={day} value={day}>
                        {day}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Starting Point */}
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-secondary" />
                  Starting Point
                </label>
                <Select value={startingPoint} onValueChange={setStartingPoint}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select starting location" />
                  </SelectTrigger>
                  <SelectContent>
                    {locations.map((location) => (
                      <SelectItem key={location} value={location}>
                        {location}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Destination */}
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Navigation className="w-4 h-4 text-government-green" />
                  Destination
                </label>
                <Select value={destination} onValueChange={setDestination}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select destination" />
                  </SelectTrigger>
                  <SelectContent>
                    {locations.map((location) => (
                      <SelectItem key={location} value={location}>
                        {location}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Search Button */}
              <Button 
                className="w-full mt-6 bg-gradient-to-r from-primary to-primary-glow hover:from-primary-glow hover:to-primary"
                disabled={!selectedDay || !startingPoint || !destination}
              >
                Search Bus Routes
              </Button>

              {/* Selection Summary */}
              {(selectedDay || startingPoint || destination) && (
                <div className="mt-6 p-4 bg-accent/50 rounded-lg">
                  <h3 className="font-medium mb-2">Your Selection:</h3>
                  <div className="space-y-1 text-sm">
                    {selectedDay && <p><strong>Day:</strong> {selectedDay}</p>}
                    {startingPoint && <p><strong>From:</strong> {startingPoint}</p>}
                    {destination && <p><strong>To:</strong> {destination}</p>}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default CustomerPortal;