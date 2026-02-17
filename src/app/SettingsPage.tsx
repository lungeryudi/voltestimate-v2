import { useState, useEffect } from 'react';
import { User, Building2, Link2, Moon, Sun, Bell, History } from 'lucide-react';
import { ZohoConnectButton, MondayConnectButton } from '../features/integrations/components';
import { getSyncLogs } from '../services/zohoIntegration';
import { useAuth } from '../features/auth/hooks/useAuth';

interface SyncLog {
  id: string;
  provider: string;
  entity_type: string;
  status: 'success' | 'error';
  created_at: string;
  external_id: string;
}

export const SettingsPage = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'profile' | 'company' | 'integrations' | 'appearance'>('profile');
  const [darkMode, setDarkMode] = useState(true);
  const [syncLogs, setSyncLogs] = useState<SyncLog[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  useEffect(() => {
    if (activeTab === 'integrations' && user) {
      loadSyncLogs();
    }
  }, [activeTab, user]);

  const loadSyncLogs = async () => {
    if (!user) return;
    setLoadingLogs(true);
    try {
      const logs = await getSyncLogs(user.id);
      setSyncLogs(logs);
    } catch (err) {
      console.error('Failed to load sync logs:', err);
    } finally {
      setLoadingLogs(false);
    }
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'company', label: 'Company', icon: Building2 },
    { id: 'integrations', label: 'Integrations', icon: Link2 },
    { id: 'appearance', label: 'Appearance', icon: darkMode ? Moon : Sun },
  ] as const;

  const getProviderIcon = (provider: string) => {
    switch (provider) {
      case 'zoho':
        return <span className="text-blue-400 font-bold">Z</span>;
      case 'monday':
        return <span className="text-fuchsia-400 font-bold">M</span>;
      default:
        return <Link2 className="w-4 h-4 text-slate-400" />;
    }
  };

  const getStatusIcon = (status: string) => {
    return status === 'success' 
      ? <span className="text-green-400 text-xs">✓ Success</span>
      : <span className="text-red-400 text-xs">✗ Error</span>;
  };

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Settings</h1>
        <p className="text-slate-400">Manage your account and preferences</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar */}
        <div className="lg:w-64 flex-shrink-0">
          <nav className="space-y-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-colors ${
                    activeTab === tab.id
                      ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                      : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1">
          {activeTab === 'profile' && (
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
              <h2 className="text-xl font-semibold text-white mb-6">Profile Settings</h2>
              
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-2xl font-bold text-white">
                    {user?.email?.[0]?.toUpperCase() || 'U'}
                  </div>
                  <div>
                    <button className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-sm font-medium transition-colors">
                      Change Avatar
                    </button>
                    <p className="text-slate-400 text-sm mt-2">JPG, PNG or GIF. Max 2MB.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Full Name</label>
                    <input
                      type="text"
                      defaultValue={user?.user_metadata?.full_name || ''}
                      placeholder="Enter your name"
                      className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Email</label>
                    <input
                      type="email"
                      defaultValue={user?.email || ''}
                      disabled
                      className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-slate-400 cursor-not-allowed"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Phone</label>
                  <input
                    type="tel"
                    placeholder="+1 (555) 123-4567"
                    className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  />
                </div>

                <div className="pt-4 border-t border-slate-800">
                  <button className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors">
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'company' && (
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
              <h2 className="text-xl font-semibold text-white mb-6">Company Settings</h2>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Company Name</label>
                  <input
                    type="text"
                    placeholder="Volt Security Systems"
                    className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">License Number</label>
                  <input
                    type="text"
                    placeholder="Enter your contractor license number"
                    className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Business Address</label>
                  <textarea
                    rows={3}
                    placeholder="Enter your business address"
                    className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all resize-none"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Default Labor Rate ($/hr)</label>
                    <input
                      type="number"
                      defaultValue="85"
                      className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Default Markup (%)</label>
                    <input
                      type="number"
                      defaultValue="25"
                      className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-800">
                  <button className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors">
                    Save Company Settings
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'integrations' && (
            <div className="space-y-6">
              {/* Zoho CRM */}
              <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
                <ZohoConnectButton />
              </div>

              {/* Monday.com */}
              <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
                <MondayConnectButton />
              </div>

              {/* QuickBooks - Coming Soon */}
              <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 opacity-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center">
                      <span className="text-green-400 font-bold">Q</span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-white">QuickBooks</h3>
                      <p className="text-slate-400 text-sm">Sync estimates and invoices with QuickBooks</p>
                    </div>
                  </div>
                  <button disabled className="px-4 py-2 bg-slate-800 text-slate-500 rounded-lg text-sm font-medium cursor-not-allowed">
                    Coming Soon
                  </button>
                </div>
              </div>

              {/* Stripe - Coming Soon */}
              <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 opacity-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center">
                      <span className="text-purple-400 font-bold">S</span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-white">Stripe</h3>
                      <p className="text-slate-400 text-sm">Accept online payments</p>
                    </div>
                  </div>
                  <button disabled className="px-4 py-2 bg-slate-800 text-slate-500 rounded-lg text-sm font-medium cursor-not-allowed">
                    Coming Soon
                  </button>
                </div>
              </div>

              {/* Sync History */}
              <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
                <div className="flex items-center gap-2 mb-4">
                  <History className="w-5 h-5 text-slate-400" />
                  <h3 className="font-semibold text-white">Sync History</h3>
                </div>
                
                {loadingLogs ? (
                  <div className="text-center py-8 text-slate-400">
                    Loading sync history...
                  </div>
                ) : syncLogs.length === 0 ? (
                  <div className="text-center py-8 text-slate-500">
                    <History className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p>No sync history yet</p>
                    <p className="text-sm mt-1">Sync history will appear here after you connect and sync data</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {syncLogs.map((log) => (
                      <div key={log.id} className="flex items-center justify-between p-3 bg-slate-950 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-slate-800 rounded-lg flex items-center justify-center">
                            {getProviderIcon(log.provider)}
                          </div>
                          <div>
                            <p className="text-sm text-white capitalize">{log.entity_type}</p>
                            <p className="text-xs text-slate-500">
                              {new Date(log.created_at).toLocaleString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(log.status)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'appearance' && (
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
              <h2 className="text-xl font-semibold text-white mb-6">Appearance</h2>
              
              <div className="space-y-6">
                <div className="flex items-center justify-between p-4 bg-slate-950 rounded-xl">
                  <div className="flex items-center gap-3">
                    {darkMode ? <Moon className="w-5 h-5 text-slate-400" /> : <Sun className="w-5 h-5 text-slate-400" />}
                    <div>
                      <p className="font-medium text-white">Dark Mode</p>
                      <p className="text-sm text-slate-400">Toggle between light and dark themes</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setDarkMode(!darkMode)}
                    className={`w-14 h-7 rounded-full transition-colors relative ${
                      darkMode ? 'bg-blue-600' : 'bg-slate-700'
                    }`}
                  >
                    <span className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-transform ${
                      darkMode ? 'translate-x-8' : 'translate-x-1'
                    }`} />
                  </button>
                </div>

                <div className="flex items-center justify-between p-4 bg-slate-950 rounded-xl">
                  <div className="flex items-center gap-3">
                    <Bell className="w-5 h-5 text-slate-400" />
                    <div>
                      <p className="font-medium text-white">Notifications</p>
                      <p className="text-sm text-slate-400">Enable browser notifications</p>
                    </div>
                  </div>
                  <button className="w-14 h-7 bg-blue-600 rounded-full relative">
                    <span className="absolute top-1 right-1 w-5 h-5 bg-white rounded-full" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
