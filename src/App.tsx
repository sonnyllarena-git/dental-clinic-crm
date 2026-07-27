import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppShell } from '@/app/AppShell';
import { IdleLock } from '@/app/IdleLock';
import { RouteErrorBoundary } from '@/app/RouteErrorBoundary';
import { SectionPlaceholder } from '@/app/placeholders/SectionPlaceholder';
import { DashboardPage } from '@/features/dashboard/DashboardPage';
import { PatientTabPage } from '@/features/patients/PatientTabPage';

export default function App() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AppShell>
        <Routes>
          <Route
            path="/"
            element={
              <RouteErrorBoundary label="Dashboard">
                <DashboardPage />
              </RouteErrorBoundary>
            }
          />
          <Route
            path="/patients"
            element={
              <RouteErrorBoundary label="Patients">
                <SectionPlaceholder
                  title="Patients"
                  stage={3}
                  description="Searchable, filterable patient list with the persistent safety banner and odontogram."
                />
              </RouteErrorBoundary>
            }
          />
          <Route
            path="/patients/:id"
            element={
              <RouteErrorBoundary label="Patient chart">
                <PatientTabPage />
              </RouteErrorBoundary>
            }
          />
          <Route
            path="/schedule"
            element={
              <RouteErrorBoundary label="Schedule">
                <SectionPlaceholder
                  title="Schedule"
                  stage={4}
                  description="Multi-provider day/week/month calendar with drag-to-reschedule."
                />
              </RouteErrorBoundary>
            }
          />
          <Route
            path="/billing"
            element={
              <RouteErrorBoundary label="Billing">
                <SectionPlaceholder
                  title="Billing"
                  stage={5}
                  description="Invoice list with aging buckets, invoice builder, and payment recording."
                />
              </RouteErrorBoundary>
            }
          />
          <Route
            path="/inventory"
            element={
              <RouteErrorBoundary label="Inventory">
                <SectionPlaceholder
                  title="Inventory"
                  stage={6}
                  description="Stock levels with low-stock and expiry alerts."
                />
              </RouteErrorBoundary>
            }
          />
          <Route
            path="/reports"
            element={
              <RouteErrorBoundary label="Reports">
                <SectionPlaceholder
                  title="Reports"
                  stage={6}
                  description="Revenue, appointment metrics, and aging reports."
                />
              </RouteErrorBoundary>
            }
          />
          <Route
            path="/settings"
            element={
              <RouteErrorBoundary label="Settings">
                <SectionPlaceholder
                  title="Settings"
                  stage={6}
                  description="Clinic settings, user management, and demo data reset."
                />
              </RouteErrorBoundary>
            }
          />
        </Routes>
      </AppShell>
      <IdleLock />
    </BrowserRouter>
  );
}
