import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api';
import toast from 'react-hot-toast';
import { Users, Plus, Target, Trash2, ChevronRight, Loader2, ArrowUpRight, ShieldAlert, Sparkles, Network } from 'lucide-react';

export default function Dashboard() {
  const [groups, setGroups] = useState([]);
  const [circles, setCircles] = useState([]);
  const [loading, setLoading] = useState(true);

  const [newGroupTitle, setNewGroupTitle] = useState('');
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);

  const [newCircleTitle, setNewCircleTitle] = useState('');
  const [isCreatingCircle, setIsCreatingCircle] = useState(false);
  
  const [isDeletingId, setIsDeletingId] = useState(null);
  
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [groupsRes, circlesRes] = await Promise.all([
        api.get('/group'),
        api.get('/circle')
      ]);
      setGroups(groupsRes.data.groups || []);
      setCircles(circlesRes.data.circles || []);
    } catch (error) {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    if (!newGroupTitle.trim()) return;
    try {
      setIsCreatingGroup(true);
      const res = await api.post('/group', { title: newGroupTitle });
      setGroups([res.data.group, ...groups]);
      setNewGroupTitle('');
      toast.success('Group created successfully! 🎉');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error creating group');
    } finally {
      setIsCreatingGroup(false);
    }
  };

  const handleDeleteGroup = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to permanently delete this group? All data will be lost.')) return;
    
    try {
      setIsDeletingId(id);
      await api.delete(`/group/${id}`);
      setGroups(groups.filter(g => g.id !== id));
      toast.success('Group deleted');
    } catch (error) {
      toast.error('Failed to delete group');
    } finally {
      setIsDeletingId(null);
    }
  };

  const handleCreateCircle = async (e) => {
    e.preventDefault();
    if (!newCircleTitle.trim()) return;
    try {
      setIsCreatingCircle(true);
      const res = await api.post('/circle', { title: newCircleTitle });
      setCircles([res.data.circle, ...circles]);
      setNewCircleTitle('');
      toast.success('Circle created! 🚀');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error creating circle');
    } finally {
      setIsCreatingCircle(false);
    }
  };

  const handleDeleteCircle = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this circle?')) return;
    
    try {
      setIsDeletingId(id);
      await api.delete(`/circle/${id}`);
      setCircles(circles.filter(c => c.id !== id));
      toast.success('Circle deleted');
    } catch (error) {
      toast.error('Failed to delete circle');
    } finally {
      setIsDeletingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex-grow flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin shadow-[0_0_30px_rgba(99,102,241,0.5)]"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 w-full py-12">
      {/* Header Hero Section */}
      <div className="mb-14 relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-sm font-bold mb-4">
            <Sparkles size={16} />
            <span>Dashboard Overview</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400">
            Welcome back.
          </h1>
          <p className="text-slate-400 mt-2 text-lg font-medium max-w-xl">
            Manage your shared expenses, track balances effortlessly, and stay on top of your financial circles.
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8 z-10 relative">
        
        {/* GROUPS COLUMN */}
        <div className="flex flex-col gap-6">
          <div className="bg-[#111827]/80 backdrop-blur-xl border border-white/5 rounded-3xl overflow-hidden shadow-2xl flex flex-col h-[600px] ring-1 ring-white/5">
            <div className="p-6 bg-gradient-to-br from-indigo-600/20 to-transparent border-b border-white/5 flex justify-between items-center relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/20 blur-3xl rounded-full"></div>
              <div className="flex items-center gap-4 relative z-10">
                <div className="bg-indigo-500/20 text-indigo-400 p-3 rounded-2xl ring-1 ring-indigo-500/30 shadow-[0_0_15px_rgba(99,102,241,0.2)]">
                  <Users size={28} />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">Groups</h2>
                  <p className="text-indigo-200/70 text-sm font-medium">Split expenses within groups</p>
                </div>
              </div>
              <span className="bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 px-4 py-1.5 rounded-full text-sm font-black shadow-inner shadow-indigo-500/20 relative z-10">
                {groups.length}
              </span>
            </div>
            
            <div className="p-6 flex-grow flex flex-col">
              <form onSubmit={handleCreateGroup} className="flex gap-3 mb-6 relative z-10">
                <div className="relative flex-grow group">
                  <div className="absolute inset-0 bg-indigo-500 opacity-0 group-focus-within:opacity-20 blur-md transition-opacity rounded-xl"></div>
                  <input 
                    type="text" 
                    placeholder="E.g., Weekend Trip, Roommates..." 
                    value={newGroupTitle}
                    onChange={e => setNewGroupTitle(e.target.value)}
                    className="w-full relative bg-[#1E293B]/80 backdrop-blur-md border border-white/10 focus:border-indigo-500 focus:bg-[#1E293B] rounded-xl px-5 py-4 text-white font-medium placeholder-slate-500 outline-none transition-all shadow-inner" 
                    required 
                  />
                </div>
                <button 
                  type="submit" 
                  disabled={isCreatingGroup}
                  className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-5 rounded-xl shadow-[0_0_20px_rgba(99,102,241,0.4)] hover:shadow-[0_0_30px_rgba(99,102,241,0.6)] transition-all flex items-center justify-center shrink-0 border border-indigo-400/30 active:scale-95"
                >
                  {isCreatingGroup ? <Loader2 size={24} className="animate-spin" /> : <Plus size={24} strokeWidth={3} />}
                </button>
              </form>

              <div className="space-y-3 flex-grow overflow-y-auto pr-2 custom-scrollbar">
                {groups.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-slate-500 min-h-[250px]">
                    <div className="bg-[#1E293B] p-4 rounded-2xl mb-4 border border-white/5">
                      <Users size={40} className="text-slate-600" />
                    </div>
                    <p className="font-semibold text-slate-400">No groups yet</p>
                    <p className="text-sm mt-1">Create one to start splitting</p>
                  </div>
                ) : groups.map(g => (
                  <div 
                    key={g.id} 
                    onClick={() => navigate(`/groups/${g.id}`)}
                    className="group relative bg-[#1E293B]/50 hover:bg-[#1E293B] border border-white/5 hover:border-indigo-500/50 rounded-2xl p-5 transition-all cursor-pointer flex items-center justify-between" 
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/0 to-indigo-500/0 group-hover:to-indigo-500/5 rounded-2xl transition-all"></div>
                    <div className="relative z-10">
                      <h3 className="font-bold text-white text-lg group-hover:text-indigo-300 transition-colors flex items-center gap-2">
                        {g.title}
                        <ArrowUpRight size={16} className="opacity-0 group-hover:opacity-100 transition-opacity -ml-2 group-hover:ml-0" />
                      </h3>
                      {g.description && <p className="text-sm text-slate-400 mt-1 truncate max-w-[200px]">{g.description}</p>}
                    </div>
                    <div className="flex items-center gap-2 relative z-10 transition-transform group-hover:translate-x-1">
                      <button 
                        onClick={(e) => handleDeleteGroup(g.id, e)}
                        disabled={isDeletingId === g.id}
                        className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                        title="Delete Group"
                      >
                        {isDeletingId === g.id ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={18} />}
                      </button>
                      <div className="bg-white/5 p-2 rounded-xl text-slate-400 group-hover:bg-indigo-500/20 group-hover:text-indigo-300 transition-colors">
                        <ChevronRight size={20} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* CIRCLES COLUMN */}
        <div className="flex flex-col gap-6">
          <div className="bg-[#111827]/80 backdrop-blur-xl border border-white/5 rounded-3xl overflow-hidden shadow-2xl flex flex-col h-[600px] ring-1 ring-white/5">
            <div className="p-6 bg-gradient-to-br from-violet-600/20 to-transparent border-b border-white/5 flex justify-between items-center relative overflow-hidden">
              <div className="absolute top-0 left-0 w-32 h-32 bg-violet-500/20 blur-3xl rounded-full"></div>
              <div className="flex items-center gap-4 relative z-10">
                <div className="bg-violet-500/20 text-violet-400 p-3 rounded-2xl ring-1 ring-violet-500/30 shadow-[0_0_15px_rgba(139,92,246,0.2)]">
                  <Network size={28} />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">Circles</h2>
                  <p className="text-violet-200/70 text-sm font-medium">Broader networks & tracking</p>
                </div>
              </div>
              <span className="bg-violet-500/20 border border-violet-500/30 text-violet-300 px-4 py-1.5 rounded-full text-sm font-black shadow-inner shadow-violet-500/20 relative z-10">
                {circles.length}
              </span>
            </div>
            
            <div className="p-6 flex-grow flex flex-col">
              <form onSubmit={handleCreateCircle} className="flex gap-3 mb-6 relative z-10">
                <div className="relative flex-grow group">
                  <div className="absolute inset-0 bg-violet-500 opacity-0 group-focus-within:opacity-20 blur-md transition-opacity rounded-xl"></div>
                  <input 
                    type="text" 
                    placeholder="E.g., Co-workers, Project X..." 
                    value={newCircleTitle}
                    onChange={e => setNewCircleTitle(e.target.value)}
                    className="w-full relative bg-[#1E293B]/80 backdrop-blur-md border border-white/10 focus:border-violet-500 focus:bg-[#1E293B] rounded-xl px-5 py-4 text-white font-medium placeholder-slate-500 outline-none transition-all shadow-inner" 
                    required 
                  />
                </div>
                <button 
                  type="submit" 
                  disabled={isCreatingCircle}
                  className="bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white px-5 rounded-xl shadow-[0_0_20px_rgba(139,92,246,0.4)] hover:shadow-[0_0_30px_rgba(139,92,246,0.6)] transition-all flex items-center justify-center shrink-0 border border-violet-400/30 active:scale-95"
                >
                  {isCreatingCircle ? <Loader2 size={24} className="animate-spin" /> : <Plus size={24} strokeWidth={3} />}
                </button>
              </form>

              <div className="space-y-3 flex-grow overflow-y-auto pr-2 custom-scrollbar">
                {circles.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-slate-500 min-h-[250px]">
                    <div className="bg-[#1E293B] p-4 rounded-2xl mb-4 border border-white/5">
                      <Network size={40} className="text-slate-600" />
                    </div>
                    <p className="font-semibold text-slate-400">No circles yet</p>
                    <p className="text-sm mt-1">Start connecting people</p>
                  </div>
                ) : circles.map(c => (
                  <div 
                    key={c.id} 
                    onClick={() => navigate(`/circles/${c.id}`)}
                    className="group relative bg-[#1E293B]/50 hover:bg-[#1E293B] border border-white/5 hover:border-violet-500/50 rounded-2xl p-5 transition-all cursor-pointer flex items-center justify-between"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-violet-500/0 to-violet-500/0 group-hover:to-violet-500/5 rounded-2xl transition-all"></div>
                    <div className="relative z-10">
                      <h3 className="font-bold text-white text-lg group-hover:text-violet-300 transition-colors flex items-center gap-2">
                        {c.title}
                        <ArrowUpRight size={16} className="opacity-0 group-hover:opacity-100 transition-opacity -ml-2 group-hover:ml-0" />
                      </h3>
                      {c.description && <p className="text-sm text-slate-400 mt-1 truncate max-w-[200px]">{c.description}</p>}
                    </div>
                    <div className="flex items-center gap-2 relative z-10 transition-transform group-hover:translate-x-1">
                      <button 
                        onClick={(e) => handleDeleteCircle(c.id, e)}
                        disabled={isDeletingId === c.id}
                        className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                        title="Delete Circle"
                      >
                        {isDeletingId === c.id ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={18} />}
                      </button>
                      <div className="bg-white/5 p-2 rounded-xl text-slate-400 group-hover:bg-violet-500/20 group-hover:text-violet-300 transition-colors">
                        <ChevronRight size={20} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
      
    </div>
  );
}
