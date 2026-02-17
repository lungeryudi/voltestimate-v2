import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AppShell } from '../shared/components/layout/AppShell';
import { ProtectedRoute } from '../features/auth/components/ProtectedRoute';
import { LoginPage } from '../features/auth/components/LoginPage';
import { SimpleLoginTest } from '../SimpleLoginTest';
import { ProjectsPage } from './ProjectsPage';
import { ProjectDetailPage } from './ProjectDetailPage';
import { EstimatesPage } from './EstimatesPage';
import { BlueprintsPage } from './BlueprintsPage';
import { SettingsPage } from './SettingsPage';
import { EstimateDetailPage } from '../pages/EstimateDetailPage';
import { BlueprintUploadPage } from '../features/blueprints/pages/BlueprintUploadPage';
import ZohoCallbackPage from '../pages/integrations/ZohoCallbackPage';
import MondayCallbackPage from '../pages/integrations/MondayCallbackPage';
import '../index.css';

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route 
          path="/login" 
          element={
            <ProtectedRoute requireAuth={false}>
              <LoginPage />
            </ProtectedRoute>
          } 
        />
        <Route path="/test-login" element={<SimpleLoginTest />} />

        {/* OAuth Callback Routes - Semi-public, need auth */}
        <Route 
          path="/auth/zoho/callback" 
          element={
            <ProtectedRoute>
              <ZohoCallbackPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/auth/monday/callback" 
          element={
            <ProtectedRoute>
              <MondayCallbackPage />
            </ProtectedRoute>
          } 
        />

        {/* Protected Routes */}
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <AppShell>
                <Routes>
                  <Route path="/" element={<Navigate to="/projects" replace />} />
                  <Route path="/projects" element={<ProjectsPage />} />
                  <Route path="/projects/:projectId" element={<ProjectDetailPage />} />
                  <Route path="/projects/:projectId/blueprints" element={<BlueprintsPage />} />
                  <Route path="/projects/:projectId/estimates" element={<EstimatesPage />} />
                  <Route path="/blueprints" element={<BlueprintsPage />} />
                  <Route path="/blueprints/upload" element={<BlueprintUploadPage />} />
                  <Route path="/estimates" element={<EstimatesPage />} />
                  <Route path="/estimates/:estimateId" element={<EstimateDetailPage />} />
                  <Route path="/settings" element={<SettingsPage />} />
                  <Route path="/settings/integrations" element={<SettingsPage />} />
                </Routes>
              </AppShell>
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
