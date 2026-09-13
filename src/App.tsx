import { GoogleOAuthProvider } from '@react-oauth/google'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Navigate, Route, BrowserRouter as Router, Routes } from 'react-router-dom'
import { AppShell } from './components/AppShell'
import { LoadingLogo } from './components/LoadingLogo'
import { AmountVisibilityProvider } from './context/AmountVisibilityContext'
import { AuthProvider, useAuth } from './context/AppProviders'
import { ToastProvider } from './context/ToastContext'
import { LanguageProvider } from './i18n/LanguageContext'
import { AnalyticsPage } from './pages/AnalyticsPage'
import { CategoriesPage } from './pages/CategoriesPage'
import { DashboardPage } from './pages/DashboardPage'
import { LandingPage } from './pages/LandingPage'
import { LoginPage } from './pages/LoginPage'
import { ProfileAppearancePage } from './pages/profile/ProfileAppearancePage'
import { ProfileCurrencyPage } from './pages/profile/ProfileCurrencyPage'
import { ProfileIntegrationsPage } from './pages/profile/ProfileIntegrationsPage'
import { ProfileLayout } from './pages/profile/ProfileLayout'
import { ProfileOverviewPage } from './pages/profile/ProfileOverviewPage'
import { ProfilePlanPage } from './pages/profile/ProfilePlanPage'
import { ProfilePrivacyPage } from './pages/profile/ProfilePrivacyPage'
import { ReportsPage } from './pages/ReportsPage'
import { SimulatorPage } from './pages/SimulatorPage'
import { TransactionsPage } from './pages/TransactionsPage'

// Default staleTime is 0, so every page mount (switching between
// Dashboard/Transactions/Categories/Analytics) refires ['categories'],
// ['transactions'], ['rates'] and ['monobank'] from scratch even though
// nothing changed since the last mount. Mutations already invalidate
// their own keys on success, so a modest staleTime only cuts redundant
// refetches during normal navigation — it doesn't risk showing stale data
// after an edit.
const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 60_000 } },
})
const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID ?? ''

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) return <LoadingLogo />
  if (!user) return <Navigate to="/login" replace />
  return <>{children}</>
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/app"
        element={
          <RequireAuth>
            <AppShell />
          </RequireAuth>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="transactions" element={<TransactionsPage />} />
        <Route path="categories" element={<CategoriesPage />} />
        <Route path="analytics" element={<AnalyticsPage />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="simulator" element={<SimulatorPage />} />
        <Route path="profile" element={<ProfileLayout />}>
          <Route index element={<ProfileOverviewPage />} />
          <Route path="integrations" element={<ProfileIntegrationsPage />} />
          <Route path="appearance" element={<ProfileAppearancePage />} />
          <Route path="currency" element={<ProfileCurrencyPage />} />
          <Route path="plan" element={<ProfilePlanPage />} />
          <Route path="privacy" element={<ProfilePrivacyPage />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <GoogleOAuthProvider clientId={googleClientId}>
      <QueryClientProvider client={queryClient}>
        <LanguageProvider>
          <AuthProvider>
            <AmountVisibilityProvider>
              <ToastProvider>
                <Router>
                  <AppRoutes />
                </Router>
              </ToastProvider>
            </AmountVisibilityProvider>
          </AuthProvider>
        </LanguageProvider>
      </QueryClientProvider>
    </GoogleOAuthProvider>
  )
}
