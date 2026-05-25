import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { Wallet, ArrowRight, Loader2 } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      toast.success('Welcome back to SplitLedger! 🎉');
      navigate('/');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="absolute inset-0 flex flex-col justify-center items-center px-4 bg-[#0B0F19] z-20">
      
      {/* Ambient background glows specifically for Auth */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/20 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-violet-600/20 rounded-full blur-[120px] pointer-events-none"></div>
      
      <div className="w-full max-w-md bg-[#111827]/80 backdrop-blur-2xl rounded-[2.5rem] shadow-2xl p-8 sm:p-10 border border-white/10 relative z-10">
        
        <div className="flex justify-center mb-8">
          <div className="relative">
            <div className="absolute inset-0 bg-indigo-500 rounded-2xl blur-md opacity-50"></div>
            <div className="relative bg-gradient-to-tr from-indigo-600 to-violet-500 text-white p-3.5 rounded-2xl shadow-lg border border-white/20">
              <Wallet size={32} strokeWidth={2.5} />
            </div>
          </div>
        </div>

        <h2 className="text-3xl font-black text-center text-white mb-3 tracking-tight">Welcome Back</h2>
        <p className="text-center text-slate-400 mb-8 font-medium">Log in to manage your shared expenses.</p>
        
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-bold text-slate-300 mb-2 ml-1">Email Address</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-[#1E293B]/80 backdrop-blur-sm border border-white/5 focus:border-indigo-500 rounded-xl px-5 py-4 text-white outline-none transition-all placeholder:text-slate-500 shadow-inner" 
              placeholder="you@example.com"
              required 
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-300 mb-2 ml-1">Password</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-[#1E293B]/80 backdrop-blur-sm border border-white/5 focus:border-indigo-500 rounded-xl px-5 py-4 text-white outline-none transition-all placeholder:text-slate-500 shadow-inner" 
              placeholder="••••••••"
              required 
            />
          </div>
          
          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-bold py-4 rounded-xl shadow-[0_0_20px_rgba(99,102,241,0.3)] hover:shadow-[0_0_30px_rgba(99,102,241,0.5)] active:scale-[0.98] transition-all flex items-center justify-center gap-2 mt-6 border border-white/10"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : 'Sign In'} 
            {!loading && <ArrowRight size={20} />}
          </button>
        </form>
        
        <div className="mt-8 text-center text-sm font-medium text-slate-400">
          New to SplitLedger?{' '}
          <Link to="/register" className="text-white font-bold hover:text-indigo-400 transition-colors">
            Create an account
          </Link>
        </div>
      </div>
    </div>
  );
}
