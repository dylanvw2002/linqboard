import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import ResetPassword from "./pages/ResetPassword";
import CreateOrganization from "./pages/CreateOrganization";
import JoinOrganization from "./pages/JoinOrganization";
import Dashboard from "./pages/Dashboard";
import Board from "./pages/Board";
import Pricing from "./pages/Pricing";
import Checkout from "./pages/Checkout";
import Invoices from "./pages/Invoices";
import VatReports from "./pages/VatReports";
import SubscriptionSuccess from "./pages/SubscriptionSuccess";
import SubscriptionFailed from "./pages/SubscriptionFailed";
import InvoicePreview from "./pages/InvoicePreview";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30 * 1000,
      gcTime: 5 * 60 * 1000,
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <HelmetProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/create-organization" element={<CreateOrganization />} />
            <Route path="/join-organization" element={<JoinOrganization />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/board/:organizationId" element={<Board />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/invoices" element={<Invoices />} />
            <Route path="/vat-reports" element={<VatReports />} />
            <Route path="/subscription-success" element={<SubscriptionSuccess />} />
            <Route path="/subscription-failed" element={<SubscriptionFailed />} />
            <Route path="/invoice-preview" element={<InvoicePreview />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </HelmetProvider>
  </QueryClientProvider>
);

export default App;
