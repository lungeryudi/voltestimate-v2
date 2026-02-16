import { useParams } from 'react-router-dom';
import { useStore } from '../shared/lib/store';
import { ArrowLeft, Building2, MapPin, Calendar, Copy, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const ProjectDetailPage = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const { projects, deleteProject, duplicateProject } = useStore();
  const navigate = useNavigate();
  
  const project = projects.find(p => p.id === projectId);
  
  if (!project) {
    return (
      <div className="p-8">
        <div className="text-center py-16">
          <h2 className="text-xl font-semibold text-white mb-2">Project not found</h2>
          <button 
            onClick={() => navigate('/projects')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg"
          >
            Back to Projects
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <button 
          onClick={() => navigate('/projects')}
          className="flex items-center gap-2 text-slate-400 hover:text-white mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Projects
        </button>
        
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">{project.name}</h1>
            <div className="flex items-center gap-4 text-slate-400">
              <span className="flex items-center gap-1">
                <Building2 className="w-4 h-4" />
                {project.client}
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                {project.address}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {new Date(project.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              project.status === 'active' ? 'bg-green-500/20 text-green-400' :
              project.status === 'completed' ? 'bg-blue-500/20 text-blue-400' :
              project.status === 'on-hold' ? 'bg-amber-500/20 text-amber-400' :
              'bg-red-500/20 text-red-400'
            }`}>
              {project.status}
            </span>
            <button
              onClick={() => duplicateProject(project.id)}
              className="p-2 hover:bg-slate-800 rounded-lg"
              title="Duplicate"
            >
              <Copy className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                if (confirm('Delete this project?')) {
                  deleteProject(project.id);
                  navigate('/projects');
                }
              }}
              className="p-2 hover:bg-slate-800 rounded-lg text-red-400"
              title="Delete"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-800 mb-6">
        <div className="flex gap-6">
          {['Overview', 'Blueprints', 'Estimates', 'Timeline'].map((tab) => (
            <button
              key={tab}
              className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
                tab === 'Overview' 
                  ? 'border-blue-500 text-blue-400' 
                  : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Project Overview</h3>
            <p className="text-slate-400">Project details and overview content will appear here.</p>
          </div>
        </div>
        
        <div>
          <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Quick Stats</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-slate-400">Blueprints</span>
                <span className="text-white">{project.blueprints?.length || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Devices</span>
                <span className="text-white">0</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Conflicts</span>
                <span className={project.conflictCount > 0 ? 'text-red-400' : 'text-green-400'}>
                  {project.conflictCount}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Value</span>
                <span className="text-white">${project.value.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectDetailPage;
