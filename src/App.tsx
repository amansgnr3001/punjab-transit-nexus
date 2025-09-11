import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import CustomerPortal from "./pages/CustomerPortal";
import BusSearchResults from "./pages/BusSearchResults";
import BusTrackingPage from "./pages/BusTrackingPage";
import DriverPortal from "./pages/DriverPortal";
import MunicipalityPortal from "./pages/MunicipalityPortal";
import BusListPage from "./pages/BusListPage";
import CustomerBusListPage from "./pages/CustomerBusListPage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/customer" element={<CustomerPortal />} />
          <Route path="/customer-portal" element={<CustomerPortal />} />
          <Route path="/bus-search-results" element={<BusSearchResults />} />
          <Route path="/track-bus/:busNumberPlate" element={<BusTrackingPage />} />
          <Route path="/driver" element={<DriverPortal />} />
          <Route path="/municipality" element={<MunicipalityPortal />} />
          <Route path="/municipality-portal" element={<MunicipalityPortal />} />
          <Route path="/bus-list" element={<BusListPage />} />
          <Route path="/customer-bus-list" element={<CustomerBusListPage />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
