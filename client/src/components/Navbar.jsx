import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut, User as UserIcon, Wallet } from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const isAuthPage = location.pathname === '/login' || location.pathname === '/register';

  if (isAuthPage) return null;

  return (
    <nav className="sticky top-0 z-50 bg-[#0F172A]/80 backdrop-blur-xl border-b border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="relative">
              <div className="absolute inset-0 bg-indigo-500 rounded-xl blur-md opacity-40 group-hover:opacity-70 transition-opacity duration-300"></div>
              <div className="relative bg-gradient-to-tr from-indigo-600 to-violet-500 text-white p-2.5 rounded-xl shadow-lg border border-white/10">
                <Wallet size={24} strokeWidth={2.5} />
              </div>
            </div>
            <span className="text-2xl font-black bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent tracking-tight">
              SplitLedger
            </span>
          </Link>
          <div>
            {user ? (
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-3 px-4 py-2 bg-white/5 rounded-full border border-white/10 shadow-inner backdrop-blur-sm">
                  <div className="bg-indigo-500/20 p-1 rounded-full">
                    <UserIcon size={16} className="text-indigo-400" />
                  </div>
                  <span className="text-sm font-semibold text-slate-200">{user.name}</span>
                </div>
                <button 
                  onClick={handleLogout}
                  className="flex items-center gap-2 text-slate-400 hover:text-red-400 transition-colors p-2 rounded-xl hover:bg-red-500/10"
                  title="Logout"
                >
                  <LogOut size={20} strokeWidth={2.5} />
                  <span className="hidden sm:inline font-semibold">Logout</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <Link to="/login" className="text-slate-300 hover:text-white font-semibold transition-colors px-4 py-2">Login</Link>
                <Link to="/register" className="bg-white text-indigo-900 px-6 py-2.5 rounded-full font-bold shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:shadow-[0_0_25px_rgba(255,255,255,0.5)] transition-all active:scale-95">Register</Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}