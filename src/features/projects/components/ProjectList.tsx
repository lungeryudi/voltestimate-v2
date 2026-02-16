import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Project } from '../../../shared/types';
import { 
  MapPin, 
  Calendar, 
  Image as ImageIcon, 
  MoreHorizontal,
  Edit2,
  Copy,
  Trash2,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useStore } from '../../../shared/lib/store';

interface ProjectListProps {
  projects: Project[];
}

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-green-500/20 text-green-400 border-green-500/30',
  completed: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  'on-hold': 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  cancelled: 'bg-red-500/20 text-red-400 border-red-500/30',
};

const ITEMS_PER_PAGE = 10;

export const ProjectList: React.FC<ProjectListProps> = ({ projects }) => {
  const navigate = useNavigate();
  const { duplicateProject, deleteProject } = useStore();
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const totalPages = Math.ceil(projects.length / ITEMS_PER_PAGE);
  const paginatedProjects = projects.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const toggleSelection = (id: string) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedItems(newSelected);
  };

  const toggleAll = () => {
    if (selectedItems.size === paginatedProjects.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(paginatedProjects.map(p => p.id)));
    }
  };

  const handleView = (project: Project) => {
    navigate(`/projects/${project.id}`);
  };

  const handleDuplicate = (project: Project, e: React.MouseEvent) => {
    e.stopPropagation();
    duplicateProject(project.id);
    setOpenMenuId(null);
  };

  const handleDelete = (project: Project, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this project?')) {
      deleteProject(project.id);
    }
    setOpenMenuId(null);
  };

  return (
    <div className="bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden">
      {/* Bulk Actions */}
      {selectedItems.size > 0 && (
        <div className="px-6 py-3 bg-blue-600/10 border-b border-slate-800 flex items-center justify-between">
          <span className="text-sm text-blue-400">
            {selectedItems.size} item{selectedItems.size !== 1 ? 's' : ''} selected
          </span>
          <button
            onClick={() => setSelectedItems(new Set())}
            className="text-sm text-slate-400 hover:text-white"
          >
            Clear selection
          </button>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-800">
              <th className="px-6 py-4 text-left">
                <input
                  type="checkbox"
                  checked={selectedItems.size === paginatedProjects.length && paginatedProjects.length > 0}
                  onChange={toggleAll}
                  className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-blue-600 focus:ring-blue-500"
                />
              </th>
              <th className="px-6 py-4 text-left text-sm font-medium text-slate-400">Project</th>
              <th className="px-6 py-4 text-left text-sm font-medium text-slate-400">Status</th>
              <th className="px-6 py-4 text-left text-sm font-medium text-slate-400">Blueprints</th>
              <th className="px-6 py-4 text-left text-sm font-medium text-slate-400">Value</th>
              <th className="px-6 py-4 text-left text-sm font-medium text-slate-400">Updated</th>
              <th className="px-6 py-4 text-right text-sm font-medium text-slate-400">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {paginatedProjects.map((project) => (
              <tr
                key={project.id}
                onClick={() => handleView(project)}
                className="hover:bg-slate-800/50 transition-colors cursor-pointer"
              >
                <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                  <input
                    type="checkbox"
                    checked={selectedItems.has(project.id)}
                    onChange={() => toggleSelection(project.id)}
                    className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-blue-600 focus:ring-blue-500"
                  />
                </td>
                <td className="px-6 py-4">
                  <div>
                    <p className="font-medium text-white">{project.name}</p>
                    <p className="text-sm text-slate-400 flex items-center gap-1 mt-1">
                      <MapPin className="w-3 h-3" />
                      {project.address}
                    </p>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium border ${STATUS_COLORS[project.status]}`}>
                    {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2 text-slate-300">
                    <ImageIcon className="w-4 h-4" />
                    <span>{project.blueprints?.length || 0}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="text-slate-300">
                    ${project.value.toLocaleString()}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2 text-sm text-slate-400">
                    <Calendar className="w-4 h-4" />
                    {new Date(project.updatedAt).toLocaleDateString()}
                  </div>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="relative" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => setOpenMenuId(openMenuId === project.id ? null : project.id)}
                      className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
                    >
                      <MoreHorizontal className="w-4 h-4 text-slate-400" />
                    </button>
                    
                    {openMenuId === project.id && (
                      <>
                        <div 
                          className="fixed inset-0 z-10"
                          onClick={() => setOpenMenuId(null)}
                        />
                        <div className="absolute right-0 top-full mt-1 w-40 bg-slate-800 border border-slate-700 rounded-xl shadow-xl z-20 py-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/projects/${project.id}`);
                            }}
                            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-slate-300 hover:bg-slate-700 transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                            Edit
                          </button>
                          <button
                            onClick={(e) => handleDuplicate(project, e)}
                            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-slate-300 hover:bg-slate-700 transition-colors"
                          >
                            <Copy className="w-4 h-4" />
                            Duplicate
                          </button>
                          <hr className="my-1 border-slate-700" />
                          <button
                            onClick={(e) => handleDelete(project, e)}
                            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-400 hover:bg-slate-700 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                            Delete
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="px-6 py-4 border-t border-slate-800 flex items-center justify-between">
          <p className="text-sm text-slate-400">
            Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1} to {Math.min(currentPage * ITEMS_PER_PAGE, projects.length)} of {projects.length}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-2 hover:bg-slate-800 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="text-sm text-slate-400">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-2 hover:bg-slate-800 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectList;
