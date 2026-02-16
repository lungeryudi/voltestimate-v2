import { useState } from 'react';
import { useStore } from '../shared/lib/store';
import { Upload, FileText, Image, Search, Grid3X3, List } from 'lucide-react';

export const BlueprintsPage = () => {
  const { blueprints, projects } = useStore();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filteredBlueprints = blueprints.filter(bp => {
    const matchesSearch = bp.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         bp.projectId?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || bp.analysisStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded text-xs">Analyzed</span>;
      case 'analyzing':
        return <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded text-xs">Analyzing...</span>;
      case 'failed':
        return <span className="px-2 py-1 bg-red-500/20 text-red-400 rounded text-xs">Failed</span>;
      default:
        return <span className="px-2 py-1 bg-slate-700 text-slate-400 rounded text-xs">Pending</span>;
    }
  };

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Blueprints</h1>
        <p className="text-slate-400">Manage and analyze architectural blueprints</p>
      </div>

      {/* Upload CTA */}
      <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-blue-500/30 rounded-xl p-6 mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
              <Upload className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Upload New Blueprint</h3>
              <p className="text-slate-400 text-sm">AI will analyze rooms, walls, and structural elements</p>
            </div>
          </div>
          <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors">
            Upload Blueprint
          </button>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col lg:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search blueprints..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-slate-900/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex gap-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="analyzing">Analyzing</option>
            <option value="completed">Completed</option>
            <option value="failed">Failed</option>
          </select>

          <div className="flex bg-slate-900/50 border border-slate-700 rounded-xl p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-slate-700 text-white' : 'text-slate-400'}`}
            >
              <Grid3X3 className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-slate-700 text-white' : 'text-slate-400'}`}
            >
              <List className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Blueprints List */}
      {filteredBlueprints.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-20 h-20 bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Image className="w-10 h-10 text-slate-500" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">No blueprints yet</h3>
          <p className="text-slate-400 mb-6">Upload your first blueprint to get started</p>
          <button className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors">
            Upload Blueprint
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredBlueprints.map((blueprint) => (
            <div key={blueprint.id} className="bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden hover:border-slate-600 transition-colors">
              <div className="aspect-video bg-slate-800 flex items-center justify-center">
                <Image className="w-12 h-12 text-slate-600" />
              </div>
              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-medium text-white truncate">{blueprint.name || 'Untitled Blueprint'}</h3>
                  {getStatusBadge(blueprint.analysisStatus || 'pending')}
                </div>
                <p className="text-sm text-slate-400">
                  {projects.find(p => p.id === blueprint.projectId)?.name || 'Unknown Project'}
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden">
          {filteredBlueprints.map((blueprint) => (
            <div key={blueprint.id} className="flex items-center gap-4 p-4 border-b border-slate-800 last:border-0 hover:bg-slate-800/50">
              <div className="w-12 h-12 bg-slate-800 rounded-lg flex items-center justify-center flex-shrink-0">
                <FileText className="w-6 h-6 text-slate-500" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-white truncate">{blueprint.name || 'Untitled Blueprint'}</h3>
                <p className="text-sm text-slate-400">
                  {projects.find(p => p.id === blueprint.projectId)?.name || 'Unknown Project'}
                </p>
              </div>
              {getStatusBadge(blueprint.analysisStatus || 'pending')}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default BlueprintsPage;
