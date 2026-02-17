import { useParams, useNavigate } from 'react-router-dom';
import { useStore } from '../shared/lib/store';
import { downloadProposal } from '../services/pdfGenerator';
import { ArrowLeft, FileDown, Building2, Calendar, DollarSign, Clock } from 'lucide-react';

export function EstimateDetailPage() {
  const { estimateId } = useParams();
  const navigate = useNavigate();
  const estimate = useStore(state => state.estimates.find(e => e.id === estimateId));
  
  if (!estimate) {
    return (
      <div className="p-8">
        <div className="text-center py-16">
          <h2 className="text-xl font-semibold text-white mb-2">Estimate not found</h2>
          <button 
            onClick={() => navigate('/estimates')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg"
          >
            Back to Estimates
          </button>
        </div>
      </div>
    );
  }

  // Group line items by category
  const categories = [...new Set(estimate.lineItems.map(item => item.category))];

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <button 
          onClick={() => navigate('/estimates')}
          className="flex items-center gap-2 text-slate-400 hover:text-white mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Estimates
        </button>
        
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">{estimate.projectName}</h1>
            <div className="flex items-center gap-4 text-slate-400">
              <span className="flex items-center gap-1">
                <Building2 className="w-4 h-4" />
                {estimate.client}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {new Date(estimate.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              estimate.status === 'draft' ? 'bg-slate-600 text-slate-200' :
              estimate.status === 'pending' ? 'bg-amber-500/20 text-amber-400' :
              estimate.status === 'approved' ? 'bg-green-500/20 text-green-400' :
              estimate.status === 'sent' ? 'bg-blue-500/20 text-blue-400' :
              'bg-red-500/20 text-red-400'
            }`}>
              {estimate.status}
            </span>
            <button 
              onClick={() => downloadProposal(estimate)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              <FileDown className="w-4 h-4" />
              Export PDF
            </button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <p className="text-slate-400 text-sm">Total Estimate</p>
              <p className="text-2xl font-bold text-white">${estimate.total.toFixed(2)}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="text-slate-400 text-sm">Labor Hours</p>
              <p className="text-2xl font-bold text-white">{estimate.laborHours.toFixed(1)} hrs</p>
            </div>
          </div>
        </div>
        
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
              <FileDown className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <p className="text-slate-400 text-sm">Line Items</p>
              <p className="text-2xl font-bold text-white">{estimate.lineItems.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Line Items Table */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-800">
          <h3 className="text-lg font-semibold text-white">Line Items</h3>
        </div>
        
        <div className="divide-y divide-slate-800">
          {categories.map(category => {
            const categoryItems = estimate.lineItems.filter(item => item.category === category);
            const categoryTotal = categoryItems.reduce((sum, item) => sum + item.total, 0);
            
            return (
              <div key={category}>
                {/* Category Header */}
                <div className="px-6 py-3 bg-slate-800/50 flex items-center justify-between">
                  <span className="font-medium text-slate-300">{category}</span>
                  <span className="text-slate-400">${categoryTotal.toFixed(2)}</span>
                </div>
                
                {/* Category Items */}
                <div className="divide-y divide-slate-800/50">
                  {categoryItems.map(item => (
                    <div key={item.id} className="px-6 py-4 flex items-center justify-between hover:bg-slate-800/30 transition-colors">
                      <div className="flex-1">
                        <p className="text-white">{item.description}</p>
                      </div>
                      <div className="flex items-center gap-8 text-right">
                        <div className="w-16">
                          <span className="text-slate-400">{item.quantity}</span>
                        </div>
                        <div className="w-24">
                          <span className="text-slate-400">${item.unitPrice.toFixed(2)}</span>
                        </div>
                        <div className="w-24">
                          <span className="text-white font-medium">${item.total.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
        
        {/* Total Row */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-800/50 flex items-center justify-between">
          <span className="text-lg font-semibold text-white">Total</span>
          <span className="text-2xl font-bold text-green-400">${estimate.total.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
}

export default EstimateDetailPage;
