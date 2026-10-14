import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "./components/theme-provider";
import { AuthProvider } from "./lib/auth-context";
import ProtectedRoute from "./components/ProtectedRoute";
import Layout from "./components/Layout";
import LoginPage from "./pages/LoginPage";
import OverviewDashboard from "./pages/OverviewDashboard";
import UsersLayout from "./pages/users/UsersLayout";
import UsersOverview from "./pages/users/UsersOverview";
import UsersList from "./pages/users/UsersList";
import OrganizationsList from "./pages/users/OrganizationsList";
import UserProfile from "./pages/users/UserProfile";
import ActivityLog from "./pages/users/ActivityLog";
import BetaCodes from "./pages/users/BetaCodes";

const queryClient = new QueryClient();

function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="codeward-admin-theme">
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <AuthProvider>
            <Routes>
              {/* ── Public routes ───────────────────────────────── */}
              <Route path="/login" element={<LoginPage />} />

              {/* ── Protected routes (super_admin only) ─────────── */}
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <Layout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<OverviewDashboard />} />
                <Route path="users" element={<UsersLayout />}>
                  <Route index element={<UsersOverview />} />
                  <Route path="all" element={<UsersList />} />
                  <Route path="organizations" element={<OrganizationsList />} />
                  <Route path="activity" element={<ActivityLog />} />
                  <Route path="beta-codes" element={<BetaCodes />} />
                  <Route path="profile/:id" element={<UserProfile />} />
                </Route>
                <Route path="*" element={<div className="p-8">Coming Soon</div>} />
              </Route>

              {/* Catch-all → login */}
              <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
