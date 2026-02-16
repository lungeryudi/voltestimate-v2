import { useNavigate } from 'react-router-dom';
import { StatusBadge } from './StatusBadge';
import { Edit, Trash2, FileText, Clock, DollarSign } from 'lucide-react';
import type { Estimate } from '../../../shared/types';

interface EstimateListProps {
  estimates: Estimate[];
  onDelete?: (id: string) => void;
  onEdit?: (estimate: Estimate) => void;
}

export const EstimateList: React.FC<EstimateListProps> = ({ 
  estimates, 
  onDelete,
  onEdit 
}) => {
  const navigate = useNavigate();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(new Date(date));
  };

  if (estimates.length === 0) {
    return (
      <div className="text-center py-12 bg-slate-900/30 rounded-xl border border-slate-800">
        <FileText className="w-12 h-12 text-slate-600 mx-auto mb-4" />
        <p className="text-slate-400">No estimates found</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-slate-800">
            <th className="text-left py-4 px-4 text-sm font-semibold text-slate-400 uppercase tracking-wider">
              Project
            </th>
            <th className="text-left py-4 px-4 text-sm font-semibold text-slate-400 uppercase tracking-wider">
              Client
            </th>
            <th className="text-left py-4 px-4 text-sm font-semibold text-slate-400 uppercase tracking-wider">
              Status
            </th>
            <th className="text-left py-4 px-4 text-sm font-semibold text-slate-400 uppercase tracking-wider">
              <div className="flex items-center gap-1">
                <DollarSign className="w-4 h-4" />
                Total
              </div>
            </th>
            <th className="text-left py-4 px-4 text-sm font-semibold text-slate-400 uppercase tracking-wider">
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                Labor Hours
              </div>
            </th>
            <th className="text-left py-4 px-4 text-sm font-semibold text-slate-400 uppercase tracking-wider">
              Updated
            </th>
            <th className="text-right py-4 px-4 text-sm font-semibold text-slate-400 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800">
          {estimates.map((estimate) => (
            <tr 
              key={estimate.id}
              className="group hover:bg-slate-800/30 transition-colors cursor-pointer"
              onClick={() => navigate(`/estimates/${estimate.id}`)}
            >
              <td className="py-4 px-4">
                <div>
                  <p className="font-medium text-white">{estimate.projectName}</p>
                  <p className="text-sm text-slate-500">ID: {estimate.id.slice(-6)}</p>
                </div>
              </td>
              <td className="py-4 px-4">
                <p className="text-slate-300">{estimate.client}</p>
              </td>
              <td className="py-4 px-4">
                <StatusBadge status={estimate.status} size="sm" />
              </td>
              <td className="py-4 px-4">
                <p className="font-medium text-green-400">{formatCurrency(estimate.total)}</p>
              </td>
              <td className="py-4 px-4">
                <p className="text-slate-300">{estimate.laborHours}h</p>
              </td>
              <td className="py-4 px-4">
                <p className="text-sm text-slate-500">{formatDate(estimate.updatedAt)}</p>
              </td>
              <td className="py-4 px-4">
                <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit?.(estimate);
                    }}
                    className="p-2 text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete?.(estimate.id);
                    }}
                    className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default EstimateList;
