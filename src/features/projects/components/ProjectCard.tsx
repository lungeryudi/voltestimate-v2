import { useState, type FC, type MouseEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Project } from '../../../shared/types';
import { 
  MapPin, 
  Calendar, 
  Image as ImageIcon, 
  AlertCircle,
  MoreVertical,
  Copy,
  Trash2
} from 'lucide-react';
import { useStore } from '../../../shared/lib/store';

interface ProjectCardProps {
  project: Project;
}

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-green-500/20 text-green-400 border-green-500/30',
  completed: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  'on-hold': 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  cancelled: 'bg-red-500/20 text-red-400 border-red-500/30',
};

export const ProjectCard: FC<ProjectCardProps> = ({ project }) => {
  const navigate = useNavigate();
  const { duplicateProject, deleteProject } = useStore();
  const [showMenu, setShowMenu] = useState(false);

  const blueprintCount = project.blueprints?.length || 0;
  const hasConflicts = project.conflictCount > 0;

  const handleView = () => {
    navigate(`/projects/${project.id}`);
  };

  const handleDuplicate = (e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    duplicateProject(project.id);
    setShowMenu(false);
  };

  const handleDelete = (e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this project?')) {
      deleteProject(project.id);
    }
    setShowMenu(false);
  };

  return (
    <div 
      onClick={handleView}
      className="group bg-slate-900/50 border border-slate-800 rounded-2xl p-6 hover:border-slate-600 transition-all duration-200 cursor-pointer hover:shadow-xl hover:shadow-blue-500/5"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-white truncate group-hover:text-blue-400 transition-colors">
            {project.name}
          </h3>
          <p className="text-sm text-slate-400 truncate">{project.client}</p>
        </div>
        <div className="relative">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowMenu(!showMenu);
            }}
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <MoreVertical className="w-4 h-4 text-slate-400" />
          </button>
          
          {showMenu && (
            <>
              <div 
                className="fixed inset-0 z-10"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMenu(false);
                }}
              />
              <div className="absolute right-0 top-full mt-1 w-40 bg-slate-800 border border-slate-700 rounded-xl shadow-xl z-20 py-1">
                <button
                  onClick={handleDuplicate}
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-slate-300 hover:bg-slate-700 transition-colors"
                >
                  <Copy className="w-4 h-4" />
                  Duplicate
                </button>
                <button
                  onClick={handleDelete}
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-400 hover:bg-slate-700 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Address */}
      <div className="flex items-center gap-2 text-sm text-slate-400 mb-4">
        <MapPin className="w-4 h-4 flex-shrink-0" />
        <span className="truncate">{project.address}</span>
      </div>

      {/* Stats Row */}
      <div className="flex items-center gap-4 mb-4">
        <div className="flex items-center gap-2 text-sm text-slate-400">
          <ImageIcon className="w-4 h-4" />
          <span>{blueprintCount} blueprint{blueprintCount !== 1 ? 's' : ''}</span>
        </div>
        {hasConflicts && (
          <div className="flex items-center gap-1 text-sm text-red-400">
            <AlertCircle className="w-4 h-4" />
            <span>{project.conflictCount} conflict{project.conflictCount !== 1 ? 's' : ''}</span>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-800">
        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${STATUS_COLORS[project.status]}`}>
          {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
        </span>
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <Calendar className="w-4 h-4" />
          <span>{new Date(project.updatedAt).toLocaleDateString()}</span>
        </div>
      </div>

      {/* Value */}
      {project.value > 0 && (
        <div className="mt-4 pt-4 border-t border-slate-800">
          <p className="text-lg font-semibold text-green-400">
            ${project.value.toLocaleString()}
          </p>
        </div>
      )}
    </div>
  );
};

export default ProjectCard;
