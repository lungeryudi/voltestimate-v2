import { useState, useEffect } from 'react';
import { Link2, Link2Off, RefreshCw, Check, AlertCircle, LayoutGrid } from 'lucide-react';
import {
  connectMonday,
  disconnectMonday,
  isMondayConnected,
  syncProjectToMonday,
  createMondayBoardItem,
  getSyncLogs
} from '../../../services/mondayIntegration';
import { useAuth } from '../../auth/hooks/useAuth';
import type { Project, Estimate } from '../../../shared/types';

interface MondayConnectButtonProps {
  variant?: 'default' | 'compact';
  project?: Project;
  estimate?: Estimate;
  onSync?: () => void;
}

export function MondayConnectButton({ 
  variant = 'default', 
  project, 
  estimate,
  onSync 
}: MondayConnectButtonProps) {
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
      const isConnected = await isMondayConnected(user.id);
      setConnected(isConnected);
      
      if (isConnected) {
        const logs = await getSyncLogs(user.id, 'monday');
        if (logs.length > 0) {
          setLastSync(new Date(logs[0].created_at));
        }
      }
    } catch (err) {
      console.error('Failed to check Monday.com connection:', err);
    }
  };

  const handleConnect = async () => {
    setLoading(true);
    setError(null);
    try {
      const authUrl = await connectMonday();
      // Store current location for after OAuth callback
      sessionStorage.setItem('monday_oauth_return', window.location.pathname);
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
      await disconnectMonday(user.id);
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
        await createMondayBoardItem(user.id, project, estimate);
      } else {
        await syncProjectToMonday(user.id, project);
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
            <LayoutGrid className={`w-5 h-5 ${connected ? 'text-green-400' : 'text-slate-400'}`} />
          </div>
          <div>
            <p className="font-medium text-white">Monday.com</p>
            <p className="text-sm text-slate-400">
              {connected 
                ? `Connected${lastSync ? ` • Last sync ${lastSync.toLocaleDateString()}` : ''}`
                : 'Connect to sync projects to boards'
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
            className="flex items-center gap-2 px-4 py-2 bg-fuchsia-600 hover:bg-fuchsia-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
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
            {estimate ? 'Sync with Estimate' : 'Sync Project'}
          </button>
        </div>
      )}
    </div>
  );
}
