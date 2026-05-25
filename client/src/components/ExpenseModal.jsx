import { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { X, Users, SplitSquareVertical, Calculator, Check, Receipt } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api';
import { useAuth } from '../context/AuthContext';

export default function ExpenseModal({ isOpen, onClose, group, onSuccess, editExpense }) {
  const { user } = useAuth();
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  
  const [payerMode, setPayerMode] = useState('SINGLE'); 
  const [singlePayerId, setSinglePayerId] = useState('');
  const [contributions, setContributions] = useState({});

  const [splitMode, setSplitMode] = useState('EQUALLY');
  const [includedMembers, setIncludedMembers] = useState({}); 
  const [splits, setSplits] = useState({}); 

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (editExpense) {
        setTitle(editExpense.title || '');
        setDescription(editExpense.description || '');
        setAmount(editExpense.amount?.toString() || '');
        setPayerMode('MULTIPLE');
        
        const contribObj = {};
        editExpense.contributions?.forEach(c => contribObj[c.userId || c.user?.id || c.id] = c.amount);
        setContributions(contribObj);

        const splitObj = {};
        editExpense.splits?.forEach(s => splitObj[s.userId || s.user?.id || s.id] = s.amount);
        setSplits(splitObj);
        setSplitMode('EXACT');
        
        const initialIncluded = {};
        group.members.forEach(m => initialIncluded[m.id] = true);
        setIncludedMembers(initialIncluded);
      } else {
        setTitle('');
        setDescription('');
        setAmount('');
        setPayerMode('SINGLE');
        setSinglePayerId(user?.id || group?.members?.[0]?.id || '');
        setContributions({});
        setSplitMode('EQUALLY');
        setSplits({});
        
        const initialIncluded = {};
        group.members.forEach(m => initialIncluded[m.id] = true);
        setIncludedMembers(initialIncluded);
      }
    }
  }, [isOpen, editExpense, group, user]);

  const totalAmountNum = parseFloat(amount) || 0;

  const equallyCalculatedSplits = useMemo(() => {
    if (splitMode !== 'EQUALLY' || totalAmountNum <= 0) return {};
    const includedIds = Object.keys(includedMembers).filter(id => includedMembers[id]);
    if (includedIds.length === 0) return {};
    const totalPaisa = Math.round(totalAmountNum * 100);
    const count = includedIds.length;
    let baseSharePaisa = Math.floor(totalPaisa / count);
    let remainderPaisa = totalPaisa % count;
    const calculated = {};
    includedIds.forEach((id) => {
      let userSharePaisa = baseSharePaisa + (remainderPaisa > 0 ? 1 : 0);
      if (remainderPaisa > 0) remainderPaisa--;
      calculated[id] = Number((userSharePaisa / 100).toFixed(2));
    });
    return calculated;
  }, [totalAmountNum, includedMembers, splitMode]);

  const currentSplitSum = useMemo(() => {
    if (splitMode === 'EQUALLY') {
      return Object.values(equallyCalculatedSplits).reduce((a, b) => a + b, 0);
    }
    return Object.values(splits).reduce((sum, val) => sum + (parseFloat(val) || 0), 0);
  }, [splitMode, equallyCalculatedSplits, splits]);

  const currentContribSum = useMemo(() => {
    if (payerMode === 'SINGLE') return totalAmountNum;
    return Object.values(contributions).reduce((sum, val) => sum + (parseFloat(val) || 0), 0);
  }, [payerMode, contributions, totalAmountNum]);

  const remainingToSplit = Number((totalAmountNum - currentSplitSum).toFixed(2));
  const remainingToContrib = Number((totalAmountNum - currentContribSum).toFixed(2));
  const isSplitValid = totalAmountNum > 0 && remainingToSplit === 0 && remainingToContrib === 0;

  const toggleMemberInclusion = (memberId) => {
    setIncludedMembers(prev => ({...prev, [memberId]: !prev[memberId]}));
  };

  const handleExactSplitChange = (userId, val) => { setSplits(prev => ({ ...prev, [userId]: val })); };
  const handleMultiplePayerChange = (userId, val) => { setContributions(prev => ({ ...prev, [userId]: val })); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isSplitValid) {
      if (remainingToContrib !== 0) toast.error(`Please match payer amounts with the total. Off by ₹${remainingToContrib}`);
      else toast.error(`Please allocate the remaining split of ₹${remainingToSplit}`);
      return;
    }

    setLoading(true);

    let formattedContributions = [];
    if (payerMode === 'SINGLE') {
      formattedContributions = [{ userId: Number(singlePayerId), amount: totalAmountNum }];
    } else {
      formattedContributions = Object.entries(contributions)
        .map(([userId, amt]) => ({ userId: Number(userId), amount: parseFloat(amt) || 0 }))
        .filter(c => c.amount > 0);
    }

    let formattedSplits = [];
    if (splitMode === 'EQUALLY') {
        formattedSplits = Object.entries(equallyCalculatedSplits)
        .map(([userId, amt]) => ({ userId: Number(userId), amount: amt }))
        .filter(c => c.amount > 0);
    } else {
        formattedSplits = Object.entries(splits)
        .map(([userId, amt]) => ({ userId: Number(userId), amount: parseFloat(amt) || 0 }))
        .filter(c => c.amount > 0);
    }

    const payload = {
      groupId: group.id,
      title,
      description,
      amount: totalAmountNum,
      contributions: formattedContributions,
      splits: formattedSplits
    };

    try {
      if (editExpense) {
        await api.patch(`/expense/${editExpense.id}`, payload);
        toast.success("Expense updated successfully");
      } else {
        await api.post('/expense', payload);
        toast.success("Expense added successfully");
      }
      onSuccess();
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error processing request');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0B0F19]/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-[#111827] rounded-3xl w-full max-w-lg shadow-[0_0_50px_rgba(0,0,0,0.5)] border border-white/10 flex flex-col max-h-[90vh] ring-1 ring-white/5 relative overflow-hidden">
        
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600 rounded-full mix-blend-screen filter blur-[80px] opacity-20 translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>

        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-white/10 relative z-10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-500/20 p-2 rounded-xl text-indigo-400 border border-indigo-500/30">
              <Receipt size={18} />
            </div>
            <h2 className="text-xl font-bold tracking-tight text-white">{editExpense ? 'Edit Expense' : 'Add New Expense'}</h2>
          </div>
          <button onClick={onClose} className="p-2 bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 rounded-full transition-colors border border-white/5">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6 custom-scrollbar relative z-10">
          
          {/* STEP 1: Core Details */}
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-sm font-semibold text-slate-300 mb-1.5 ml-1">Description</label>
              <input type="text" placeholder="e.g. Dinner" value={title} onChange={e => setTitle(e.target.value)} className="w-full bg-[#1E293B]/80 border border-white/5 focus:border-indigo-500 focus:bg-[#1E293B] rounded-xl px-4 py-2.5 outline-none transition-all text-white placeholder-slate-500 shadow-inner" />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-sm font-semibold text-slate-300 mb-1.5 ml-1">Amount (₹)</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-slate-400 font-bold">₹</span>
                </div>
                <input type="number" placeholder="0.00" value={amount} onChange={e => setAmount(e.target.value)} className="w-full bg-[#1E293B]/80 border border-white/5 focus:border-indigo-500 focus:bg-[#1E293B] rounded-xl pl-8 pr-4 py-2.5 outline-none text-lg font-bold text-indigo-300 transition-all placeholder-slate-600 shadow-inner" />
              </div>
            </div>
          </div>

          <hr className="border-white/10"/>

          {/* STEP 2: Payer Logic */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <label className="block text-sm font-bold text-white flex items-center gap-2">
                <Check size={16} className="text-emerald-400"/> Who paid?
              </label>
              {payerMode === 'SINGLE' ? (
                <button type="button" onClick={() => setPayerMode('MULTIPLE')} className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 bg-indigo-500/10 px-3 py-1 rounded-lg border border-indigo-500/20 transition-colors">Multiple people?</button>
              ) : (
                <button type="button" onClick={() => setPayerMode('SINGLE')} className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 bg-indigo-500/10 px-3 py-1 rounded-lg border border-indigo-500/20 transition-colors">One person?</button>
              )}
            </div>

            {payerMode === 'SINGLE' ? (
              <select value={singlePayerId} onChange={(e) => setSinglePayerId(e.target.value)} className="w-full bg-[#1E293B]/80 border border-white/5 focus:border-indigo-500 rounded-xl px-4 py-2.5 outline-none font-medium text-white shadow-inner cursor-pointer">
                {group.members.map(m => (
                  <option key={m.id} value={m.id} className="bg-[#1E293B]">{m.id === user?.id ? 'Paid by You' : m.name}</option>
                ))}
              </select>
            ) : (
              <div className="space-y-2 max-h-40 overflow-y-auto pr-2 custom-scrollbar rounded-xl border border-white/10 p-2 bg-[#1E293B]/30">
                {group.members.map(m => (
                  <div key={m.id} className="flex items-center gap-3 p-1 w-full flex-wrap sm:flex-nowrap">
                    <span className="flex-1 text-sm font-bold text-slate-300 truncate w-full sm:w-auto">{m.name}</span>
                    <div className="relative shrink-0 ml-auto">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500 text-sm">₹</span>
                      <input type="number" placeholder="0.00" value={contributions[m.id] || ''} onChange={(e) => handleMultiplePayerChange(m.id, e.target.value)} className="w-24 bg-[#0F172A] border border-white/10 rounded-lg pl-7 pr-3 py-1.5 text-right text-sm text-white font-medium focus:border-indigo-500 outline-none"/>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <hr className="border-white/10"/>

          {/* STEP 3: Split Logic */}
          <div className="space-y-3">
             <label className="block text-sm font-bold text-white flex items-center gap-2">
                <SplitSquareVertical size={16} className="text-violet-400"/> How to split?
             </label>
             
             <div className="flex bg-[#1E293B]/50 p-1 rounded-xl border border-white/5">
                <button type="button" onClick={() => setSplitMode('EQUALLY')} className={`flex-1 py-1.5 text-sm font-bold rounded-lg transition-all ${splitMode === 'EQUALLY' ? 'bg-indigo-600 text-white shadow-md border border-indigo-500/50' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}>Equally</button>
                <button type="button" onClick={() => setSplitMode('EXACT')} className={`flex-1 py-1.5 text-sm font-bold rounded-lg transition-all ${splitMode === 'EXACT' ? 'bg-indigo-600 text-white shadow-md border border-indigo-500/50' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}>Exact Amounts</button>
             </div>

             <div className="space-y-1 bg-[#1E293B]/30 p-2 rounded-xl border border-white/5">
                {group.members.map(m => {
                    const isEqualMode = splitMode === 'EQUALLY';
                    const isChecked = includedMembers[m.id];
                    
                    return (
                    <div key={m.id} className={`flex items-center gap-3 p-1.5 rounded-lg transition-colors flex-wrap sm:flex-nowrap ${!isChecked && isEqualMode ? 'opacity-40 grayscale' : 'hover:bg-white/5'}`}>
                        {isEqualMode && (
                        <div className="flex items-center shrink-0">
                          <input type="checkbox" checked={isChecked} onChange={() => toggleMemberInclusion(m.id)} className="w-4 h-4 text-indigo-600 rounded-md border-white/20 bg-[#0F172A] focus:ring-indigo-500/50 focus:ring-offset-0 cursor-pointer accent-indigo-500"/>
                        </div>
                        )}
                        <span className="flex-1 text-sm font-bold text-slate-200 truncate min-w-[100px]">{m.name}</span>
                        
                        {isEqualMode ? (
                            <span className={`text-sm font-black shrink-0 ${isChecked ? 'text-indigo-300' : 'text-slate-500'}`}>₹{isChecked ? (equallyCalculatedSplits[m.id] || '0.00') : '0.00'}</span>
                        ) : (
                            <div className="relative shrink-0 ml-auto">
                              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500 text-sm">₹</span>
                              <input type="number" placeholder="0.00" value={splits[m.id] || ''} onChange={(e) => handleExactSplitChange(m.id, e.target.value)} className="w-24 bg-[#0F172A] border border-white/10 rounded-lg pl-7 pr-3 py-1.5 text-right text-sm text-white font-medium focus:border-indigo-500 outline-none"/>
                            </div>
                        )}
                    </div>
                    )
                })}
             </div>
             
             {splitMode === 'EXACT' && (
                <button type="button" onClick={() => { setSplitMode('EQUALLY'); setSplits({}); }} className="text-xs font-bold text-violet-400 hover:text-violet-300 transition mt-1 flex items-center gap-1">
                  ← Reset to Split Equally
                </button>
             )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-[#0F172A] border-t border-white/10 relative z-10 shrink-0">
           <div className="flex items-center justify-between mb-3 px-1">
              <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 shrink-0">
                 <Calculator size={14}/> Checksum
              </span>
              <div className="text-right">
                {payerMode !== 'SINGLE' && remainingToContrib !== 0 && (
                  <div className={`text-xs font-bold text-orange-400`}>Payer diff: ₹{Math.abs(remainingToContrib).toFixed(2)}</div>
                )}
                <div className={`text-xs font-bold ${remainingToSplit === 0 && remainingToContrib === 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                   {remainingToSplit === 0 && remainingToContrib === 0 ? 'Balances perfectly ✓' : (remainingToSplit !== 0 ? (remainingToSplit > 0 ? `₹${remainingToSplit.toFixed(2)} remaining to split` : `Split over by ₹${Math.abs(remainingToSplit).toFixed(2)}`) : '')}
                </div>
              </div>
           </div>
           
           <button onClick={handleSubmit} disabled={!isSplitValid || loading || !title} className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-xl shadow-[0_0_15px_rgba(99,102,241,0.3)] transition-all active:scale-[0.98] border border-white/10 flex items-center justify-center gap-2">
             {loading ? <span className="flex items-center gap-2"><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> Saving...</span> : 'Save Expense'}
           </button>
        </div>

      </div>
    </div>,
    document.body
  );
}
