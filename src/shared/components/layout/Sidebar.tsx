import { NavLink, useLocation } from 'react-router-dom';
import { 
  FolderKanban, 
  FileText, 
  Image as ImageIcon, 
  Settings, 
  Zap,
  User,
  ChevronRight
} from 'lucide-react';

interface SidebarProps {
  onNavigate?: () => void;
}

const navigation = [
  { name: 'Projects', path: '/projects', icon: FolderKanban },
  { name: 'Blueprints', path: '/blueprints', icon: ImageIcon },
  { name: 'Estimates', path: '/estimates', icon: FileText },
  { name: 'Settings', path: '/settings', icon: Settings },
];

export const Sidebar: React.FC<SidebarProps> = ({ onNavigate }) => {
  const location = useLocation();

  return (
    <div className="h-full bg-slate-900/95 backdrop-blur-xl border-r border-slate-800 flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Zap className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-lg tracking-tight">VoltEstimate</h1>
            <p className="text-xs text-slate-400">Pro</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navigation.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname.startsWith(item.path);
          
          return (
            <NavLink
              key={item.name}
              to={item.path}
              onClick={onNavigate}
              className={`
                flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group
                ${isActive 
                  ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30' 
                  : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                }
              `}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'text-blue-400' : 'group-hover:text-slate-200'}`} />
              <span className="font-medium">{item.name}</span>
              {isActive && (
                <ChevronRight className="w-4 h-4 ml-auto opacity-50" />
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* User Profile */}
      <div className="p-4 border-t border-slate-800">
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-800/50 border border-slate-700/50">
          <div className="w-10 h-10 bg-gradient-to-br from-slate-600 to-slate-700 rounded-full flex items-center justify-center">
            <User className="w-5 h-5 text-slate-300" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-200 truncate">Admin User</p>
            <p className="text-xs text-slate-500 truncate">admin@voltestimate.com</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
