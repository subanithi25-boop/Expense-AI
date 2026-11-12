import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { ThemeProvider } from './context/ThemeContext';
import { Layout } from './components/layout/Layout';
import { ProtectedRoute } from './components/common/ProtectedRoute';
import { LandingPage } from './pages/LandingPage';
import { DashboardPage } from './pages/DashboardPage';
import { ExpensesPage } from './pages/ExpensesPage';
import { ScanReceiptPage } from './pages/ScanReceiptPage';
import { ReportsPage } from './pages/ReportsPage';
import { ApprovalsPage } from './pages/ApprovalsPage';
import { BudgetsPage } from './pages/BudgetsPage';
import { MileagePage } from './pages/MileagePage';
import { AnomalyReviewPage } from './pages/AnomalyReviewPage';
import { IntegrationsPage } from './pages/IntegrationsPage';
import { NotificationsPage } from './pages/NotificationsPage';
import { SettingsPage } from './pages/SettingsPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { ErrorBoundary } from './components/common/ErrorBoundary';

export function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <NotificationProvider>
          <ErrorBoundary>
            <BrowserRouter>
              <Routes>
                {/* Public landing page */}
                <Route path="/" element={<LandingPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />

                {/* Authenticated dashboard — requires sign-in */}
                <Route path="/dashboard" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
                  <Route index element={<DashboardPage />} />
                  <Route path="overview" element={<DashboardPage />} />
                  <Route path="expenses" element={<ExpensesPage />} />
                  <Route path="scan" element={<ScanReceiptPage />} />
                  <Route path="reports" element={<ReportsPage />} />
                  <Route path="reports/:id" element={<ReportsPage />} />
                  <Route path="approvals" element={<ApprovalsPage />} />
                  <Route path="budgets" element={<BudgetsPage />} />
                  <Route path="mileage" element={<MileagePage />} />
                  <Route path="anomalies" element={<AnomalyReviewPage />} />
                  <Route path="integrations" element={<IntegrationsPage />} />
                  <Route path="notifications" element={<NotificationsPage />} />
                  <Route path="settings" element={<SettingsPage />} />
                </Route>

                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </BrowserRouter>
          </ErrorBoundary>
        </NotificationProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
