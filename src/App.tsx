import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import GenerateTrip from "./pages/GenerateTrip";
import TripResults from "./pages/TripResults";
import BuildTrip from "./pages/BuildTrip";
import PublishedTrip from "./pages/PublishedTrip";
import SavedPlans from "./pages/SavedPlans";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/generate" element={<GenerateTrip />} />
          <Route path="/results" element={<TripResults />} />
          <Route path="/build" element={<BuildTrip />} />
          <Route path="/trip/:tripId" element={<PublishedTrip />} />
          <Route path="/saved" element={<SavedPlans />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
