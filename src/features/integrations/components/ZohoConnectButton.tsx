import { useState, useEffect } from 'react';
import { Link2, Link2Off, RefreshCw, Check, AlertCircle } from 'lucide-react';
import {
  connectZoho,
  disconnectZoho,
  isZohoConnected,
  syncProjectToZoho,
  syncEstimateToZoho,
  getSyncLogs
} from '../../../services/zohoIntegration';
import { useAuth } from '../../auth/hooks/useAuth';
import type { Project, Estimate } from '../../../shared/types';

interface ZohoConnectButtonProps {
  variant?: 'default' | 'compact';
  project?: Project;
  estimate?: Estimate;
  onSync?: () => void;
}

export function ZohoConnectButton({ 
  variant = 'default', 
  project, 
  estimate,
  onSync 
}: ZohoConnectButtonProps) {
  const { user } = useAuth();
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastSync, setLastSync] = useState<Date | null>(null);

  useEffect(() => {
    if (user) {
      checkConnection();
    }
  }, [user]);

  const checkConnection = async () => {
    if (!user) return;
    try {
      const isConnected = await isZohoConnected(user.id);
      setConnected(isConnected);
      
      if (isConnected) {
        const logs = await getSyncLogs(user.id, 'zoho');
        if (logs.length > 0) {
          setLastSync(new Date(logs[0].created_at));
        }
      }
    } catch (err) {
      console.error('Failed to check Zoho connection:', err);
    }
  };

  const handleConnect = async () => {
    setLoading(true);
    setError(null);
    try {
      const authUrl = await connectZoho();
      // Store current location for after OAuth callback
      sessionStorage.setItem('zoho_oauth_return', window.location.pathname);
      window.location.href = authUrl;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect');
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    if (!user) return;
    setLoading(true);
    try {
      await disconnectZoho(user.id);
      setConnected(false);
      setLastSync(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to disconnect');
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    if (!user || !project) return;
    setSyncing(true);
    setError(null);
    try {
      if (estimate) {
        await syncEstimateToZoho(user.id, project, estimate);
      } else {
        await syncProjectToZoho(user.id, project);
      }
      setLastSync(new Date());
      onSync?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sync failed');
    } finally {
      setSyncing(false);
    }
  };

  if (variant === 'compact') {
    return (
      <div className="flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500' : 'bg-slate-500'}`} />
        <span className="text-sm text-slate-400">
          {connected ? 'Connected' : 'Not connected'}
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Status */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
            connected ? 'bg-green-500/20' : 'bg-slate-700/50'
          }`}>
            <span className={`font-bold ${connected ? 'text-green-400' : 'text-slate-400'}`}>
              Z
            </span>
          </div>
          <div>
            <p className="font-medium text-white">Zoho CRM</p>
            <p className="text-sm text-slate-400">
              {connected 
                ? `Connected${lastSync ? ` • Last sync ${lastSync.toLocaleDateString()}` : ''}`
                : 'Connect to sync projects and deals'
              }
            </p>
          </div>
        </div>
        
        {connected ? (
          <button
            onClick={handleDisconnect}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
          >
            <Link2Off className="w-4 h-4" />
            Disconnect
          </button>
        ) : (
          <button
            onClick={handleConnect}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
          >
            {loading ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Link2 className="w-4 h-4" />
            )}
            Connect
          </button>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 px-4 py-2 rounded-lg">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}

      {/* Sync Actions */}
      {connected && project && (
        <div className="flex gap-2 pt-2 border-t border-slate-800">
          <button
            onClick={handleSync}
            disabled={syncing}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
          >
            {syncing ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Check className="w-4 h-4" />
            )}
            {estimate ? 'Sync as Deal' : 'Sync Project'}
          </button>
        </div>
      )}
    </div>
  );
}
