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
import AdminsList from "./pages/users/AdminsList";
import OrganizationsList from "./pages/users/OrganizationsList";
import UserProfile from "./pages/users/UserProfile";
import ActivityLog from "./pages/users/ActivityLog";
import BetaCodes from "./pages/users/BetaCodes";
import RevenueLayout from "./pages/revenue/RevenueLayout";
import RevenueOverview from "./pages/revenue/RevenueOverview";
import PayingOrgs from "./pages/revenue/PayingOrgs";
import Subscribers from "./pages/revenue/Subscribers";
import MessagesLayout from "./pages/messages/MessagesLayout";
import MessagesPage from "./pages/messages/MessagesPage";
import ComposeEmail from "./pages/messages/ComposeEmail";

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
                  <Route path="admins" element={<AdminsList />} />
                  <Route path="organizations" element={<OrganizationsList />} />
                  <Route path="activity" element={<ActivityLog />} />
                  <Route path="beta-codes" element={<BetaCodes />} />
                  <Route path="profile/:id" element={<UserProfile />} />
                </Route>
                <Route path="revenue" element={<RevenueLayout />}>
                  <Route index element={<RevenueOverview />} />
                  <Route path="orgs" element={<PayingOrgs />} />
                  <Route path="subscribers" element={<Subscribers />} />
                </Route>
                <Route path="messages" element={<MessagesLayout />}>
                  <Route index element={<MessagesPage />} />
                  <Route path="compose" element={<ComposeEmail />} />
                  <Route path=":threadId" element={<MessagesPage />} />
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
