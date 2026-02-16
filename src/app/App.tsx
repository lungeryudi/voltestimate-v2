import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AppShell } from '../shared/components/layout/AppShell';
import { ProjectsPage } from './ProjectsPage';
import { ProjectDetailPage } from './ProjectDetailPage';
import { EstimatesPage } from './EstimatesPage';
import { BlueprintsPage } from './BlueprintsPage';
import { SettingsPage } from './SettingsPage';
import '../index.css';

function App() {
  return (
    <Router>
      <AppShell>
        <Routes>
          <Route path="/" element={<Navigate to="/projects" replace />} />
          <Route path="/projects" element={<ProjectsPage />} />
          <Route path="/projects/:projectId" element={<ProjectDetailPage />} />
          <Route path="/blueprints" element={<BlueprintsPage />} />
          <Route path="/estimates" element={<EstimatesPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
      </AppShell>
    </Router>
  );
}

export default App;
