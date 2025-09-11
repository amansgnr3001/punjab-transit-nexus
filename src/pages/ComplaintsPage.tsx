import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, MessageSquare, Clock, MapPin, Bus, Calendar, Loader2, RefreshCw } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useComplaints } from "@/hooks/useComplaints";

const ComplaintsPage = () => {
  const navigate = useNavigate();
  const { complaints, loading, error, refetch } = useComplaints();
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const isNewComplaint = (createdAt: string) => {
    const today = new Date();
    const twoDaysAgo = new Date(today.getTime() - (2 * 24 * 60 * 60 * 1000));
    const complaintDate = new Date(createdAt);
    return complaintDate >= twoDaysAgo;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getRelativeTime = (createdAt: string) => {
    const now = new Date();
    const complaintDate = new Date(createdAt);
    const diffInHours = Math.floor((now.getTime() - complaintDate.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Button 
              variant="ghost" 
              onClick={() => navigate('/municipality-portal')}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
            
            {/* Center - Title */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <MessageSquare className="w-4 h-4 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">Complaint Register</h1>
                <p className="text-sm text-gray-500">Passenger feedback management</p>
              </div>
            </div>
            
            {/* Right Side - Refresh Button */}
            <Button 
              variant="ghost" 
              size="sm"
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
            >
              {refreshing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
              Refresh
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-1">
                All Complaints
              </h2>
              <p className="text-gray-600">
                {complaints.length} complaint{complaints.length !== 1 ? 's' : ''} received
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm text-gray-500">Live updates</span>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-16">
            <div className="text-center">
              <Loader2 className="w-6 h-6 animate-spin mx-auto mb-3 text-gray-400" />
              <p className="text-gray-500 text-sm">Loading complaints...</p>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 bg-red-100 rounded-full flex items-center justify-center">
                <MessageSquare className="w-3 h-3 text-red-600" />
              </div>
              <div>
                <h3 className="font-medium text-red-800 text-sm">Error Loading Complaints</h3>
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Complaints List */}
        {!loading && !error && (
          <div className="space-y-3">
            {complaints.length === 0 ? (
              <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
                <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No complaints yet</h3>
                <p className="text-gray-500">Complaints will appear here when passengers submit feedback.</p>
              </div>
            ) : (
              complaints.map((complaint) => (
                <div key={complaint._id} className="bg-white rounded-lg border border-gray-200 hover:border-gray-300 hover:shadow-lg hover:shadow-gray-100 transition-all duration-300 ease-in-out transform hover:-translate-y-1 hover:scale-[1.02] cursor-pointer group">
                  <div className="p-6">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center group-hover:bg-orange-200 transition-colors duration-300">
                          <MessageSquare className="w-4 h-4 text-orange-600 group-hover:text-orange-700 transition-colors duration-300" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium text-gray-900 group-hover:text-gray-800 transition-colors duration-300">
                              Complaint #{complaint._id.slice(-6).toUpperCase()}
                            </h3>
                            {isNewComplaint(complaint.createdAt) && (
                              <Badge variant="destructive" className="text-xs px-2 py-0.5 group-hover:bg-red-600 transition-colors duration-300">
                                NEW
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-500 group-hover:text-gray-600 transition-colors duration-300">
                            {getRelativeTime(complaint.createdAt)} • {formatDate(complaint.createdAt)}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Route Information */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg group-hover:bg-blue-50 transition-colors duration-300">
                        <Bus className="w-4 h-4 text-gray-600 group-hover:text-blue-600 transition-colors duration-300" />
                        <div>
                          <p className="text-xs text-gray-500 uppercase tracking-wide group-hover:text-blue-500 transition-colors duration-300">Bus</p>
                          <p className="font-medium text-gray-900 group-hover:text-blue-900 transition-colors duration-300">{complaint.busnumberplate}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg group-hover:bg-green-50 transition-colors duration-300">
                        <MapPin className="w-4 h-4 text-gray-600 group-hover:text-green-600 transition-colors duration-300" />
                        <div>
                          <p className="text-xs text-gray-500 uppercase tracking-wide group-hover:text-green-500 transition-colors duration-300">From</p>
                          <p className="font-medium text-gray-900 group-hover:text-green-900 transition-colors duration-300">{complaint.startingplace}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg group-hover:bg-purple-50 transition-colors duration-300">
                        <MapPin className="w-4 h-4 text-gray-600 group-hover:text-purple-600 transition-colors duration-300" />
                        <div>
                          <p className="text-xs text-gray-500 uppercase tracking-wide group-hover:text-purple-500 transition-colors duration-300">To</p>
                          <p className="font-medium text-gray-900 group-hover:text-purple-900 transition-colors duration-300">{complaint.destination}</p>
                        </div>
                      </div>
                    </div>

                    {/* Description */}
                    <div className="border-t border-gray-100 pt-4 group-hover:border-gray-200 transition-colors duration-300">
                      <h4 className="text-sm font-medium text-gray-900 mb-2 group-hover:text-gray-800 transition-colors duration-300">Description</h4>
                      <p className="text-gray-700 text-sm leading-relaxed group-hover:text-gray-800 transition-colors duration-300">{complaint.description}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default ComplaintsPage;
