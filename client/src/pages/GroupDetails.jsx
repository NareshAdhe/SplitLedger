import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';
import toast from 'react-hot-toast';
import { Users, Receipt, ArrowRightLeft, Plus, Edit2, Trash2, RefreshCw, Sparkles, ArrowRight } from 'lucide-react';
import ExpenseModal from '../components/ExpenseModal';
import { useAuth } from '../context/AuthContext';

export default function GroupDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [group, setGroup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('expenses');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editExpenseData, setEditExpenseData] = useState(null);

  useEffect(() => {
    fetchGroup();
  }, [id]);

  const fetchGroup = async () => {
    try {
      const res = await api.get(`/group/${id}`);
      setGroup(res.data.group);
    } catch (error) {
      toast.error('Failed to load group');
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAddExpense = () => {
    setEditExpenseData(null);
    setIsModalOpen(true);
  };

  const handleOpenEditExpense = (expense) => {
    setEditExpenseData(expense);
    setIsModalOpen(true);
  };

  const handleDeleteExpense = async (expenseId) => {
    if (!window.confirm("Are you sure you want to delete this expense?")) return;
    try {
      await api.delete(`/expense/${expenseId}`);
      toast.success("Expense deleted");
      fetchGroup();
    } catch (error) {
      toast.error("Failed to delete expense");
    }
  };

  const getUserNameMap = () => {
    const map = {};
    if (group?.members) {
      group.members.forEach(m => map[m.id] = m.name);
    }
    return map;
  };

  const handleSettleUp = (b) => {
    toast.success(`Settlement coming soon for ₹${b.amount}`);
  };

  if (loading) {
    return (
      <div className="flex-grow flex items-center justify-center min-h-[60vh]">
        <div className="w-16 h-16 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin shadow-[0_0_30px_rgba(99,102,241,0.5)]"></div>
      </div>
    );
  }
  
  if (!group) return null;

  const userNameMap = getUserNameMap();

  return (
    <div className="max-w-5xl mx-auto py-12 px-4 w-full relative z-10">
      
      {/* Group Header */}
      <div className="bg-[#111827]/80 backdrop-blur-2xl rounded-3xl p-8 sm:p-10 mb-10 text-white shadow-2xl relative overflow-hidden border border-white/10 ring-1 ring-white/5">
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-600 rounded-full mix-blend-screen filter blur-[100px] opacity-30 translate-x-1/4 -translate-y-1/4"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-violet-600 rounded-full mix-blend-screen filter blur-[100px] opacity-30 -translate-x-1/4 translate-y-1/4"></div>

        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-sm font-bold mb-4">
              <Sparkles size={16} />
              <span>Group Ledger</span>
            </div>
            <div className="flex items-center gap-4 mb-3">
              <h1 className="text-4xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400 tracking-tight">{group.title}</h1>
            </div>
            
            <div className="flex gap-3 mb-4">
                <span className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white/5 border border-white/10 text-xs font-bold text-slate-300 shadow-inner backdrop-blur-sm">
                  <Users size={14} className="text-indigo-400" /> {group.members?.length || 0} Members
                </span>
                <span className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white/5 border border-white/10 text-xs font-bold text-slate-300 shadow-inner backdrop-blur-sm">
                  <Receipt size={14} className="text-violet-400" /> {group.expenses?.length || 0} Expenses
                </span>
            </div>
            <p className="text-slate-400 text-base max-w-2xl font-medium">{group.description}</p>
          </div>
          
          <button 
            onClick={handleOpenAddExpense}
            className="shrink-0 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white px-6 py-3.5 rounded-xl font-bold shadow-[0_0_20px_rgba(99,102,241,0.4)] hover:shadow-[0_0_30px_rgba(99,102,241,0.6)] transition-all flex items-center gap-2 border border-white/10 active:scale-95"
          >
            <Plus size={20} strokeWidth={3} /> Add Expense
          </button>
        </div>
      </div>
      
      {/* Tabs */}
      <div className="flex flex-wrap gap-3 mb-8 p-1.5 bg-[#111827]/50 backdrop-blur-md rounded-2xl border border-white/5 inline-flex w-full sm:w-auto overflow-x-auto custom-scrollbar">
        <button 
          onClick={() => setActiveTab('expenses')}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all text-sm whitespace-nowrap ${activeTab === 'expenses' ? 'bg-indigo-600 text-white shadow-[0_0_15px_rgba(99,102,241,0.4)] border border-indigo-400/30' : 'bg-transparent text-slate-400 hover:text-white hover:bg-white/5'}`}
        >
          <Receipt size={18} /> Expenses
        </button>
        <button 
          onClick={() => setActiveTab('balances')}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all text-sm whitespace-nowrap ${activeTab === 'balances' ? 'bg-indigo-600 text-white shadow-[0_0_15px_rgba(99,102,241,0.4)] border border-indigo-400/30' : 'bg-transparent text-slate-400 hover:text-white hover:bg-white/5'}`}
        >
          <ArrowRightLeft size={18} /> Balances
        </button>
        <button 
          onClick={() => setActiveTab('members')}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all text-sm whitespace-nowrap ${activeTab === 'members' ? 'bg-indigo-600 text-white shadow-[0_0_15px_rgba(99,102,241,0.4)] border border-indigo-400/30' : 'bg-transparent text-slate-400 hover:text-white hover:bg-white/5'}`}
        >
          <Users size={18} /> Members
        </button>
      </div>

      {/* Tab Content */}
      <div className="bg-[#111827]/80 backdrop-blur-xl rounded-3xl p-6 sm:p-8 border border-white/5 shadow-2xl min-h-[400px] ring-1 ring-white/5">
        
        {activeTab === 'expenses' && (
          <div>
            {(!group.expenses || group.expenses.length === 0) ? (
              <div className="text-center py-20 text-slate-500 bg-[#1E293B]/50 rounded-2xl border border-dashed border-slate-700/50">
                <Receipt size={48} className="mx-auto mb-4 opacity-30 text-indigo-400" />
                <p className="text-xl font-bold text-slate-300">No expenses yet</p>
                <p className="text-sm mt-2 text-slate-500 font-medium">Click "Add Expense" to get started.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {group.expenses.map(e => {
                  const payers = e.contributions?.map(c => c.user?.name || userNameMap[c.user?.id] || `User ${c.user?.id}`) || [];
                  const payerText = payers.length > 0 
                    ? (payers.length === 1 ? `Paid by ${payers[0]}` : `Paid by ${payers.length} people`) 
                    : `Added on ${new Date(e.createdAt).toLocaleDateString()}`;

                  const mySplit = e.splits?.find(s => s.user?.id === user?.id);
                  const myShareAmount = mySplit ? Number(mySplit.amount).toFixed(2) : '0.00';

                  return (
                  <div key={e.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-5 rounded-2xl border border-white/5 bg-[#1E293B]/40 hover:bg-[#1E293B]/80 hover:border-indigo-500/30 transition-all gap-4 group">
                    <div className="flex items-center gap-5 w-full sm:w-auto">
                      <div className="shrink-0 flex flex-col items-center justify-center w-14 h-14 rounded-xl bg-[#0F172A] border border-white/10 text-slate-300 shadow-inner">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400">{new Date(e.createdAt).toLocaleString('default', { month: 'short' })}</span>
                        <span className="text-xl font-bold leading-none text-white">{new Date(e.createdAt).getDate()}</span>
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-lg text-white mb-1 group-hover:text-indigo-300 transition-colors">{e.title}</h3>
                        <p className="text-xs font-semibold text-slate-400 bg-white/5 inline-block px-2 py-0.5 rounded">{payerText}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto border-t sm:border-t-0 border-slate-800 pt-4 sm:pt-0 mt-2 sm:mt-0">
                      <div className="text-left sm:text-right">
                        <p className="text-xl font-black text-white">₹{Number(e.amount).toFixed(2)}</p>
                        {mySplit && <p className="text-xs font-bold text-indigo-400 mt-1 bg-indigo-500/10 px-2 py-0.5 rounded inline-block">Your share: ₹{myShareAmount}</p>}
                      </div>
                      <div className="flex gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                        <button onClick={() => handleOpenEditExpense(e)} className="p-2 text-slate-400 hover:text-indigo-400 bg-white/5 hover:bg-indigo-500/20 rounded-xl transition-all border border-transparent hover:border-indigo-500/30 shadow-sm" title="Edit">
                          <Edit2 size={18} />
                        </button>
                        <button onClick={() => handleDeleteExpense(e.id)} className="p-2 text-slate-400 hover:text-red-400 bg-white/5 hover:bg-red-500/20 rounded-xl transition-all border border-transparent hover:border-red-500/30 shadow-sm" title="Delete">
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  </div>
                )})}
              </div>
            )}
          </div>
        )}

        {/* Balances Tab */}
        {activeTab === 'balances' && (
          <div>
            {(!group.balances || group.balances.length === 0) ? (
              <div className="text-center py-20 text-slate-500 bg-[#1E293B]/50 rounded-2xl border border-dashed border-slate-700/50">
                <ArrowRightLeft size={48} className="mx-auto mb-4 opacity-30 text-emerald-400" />
                <p className="text-xl font-bold text-emerald-400">You are all settled up!</p>
                <p className="text-sm mt-2 text-slate-400 font-medium">No pending balances in this group.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {group.balances.map((b, i) => {
                  const isOwer = b.from === user?.id; // You owe money
                  const isOwed = b.to === user?.id; // You are owed money

                  let cardConfig = {
                    bg: "bg-[#1E293B]/40",
                    border: "border-white/5",
                    iconColor: "text-slate-500",
                    amount: "text-white",
                    btn: "bg-white/10 hover:bg-white/20 text-white border-white/10"
                  };
                  
                  if (isOwer) {
                    cardConfig = {
                      bg: "bg-red-500/5",
                      border: "border-red-500/20",
                      iconColor: "text-red-500/50",
                      amount: "text-red-400",
                      btn: "bg-red-500/20 hover:bg-red-500/30 text-red-300 border-red-500/30"
                    };
                  } else if (isOwed) {
                    cardConfig = {
                      bg: "bg-emerald-500/5",
                      border: "border-emerald-500/20",
                      iconColor: "text-emerald-500/50",
                      amount: "text-emerald-400",
                      btn: "bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border-emerald-500/30"
                    };
                  }

                  return (
                  <div key={i} className={`flex flex-col sm:flex-row items-center justify-between p-5 rounded-2xl border transition-all ${cardConfig.border} ${cardConfig.bg} gap-4`}>
                    <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto overflow-hidden bg-white/5 px-4 py-2 rounded-xl border border-white/5 shadow-inner flex-1 max-w-sm">
                      <p className="font-bold text-slate-300 truncate max-w-[150px] sm:max-w-[200px]">
                        {userNameMap[b.from] || `User ${b.from}`}
                      </p>
                      <ArrowRight size={16} className={`shrink-0 ${cardConfig.iconColor}`} />
                      <p className="font-bold text-slate-300 truncate max-w-[150px] sm:max-w-[200px]">
                        {userNameMap[b.to] || `User ${b.to}`}
                      </p>
                    </div>
                    <div className="flex items-center justify-between w-full sm:w-auto gap-5">
                      <p className={`text-xl font-black ${cardConfig.amount}`}>₹{Number(b.amount).toFixed(2)}</p>
                      {(isOwer || isOwed) && (
                        <button onClick={() => handleSettleUp(b)} className={`px-5 py-2.5 rounded-xl text-sm font-bold shadow-sm transition-all border ${cardConfig.btn}`}>
                          Settle Up
                        </button>
                      )}
                    </div>
                  </div>
                )})}
              </div>
            )}
          </div>
        )}

        {/* Members Tab */}
        {activeTab === 'members' && (
          <div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {group.members?.map(m => {
                const isCreator = m.id === group.createdBy?.id;
                const isYou = m.id === user?.id;

                return (
                <div key={m.id} className="flex items-center gap-4 p-4 rounded-2xl border border-white/5 bg-[#1E293B]/40 hover:bg-[#1E293B]/80 hover:border-indigo-500/30 transition-all shadow-sm">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-violet-500/20 border border-indigo-500/30 flex items-center justify-center font-black text-indigo-300 shadow-inner text-xl uppercase">
                    {m.name?.charAt(0) || 'U'}
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <p className="font-bold text-white text-lg truncate flex items-center gap-2 mb-1">
                       {m.name || `User ${m.id}`}
                       {isYou && <span className="text-[10px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded-md font-black uppercase tracking-wider">You</span>}
                    </p>
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] uppercase font-black tracking-wider px-2 py-0.5 rounded-md ${isCreator ? 'bg-violet-500/20 text-violet-300 border border-violet-500/30' : 'bg-slate-800 text-slate-400 border border-slate-700'}`}>
                        {isCreator ? 'Creator' : 'Member'}
                      </span>
                      <span className="text-xs text-slate-400 truncate hidden sm:inline-block font-medium">{m.email}</span>
                    </div>
                  </div>
                </div>
              )})}
            </div>
          </div>
        )}

      </div>

      <ExpenseModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        group={group} 
        onSuccess={fetchGroup} 
        editExpense={editExpenseData}
      />
    </div>
  );
}
