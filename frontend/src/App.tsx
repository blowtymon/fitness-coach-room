import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import { QueryClient } from "@tanstack/react-query";
import { AuthForm } from "./components/auth/AuthForm";
import { FitnessCoach } from "./components/FitnessCoach";
import NotFound from "./pages/NotFound";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { HomeRoute } from "./components/HomeRoute";
import { AuthProvider } from "@/contexts/AuthContext";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route
              path="/"
              element={<HomeRoute />}
            />
            <Route
              path="/signin"
              element={<AuthForm mode="signin" />}
            />
            <Route
              path="/signup"
              element={<AuthForm mode="signup" />}
            />
            <Route
              path="/chat"
              element={
                <ProtectedRoute>
                  <FitnessCoach />
                </ProtectedRoute>
              }
            />
            <Route
              path="*"
              element={<NotFound />}
            />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);
export default App;
