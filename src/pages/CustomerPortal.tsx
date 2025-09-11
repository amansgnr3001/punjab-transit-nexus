import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ArrowLeft, Calendar, MapPin, Navigation, Loader2, Search, Bus, MessageSquare, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { usePlaces } from "@/hooks/usePlaces";
import { useBusSearch } from "@/hooks/useBusSearch";
import { useBusNumberPlates } from "@/hooks/useBusNumberPlates";
import { useBusPlaces } from "@/hooks/useBusPlaces";

const CustomerPortal = () => {
  const navigate = useNavigate();
  const [selectedDay, setSelectedDay] = useState("");
  const [startingPoint, setStartingPoint] = useState("");
  const [destination, setDestination] = useState("");
  const [showComplaintForm, setShowComplaintForm] = useState(false);
  const [complaintForm, setComplaintForm] = useState({
    busnumberplate: "",
    startingplace: "",
    destination: "",
    description: ""
  });
  const [submittingComplaint, setSubmittingComplaint] = useState(false);

  // Use the custom hooks
  const { places, loading: placesLoading, error: placesError } = usePlaces();
  const { searchBuses, loading: searchLoading, error: searchError } = useBusSearch();
  const { busNumberPlates, loading: busPlatesLoading, error: busPlatesError } = useBusNumberPlates();
  const { places: busPlaces, loading: busPlacesLoading, error: busPlacesError } = useBusPlaces(complaintForm.busnumberplate);

  const daysOfWeek = [
    "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"
  ];

  const handleSearch = async () => {
    if (!selectedDay || !startingPoint || !destination) {
      return;
    }

    try {
      const searchResponse = await searchBuses(selectedDay, startingPoint, destination);
      
      // Navigate to results page with the search results and parameters
      navigate('/bus-search-results', {
        state: {
          searchResponse,
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

  // All Buses function - navigate to bus list page
  const handleAllBuses = () => {
    navigate('/customer-bus-list');
    console.log('All Buses button clicked - navigating to bus list');
  };

  const handleComplain = () => {
    setShowComplaintForm(true);
    console.log('Complain button clicked - opening form');
  };

  const handleComplaintFormChange = (field: string, value: string) => {
    setComplaintForm(prev => {
      const newForm = {
        ...prev,
        [field]: value
      };
      
      // Clear starting place and destination when bus number plate changes
      if (field === 'busnumberplate') {
        newForm.startingplace = '';
        newForm.destination = '';
      }
      
      return newForm;
    });
  };

  const handleComplaintSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (!complaintForm.busnumberplate || !complaintForm.startingplace || !complaintForm.destination || !complaintForm.description) {
      alert('Please fill in all required fields');
      return;
    }
    
    setSubmittingComplaint(true);
    
    try {
      const response = await fetch('http://localhost:3002/api/passenger/complaint', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          busnumberplate: complaintForm.busnumberplate,
          startingplace: complaintForm.startingplace,
          destination: complaintForm.destination,
          description: complaintForm.description
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        alert('Complaint submitted successfully!');
        console.log('Complaint submitted:', data);
        
        // Close form and reset
        setShowComplaintForm(false);
        setComplaintForm({
          busnumberplate: "",
          startingplace: "",
          destination: "",
          description: ""
        });
        
        // Redirect to passenger portal dashboard
        navigate('/customer-portal');
      } else {
        alert(`Failed to submit complaint: ${data.message || data.error || 'Unknown error'}`);
        console.error('Complaint submission failed:', data);
      }
    } catch (error) {
      console.error('Error submitting complaint:', error);
      alert('Network error. Please try again.');
    } finally {
      setSubmittingComplaint(false);
    }
  };

  const handleCloseComplaintForm = () => {
    setShowComplaintForm(false);
    setComplaintForm({
      busnumberplate: "",
      startingplace: "",
      destination: "",
      description: ""
    });
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
            
            {/* Center - Government of Punjab */}
            <div className="flex items-center gap-3">
              {/* Punjab Government Official Logo */}
              <div className="w-24 h-24 flex items-center justify-center">
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
                <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center" style={{display: 'none'}}>
                  <span className="text-white font-bold text-2xl">P</span>
                </div>
              </div>
              <div className="text-center">
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 via-cyan-600 to-indigo-600 bg-clip-text text-transparent">PUNJAB TRANSPORT</h1>
                <p className="text-sm text-gray-600 font-medium">Customer Portal</p>
              </div>
              {/* PUNBUS Logo */}
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
            
            {/* Right Side - Spacer for balance */}
            <div className="w-32"></div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Side Panel */}
          <div className="w-full lg:w-64 flex-shrink-0">
            <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-semibold text-gray-800">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  onClick={handleAllBuses}
                  className="w-full justify-start bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white shadow-md"
                >
                  <Bus className="w-5 h-5 mr-3" />
                  All Buses
                </Button>
                <Button 
                  onClick={handleComplain}
                  variant="outline"
                  className="w-full justify-start border-gray-300 hover:bg-gray-50 text-gray-700"
                >
                  <MessageSquare className="w-5 h-5 mr-3" />
                  Complain
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Main Content Area */}
          <div className="flex-1 max-w-2xl">
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
        </div>
      </main>

      {/* Complaint Form Modal */}
      <Dialog open={showComplaintForm} onOpenChange={setShowComplaintForm}>
        <DialogContent className="max-w-md mx-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl font-bold text-gray-800">
              <MessageSquare className="w-5 h-5 text-blue-600" />
              Submit Complaint
            </DialogTitle>
            <DialogDescription className="text-gray-600">
              Please provide details about your complaint regarding the bus service.
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleComplaintSubmit} className="space-y-4">
            {/* Bus Number Plate */}
            <div className="space-y-2">
              <Label htmlFor="busnumberplate" className="text-sm font-medium text-gray-700">
                Bus Number Plate *
              </Label>
              <Select 
                value={complaintForm.busnumberplate} 
                onValueChange={(value) => handleComplaintFormChange('busnumberplate', value)}
              >
                <SelectTrigger className="border-gray-300 focus:border-blue-500 focus:ring-blue-500">
                  <SelectValue placeholder="Select a bus number plate" />
                </SelectTrigger>
                <SelectContent>
                  {busPlatesLoading ? (
                    <SelectItem value="loading" disabled>
                      <div className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Loading buses...
                      </div>
                    </SelectItem>
                  ) : busPlatesError ? (
                    <SelectItem value="error" disabled>
                      Error loading buses
                    </SelectItem>
                  ) : busNumberPlates.length === 0 ? (
                    <SelectItem value="no-buses" disabled>
                      No buses available
                    </SelectItem>
                  ) : (
                    busNumberPlates.map((plate) => (
                      <SelectItem key={plate} value={plate}>
                        {plate}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Starting Place */}
            <div className="space-y-2">
              <Label htmlFor="startingplace" className="text-sm font-medium text-gray-700">
                Starting Place *
              </Label>
              <Select 
                value={complaintForm.startingplace} 
                onValueChange={(value) => handleComplaintFormChange('startingplace', value)}
                disabled={!complaintForm.busnumberplate || busPlacesLoading}
              >
                <SelectTrigger className="border-gray-300 focus:border-blue-500 focus:ring-blue-500">
                  <SelectValue placeholder={
                    !complaintForm.busnumberplate 
                      ? "Select a bus first" 
                      : busPlacesLoading 
                        ? "Loading places..." 
                        : "Select starting place"
                  } />
                </SelectTrigger>
                <SelectContent>
                  {!complaintForm.busnumberplate ? (
                    <SelectItem value="no-bus" disabled>
                      Please select a bus number plate first
                    </SelectItem>
                  ) : busPlacesLoading ? (
                    <SelectItem value="loading" disabled>
                      <div className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Loading places...
                      </div>
                    </SelectItem>
                  ) : busPlacesError ? (
                    <SelectItem value="error" disabled>
                      Error loading places
                    </SelectItem>
                  ) : busPlaces.length === 0 ? (
                    <SelectItem value="no-places" disabled>
                      No places available for this bus
                    </SelectItem>
                  ) : (
                    busPlaces.map((place) => (
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
              <Label htmlFor="destination" className="text-sm font-medium text-gray-700">
                Destination *
              </Label>
              <Select 
                value={complaintForm.destination} 
                onValueChange={(value) => handleComplaintFormChange('destination', value)}
                disabled={!complaintForm.busnumberplate || busPlacesLoading}
              >
                <SelectTrigger className="border-gray-300 focus:border-blue-500 focus:ring-blue-500">
                  <SelectValue placeholder={
                    !complaintForm.busnumberplate 
                      ? "Select a bus first" 
                      : busPlacesLoading 
                        ? "Loading places..." 
                        : "Select destination"
                  } />
                </SelectTrigger>
                <SelectContent>
                  {!complaintForm.busnumberplate ? (
                    <SelectItem value="no-bus" disabled>
                      Please select a bus number plate first
                    </SelectItem>
                  ) : busPlacesLoading ? (
                    <SelectItem value="loading" disabled>
                      <div className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Loading places...
                      </div>
                    </SelectItem>
                  ) : busPlacesError ? (
                    <SelectItem value="error" disabled>
                      Error loading places
                    </SelectItem>
                  ) : busPlaces.length === 0 ? (
                    <SelectItem value="no-places" disabled>
                      No places available for this bus
                    </SelectItem>
                  ) : (
                    busPlaces.map((place) => (
                      <SelectItem key={place} value={place}>
                        {place}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description" className="text-sm font-medium text-gray-700">
                Complaint Description *
              </Label>
              <Textarea
                id="description"
                placeholder="Please describe your complaint in detail..."
                value={complaintForm.description}
                onChange={(e) => handleComplaintFormChange('description', e.target.value)}
                required
                rows={4}
                className="border-gray-300 focus:border-blue-500 focus:ring-blue-500 resize-none"
              />
            </div>

            {/* Form Actions */}
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleCloseComplaintForm}
                className="flex-1 border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submittingComplaint}
                className="flex-1 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submittingComplaint ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  'Submit Complaint'
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CustomerPortal;