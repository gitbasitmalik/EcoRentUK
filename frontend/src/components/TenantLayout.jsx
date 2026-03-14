import { useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Home, 
  MessageSquare, 
  Settings, 
  LogOut,
  Menu,
  X,
  Leaf,
  ChevronRight
} from 'lucide-react';

const navItems = [
  { path: '/tenant', label: 'My Home', icon: Home, exact: true },
  { path: '/tenant/chat', label: 'Messages', icon: MessageSquare },
  { path: '/tenant/settings', label: 'Settings', icon: Settings },
];

export const TenantLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const isActive = (item) => {
    if (item.exact) return location.pathname === item.path;
    return location.pathname.startsWith(item.path);
  };

  return (
    <div className="min-h-screen bg-[#0A192F]">
      {/* Mobile Header */}
      <header className="lg:hidden glass-heavy border-b border-white/10 p-4 flex items-center justify-between sticky top-0 z-50">
        <Link to="/tenant" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[#00FFAB] flex items-center justify-center">
            <Leaf className="w-5 h-5 text-black" />
          </div>
          <span className="font-bold text-lg text-white font-['Outfit']">EcoRent</span>
        </Link>
        
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 rounded-lg hover:bg-white/5"
          data-testid="tenant-mobile-menu-btn"
        >
          {mobileMenuOpen ? (
            <X className="w-6 h-6 text-white" />
          ) : (
            <Menu className="w-6 h-6 text-white" />
          )}
        </button>
      </header>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="lg:hidden fixed inset-x-0 top-16 glass-heavy border-b border-white/10 z-40"
          >
            <nav className="p-4 space-y-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 p-3 rounded-xl transition-colors ${
                      isActive(item)
                        ? 'bg-[#00FFAB]/10 text-[#00FFAB]'
                        : 'hover:bg-white/5 text-white'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-red-500/10 text-red-400 w-full"
              >
                <LogOut className="w-5 h-5" />
                <span>Log Out</span>
              </button>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Desktop Header */}
      <header className="hidden lg:block glass-heavy border-b border-white/10 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link to="/tenant" className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#00FFAB] flex items-center justify-center">
                <Leaf className="w-6 h-6 text-black" />
              </div>
              <span className="font-bold text-xl text-white font-['Outfit']">EcoRent UK</span>
              <span className="px-3 py-1 rounded-full bg-[#00FFAB]/20 text-[#00FFAB] text-xs font-medium">
                Tenant Portal
              </span>
            </Link>

            <nav className="flex items-center gap-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item);
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                      active
                        ? 'bg-[#00FFAB]/15 text-[#00FFAB]'
                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                    }`}
                    data-testid={`tenant-nav-${item.label.toLowerCase().replace(' ', '-')}`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              {user?.picture ? (
                <img 
                  src={user.picture} 
                  alt={user.name} 
                  className="w-10 h-10 rounded-full border-2 border-[#00FFAB]/30"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-[#00FFAB]/20 flex items-center justify-center">
                  <span className="text-[#00FFAB] font-bold">
                    {user?.name?.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
              <div>
                <p className="text-white font-medium">{user?.name}</p>
                <p className="text-slate-400 text-sm">{user?.email}</p>
              </div>
            </div>
            
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 rounded-xl hover:bg-red-500/10 text-red-400 transition-colors"
              data-testid="tenant-logout-btn"
            >
              <LogOut className="w-5 h-5" />
              <span>Log Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 lg:px-6 py-6 lg:py-8">
        <Outlet />
      </main>
    </div>
  );
};
