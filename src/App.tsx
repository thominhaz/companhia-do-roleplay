import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useSearchParams } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ThemeProvider } from "@/hooks/useTheme";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import { CharacterSheet } from "@/components/character/CharacterSheet";
import { SpellGrimoire } from "@/components/tools/SpellGrimoire";
import ResetPassword from "@/pages/ResetPassword";

const queryClient = new QueryClient();

// Redirect component that preserves query params
function RedirectWithParams({ to }: { to: string }) {
  const [searchParams] = useSearchParams();
  const queryString = searchParams.toString();
  const redirectTo = queryString ? `${to}?${queryString}` : to;
  return <Navigate to={redirectTo} replace />;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <ThemeProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/character/:id" element={<CharacterSheet />} />
              <Route path="/grimoire" element={<SpellGrimoire />} />
              {/* Tab redirects - redirect to Index with tab query param */}
              <Route path="/characters" element={<RedirectWithParams to="/?tab=characters" />} />
              <Route path="/campaigns" element={<RedirectWithParams to="/?tab=campaigns" />} />
              <Route path="/tools" element={<RedirectWithParams to="/?tab=tools" />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </ThemeProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
