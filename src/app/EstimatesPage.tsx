import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../shared/lib/store';
import { EstimateList } from '../features/estimates/components/EstimateList';
import { 
  Search, 
  Plus, 
  Filter, 
  FileText, 
  DollarSign, 
  Clock,
  CheckCircle,
  Send
} from 'lucide-react';
import type { Estimate } from '../shared/types';

type StatusFilter = 'all' | Estimate['status'];
type SortBy = 'date' | 'total' | 'project' | 'status';
type SortOrder = 'asc' | 'desc';

export const EstimatesPage: React.FC = () => {
  const navigate = useNavigate();
  const { estimates, projects } = useStore();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [sortBy, setSortBy] = useState<SortBy>('date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Filter and sort estimates
  const filteredEstimates = useMemo(() => {
    let filtered = [...estimates];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(e => 
        e.projectName.toLowerCase().includes(query) ||
        e.client.toLowerCase().includes(query) ||
        e.id.toLowerCase().includes(query)
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(e => e.status === statusFilter);
    }

    // Sort
    filtered.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'date':
          comparison = new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
          break;
        case 'total':
          comparison = a.total - b.total;
          break;
        case 'project':
          comparison = a.projectName.localeCompare(b.projectName);
          break;
        case 'status':
          comparison = a.status.localeCompare(b.status);
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [estimates, searchQuery, statusFilter, sortBy, sortOrder]);

  // Calculate stats
  const stats = useMemo(() => ({
    total: estimates.length,
    totalValue: estimates.reduce((sum, e) => sum + e.total, 0),
    draft: estimates.filter(e => e.status === 'draft').length,
    pending: estimates.filter(e => e.status === 'pending').length,
    approved: estimates.filter(e => e.status === 'approved').length,
    sent: estimates.filter(e => e.status === 'sent').length,
  }), [estimates]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this estimate?')) {
      // Delete will be handled through store action
      console.log('Delete estimate:', id);
    }
  };

  const handleEdit = (estimate: Estimate) => {
    navigate(`/estimates/${estimate.id}`);
  };

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Estimates</h1>
        <p className="text-slate-400">Manage project estimates and quotes</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        <StatCard 
          label="Total Estimates" 
          value={stats.total} 
          icon={FileText}
          color="blue" 
        />
        <StatCard 
          label="Total Value" 
          value={formatCurrency(stats.totalValue)} 
          icon={DollarSign}
          color="green" 
          isCurrency
        />
        <StatCard 
          label="Draft" 
          value={stats.draft} 
          icon={Filter}
          color="slate" 
        />
        <StatCard 
          label="Pending" 
          value={stats.pending} 
          icon={Clock}
          color="amber" 
        />
        <StatCard 
          label="Approved" 
          value={stats.approved} 
          icon={CheckCircle}
          color="green" 
        />
        <StatCard 
          label="Sent" 
          value={stats.sent} 
          icon={Send}
          color="blue" 
        />
      </div>

      {/* Filters & Controls */}
      <div className="flex flex-col lg:flex-row gap-4 mb-6">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by project name, client, or ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-slate-900/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
            className="px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Status</option>
            <option value="draft">Draft</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="sent">Sent</option>
            <option value="rejected">Rejected</option>
          </select>

          <select
            value={`${sortBy}-${sortOrder}`}
            onChange={(e) => {
              const [field, order] = e.target.value.split('-');
              setSortBy(field as SortBy);
              setSortOrder(order as SortOrder);
            }}
            className="px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-blue-500"
          >
            <option value="date-desc">Newest First</option>
            <option value="date-asc">Oldest First</option>
            <option value="total-desc">Highest Value</option>
            <option value="total-asc">Lowest Value</option>
            <option value="project-asc">Project A-Z</option>
            <option value="project-desc">Project Z-A</option>
            <option value="status-asc">Status A-Z</option>
          </select>

          {/* Create Button */}
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span className="hidden sm:inline">New Estimate</span>
          </button>
        </div>
      </div>

      {/* Active Filters */}
      {(statusFilter !== 'all' || searchQuery) && (
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <span className="text-sm text-slate-400">Active filters:</span>
          {statusFilter !== 'all' && (
            <button
              onClick={() => setStatusFilter('all')}
              className="inline-flex items-center gap-1 px-3 py-1 bg-blue-500/10 text-blue-400 rounded-full text-sm hover:bg-blue-500/20 transition-colors"
            >
              Status: {statusFilter}
              <span className="text-xs">×</span>
            </button>
          )}
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="inline-flex items-center gap-1 px-3 py-1 bg-blue-500/10 text-blue-400 rounded-full text-sm hover:bg-blue-500/20 transition-colors"
            >
              Search: "{searchQuery}"
              <span className="text-xs">×</span>
            </button>
          )}
          <button
            onClick={() => {
              setStatusFilter('all');
              setSearchQuery('');
            }}
            className="text-sm text-slate-500 hover:text-slate-300 underline"
          >
            Clear all
          </button>
        </div>
      )}

      {/* Results Count */}
      <div className="mb-4 text-sm text-slate-400">
        Showing {filteredEstimates.length} of {estimates.length} estimates
      </div>

      {/* Estimates Table */}
      {filteredEstimates.length === 0 ? (
        <EmptyState onCreate={() => setShowCreateModal(true)} hasEstimates={estimates.length > 0} />
      ) : (
        <div className="bg-slate-900/30 border border-slate-800 rounded-xl overflow-hidden">
          <EstimateList 
            estimates={filteredEstimates}
            onDelete={handleDelete}
            onEdit={handleEdit}
          />
        </div>
      )}

      {/* Create Modal would go here */}
      {showCreateModal && (
        <CreateEstimateModal 
          projects={projects}
          onClose={() => setShowCreateModal(false)}
        />
      )}
    </div>
  );
};

const StatCard: React.FC<{ 
  label: string; 
  value: string | number; 
  icon: React.ElementType;
  color: string;
  isCurrency?: boolean;
}> = ({ label, value, icon: Icon, color }) => {
  const colorClasses: Record<string, string> = {
    blue: 'bg-blue-500/10 border-blue-500/30 text-blue-400',
    green: 'bg-green-500/10 border-green-500/30 text-green-400',
    slate: 'bg-slate-500/10 border-slate-500/30 text-slate-400',
    amber: 'bg-amber-500/10 border-amber-500/30 text-amber-400',
    purple: 'bg-purple-500/10 border-purple-500/30 text-purple-400',
  };

  return (
    <div className={`p-4 rounded-xl border ${colorClasses[color]}`}>
      <div className="flex items-center justify-between mb-2">
        <Icon className="w-5 h-5 opacity-60" />
      </div>
      <p className="text-2xl font-bold truncate">{value}</p>
      <p className="text-xs opacity-70">{label}</p>
    </div>
  );
};

const EmptyState: React.FC<{ onCreate: () => void; hasEstimates: boolean }> = ({ 
  onCreate, 
  hasEstimates 
}) => (
  <div className="text-center py-16 bg-slate-900/30 rounded-xl border border-slate-800">
    <div className="w-20 h-20 bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-6">
      <FileText className="w-10 h-10 text-slate-500" />
    </div>
    <h3 className="text-xl font-semibold text-white mb-2">
      {hasEstimates ? 'No estimates match your filters' : 'No estimates yet'}
    </h3>
    <p className="text-slate-400 mb-6">
      {hasEstimates 
        ? 'Try adjusting your search or filter criteria'
        : 'Get started by creating your first estimate'
      }
    </p>
    {!hasEstimates && (
      <button
        onClick={onCreate}
        className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors"
      >
        <Plus className="w-5 h-5" />
        Create Estimate
      </button>
    )}
  </div>
);

// Placeholder for create modal
const CreateEstimateModal: React.FC<{ 
  projects: any[]; 
  onClose: () => void;
}> = ({ projects, onClose }) => (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
    <div className="bg-slate-900 rounded-2xl p-6 max-w-md w-full mx-4 border border-slate-800">
      <h2 className="text-xl font-bold text-white mb-4">Create New Estimate</h2>
      <p className="text-slate-400 mb-6">Select a project to create an estimate for:</p>
      
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {projects.length === 0 ? (
          <p className="text-slate-500 text-center py-4">No projects available</p>
        ) : (
          projects.map(project => (
            <button
              key={project.id}
              onClick={() => {
                console.log('Create estimate for project:', project.id);
                onClose();
              }}
              className="w-full text-left p-3 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors"
            >
              <p className="font-medium text-white">{project.name}</p>
              <p className="text-sm text-slate-400">{project.client}</p>
            </button>
          ))
        )}
      </div>
      
      <button
        onClick={onClose}
        className="mt-4 w-full py-2 text-slate-400 hover:text-white transition-colors"
      >
        Cancel
      </button>
    </div>
  </div>
);

export default EstimatesPage;
