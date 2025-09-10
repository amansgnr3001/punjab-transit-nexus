import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Calendar, MapPin, Navigation, Loader2, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { usePlaces } from "@/hooks/usePlaces";
import { useBusSearch } from "@/hooks/useBusSearch";

const CustomerPortal = () => {
  const navigate = useNavigate();
  const [selectedDay, setSelectedDay] = useState("");
  const [startingPoint, setStartingPoint] = useState("");
  const [destination, setDestination] = useState("");

  // Use the custom hooks
  const { places, loading: placesLoading, error: placesError } = usePlaces();
  const { searchBuses, loading: searchLoading, error: searchError } = useBusSearch();

  const daysOfWeek = [
    "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"
  ];

  const handleSearch = async () => {
    if (!selectedDay || !startingPoint || !destination) {
      return;
    }

    try {
      const buses = await searchBuses(selectedDay, startingPoint, destination);
      
      // Navigate to results page with the search results and parameters
      navigate('/bus-search-results', {
        state: {
          buses,
          searchParams: {
            day: selectedDay,
            startingPoint,
            destination
          }
        }
      });
    } catch (error) {
      console.error('Search failed:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-indigo-100">
      {/* Header */}
      <header className="bg-gradient-to-r from-white via-blue-50 to-cyan-50 backdrop-blur-md shadow-lg border-b border-blue-200">
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
            
            {/* Center - Customer Portal Title */}
            <div className="text-center">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-cyan-600 to-indigo-600 bg-clip-text text-transparent">Customer Portal</h1>
              <p className="text-sm text-gray-600 font-medium">Plan Your Journey</p>
            </div>
            
            {/* Right Side - Spacer for balance */}
            <div className="w-32"></div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-cyan-600 to-indigo-600 bg-clip-text text-transparent mb-2">
              Plan Your Journey
            </h2>
            <p className="text-xl text-gray-600">
              Select your travel preferences to find the best bus routes
            </p>
          </div>

          <Card className="shadow-2xl border-0 bg-gradient-to-br from-white to-blue-50 backdrop-blur-sm">
            <CardHeader className="text-center pb-6 pt-8">
              <CardTitle className="flex items-center justify-center gap-2 text-2xl font-bold text-gray-800">
                <Navigation className="w-6 h-6 text-blue-600" />
                Journey Planner
              </CardTitle>
              <CardDescription className="text-gray-600 text-base">
                Choose your day and route preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pb-8">
              {/* Day Selection */}
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2 text-gray-700">
                  <Calendar className="w-4 h-4 text-blue-600" />
                  Day of the Week
                </label>
                <Select value={selectedDay} onValueChange={setSelectedDay}>
                  <SelectTrigger className="w-full border-blue-200 focus:border-blue-400">
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
                <label className="text-sm font-medium flex items-center gap-2 text-gray-700">
                  <MapPin className="w-4 h-4 text-cyan-600" />
                  Starting Point
                </label>
                <Select value={startingPoint} onValueChange={setStartingPoint} disabled={placesLoading}>
                  <SelectTrigger className="w-full border-cyan-200 focus:border-cyan-400">
                    <SelectValue placeholder={placesLoading ? "Loading places..." : "Select starting location"} />
                  </SelectTrigger>
                  <SelectContent>
                    {placesLoading ? (
                      <div className="flex items-center justify-center p-4">
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        Loading places...
                      </div>
                    ) : placesError ? (
                      <div className="p-4 text-center text-red-500">
                        Error loading places
                      </div>
                    ) : (
                      places.map((place) => (
                        <SelectItem key={place} value={place}>
                          {place}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              {/* Destination */}
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2 text-gray-700">
                  <Navigation className="w-4 h-4 text-indigo-600" />
                  Destination
                </label>
                <Select value={destination} onValueChange={setDestination} disabled={placesLoading}>
                  <SelectTrigger className="w-full border-indigo-200 focus:border-indigo-400">
                    <SelectValue placeholder={placesLoading ? "Loading places..." : "Select destination"} />
                  </SelectTrigger>
                  <SelectContent>
                    {placesLoading ? (
                      <div className="flex items-center justify-center p-4">
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        Loading places...
                      </div>
                    ) : placesError ? (
                      <div className="p-4 text-center text-red-500">
                        Error loading places
                      </div>
                    ) : (
                      places.map((place) => (
                        <SelectItem key={place} value={place}>
                          {place}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              {/* Search Button */}
              <Button 
                className="w-full mt-6 bg-gradient-to-r from-blue-500 via-cyan-500 to-indigo-500 hover:from-blue-600 hover:via-cyan-600 hover:to-indigo-600 text-white font-semibold py-3 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                disabled={!selectedDay || !startingPoint || !destination || searchLoading}
                onClick={handleSearch}
              >
                {searchLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Searching...
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4 mr-2" />
                    Search Bus Routes
                  </>
                )}
              </Button>

              {/* Search Error */}
              {searchError && (
                <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
                  {searchError}
                </div>
              )}

              {/* Selection Summary */}
              {(selectedDay || startingPoint || destination) && (
                <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl border border-blue-200">
                  <h3 className="font-semibold mb-2 text-gray-800">Your Selection:</h3>
                  <div className="space-y-1 text-sm text-gray-600">
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